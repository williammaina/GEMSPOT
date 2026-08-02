/** Shared store for admin-created places & events (localStorage + optional API). */

export const PLACES_KEY = 'gemspot-admin-places';
export const EVENTS_KEY = 'gemspot-admin-events';
export const ADMIN_CHANGED = 'gemspot-admin-changed';

export function readAdminPlaces() {
  try {
    const raw = localStorage.getItem(PLACES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAdminPlaces(list) {
  localStorage.setItem(PLACES_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(ADMIN_CHANGED, { detail: { type: 'places' } }));
}

export function readAdminEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAdminEvents(list) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(ADMIN_CHANGED, { detail: { type: 'events' } }));
}

/** Merge seed/API list with admin overrides (admin wins on same id). */
export function mergeWithAdminPlaces(baseList = []) {
  const admin = readAdminPlaces();
  if (!admin.length) return baseList;
  const byId = new Map();
  for (const p of baseList) {
    const id = String(p.place_id ?? p.id ?? '');
    if (id) byId.set(id, p);
  }
  for (const p of admin) {
    const id = String(p.place_id ?? p.id ?? '');
    if (id) byId.set(id, { ...byId.get(id), ...p });
    else byId.set(`admin-${Math.random()}`, p);
  }
  return Array.from(byId.values());
}

export function mergeWithAdminEvents(baseList = []) {
  const admin = readAdminEvents();
  if (!admin.length) return baseList;
  const byId = new Map();
  for (const e of baseList) {
    const id = String(e.id ?? e.event_id ?? '');
    if (id) byId.set(id, e);
  }
  for (const e of admin) {
    const id = String(e.id ?? e.event_id ?? '');
    if (id) byId.set(id, { ...byId.get(id), ...e });
    else byId.set(`admin-ev-${Math.random()}`, e);
  }
  return Array.from(byId.values());
}
