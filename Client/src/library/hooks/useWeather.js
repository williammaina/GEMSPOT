import { useEffect, useState } from 'react';

const CACHE = new Map();

async function geocodeCity(query) {
  const q = String(query || 'Nairobi').split(',')[0].trim() || 'Nairobi';
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('geo failed');
  const data = await res.json();
  const hit = data?.results?.[0];
  if (!hit) return { lat: -1.2921, lng: 36.8219, name: 'Nairobi' };
  return { lat: hit.latitude, lng: hit.longitude, name: hit.name };
}

function codeToLabel(code) {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow / ice';
  if (code <= 82) return 'Showers';
  if (code <= 99) return 'Thunderstorms';
  return 'Mixed';
}

/**
 * Live daily weather for a location string or {lat,lng}.
 */
export function useWeather(locationOrCoords) {
  const [state, setState] = useState({
    loading: true,
    condition: null,
    temp: null,
    high: null,
    low: null,
    precipProb: null,
    wind: null,
    label: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const key =
      typeof locationOrCoords === 'object' && locationOrCoords
        ? `${locationOrCoords.lat},${locationOrCoords.lng}`
        : String(locationOrCoords || 'Nairobi');

    if (CACHE.has(key)) {
      setState({ loading: false, error: null, ...CACHE.get(key) });
      return undefined;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        let lat;
        let lng;
        let name = key;
        if (typeof locationOrCoords === 'object' && locationOrCoords?.lat != null) {
          lat = Number(locationOrCoords.lat);
          lng = Number(locationOrCoords.lng);
        } else {
          const g = await geocodeCity(locationOrCoords);
          lat = g.lat;
          lng = g.lng;
          name = g.name;
        }
        const wx = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FNairobi&forecast_days=1`
        );
        if (!wx.ok) throw new Error('weather failed');
        const data = await wx.json();
        const code = data?.current?.weather_code;
        const payload = {
          condition: codeToLabel(code),
          temp: data?.current?.temperature_2m ?? null,
          high: data?.daily?.temperature_2m_max?.[0] ?? null,
          low: data?.daily?.temperature_2m_min?.[0] ?? null,
          precipProb: data?.daily?.precipitation_probability_max?.[0] ?? null,
          wind: data?.current?.wind_speed_10m ?? null,
          label: name,
        };
        CACHE.set(key, payload);
        if (!cancelled) setState({ loading: false, error: null, ...payload });
      } catch (err) {
        if (!cancelled) {
          setState({
            loading: false,
            condition: null,
            temp: null,
            high: null,
            low: null,
            precipProb: null,
            wind: null,
            label: null,
            error: err?.message || 'unavailable',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    typeof locationOrCoords === 'object'
      ? `${locationOrCoords?.lat},${locationOrCoords?.lng}`
      : locationOrCoords,
  ]);

  return state;
}
