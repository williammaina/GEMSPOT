/** Earth radius (mean) in metres — WGS84-friendly Haversine */
const R_M = 6371008.8;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance in kilometres (high precision).
 * Returns null if any coordinate is missing/invalid.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const a = Number(lat1);
  const b = Number(lon1);
  const c = Number(lat2);
  const d = Number(lon2);
  if (![a, b, c, d].every((n) => Number.isFinite(n))) return null;
  if (a < -90 || a > 90 || c < -90 || c > 90) return null;
  if (b < -180 || b > 180 || d < -180 || d > 180) return null;

  const φ1 = toRad(a);
  const φ2 = toRad(c);
  const Δφ = toRad(c - a);
  const Δλ = toRad(d - b);

  const sinΔφ = Math.sin(Δφ / 2);
  const sinΔλ = Math.sin(Δλ / 2);
  const h =
    sinΔφ * sinΔφ +
    Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;
  const metres = 2 * R_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return metres / 1000;
}

/** Distance in metres (or null). */
export function distanceMetres(lat1, lon1, lat2, lon2) {
  const km = calculateDistance(lat1, lon1, lat2, lon2);
  return km == null ? null : km * 1000;
}

/**
 * Human label for cards:
 *  - < 100m  → "80 m away"
 *  - < 1km   → "450 m away"
 *  - < 10km  → "3.2 km away"
 *  - else    → "24 km away"
 */
export function formatDistanceLabel(km) {
  if (km == null || !Number.isFinite(km)) return null;
  const m = km * 1000;
  if (m < 100) return `${Math.max(1, Math.round(m))} m away`;
  if (m < 1000) return `${Math.round(m / 10) * 10} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  if (km < 100) return `${Math.round(km * 10) / 10} km away`;
  return `${Math.round(km)} km away`;
}

/** Pull lat/lng from place or event shapes. */
const KENYA_PLACE_HINTS = [
  { re: /karura/i, lat: -1.2345, lng: 36.826 },
  { re: /ngong/i, lat: -1.401, lng: 36.656 },
  { re: /nairobi\s*national|nnp/i, lat: -1.373, lng: 36.858 },
  { re: /westlands/i, lat: -1.267, lng: 36.804 },
  { re: /kilimani/i, lat: -1.292, lng: 36.782 },
  { re: /karen/i, lat: -1.319, lng: 36.715 },
  { re: /lavington/i, lat: -1.28, lng: 36.77 },
  { re: /cbd|city\s*centre|city\s*center/i, lat: -1.2864, lng: 36.8172 },
  { re: /nairobi/i, lat: -1.2921, lng: 36.8219 },
  { re: /mombasa/i, lat: -4.0435, lng: 39.6682 },
  { re: /kisumu/i, lat: -0.0917, lng: 34.768 },
];

export function getCoords(entity) {
  if (!entity || typeof entity !== 'object') return null;
  const lat = Number(
    entity.latitude ?? entity.lat ?? entity.geo_lat ?? entity.location_lat
  );
  const lng = Number(
    entity.longitude ??
      entity.lng ??
      entity.lon ??
      entity.geo_lng ??
      entity.location_lng
  );
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return { lat, lng };
  }
  // Text fallback for events/places missing explicit coordinates
  const hay = [entity.location, entity.venue_name, entity.venue, entity.address, entity.town, entity.title, entity.name]
    .filter(Boolean)
    .join(' ');
  for (const h of KENYA_PLACE_HINTS) {
    if (h.re.test(hay)) return { lat: h.lat, lng: h.lng, approximate: true };
  }
  return null;
}

/**
 * Distance from userLocation → entity (place/event).
 */
export function distanceFromUser(userLocation, entity) {
  if (!userLocation) return null;
  const dest = getCoords(entity);
  if (!dest) return null;
  const lat = Number(userLocation.lat ?? userLocation.latitude);
  const lng = Number(userLocation.lng ?? userLocation.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return calculateDistance(lat, lng, dest.lat, dest.lng);
}
