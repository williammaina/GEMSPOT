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
  return row;
}

export function getAnalyticsSummary() {
  const rows = read();
  const byName = {};
  const paths = {};
  const cats = {};
  rows.forEach((r) => {
    byName[r.name] = (byName[r.name] || 0) + 1;
    if (r.path) paths[r.path] = (paths[r.path] || 0) + 1;
    if (r.props?.category) cats[r.props.category] = (cats[r.props.category] || 0) + 1;
  });
  return {
    total: rows.length,
    last24h: rows.filter((r) => Date.now() - r.at < 86400000).length,
    topEvents: Object.entries(byName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name, count })),
    topPaths: Object.entries(paths)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([path, count]) => ({ path, count })),
    topCategories: Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count })),
    guestToAuth: {
      detailBlocks: byName.guest_detail_blocked || 0,
      registers: byName.auth_register || 0,
    },
  };
}

export function clearAnalytics() {
  write([]);
}
