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
    return JSON.parse(localStorage.getItem(PACK_KEY) || 'null');
  } catch {
    return null;
  }
}
