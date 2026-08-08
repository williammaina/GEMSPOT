/**
 * Trust & quality helpers: freshness, open check-ins, safety notes, local badges.
 */

const OPEN_KEY = 'gemspot-open-checkins';
const REPORT_KEY = 'gemspot-media-reports';

export function getFreshness(place) {
  const raw =
    place?.updatedAt ||
    place?.updated_at ||
    place?.last_verified ||
    place?.created_at ||
    null;
  let ts = raw ? new Date(raw).getTime() : null;
  if (!ts || Number.isNaN(ts)) {
    // seed data: stable pseudo age from id
    const id = String(place?.place_id ?? place?.id ?? 'x');
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 14;
    ts = Date.now() - (h + 1) * 86400000;
  }
  const days = Math.max(0, Math.floor((Date.now() - ts) / 86400000));
  let label;
  if (days === 0) label = 'Updated today';
  else if (days === 1) label = 'Updated yesterday';
  else if (days < 7) label = `Updated ${days} days ago`;
  else if (days < 30) label = `Updated ${Math.floor(days / 7)} weeks ago`;
  else label = 'May be outdated';
  return { days, label, stale: days >= 21, ts };
}

export function safetyNotesForPlace(place) {
  const cat = String(place?.category || '').toLowerCase();
  const hour = new Date().getHours();
  const notes = [];
  const base = place?.safetyLevel || place?.safety_level || place?.safety;
  if (typeof base === 'string' && base.trim()) notes.push(base);

  if (cat === 'nightlife') {
    if (hour >= 22 || hour < 5) {
      notes.push('Late night — use a trusted ride (Uber/Bolt) after 10pm');
      notes.push('Stay in well-lit areas near the venue');
    } else {
      notes.push('Standard nightlife awareness');
    }
  } else if (cat === 'nature') {
    notes.push('Carry water · tell someone your route');
    if (hour >= 17) notes.push('Daylight fading — finish trails before dark');
  } else if (cat === 'action') {
    notes.push('Follow venue safety rules and gear requirements');
  } else if (cat === 'eats') {
    notes.push('Generally low risk · watch belongings in busy spots');
  }

  if (place?.parking) notes.push('Parking available — still lock valuables');
  return [...new Set(notes)].slice(0, 4);
}

function readMap(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

function writeMap(key, map) {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* */
  }
}

/** User reports "open now" / "closed" for a place */
export function reportOpenStatus(placeId, isOpen, userId = 'anon') {
  const id = String(placeId);
  const map = readMap(OPEN_KEY);
  const list = (map[id] || []).filter((x) => Date.now() - x.at < 6 * 3600000);
  list.push({ open: Boolean(isOpen), at: Date.now(), user: userId });
  map[id] = list.slice(-20);
  writeMap(OPEN_KEY, map);
  return aggregateOpenStatus(id, null);
}

export function aggregateOpenStatus(placeId, fallbackOpen = null) {
  const id = String(placeId);
  const list = (readMap(OPEN_KEY)[id] || []).filter((x) => Date.now() - x.at < 6 * 3600000);
  if (!list.length) {
    return {
      hasReports: false,
      open: fallbackOpen,
      label: fallbackOpen == null ? 'Hours unknown' : fallbackOpen ? 'Likely open' : 'Likely closed',
      reports: 0,
    };
  }
  const openVotes = list.filter((x) => x.open).length;
  const closedVotes = list.length - openVotes;
  const open = openVotes >= closedVotes;
  return {
    hasReports: true,
    open,
    label: open
      ? `Open now · ${openVotes} check-in${openVotes === 1 ? '' : 's'}`
      : `Closed · ${closedVotes} report${closedVotes === 1 ? '' : 's'}`,
    reports: list.length,
  };
}

export function reportMedia(reviewId, reason = 'inappropriate') {
  const map = readMap(REPORT_KEY);
  map[String(reviewId)] = {
    reason,
    at: Date.now(),
    count: (map[String(reviewId)]?.count || 0) + 1,
  };
  writeMap(REPORT_KEY, map);
  return map[String(reviewId)];
}

export function isMediaReported(reviewId) {
  return Boolean(readMap(REPORT_KEY)[String(reviewId)]);
}

export function isVerifiedLocal(review) {
  if (!review) return false;
  if (review.verifiedLocal || review.verified_local || review.local) return true;
  // heuristic: Kenyan phone or "local" in body
  if (/local|nairobi|mimi|tuko/i.test(String(review.body || review.text || ''))) return true;
  return Boolean(review.user?.verified);
}

/** Rank reviews: useful tips + media first, reported last */
export function rankReviews(reviews = []) {
  return [...reviews].sort((a, b) => {
    const ar = isMediaReported(a.id) ? -50 : 0;
    const br = isMediaReported(b.id) ? -50 : 0;
    const au =
      (a.tip ? 5 : 0) +
      (a.photos?.length || a.media ? 3 : 0) +
      (isVerifiedLocal(a) ? 4 : 0) +
      (a.helpful || 0);
    const bu =
      (b.tip ? 5 : 0) +
      (b.photos?.length || b.media ? 3 : 0) +
      (isVerifiedLocal(b) ? 4 : 0) +
      (b.helpful || 0);
    return bu + br - (au + ar);
  });
}
