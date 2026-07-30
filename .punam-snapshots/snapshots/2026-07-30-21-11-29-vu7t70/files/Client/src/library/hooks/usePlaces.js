import { useEffect, useState } from 'react';
import { placesData } from '../json/placesData.js';
import { fetchPlacesHandler, fetchPlaceByIdHandler } from '../handlers/apiHandler.js';
import { isOpenNow, openStatusLabel } from '../helpers/openingHours.js';
import { calculateDistance } from '../helpers/calculateDistance.js';

/** Map frontend filter keys → backend category name fragments */
const CATEGORY_ALIASES = {
  nature: ['nature', 'outdoors', 'nature & outdoors'],
  eats: ['eats', 'cafe', 'cafes', 'cafes & workspaces', 'food', 'restaurant'],
  nightlife: ['nightlife', 'nightlife & vibes', 'vibes', 'club'],
  action: ['action', 'adventure', 'action & adventure', 'play'],
};

function categoryMatchesFilter(placeCategory, filterKey) {
  if (!filterKey || filterKey === 'all') return true;
  const aliases = CATEGORY_ALIASES[filterKey] || [filterKey];
  const cat = String(placeCategory || '').toLowerCase();
  return aliases.some((a) => cat === a || cat.includes(a));
}

function filterLocalPlaces({ category, query, budget, sort }) {
  const normalizedQuery = (query || '').trim().toLowerCase();
  const normalizedBudget = (budget || 'all').toLowerCase();
  const normalizedSort = (sort || 'rating').toLowerCase();

  const filtered = placesData.filter((place) => {
    const title = (place.title || place.name || '').toLowerCase();
    const locationName = (place.location || '').toLowerCase();
    const cat = place.category || '';
    const description = (place.description || '').toLowerCase();
    const vibes = Array.isArray(place.vibes) ? place.vibes.join(' ').toLowerCase() : '';
    const searchBlob = [title, locationName, cat, description, vibes].join(' ');

    const categoryOk = categoryMatchesFilter(cat, category);
    const queryMatches = !normalizedQuery || searchBlob.includes(normalizedQuery);
    const budgetMatches =
      normalizedBudget === 'all' ||
      (place.budgetTier || '').toLowerCase() === normalizedBudget;

    return categoryOk && queryMatches && budgetMatches;
  });

  return sortPlaces(filtered, normalizedSort);
}

