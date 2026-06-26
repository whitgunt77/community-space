import { useState, useEffect, useCallback } from 'react';

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }; // NYC fallback

/**
 * useGeolocation
 * Returns the user's current coordinates, a loading flag, and any error.
 * Also exposes a manual `refresh()` trigger.
 */
export function useGeolocation({ watchPosition = false, timeout = 10_000 } = {}) {
  const [position, setPosition] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const onSuccess = useCallback((pos) => {
    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setLoading(false);
    setError(null);
  }, []);

  const onError = useCallback((err) => {
    console.warn('Geolocation error:', err.message);
    setPosition(DEFAULT_CENTER);
    setLoading(false);
    setError(err.message);
  }, []);

  const options = { enableHighAccuracy: false, timeout, maximumAge: 60_000 };

  useEffect(() => {
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosition(DEFAULT_CENTER);
      setLoading(false);
      setError('Geolocation is not supported by your browser.');
      return;
    }

    if (watchPosition) {
      const watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }
  }, [watchPosition]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    setLoading(true);
    navigator.geolocation?.getCurrentPosition(onSuccess, onError, { ...options, maximumAge: 0 });
  }, [onSuccess, onError]); // eslint-disable-line react-hooks/exhaustive-deps

  return { position, loading, error, refresh, isDefault: !position || (position.lat === DEFAULT_CENTER.lat) };
}

export { DEFAULT_CENTER };