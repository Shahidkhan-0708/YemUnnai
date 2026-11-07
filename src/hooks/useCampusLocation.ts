import { useState, useEffect, useCallback, useRef } from 'react';
import { MITS_CAMPUS } from '../lib/mapLocations.ts';

export interface CampusLocationState {
  location: [number, number];
  accuracyMeters: number;
  heading: number | null;
  isWatching: boolean;
  error: string | null;
  recenterTrigger: number;
  triggerRecenter: () => void;
}

/**
 * Continuous high-fidelity geolocation watch hook.
 * Streams real-time GPS coordinates, accuracy radius (meters), and compass heading.
 * Gracefully falls back to MITS Campus center coordinates if location is unavailable.
 */
export function useCampusLocation(): CampusLocationState {
  const [location, setLocation] = useState<[number, number]>(MITS_CAMPUS);
  const [accuracyMeters, setAccuracyMeters] = useState<number>(20);
  const [heading, setHeading] = useState<number | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && !('geolocation' in navigator)) {
      return 'Geolocation is not supported in this browser.';
    }
    return null;
  });
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isMountedRef.current) return;
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        setAccuracyMeters(Math.max(5, Math.round(pos.coords.accuracy || 20)));
        setHeading(pos.coords.heading ?? null);
        setIsWatching(true);
        setError(null);
      },
      (err) => {
        if (!isMountedRef.current) return;
        setIsWatching(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Showing MITS Campus center.');
        } else if (err.code === err.TIMEOUT) {
          setError('GPS signal timed out. Defaulted to MITS Campus.');
        } else {
          setError('GPS unavailable. Defaulted to MITS Campus.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      }
    );

    return () => {
      isMountedRef.current = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const triggerRecenter = useCallback(() => {
    setRecenterTrigger((prev) => prev + 1);
  }, []);

  return {
    location,
    accuracyMeters,
    heading,
    isWatching,
    error,
    recenterTrigger,
    triggerRecenter,
  };
}
