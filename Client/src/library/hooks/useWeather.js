import { useState, useEffect } from 'react';

const MOCK_CONDITIONS = [
  { condition: 'Light rain', temp: 18 },
  { condition: 'Partly cloudy', temp: 22 },
  { condition: 'Sunny', temp: 26 },
  { condition: 'Overcast', temp: 19 },
];

/**
 * Lightweight weather hook. Uses a deterministic mock based on location
 * so UI stays stable across re-renders without an API key.
 */
export function useWeather(location) {
  const [weather, setWeather] = useState({
    condition: null,
    temp: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setWeather((prev) => ({ ...prev, loading: true }));

    const timer = setTimeout(() => {
      if (cancelled) return;
      const seed = String(location || 'Nairobi')
        .split('')
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const pick = MOCK_CONDITIONS[seed % MOCK_CONDITIONS.length];
      setWeather({
        condition: pick.condition,
        temp: pick.temp,
        loading: false,
      });
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [location]);

  return weather;
}