function sortPlaces(list, sort) {
  const normalizedSort = (sort || 'rating').toLowerCase();
  return [...list].sort((a, b) => {
    if (normalizedSort === 'price-asc') return (a.price ?? 0) - (b.price ?? 0);
    if (normalizedSort === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
    if (normalizedSort === 'name') {
      return String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''));
    }
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}

/**
 * Normalize API / local place into UI shape.
 * CRITICAL: route id must be backend place_id (numeric), not old local slugs.
 */
export function normalizePlace(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  const placeId = raw.place_id ?? raw.id ?? raw._id ?? null;
  const vibes = raw.vibes || raw.vibe_tags || raw.tags || [];
  const amenities = raw.amenities || raw.features || [];

  // category may be nested object from Flask relationship
  let category = raw.category;
  if (category && typeof category === 'object') {
    category = category.name || category.slug || category.key || '';
  }
  category = category || raw.category_name || raw.type || '';

  const tagsList = Array.isArray(raw.tags)
    ? raw.tags.map((t) => (typeof t === 'string' ? t : t.name || t.label)).filter(Boolean)
    : [];

  return {
    ...raw,
    // Always prefer numeric place_id for routing & API calls
    id: placeId != null ? String(placeId) : raw.slug || '',
    place_id: placeId,
    slug: placeId != null ? String(placeId) : raw.slug || '',
    title: raw.title || raw.name || 'Untitled spot',
    name: raw.name || raw.title || 'Untitled spot',
    description: raw.description || raw.summary || raw.about || '',
    location:
      raw.location ||
      [raw.town, raw.county].filter(Boolean).join(', ') ||
      raw.address ||
      '',
    town: raw.town || '',
    county: raw.county || '',
    category: String(category).toLowerCase(),
    categoryLabel: String(category),
    image:
      raw.image ||
      raw.image_url ||
      raw.featured_image ||
      raw.featuredImage ||
      raw.cover_image ||
      raw.photo ||
      '',
    featuredImage: raw.featured_image || raw.featuredImage || raw.image || '',
    rating: Number(raw.rating ?? raw.avg_rating ?? raw.score ?? 0) || 0,
    price: raw.price ?? raw.damage_for_two ?? raw.damage ?? raw.cost ?? null,
    priceLevel: raw.price_level || raw.priceLevel || '',
    budgetTier: raw.budget_tier || raw.budgetTier || '',
    mpesaAvailable: raw.mpesa_available ?? raw.mpesaAvailable ?? null,
    parking: raw.parking ?? null,
    wifi: raw.wifi ?? null,
    matatu: raw.matatu_route || raw.matatu || '',
    gateFee: raw.gate_fee || raw.gateFee || '',
    dressCode: raw.dress_code || raw.dressCode || '',
    latitude: Number(raw.latitude ?? raw.lat) || undefined,
    longitude: Number(raw.longitude ?? raw.lng ?? raw.lon) || undefined,
    vibes: Array.isArray(vibes)
      ? vibes.map((v) => (typeof v === 'string' ? v : v.name || '')).filter(Boolean)
      : tagsList,
    amenities: Array.isArray(amenities)
      ? amenities.map((a) => (typeof a === 'string' ? a : a.name || '')).filter(Boolean)
      : [],
    tags: tagsList,
    reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
    reels: Array.isArray(raw.reels) ? raw.reels : Array.isArray(raw.gallery) ? raw.gallery : [],
    indoorAlternatives: raw.indoorAlternatives || raw.indoor_alternatives || [],
    featured: Boolean(raw.featured || raw.is_featured || raw.verified),
    openingHours: raw.opening_hours || raw.openingHours || raw.hours || '',
    openNow: isOpenNow(raw.opening_hours || raw.openingHours || raw.hours || ''),
    openLabel: openStatusLabel(raw.opening_hours || raw.openingHours || raw.hours || ''),
  };
}

/** Query params sent to Flask — map UI keys to backend-friendly values */
function buildPlacesParams({ category, query, budget, sort }) {
  const params = {};
  if (query) {
    params.q = query;
    params.search = query;
  }
  if (budget && budget !== 'all') params.budget = budget;
  if (sort) params.sort = sort;

  // Send both short key and expanded name so either backend style works
  if (category && category !== 'all') {
    params.category = category;
    const nameMap = {
      nature: 'Nature & Outdoors',
      eats: 'Cafes & Workspaces',
      nightlife: 'Nightlife & Vibes',
      action: 'Action & Adventure',
    };
    if (nameMap[category]) {
      params.category_name = nameMap[category];
    }
  }
  return params;
}

export function usePlaces({
  category = 'all',
  query = '',
  budget = 'all',
  sort = 'rating',
  openNowOnly = false,
  userLocation = null,
} = {}) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('local');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const params = buildPlacesParams({ category, query, budget, sort });

      try {
        const remote = await fetchPlacesHandler(params);
        if (cancelled) return;

        let normalized = (Array.isArray(remote) ? remote : []).map(normalizePlace);

        // Client-side category filter using aliases (backend may return all)
        if (category && category !== 'all') {
          const matched = normalized.filter((p) =>
            categoryMatchesFilter(p.categoryLabel || p.category, category)
          );
          if (matched.length > 0) normalized = matched;
        }

        if (query) {
          const q = query.toLowerCase();
          normalized = normalized.filter((p) => {
            const blob = [p.title, p.location, p.category, p.description, ...(p.vibes || [])]
              .join(' ')
              .toLowerCase();
            return blob.includes(q);
          });
        }

        if (openNowOnly) {
          normalized = normalized.filter((p) => p.openNow === true);
        }
        if (sort === 'distance' && userLocation) {
          normalized = [...normalized].sort((a, b) => {
            const da =
              a.latitude != null
                ? calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
                : 9999;
            const db =
              b.latitude != null
                ? calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
                : 9999;
            return da - db;
          });
        } else {
          normalized = sortPlaces(normalized, sort);
        }
        setPlaces(normalized);
        setSource('api');
        setLoading(false);
        if (import.meta.env.DEV) {
          console.info(`[GemSpot] places from API: ${normalized.length}`);
        }
        return;
      } catch (err) {
        if (cancelled) return;
        setError(err);
        if (import.meta.env.DEV) {
          console.warn('[GemSpot] places API failed — local seed', err?.message || err);
        }
      }

      if (cancelled) return;
      setPlaces(filterLocalPlaces({ category, query, budget, sort }));
      setSource('local');
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [category, query, budget, sort, openNowOnly, userLocation]);

  return {
    places,
    total: places.length,
    isEmpty: places.length === 0,
    loading,
    error,
    source,
  };
}

export async function getPlaceById(id) {
  if (id == null || id === '') return null;

  // Never call API with old local-only slugs if we can avoid 404 noise —
  // still try API first for numeric ids and any backend slug support.
  try {
    const remote = await fetchPlaceByIdHandler(id);
    if (remote && typeof remote === 'object') {
      return normalizePlace(remote);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[GemSpot] place detail API', id, err?.response?.status || err?.message);
    }
  }

  // Local fallback only for legacy demo slugs
  return (
    placesData.find((item) => String(item.slug || item.id) === String(id)) || null
  );
}

export function getRelatedPlaces(place, limit = 3) {
  if (!place) return [];
  return placesData
    .filter(
      (p) =>
        String(p.id) !== String(place.id) &&
        (p.category === place.category ||
          (Array.isArray(p.vibes) &&
            Array.isArray(place.vibes) &&
            p.vibes.some((v) => place.vibes.includes(v))))
    )
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);
}

export function usePlaceDetail(id) {
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getPlaceById(id)
      .then((result) => {
        if (!cancelled) {
          setPlace(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { place, related: getRelatedPlaces(place, 3), loading, error };
}
