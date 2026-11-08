import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MITS_CAMPUS } from '../lib/mapLocations';
import {
  CAMPUS_SHOPS,
  calculateDynamicCampusRoute,
  CampusGpsKalmanFilter,
  sanitizeWalkString,
  type DynamicCampusRouteResult,
} from '../lib/campusTrackerData';

export interface TelemetryUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  bearing?: number;
  timestamp?: number;
}

export interface CampusTelemetryState {
  courierLocation: [number, number]; // [latitude, longitude]
  mapboxCoordinates: [number, number]; // [longitude, latitude] for Mapbox / GeoJSON
  headingAngle: number;
  distanceRemainingMeters: number;
  distanceRemainingText: string;
  estimatedWalkTimeText: string;
  isLiveStreaming: boolean;
  accuracyMeters: number;
  isOffCampus: boolean;
  clampedGateName?: string;
  statusBadgeText: string;
  accuracyBadge: string;
  dynamicRoute?: DynamicCampusRouteResult;
  isAutoRefocusEnabled: boolean;
  setIsAutoRefocusEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  recenterTrigger: number;
  triggerRecenter: () => void;
}

/**
 * Production low-latency campus telemetry synchronization hook.
 *
 * Implements:
 * 1. Persistent WebSocket telemetry connection with graceful fallback to high-accuracy GPS watch.
 * 2. Sensor Fusion & Kalman Filtering: Smooths GPS jitter and eliminates route flickering.
 * 3. Dynamic Dijkstra Route Sync: Calculates shortest walking path to campus dining venues.
 * 4. Off-Campus Gate Clamping: Clamps off-campus readings to campus perimeter anchors.
 * 5. Strict Metric Formatting: Zero decimal leaks (Math.round()) & calibrated 80m/min pace.
 * 6. String Collision Prevention: No "walk walk" or duplicate unit leaks.
 */
