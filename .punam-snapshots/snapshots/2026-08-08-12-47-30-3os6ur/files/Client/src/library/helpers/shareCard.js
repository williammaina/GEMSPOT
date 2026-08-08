export function buildShareText({ title, location, price, distance, crowd, url }) {
  return [
    title || 'GemSpot pick',
    location ? `📍 ${location}` : null,
    price ? `💸 ${price}` : null,
    distance ? `↗ ${distance}` : null,
    crowd ? `👥 ${crowd}` : null,
    url || (typeof window !== 'undefined' ? window.location.href : ''),
    '— via GemSpot KE',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function sharePlaceCard(place, extras = {}) {
  const text = buildShareText({
    title: place?.title || place?.name,
    location: place?.location,
    price: place?.price != null ? `KES ${place.price}` : place?.priceLevel,
    distance: extras.distance,
    crowd: extras.crowd,
    url: extras.url,
  });
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: place?.title, text });
      return true;
    } catch {
      /* */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return false;
  }
}
