/**
 * Weather-aware Plan B: when rain risk is high for outdoor places,
 * surface indoor alternatives (eats / nightlife / indoor action).
 */

const RAIN_PRECIP_THRESHOLD = 55; // %
const RAIN_CONDITIONS = /rain|shower|drizzle|thunder|storm/i;

export function isHighRainRisk(weather) {
  if (!weather || weather.loading) return false;
  const precip = Number(weather.precipProb);
  if (Number.isFinite(precip) && precip >= RAIN_PRECIP_THRESHOLD) return true;
  const label = String(weather.condition || weather.label || '');
  return RAIN_CONDITIONS.test(label);
}

export function isOutdoorCategory(category) {
  const c = String(category || '').toLowerCase();
  return c === 'nature' || c === 'action';
}

export function isIndoorFriendly(place) {
  if (!place) return false;
  const cat = String(place.category || '').toLowerCase();
  if (cat === 'eats' || cat === 'nightlife') return true;
  const blob = [
    place.title,
    place.name,
    place.description,
    ...(place.vibes || []),
    ...(place.tags || []),
    ...(place.activities || []),
  ]
    .join(' ')
    .toLowerCase();
  if (/indoor|mall|covered|cafe|coffee|cinema|museum|gallery/.test(blob)) return true;
  if (place.wifi && cat === 'action') return true;
  return false;
}

/**
 * Pick indoor Plan B candidates near the current place.
 */
export function pickIndoorAlternatives(current, allPlaces = [], limit = 4) {
  if (!current) return [];
  const id = String(current.place_id ?? current.id ?? '');
  const scored = allPlaces
    .filter((p) => String(p.place_id ?? p.id) !== id)
    .filter(isIndoorFriendly)
    .map((p) => {
      let score = 0;
      const cat = String(p.category || '').toLowerCase();
      if (cat === 'eats') score += 3;
      if (cat === 'nightlife') score += 2;
      if (p.wifi) score += 1;
      if (p.verified) score += 1;
      // prefer same town
      if (p.town && current.town && String(p.town).toLowerCase() === String(current.town).toLowerCase()) {
        score += 4;
      }
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
  return scored;
}

export function planBMessage(weather) {
  const precip = weather?.precipProb;
  if (Number.isFinite(precip) && precip >= RAIN_PRECIP_THRESHOLD) {
    return `${Math.round(precip)}% chance of rain`;
  }
  return weather?.condition || 'Wet weather';
}
