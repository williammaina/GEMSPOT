const KEY = 'gemspot-analytics-v1';
const MAX = 500;

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function write(rows) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows.slice(-MAX)));
  } catch {
    /* */
  }
}

export function trackEvent(name, props = {}) {
  const row = {
    name: String(name),
    props,
    at: Date.now(),
    path: typeof window !== 'undefined' ? window.location.pathname : '',
  };
  const rows = read();
  rows.push(row);
  write(rows);
  if (import.meta.env?.DEV) {
    console.info('[analytics]', name, props);
  }
  return row;
}

export function getAnalyticsSummary() {
  const rows = read();
  const byName = {};
  const paths = {};
  rows.forEach((r) => {
    byName[r.name] = (byName[r.name] || 0) + 1;
    if (r.path) paths[r.path] = (paths[r.path] || 0) + 1;
  });
  const topEvents = Object.entries(byName)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));
  const topPaths = Object.entries(paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }));
  return {
    total: rows.length,
    topEvents,
    topPaths,
    last24h: rows.filter((r) => Date.now() - r.at < 86400000).length,
  };
}

export function clearAnalytics() {
  write([]);
}
