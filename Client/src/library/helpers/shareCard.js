/**
 * Build a shareable text card (WhatsApp / clipboard).
 * Canvas image optional when DOM available.
 */
export function buildShareText({ title, location, price, distance, crowd, url }) {
  const lines = [
    title || 'GemSpot pick',
    location ? `📍 ${location}` : null,
    price ? `💸 ${price}` : null,
    distance ? `↗ ${distance}` : null,
    crowd ? `👥 ${crowd}` : null,
    url || (typeof window !== 'undefined' ? window.location.href : ''),
    '— via GemSpot KE',
  ].filter(Boolean);
  return lines.join('\n');
}

export async function sharePlaceCard(place, extras = {}) {
  const text = buildShareText({
    title: place?.title || place?.name,
    location: place?.location,
    price: place?.price != null ? `KES ${place.price}` : place?.priceLevel,
    distance: extras.distance,
    crowd: extras.crowd,
    url: extras.url || (typeof window !== 'undefined' ? window.location.href : ''),
  });
  if (navigator.share) {
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
