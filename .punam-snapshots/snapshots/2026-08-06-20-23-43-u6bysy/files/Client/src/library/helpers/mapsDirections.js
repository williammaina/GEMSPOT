/**
 * Build a Google Maps directions URL from the user's current position
 * to a destination (coords preferred, else text query).
 */
export function buildDirectionsUrl({ lat, lng, query } = {}) {
  const dest =
    lat != null &&
    lng != null &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng))
      ? `${Number(lat)},${Number(lng)}`
      : String(query || '').trim();

  if (!dest) {
    return 'https://www.google.com/maps';
  }

  // origin=Current+Location works on mobile Google Maps / app handoff
  return `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(dest)}&travelmode=driving`;
}

/**
 * Try to get a more precise URL with actual GPS coords as origin.
 * Falls back to Current+Location if geolocation fails / is denied.
 */
export function openDirectionsTo({ lat, lng, query } = {}) {
  const dest =
    lat != null &&
    lng != null &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng))
      ? `${Number(lat)},${Number(lng)}`
      : String(query || '').trim();

  if (!dest) {
    window.open('https://www.google.com/maps', '_blank', 'noopener,noreferrer');
    return;
  }

  const open = (origin) => {
    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`
      : buildDirectionsUrl({ lat, lng, query });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!navigator.geolocation) {
    open(null);
    return;
  }

  const timer = setTimeout(() => open(null), 2500);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      clearTimeout(timer);
      open(`${pos.coords.latitude},${pos.coords.longitude}`);
    },
    () => {
      clearTimeout(timer);
      open(null);
    },
    { enableHighAccuracy: true, timeout: 2200, maximumAge: 60000 }
  );
}
