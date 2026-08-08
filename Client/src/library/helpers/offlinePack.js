const PACK_KEY = 'gemspot-offline-pack';

export function saveOfflinePack({ places = [], events = [], planStops = [] }) {
  const pack = {
    places: places.slice(0, 40),
    events: events.slice(0, 20),
    planStops: planStops.slice(0, 12),
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(PACK_KEY, JSON.stringify(pack));
  } catch {
    /* quota — try smaller */
    try {
      localStorage.setItem(
        PACK_KEY,
        JSON.stringify({ ...pack, places: places.slice(0, 12), events: events.slice(0, 8) })
      );
    } catch {
      /* */
    }
  }
  return pack;
}

export function loadOfflinePack() {
  try {
    const raw = localStorage.getItem(PACK_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function offlinePackAgeHours() {
  const p = loadOfflinePack();
  if (!p?.savedAt) return null;
  return Math.round((Date.now() - p.savedAt) / 3600000);
}
