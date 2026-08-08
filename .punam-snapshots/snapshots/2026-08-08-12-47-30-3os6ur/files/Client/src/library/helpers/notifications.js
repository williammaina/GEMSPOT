const REMINDERS_KEY = 'gemspot-reminders';
const PREF_KEY = 'gemspot-notify-pref';

export function getNotifyPref() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || '{"enabled":false}');
  } catch {
    return { enabled: false };
  }
}

export function setNotifyPref(pref) {
  localStorage.setItem(PREF_KEY, JSON.stringify(pref));
}

export async function ensureNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const r = await Notification.requestPermission();
  setNotifyPref({ enabled: r === 'granted' });
  return r;
}

export function showLocalNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    const n = new Notification(title, {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      ...options,
    });
    if (options.onClickUrl) {
      n.onclick = () => {
        window.focus();
        window.location.href = options.onClickUrl;
        n.close();
      };
    }
    return true;
  } catch {
    return false;
  }
}

function readReminders() {
  try {
    return JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeReminders(list) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(list.slice(-40)));
}

/**
 * Schedule a local reminder (checked while app is open).
 */
export function scheduleReminder({ id, title, body, at, url }) {
  const list = readReminders().filter((r) => r.id !== id);
  list.push({ id, title, body, at: Number(at), url: url || '/', fired: false });
  writeReminders(list);
  return id;
}

export function cancelReminder(id) {
  writeReminders(readReminders().filter((r) => r.id !== id));
}

/** Call periodically from AppProvider */
export function tickReminders() {
  const now = Date.now();
  const list = readReminders();
  let changed = false;
  for (const r of list) {
    if (!r.fired && r.at <= now) {
      showLocalNotification(r.title, { body: r.body, onClickUrl: r.url });
      r.fired = true;
      changed = true;
    }
  }
  if (changed) writeReminders(list);
  return list.filter((r) => !r.fired);
}

export function whatsappRemindLink(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Helpers for plan / event */
export function remindPlanInOneHour(planStops = []) {
  const titles = planStops.map((p) => p.title).filter(Boolean).slice(0, 5);
  const body = titles.length
    ? `Tonight: ${titles.join(' → ')}`
    : 'Your GemSpot plan is coming up';
  return scheduleReminder({
    id: `plan-${Date.now()}`,
    title: 'GemSpot · plan in 1 hour',
    body,
    at: Date.now() + 60 * 60 * 1000,
    url: '/saved?tab=plan',
  });
}

export function remindEvent(event, hoursBefore = 24) {
  if (!event) return null;
  const start = event.startDate || event.starts_at || event.start;
  let at = Date.now() + hoursBefore * 3600 * 1000;
  if (start) {
    const t = new Date(start).getTime();
    if (!Number.isNaN(t)) at = Math.max(Date.now() + 60_000, t - hoursBefore * 3600 * 1000);
  }
  return scheduleReminder({
    id: `event-${event.id}`,
    title: `GemSpot · ${event.title || 'Event'}`,
    body: `Starts soon${event.location ? ` · ${event.location}` : ''}`,
    at,
    url: `/event/${event.id}`,
  });
}
