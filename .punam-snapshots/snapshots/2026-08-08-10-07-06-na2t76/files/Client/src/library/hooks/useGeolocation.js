import { useCallback, useEffect, useRef, useState } from 'react';

const CACHE_KEY = 'gemspot-last-geo';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // accept cache up to 30 minutes for first paint
    if (data?.lat != null && data?.at && Date.now() - data.at < 30 * 60 * 1000) {
      return {
        lat: data.lat,
        lng: data.lng,
        accuracy: data.accuracy ?? null,
        updatedAt: data.at,
        fromCache: true,
      };
    }
  } catch {
    /* */
  }
  return null;
}

function writeCache(pos) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
        at: pos.updatedAt,
      })
    );
  } catch {
    /* */
  }
}

/**
 * Continuous GPS for distance cards.
 * - Instant last-known cache
 * - getCurrentPosition (fast)
 * - watchPosition (realtime updates while app is open)
 */
export function useGeolocation({ enabled = true } = {}) {
  const [location, setLocation] = useState(() => readCache());
  const [status, setStatus] = useState(() =>
    typeof navigator !== 'undefined' && navigator.geolocation ? 'pending' : 'unsupported'
  );
  const [error, setError] = useState(null);
  const watchId = useRef(null);

  const applyPosition = useCallback((coords) => {
    const next = {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy ?? null,
      altitude: coords.altitude ?? null,
      heading: coords.heading ?? null,
      speed: coords.speed ?? null,
      updatedAt: Date.now(),
      fromCache: false,
    };
    setLocation(next);
    writeCache(next);
    setStatus('ready');
    setError(null);
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return;
    }
    setStatus((s) => (s === 'ready' ? s : 'pending'));
    navigator.geolocation.getCurrentPosition(
      (pos) => applyPosition(pos.coords),
      (err) => {
        setError(err?.message || 'Location unavailable');
        setStatus((s) => (s === 'ready' ? s : 'denied'));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }
    );
  }, [applyPosition]);

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return undefined;
    }

    // Quick fix
    navigator.geolocation.getCurrentPosition(
      (pos) => applyPosition(pos.coords),
      (err) => {
        setError(err?.message || 'Location unavailable');
        // keep cache if we have it
        setStatus((s) => {
          if (s === 'ready') return s;
          return err?.code === 1 ? 'denied' : 'error';
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 20000 }
    );

    // Live updates — only when position moves meaningfully
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation((prev) => {
          // ignore noisy tiny updates under 25m if accuracy is poor
          if (prev && !prev.fromCache) {
            const dLat = (latitude - prev.lat) * 111320;
            const dLng = (longitude - prev.lng) * 111320 * Math.cos((latitude * Math.PI) / 180);
            const moved = Math.sqrt(dLat * dLat + dLng * dLng);
            if (moved < 25 && (accuracy == null || accuracy > 50)) {
              return prev;
            }
          }
          const next = {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy ?? null,
            altitude: pos.coords.altitude ?? null,
            heading: pos.coords.heading ?? null,
            speed: pos.coords.speed ?? null,
            updatedAt: Date.now(),
            fromCache: false,
          };
          writeCache(next);
          return next;
        });
        setStatus('ready');
        setError(null);
      },
      (err) => {
        setError(err?.message || 'watch failed');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    return () => {
      if (watchId.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [enabled, applyPosition]);

  return { location, status, error, request };
}
