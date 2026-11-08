import { useEffect, useState, useRef, useCallback } from 'react';
import { MITS_CAMPUS, haversineDistance, formatWalkingTime } from '../lib/mapLocations';

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
 * 2. Accuracy Boundary Verification: Filters out erratic hardware signals > 25m.
 * 3. Dead Reckoning Noise Guard: Ignores sub-5m micro-jitter that causes UI jank.
 * 4. Automatic Screen Refocusing: Keeps map canvas centered smoothly on walker position.
 */
export function useCampusTelemetry(
  canteenId: string = 'MITS_CANTEEN',
  targetDestinationCoords: [number, number] = [13.6288, 78.5022]
): CampusTelemetryState {
  const [courierLocation, setCourierLocation] = useState<[number, number]>(MITS_CAMPUS);
  const [headingAngle, setHeadingAngle] = useState<number>(0);
  const [distanceRemainingMeters, setDistanceRemainingMeters] = useState<number>(52);
  const [distanceRemainingText, setDistanceRemainingText] = useState<string>('52m');
  const [estimatedWalkTimeText, setEstimatedWalkTimeText] = useState<string>('1 min');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
  const [accuracyMeters, setAccuracyMeters] = useState<number>(10);
  const [isAutoRefocusEnabled, setIsAutoRefocusEnabled] = useState<boolean>(true);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);
  const lastLoggedCoords = useRef<{ lat: number; lng: number } | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const triggerRecenter = useCallback(() => {
    setRecenterTrigger((prev) => prev + 1);
  }, []);

  // Update dynamic distance and ETA calculations based on coordinates
  const updateMetrics = useCallback((lat: number, lng: number) => {
    const distMeters = Math.max(8, haversineDistance([lat, lng], targetDestinationCoords));
    setDistanceRemainingMeters(distMeters);
    setDistanceRemainingText(`${distMeters}m`);
    setEstimatedWalkTimeText(formatWalkingTime(distMeters));
  }, [targetDestinationCoords]);

  // Primary Telemetry Stream: WebSocket + Geolocation Guard
  useEffect(() => {
    isMountedRef.current = true;

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

            // 1. Accuracy Boundary Verification: Filter out erratic GPS signals (> 25m)
            if (payload.accuracy && payload.accuracy > 25) return;

            // 2. Dead Reckoning Noise Guard: Ignore tiny shifts (< 5m / < 0.00003 deg)
            if (lastLoggedCoords.current) {
              const latDiff = Math.abs(payload.latitude - lastLoggedCoords.current.lat);
              const lngDiff = Math.abs(payload.longitude - lastLoggedCoords.current.lng);
              if (latDiff < 0.00003 && lngDiff < 0.00003) return;
            }

            setCourierLocation([payload.latitude, payload.longitude]);
            if (payload.bearing !== undefined) setHeadingAngle(payload.bearing);
            if (payload.accuracy) setAccuracyMeters(payload.accuracy);

            updateMetrics(payload.latitude, payload.longitude);
            lastLoggedCoords.current = { lat: payload.latitude, lng: payload.longitude };

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

    // 2. Continuous Hardware Geolocation Watch with Dead-Reckoning Filter
    let watchId: number | null = null;
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!isMountedRef.current) return;

          const acc = Math.round(pos.coords.accuracy || 15);
          // Accuracy Boundary Verification
          if (acc > 35) return;

          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          // Dead Reckoning Noise Guard: Ignore tiny sub-5m shifts
          if (lastLoggedCoords.current) {
            const latDiff = Math.abs(lat - lastLoggedCoords.current.lat);
            const lngDiff = Math.abs(lng - lastLoggedCoords.current.lng);
            if (latDiff < 0.00003 && lngDiff < 0.00003) return;
          }

          setCourierLocation([lat, lng]);
          setAccuracyMeters(acc);
          if (pos.coords.heading !== null && pos.coords.heading !== undefined) {
            setHeadingAngle(pos.coords.heading);
          }
          setIsLiveStreaming(true);

          updateMetrics(lat, lng);
          lastLoggedCoords.current = { lat, lng };

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
    isAutoRefocusEnabled,
    setIsAutoRefocusEnabled,
    recenterTrigger,
    triggerRecenter,
  };
}

export default useCampusTelemetry;
