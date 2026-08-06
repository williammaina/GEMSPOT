import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'gemspot-crowd-v2';
const CHANNEL = 'gemspot-crowd';
const SCORE = { quiet: 18, moderate: 42, busy: 68, packed: 90 };
const TTL_MS = 4 * 60 * 60 * 1000; // reports matter for 4h
const API_BASE = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : null;

/** @typedef {{ score: number, key: string, at: number, user?: string, source?: string }} Pulse */

let memory = null;
const listeners = new Set();
let bc = null;

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* */
    }
  });
}

function loadStore() {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    memory = raw ? JSON.parse(raw) : { places: {}, version: 2 };
  } catch {
    memory = { places: {}, version: 2 };
  }
  if (!memory.places) memory.places = {};
  return memory;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    /* quota */
  }
  emit();
  try {
    if (!bc && typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(CHANNEL);
    }
    bc?.postMessage({ type: 'crowd-sync', at: Date.now() });
  } catch {
    /* */
  }
}

// Cross-tab sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      memory = null;
      emit();
    }
  });
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = () => {
      memory = null;
      emit();
    };
  } catch {
    /* */
  }
}

function baselineLevel(category, hour, weekday) {
  const cat = String(category || '').toLowerCase();
  const weekend = weekday === 0 || weekday === 6;
  let n = 38;
  if (cat === 'nightlife') {
    if (hour >= 22 || hour < 2) n = 86;
    else if (hour >= 19) n = 68;
    else if (hour >= 16) n = 42;
    else n = 18;
    if (weekend && hour >= 20) n = Math.min(95, n + 8);
  } else if (cat === 'eats') {
    if (hour >= 12 && hour < 14) n = 72;
    else if (hour >= 18 && hour < 21) n = 78;
    else if (hour >= 7 && hour < 10) n = 48;
    else n = 32;
    if (weekend && hour >= 11 && hour < 15) n = Math.min(90, n + 6);
  } else if (cat === 'nature' || cat === 'action') {
    if (hour >= 9 && hour < 12) n = 58;
    else if (hour >= 14 && hour < 17) n = 52;
    else n = 22;
    if (weekend && hour >= 9 && hour < 16) n = Math.min(88, n + 12);
  }
  return n;
}

/**
 * Ambient "other users" signal — deterministic per place+hour so every
 * client sees the same shared pulse without a server.
 */
function ambientCommunity(placeId, category, now) {
  const id = String(placeId || '');
  const hour = new Date(now).getHours();
  const day = new Date(now).getDate();
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  h = (h + hour * 17 + day * 3) % 100;
  const cat = String(category || '').toLowerCase();
  // more ambient chatter for nightlife evenings, quieter for nature mornings
  let amp = 6;
  if (cat === 'nightlife' && (hour >= 20 || hour < 2)) amp = 14;
  if (cat === 'eats' && ((hour >= 12 && hour < 14) || (hour >= 18 && hour < 21))) amp = 10;
  if (cat === 'nature' && hour >= 9 && hour < 12) amp = 8;
  return Math.round(((h % (amp * 2)) - amp) * 0.6);
}

function prune(list, now) {
  return (list || []).filter((p) => p && now - p.at < TTL_MS).slice(-40);
}

function labelFor(score) {
  if (score >= 80) return { key: 'packed', label: 'Packed', tone: 'hot' };
  if (score >= 60) return { key: 'busy', label: 'Busy', tone: 'warm' };
  if (score >= 35) return { key: 'moderate', label: 'Moderate', tone: 'ok' };
  return { key: 'quiet', label: 'Quiet', tone: 'cool' };
}

function computeSnapshot(placeId, category, now = Date.now()) {
  const id = String(placeId || '');
  const store = loadStore();
  const d = new Date(now);
  const hour = d.getHours();
  const weekday = d.getDay();
  let base = baselineLevel(category, hour, weekday);
  base += ambientCommunity(id, category, now);

  const recent = prune(store.places[id], now);
  let communityScore = null;
  let reportsLast4h = recent.length;
  if (recent.length) {
    // time-decayed weighted average (newer reports weigh more)
    let wSum = 0;
    let sSum = 0;
    recent.forEach((p) => {
      const age = now - p.at;
      const w = Math.max(0.15, 1 - age / TTL_MS);
      wSum += w;
      sSum += p.score * w;
    });
    communityScore = sSum / wSum;
    const w = Math.min(0.82, 0.28 + recent.length * 0.09);
    base = Math.round(base * (1 - w) + communityScore * w);
  }

  // gentle live jitter so meters feel alive, stable per minute
  const minute = Math.floor(now / 60000);
  const jitter = Math.sin((minute + id.length) * 0.7) * 2.5;
  const score = Math.max(4, Math.min(98, Math.round(base + jitter)));
  const meta = labelFor(score);
  const uniqueReporters = new Set(recent.map((p) => p.user || p.at)).size;

  return {
    placeId: id,
    score,
    ...meta,
    reportsLast4h,
    uniqueReporters,
    updatedAt: now,
    hasCommunity: reportsLast4h > 0,
  };
}