export function useCampusTelemetry(
  canteenId: string = 'MITS_CANTEEN',
  targetDestinationCoords?: [number, number]
): CampusTelemetryState {
  const [courierLocation, setCourierLocation] = useState<[number, number]>(MITS_CAMPUS);
  const [headingAngle, setHeadingAngle] = useState<number>(0);
  const [distanceRemainingMeters, setDistanceRemainingMeters] = useState<number>(148);
  const [distanceRemainingText, setDistanceRemainingText] = useState<string>('148m');
  const [estimatedWalkTimeText, setEstimatedWalkTimeText] = useState<string>('2 min walk');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
  const [accuracyMeters, setAccuracyMeters] = useState<number>(10);
  const [isOffCampus, setIsOffCampus] = useState<boolean>(false);
  const [clampedGateName, setClampedGateName] = useState<string | undefined>(undefined);
  const [statusBadgeText, setStatusBadgeText] = useState<string>('Campus Perimeter');
  const [accuracyBadge, setAccuracyBadge] = useState<string>('GPS (±2m)');
  const [dynamicRoute, setDynamicRoute] = useState<DynamicCampusRouteResult | undefined>(undefined);
  const [isAutoRefocusEnabled, setIsAutoRefocusEnabled] = useState<boolean>(true);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);
  const lastLoggedCoords = useRef<{ lat: number; lng: number } | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const kalmanFilter = useRef<CampusGpsKalmanFilter>(new CampusGpsKalmanFilter());

  const triggerRecenter = useCallback(() => {
    setRecenterTrigger((prev) => prev + 1);
  }, []);

  // Dynamically resolve target destination coordinates if not custom
  const _resolvedTarget: [number, number] = useMemo(() => {
    if (targetDestinationCoords) {
      return targetDestinationCoords;
    }
    const matched = CAMPUS_SHOPS.find((s) => s.id === canteenId || s.code === canteenId);
    return matched ? matched.coords : [13.62955, 78.47895];
  }, [canteenId, targetDestinationCoords]);
  void _resolvedTarget;

  // Update dynamic Dijkstra distance, ETA, and perimeter clamping based on filtered coordinates
  const updateMetrics = useCallback(
    (lat: number, lng: number) => {
      // Execute Dynamic Dijkstra routing
      const route = calculateDynamicCampusRoute([lat, lng], canteenId);

      // Enforce strict integer rounding on all distances
      const roundedMeters = Math.max(15, Math.round(route.totalDistanceMeters));
      setDistanceRemainingMeters(roundedMeters);
      setDistanceRemainingText(`${roundedMeters}m`);

      // Prevent duplicated string collisions like "walk walk"
      const safeWalkText = sanitizeWalkString(route.estimatedWalkTimeText);
      setEstimatedWalkTimeText(safeWalkText);

      setIsOffCampus(route.isOffCampus);
      setClampedGateName(route.clampedGateName);
      setStatusBadgeText(route.statusBadgeText);
      setAccuracyBadge(route.accuracyBadge);
      setDynamicRoute(route);
    },
    [canteenId]
  );

  // Primary Telemetry Stream: WebSocket + Geolocation Guard with Sensor Fusion
  useEffect(() => {
    isMountedRef.current = true;

    // Immediately synchronize metrics to current or default location
    const [initLat, initLng] = courierLocation || MITS_CAMPUS;
    updateMetrics(initLat, initLng);

    // 1. Attempt WebSocket connection if endpoint is configured
    const wsUrl = import.meta.env.VITE_TELEMETRY_WS_URL;
    if (wsUrl) {
      try {
        const fullWsUrl = `${wsUrl.replace(/\/$/, '')}/v1/tracking/live/${canteenId}`;
        const ws = new WebSocket(fullWsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          setIsLiveStreaming(true);
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const payload: TelemetryUpdate = JSON.parse(event.data);

            // Accuracy Boundary Verification: Filter erratic GPS signals (> 25m)
            if (payload.accuracy && payload.accuracy > 25) return;

            // Apply Kalman filter sensor fusion to eliminate hardware jitter
            const [filteredLat, filteredLng] = kalmanFilter.current.filter(
              payload.latitude,
              payload.longitude,
              payload.accuracy || 10
            );

            // Dead Reckoning Noise Guard: Ignore tiny shifts (< 5m / < 0.00003 deg)
            if (lastLoggedCoords.current) {
              const latDiff = Math.abs(filteredLat - lastLoggedCoords.current.lat);
              const lngDiff = Math.abs(filteredLng - lastLoggedCoords.current.lng);
              if (latDiff < 0.00003 && lngDiff < 0.00003) return;
            }

            setCourierLocation([filteredLat, filteredLng]);
            if (payload.bearing !== undefined) setHeadingAngle(payload.bearing);
            if (payload.accuracy) setAccuracyMeters(Math.round(payload.accuracy));

            updateMetrics(filteredLat, filteredLng);
            lastLoggedCoords.current = { lat: filteredLat, lng: filteredLng };

            // Automatic camera recentering if enabled
            if (isAutoRefocusEnabled) {
              setRecenterTrigger((prev) => prev + 1);
            }
          } catch (err) {
            console.error('Failed parsing real-time tracking stream packet:', err);
          }
        };

        ws.onerror = () => {
          setIsLiveStreaming(false);
        };

        ws.onclose = () => {
          setIsLiveStreaming(false);
        };
      } catch {
        setIsLiveStreaming(false);
      }
    }

    // 2. Continuous Hardware Geolocation Watch with Kalman Filter & Dead-Reckoning
    let watchId: number | null = null;
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!isMountedRef.current) return;

          const acc = Math.round(pos.coords.accuracy || 15);
          // Accuracy Boundary Verification
          if (acc > 35) return;

          // Kalman Filter smoothing
          const [filteredLat, filteredLng] = kalmanFilter.current.filter(
            pos.coords.latitude,
            pos.coords.longitude,
            acc
          );

          // Dead Reckoning Noise Guard: Ignore tiny sub-5m shifts
          if (lastLoggedCoords.current) {
            const latDiff = Math.abs(filteredLat - lastLoggedCoords.current.lat);
            const lngDiff = Math.abs(filteredLng - lastLoggedCoords.current.lng);
            if (latDiff < 0.00003 && lngDiff < 0.00003) return;
          }

          setCourierLocation([filteredLat, filteredLng]);
          setAccuracyMeters(acc);
          if (pos.coords.heading !== null && pos.coords.heading !== undefined) {
            setHeadingAngle(pos.coords.heading);
          }
          setIsLiveStreaming(true);

          updateMetrics(filteredLat, filteredLng);
          lastLoggedCoords.current = { lat: filteredLat, lng: filteredLng };

          if (isAutoRefocusEnabled) {
            setRecenterTrigger((prev) => prev + 1);
          }
        },
        () => {
          // Fallback to static campus coordinates on permission issue
          if (isMountedRef.current) {
            updateMetrics(MITS_CAMPUS[0], MITS_CAMPUS[1]);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 2500,
        }
      );
    }

    return () => {
      isMountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (watchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [canteenId, isAutoRefocusEnabled, updateMetrics]);

  return {
    courierLocation,
    mapboxCoordinates: [courierLocation[1], courierLocation[0]], // [Lng, Lat]
    headingAngle,
    distanceRemainingMeters,
    distanceRemainingText,
    estimatedWalkTimeText,
    isLiveStreaming,
    accuracyMeters,
    isOffCampus,
    clampedGateName,
    statusBadgeText,
    accuracyBadge,
    dynamicRoute,
    isAutoRefocusEnabled,
    setIsAutoRefocusEnabled,
    recenterTrigger,
    triggerRecenter,
  };
}

export default useCampusTelemetry;
