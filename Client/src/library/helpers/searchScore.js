/**
 * Multi-field search score for places (higher = better match).
 */
export function scorePlace(place, query) {
  const q = String(query || '')
    .toLowerCase()
    .trim();
  if (!q) return 1;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (!tokens.length) return 1;

  const fields = [
    { w: 5, v: place.title || place.name },
    { w: 4, v: place.location },
    { w: 3, v: place.town },
    { w: 3, v: place.county },
    { w: 3, v: place.category },
    { w: 2.5, v: (place.vibes || place.tags || []).join(' ') },
    { w: 2.5, v: place.matatu || place.matatu_route },
    { w: 2, v: (place.menuHighlights || place.menu_highlights || []).join(' ') },
    { w: 2, v: (place.activities || []).join(' ') },
    { w: 2, v: (place.signatureDrinks || place.signature_drinks || []).join(' ') },
    { w: 1.5, v: place.description },
    { w: 1.5, v: place.dressCode || place.dress_code },
    { w: 1, v: place.bestTime || place.best_time },
  ];

  let score = 0;
  for (const token of tokens) {
    let hit = 0;
    for (const f of fields) {
      const text = String(f.v || '').toLowerCase();
      if (!text) continue;
      if (text === token) hit += f.w * 3;
      else if (text.startsWith(token)) hit += f.w * 2;
      else if (text.includes(token)) hit += f.w;
    }
    if (hit === 0) return 0; // every token must match something
    score += hit;
  }
  return score;
}

export function filterAndRankPlaces(list, query) {
  const q = String(query || '').trim();
  if (!q) return list;
  return list
    .map((p) => ({ p, s: scorePlace(p, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);
}
