import { apiClient } from '../handlers/apiClient.js';
import { getToken, isDemoToken } from '../../app/site/private/authentication/authService.js';

const QUEUE_KEY = 'gemspot-sync-queue';
const META_KEY = 'gemspot-sync-meta';

function canUseApi() {
  const t = getToken();
  return Boolean(t && !isDemoToken(t));
}

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeQueue(q) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-80)));
  } catch {
    /* */
  }
}

function setMeta(partial) {
  try {
    const prev = JSON.parse(localStorage.getItem(META_KEY) || '{}');
    localStorage.setItem(META_KEY, JSON.stringify({ ...prev, ...partial, at: Date.now() }));
  } catch {
    /* */
  }
}

export function getSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Enqueue a mutation for later if API is down / offline.
 */
export function enqueueSync(op) {
  const q = readQueue();
  q.push({ ...op, enqueuedAt: Date.now() });
  writeQueue(q);
}

/**
 * Pull cloud user state (favorites, plan, interested, going).
 * Returns null if unavailable.
 */
export async function pullUserState() {
  if (!canUseApi()) return null;
  try {
    const { data } = await apiClient.get('/me/state');
    const body = data?.data || data || {};
    setMeta({ lastPull: Date.now(), ok: true });
    return {
      favorites: body.favorites || body.favorite_ids || [],
      planStops: body.plan_stops || body.planStops || [],
      interestedEvents: body.interested_events || body.interestedEvents || [],
      goingEventIds: body.going_event_ids || body.goingEventIds || [],
    };
  } catch {
    // Fallback: try discrete endpoints
    try {
      const fav = await apiClient.get('/favorites');
      const list = fav.data?.data || fav.data || [];
      const ids = (Array.isArray(list) ? list : []).map((x) =>
        String(x.place_id ?? x.id ?? x)
      );
      setMeta({ lastPull: Date.now(), ok: true, partial: true });
      return { favorites: ids, planStops: null, interestedEvents: null, goingEventIds: null };
    } catch {
      setMeta({ lastPull: Date.now(), ok: false });
      return null;
    }
  }
}

/**
 * Push full snapshot of local user lists to cloud.
 */
export async function pushUserState(snapshot) {
  if (!canUseApi()) {
    enqueueSync({ type: 'push_state', snapshot });
    return { queued: true };
  }
  try {
    await apiClient.put('/me/state', {
      favorites: snapshot.favorites || [],
      plan_stops: snapshot.planStops || [],
      interested_events: snapshot.interestedEvents || [],
      going_event_ids: snapshot.goingEventIds || [],
    });
    setMeta({ lastPush: Date.now(), ok: true });
    return { ok: true };
  } catch {
    enqueueSync({ type: 'push_state', snapshot });
    setMeta({ lastPush: Date.now(), ok: false });
    return { queued: true };
  }
}

export async function flushSyncQueue() {
  if (!canUseApi()) return { flushed: 0 };
  const q = readQueue();
  if (!q.length) return { flushed: 0 };
  const remain = [];
  let flushed = 0;
  for (const op of q) {
    try {
      if (op.type === 'push_state') {
        await apiClient.put('/me/state', {
          favorites: op.snapshot?.favorites || [],
          plan_stops: op.snapshot?.planStops || [],
          interested_events: op.snapshot?.interestedEvents || [],
          going_event_ids: op.snapshot?.goingEventIds || [],
        });
        flushed += 1;
      } else if (op.type === 'crowd') {
        await apiClient.post('/crowd', op.payload);
        flushed += 1;
      } else {
        remain.push(op);
      }
    } catch {
      remain.push(op);
    }
  }
  writeQueue(remain);
  return { flushed, remaining: remain.length };
}

/** Online listener helper */
export function attachOnlineFlush(cb) {
  if (typeof window === 'undefined') return () => {};
  const run = () => {
    flushSyncQueue().then((r) => cb?.(r));
  };
  window.addEventListener('online', run);
  return () => window.removeEventListener('online', run);
}
