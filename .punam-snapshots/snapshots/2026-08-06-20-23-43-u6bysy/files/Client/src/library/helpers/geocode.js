const KENYA = { proximity: '36.8219,-1.2921', country: 'ke', bbox: '33.9,-4.9,41.9,5.5' };

const LOCAL = {
  nairobi: { lng: 36.8219, lat: -1.2921, label: 'Nairobi, Kenya' },
  kilimani: { lng: 36.787, lat: -1.29, label: 'Kilimani, Nairobi' },
  westlands: { lng: 36.8095, lat: -1.267, label: 'Westlands, Nairobi' },
  karen: { lng: 36.702, lat: -1.319, label: 'Karen, Nairobi' },
  lavington: { lng: 36.775, lat: -1.277, label: 'Lavington, Nairobi' },
  kileleshwa: { lng: 36.782, lat: -1.28, label: 'Kileleshwa, Nairobi' },
  parklands: { lng: 36.818, lat: -1.26, label: 'Parklands, Nairobi' },
  eastleigh: { lng: 36.85, lat: -1.275, label: 'Eastleigh, Nairobi' },
  'south b': { lng: 36.835, lat: -1.31, label: 'South B, Nairobi' },
  'south c': { lng: 36.825, lat: -1.322, label: 'South C, Nairobi' },
  langata: { lng: 36.78, lat: -1.35, label: 'Langata, Nairobi' },
  gigiri: { lng: 36.805, lat: -1.232, label: 'Gigiri, Nairobi' },
  ruaka: { lng: 36.78, lat: -1.205, label: 'Ruaka, Nairobi' },
  kiambu: { lng: 36.835, lat: -1.171, label: 'Kiambu, Kenya' },
  limuru: { lng: 36.69, lat: -1.11, label: 'Limuru, Kenya' },
  ngong: { lng: 36.655, lat: -1.352, label: 'Ngong, Kenya' },
  mombasa: { lng: 39.6682, lat: -4.0435, label: 'Mombasa, Kenya' },
  kisumu: { lng: 34.7617, lat: -0.0917, label: 'Kisumu, Kenya' },
  nakuru: { lng: 36.08, lat: -0.3031, label: 'Nakuru, Kenya' },
  karura: { lng: 36.795, lat: -1.239, label: 'Karura Forest, Nairobi' },
};

export function getMapboxToken() {
  return ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPBOX_ACCESS_TOKEN) || '').trim();
}

function pack(hit) {
  if (!hit) return null;
  const lng = Number(hit.lng ?? hit.lon ?? hit.longitude);
  const lat = Number(hit.lat ?? hit.latitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat, label: hit.label || hit.place_name || hit.display_name || '', source: hit.source || 'unknown' };
}

function localLookup(query) {
  const key = String(query || '').trim().toLowerCase().replace(/,.*$/, '').trim();
  if (!key) return null;
  if (LOCAL[key]) return pack({ ...LOCAL[key], source: 'local' });
  const soft = Object.entries(LOCAL).find(([k]) => key.includes(k) || k.includes(key));
  return soft ? pack({ ...soft[1], source: 'local' }) : null;
}

async function mapboxGeocode(query, token) {
  const params = new URLSearchParams({ access_token: token, limit: '1', country: KENYA.country, proximity: KENYA.proximity, bbox: KENYA.bbox, language: 'en' });
  const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`);
  if (!res.ok) throw new Error(`mapbox ${res.status}`);
  const data = await res.json();
  const f = data?.features?.[0];
  if (!f?.center) return null;
  return pack({ lng: f.center[0], lat: f.center[1], label: f.place_name, source: 'mapbox' });
}

async function nominatimGeocode(query) {
  const params = new URLSearchParams({ q: query, format: 'json', limit: '1', countrycodes: 'ke' });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = await res.json();
  const hit = Array.isArray(data) ? data[0] : null;
  if (!hit) return null;
  return pack({ lng: hit.lon, lat: hit.lat, label: hit.display_name, source: 'nominatim' });
}

export async function geocodeLocation(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return null;
  const exactLocal = localLookup(q);
  const key = q.toLowerCase().replace(/,.*$/, '').trim();
  if (exactLocal && LOCAL[key]) return exactLocal;
  const token = getMapboxToken();
  if (token) {
    try {
      const hit = await mapboxGeocode(q, token);
      if (hit) return hit;
    } catch { /* fallthrough */ }
  }
  try {
    const hit = await nominatimGeocode(q);
    if (hit) return hit;
  } catch { /* fallthrough */ }
  return exactLocal;
}