/**
 * Submit a crowd report. Fans out to local store, other tabs, and API if present.
 */
export function reportCrowd(placeId, levelKey, meta = {}) {
  const id = String(placeId || '');
  if (!id) return null;
  const score = SCORE[levelKey] ?? 45;
  const store = loadStore();
  const pulse = {
    score,
    key: levelKey,
    at: Date.now(),
    user: meta.userId || meta.user || 'anon',
    source: meta.source || 'manual',
  };
  store.places[id] = prune([...(store.places[id] || []), pulse], Date.now());
  persist();

  // Best-effort backend share (multi-user when API is live)
  if (API_BASE) {
    try {
      fetch(`${API_BASE}/crowd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: id, level: levelKey, score, at: pulse.at }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* offline */
    }
  }
  return computeSnapshot(id, meta.category, Date.now());
}

/** Sync read for cards / lists (no React subscription). */
export function getCrowdSnapshot(placeId, category) {
  return computeSnapshot(placeId, category, Date.now());
}

export function safetyLevelFromPlace(place) {
  const raw = place?.safetyLevel || place?.safety_level || place?.safety;
  if (typeof raw === 'number') {
    if (raw >= 4) return { key: 'high', label: 'High', score: raw };
    if (raw >= 3) return { key: 'good', label: 'Good', score: raw };
    if (raw >= 2) return { key: 'moderate', label: 'Moderate', score: raw };
    return { key: 'caution', label: 'Use caution', score: raw };
  }
  if (typeof raw === 'string' && raw.trim()) {
    const s = raw.toLowerCase();
    if (/high|safe|excellent/.test(s)) return { key: 'high', label: raw, score: 5 };
    if (/good|ok|fine/.test(s)) return { key: 'good', label: raw, score: 4 };
    if (/moderate|average/.test(s)) return { key: 'moderate', label: raw, score: 3 };
    return { key: 'caution', label: raw, score: 2 };
  }
  const cat = String(place?.category || '').toLowerCase();
  if (place?.parking && cat !== 'nightlife') return { key: 'good', label: 'Good', score: 4 };
  if (cat === 'nightlife') return { key: 'moderate', label: 'Moderate — stay aware', score: 3 };
  if (cat === 'nature') return { key: 'good', label: 'Good — standard outdoor care', score: 4 };
  return { key: 'good', label: 'Good', score: 4 };
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Live crowd for a place — app-wide store, multi-tab sync, optional API.
 */
export function useCrowdLevel(placeId, category, userId) {
  const id = String(placeId || '');
  const [tick, setTick] = useState(0);

  const storeVersion = useSyncExternalStore(
    subscribe,
    () => {
      const s = loadStore();
      return JSON.stringify(s.places[id] || []);
    },
    () => '[]'
  );

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // Optional: pull server aggregate
  useEffect(() => {
    if (!id || !API_BASE) return undefined;
    let cancelled = false;
    fetch(`${API_BASE}/crowd/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const remote = Array.isArray(data.pulses) ? data.pulses : data.reports || [];
        if (!remote.length) return;
        const store = loadStore();
        const merged = prune(
          [...(store.places[id] || []), ...remote.map((p) => ({
            score: Number(p.score) || SCORE[p.level] || 45,
            key: p.level || p.key || 'moderate',
            at: p.at || Date.now(),
            user: p.user || 'remote',
            source: 'api',
          }))],
          Date.now()
        );
        store.places[id] = merged;
        persist();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, tick]);

  const report = useCallback(
    (levelKey) => reportCrowd(id, levelKey, { userId, category, source: 'manual' }),
    [id, userId, category]
  );

  return useMemo(() => {
    const snap = computeSnapshot(id, category, Date.now());
    return { ...snap, report };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, category, storeVersion, tick, report]);
}

export { labelFor, SCORE as CROWD_SCORES };
