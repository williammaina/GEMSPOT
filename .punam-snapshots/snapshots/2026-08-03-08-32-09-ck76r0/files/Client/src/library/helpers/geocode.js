/**
 * Turn a free-text location (e.g. "Kilimani, Nairobi") into coordinates.
 *
 * Strategy:
 *  1. Mapbox Geocoding API when VITE_MAPBOX_ACCESS_TOKEN is set (best quality, Kenya bias)
 *  2. OpenStreetMap Nominatim as free fallback (no token; rate-limited — fine for search-on-submit)
 *
 * No backend required. Optional later: proxy through Flask to hide the token.
 */

const NAIROBI_BIAS = {
  // proximity / bbox around Kenya so "Westlands" resolves in Nairobi not elsewhere
  proximity: '36.8219,-1.2921',
  country: 'ke',
  bbox: '33.9,-4.9,41.9,5.5', // Kenya rough bounds
};

function getMapboxToken() {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPBOX_ACCESS_TOKEN) ||
    ''
  ).trim();
}

function normalizeResult(hit) {
  if (!hit) return null;
  const lng = Number(hit.lng ?? hit.lon ?? hit.longitude);
  const lat = Number(hit.lat ?? hit.latitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return {
    lng,
    lat,
    label: hit.label || hit.place_name || hit.display_name || '',
    source: hit.source || 'unknown',
  };
}

async function geocodeMapbox(query, token) {
  const params = new URLSearchParams({
    access_token: token,
    limit: '1',
    country: NAIROBI_BIAS.country,
    proximity: NAIROBI_BIAS.proximity,
    bbox: NAIROBI_BIAS.bbox,
    language: 'en',
  });
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query
  )}.json?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox geocode ${res.status}`);
  const data = await res.json();
  const feature = data?.features?.[0];
  if (!feature?.center) return null;
  const [lng, lat] = feature.center;
  return normalizeResult({
    lng,
    lat,
    label: feature.place_name,
    source: 'mapbox',
  });
}

async function geocodeNominatim(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'ke',
    addressdetails: '0',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      // Nominatim usage policy requires a valid User-Agent identifying the app
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Nominatim geocode ${res.status}`);
  const data = await res.json();
  const hit = Array.isArray(data) ? data[0] : null;
  if (!hit) return null;
  return normalizeResult({
    lng: hit.lon,
    lat: hit.lat,
    label: hit.display_name,
    source: 'nominatim',
  });
}

/** Local Kenya aliases so common area names resolve even offline / without network */
const KENYA_PLACES = {
  nairobi: { lng: 36.8219, lat: -1.2921, label: 'Nairobi, Kenya' },
  kilimani: { lng: 36.787, lat: -1.29, label: 'Kilimani, Nairobi' },
  westlands: { lng: 36.8095, lat: -1.267, label: 'Westlands, Nairobi' },
  karen: { lng: 36.702, lat: -1.319, label: 'Karen, Nairobi' },
  lavington: { lng: 36.775, lat: -1.277, label: 'Lavington, Nairobi' },
  kileleshwa: { lng: 36.782, lat: -1.28, label: 'Kileleshwa, Nairobi' },
  parklands: { lng: 36.818, lat: -1.26, label: 'Parklands, Nairobi' },
  eastleigh: { lng: 36.85, lat: -1.275, label: 'Eastleigh, Nairobi' },
  south: { lng: 36.827, lat: -1.31, label: 'South B / C, Nairobi' },
  'south b': { lng: 36.835, lat: -1.31, label: 'South B, Nairobi' },
  'south c': { lng: 36.825, lat: -1.322, label: 'South C, Nairobi' },
  langata: { lng: 36.78, lat: -1.35, label: 'Langata, Nairobi' },
  gigiri: { lng: 36.805, lat: -1.232, label: 'Gigiri, Nairobi' },
  ruaka: { lng: 36.78, lat: -1.205, label: 'Ruaka, Nairobi' },
  kiambu: { lng: 36.835, lat: -1.171, label: 'Kiambu, Kenya' },
  limuru: { lng: 36.69, lat: -1.11, label: 'Limuru, Kenya' },
  tigoni: { lng: 36.655, lat: -1.12, label: 'Tigoni, Kenya' },
  ngong: { lng: 36.655, lat: -1.352, label: 'Ngong, Kenya' },
  mombasa: { lng: 39.6682, lat: -4.0435, label: 'Mombasa, Kenya' },
  nyali: { lng: 39.69, lat: -4.04, label: 'Nyali, Mombasa' },
  kisumu: { lng: 34.7617, lat: -0.0917, label: 'Kisumu, Kenya' },
  nakuru: { lng: 36.08, lat: -0.3031, label: 'Nakuru, Kenya' },
  karura: { lng: 36.795, lat: -1.239, label: 'Karura Forest, Nairobi' },
  'village market': { lng: 36.805, lat: -1.232, label: 'Village Market, Gigiri' },
  'two rivers': { lng: 36.794, lat: -1.21, label: 'Two Rivers, Ruaka' },
};

function geocodeLocal(query) {
  const key = String(query || '')
    .trim()
    .toLowerCase()
    .replace(/,.*$/, '')
    .trim();
  if (!key) return null;
  if (KENYA_PLACES[key]) {
    return normalizeResult({ ...KENYA_PLACES[key], source: 'local' });
  }
  // partial match
  const hit = Object.entries(KENYA_PLACES).find(
    ([k]) => key.includes(k) || k.includes(key)
  );
  if (hit) return normalizeResult({ ...hit[1], source: 'local' });
  return null;
}

/**
 * @param {string} query
 * @returns {Promise<{ lng: number, lat: number, label: string, source: string } | null>}
 */
export async function geocodeLocation(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return null;

  // Always try local first for instant Kenya area names
  const local = geocodeLocal(q);
  if (local && local.source === 'local' && KENYA_PLACES[q.toLowerCase().replace(/,.*$/, '').trim()]) {
    return local;
  }

  const token = getMapboxToken();
  if (token) {
    try {
      const hit = await geocodeMapbox(q, token);
      if (hit) return hit;
    } catch {
      /* fall through */
    }
  }

  try {
    const hit = await geocodeNominatim(q);
    if (hit) return hit;
  } catch {
    /* fall through */
  }

  // Last resort: fuzzy local
  return local;
}

export { getMapboxToken };
