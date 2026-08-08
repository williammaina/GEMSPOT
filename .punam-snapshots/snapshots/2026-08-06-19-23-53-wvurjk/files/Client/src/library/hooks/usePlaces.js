import { useEffect, useState, useCallback, useMemo } from 'react';
import { placesData } from '../json/placesData.js';
import { fetchPlacesHandler, fetchPlaceByIdHandler } from '../handlers/apiHandler.js';
import { calculateDistance } from '../helpers/calculateDistance.js';
import { isOpenNow } from '../helpers/openingHours.js';
import { mergeWithAdminPlaces, ADMIN_CHANGED } from '../helpers/adminStore.js';

function normalizePlace(p) {
  if (!p) return null;
  const id = p.place_id ?? p.id ?? p.slug;
  // Map backend snake_case JSON fields → frontend camelCase used by PlaceCard / CategoryInsights
  const menuHighlights =
    p.menuHighlights || p.menu_highlights || [];
  const whatToBring = p.whatToBring || p.what_to_bring || [];
  const signatureDrinks = p.signatureDrinks || p.signature_drinks || [];
  const musicVibe = p.musicVibe || p.music_vibe || null;
  const peakHours = p.peakHours || p.peak_hours || null;
  const coverCharge = p.coverCharge || p.cover_charge || null;
  const bestTime = p.bestTime || p.best_time || null;
  const dressCode = p.dressCode || p.dress_code || null;
  const priceLevel = p.priceLevel || p.price_level || null;
  const matatu = p.matatu || p.matatu_route || '';
  const price =
    p.price != null
      ? p.price
      : p.damage_for_two != null
        ? p.damage_for_two
        : null;
  const image = p.image || p.featured_image || '';
  const location =
    p.location ||
    [p.town, p.county].filter(Boolean).join(', ') ||
    p.address ||
    '';
  const vibes = Array.isArray(p.vibes)
    ? p.vibes
    : Array.isArray(p.tags)
      ? p.tags.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean)
      : [];

  return {
    ...p,
    place_id: id,
    id: id,
    title: p.title || p.name,
    name: p.name || p.title,
    image,
    featured_image: p.featured_image || image,
    matatu,
    matatu_route: p.matatu_route || matatu,
    price,
    damage_for_two: p.damage_for_two != null ? p.damage_for_two : price,
    location,
    hours: p.hours || p.opening_hours || null,
    opening_hours: p.opening_hours || p.hours || null,
    priceLevel,
    price_level: p.price_level || priceLevel,
    dressCode,
    dress_code: p.dress_code || dressCode,
    menuHighlights,
    menu_highlights: p.menu_highlights || menuHighlights,
    whatToBring,
    what_to_bring: p.what_to_bring || whatToBring,
    signatureDrinks,
    signature_drinks: p.signature_drinks || signatureDrinks,
    musicVibe,
    music_vibe: p.music_vibe || musicVibe,
    peakHours,
    peak_hours: p.peak_hours || peakHours,
    coverCharge,
    cover_charge: p.cover_charge || coverCharge,
    bestTime,
    best_time: p.best_time || bestTime,
    activities: Array.isArray(p.activities) ? p.activities : [],
    requirements: Array.isArray(p.requirements) ? p.requirements : [],
    dietary: Array.isArray(p.dietary) ? p.dietary : [],
    vibes,
    mpesa: p.mpesa != null ? p.mpesa : p.mpesa_available,
    wifi: Boolean(p.wifi),
    openNow: p.openNow != null ? p.openNow : true,
    openLabel: p.openLabel || (p.opening_hours || p.hours ? 'Open now' : null),
    category:
      typeof p.category === 'string'
        ? p.category
        : p.category?.name
          ? String(p.category.name).toLowerCase()
          : p.category_slug || 'other',
  };
}

function matchesBudget(place, budget) {
  if (!budget || budget === 'all') return true;
  const price = Number(place.price);
  if (!Number.isFinite(price)) return true;
  switch (budget) {
    case 'under1500':
      return price < 1500;
    case 'mid':
      return price >= 1500 && price < 3000;
    case 'premium':
      return price >= 3000 && price < 6000;
    case 'luxury':
      return price >= 6000;
    default:
      return true;
  }
}

function sortPlaces(list, sort, userLocation) {
  const next = [...list];
  switch (sort) {
    case 'price-asc':
      return next.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    case 'price-desc':
      return next.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    case 'name':
      return next.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
    case 'distance':
      if (!userLocation) return next;
      return next.sort((a, b) => {
        const da =
          a.latitude != null && a.longitude != null
            ? calculateDistance(userLocation.lat, userLocation.lng, Number(a.latitude), Number(a.longitude))
            : 9999;
        const db =
          b.latitude != null && b.longitude != null
            ? calculateDistance(userLocation.lat, userLocation.lng, Number(b.latitude), Number(b.longitude))
            : 9999;
        return da - db;
      });
    case 'rating':
    default:
      return next.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  }
}

export function getPlaceById(id) {
  const key = String(id || '');
  const adminHit = mergeWithAdminPlaces([]).find(
    (p) => String(p.place_id) === key || String(p.id) === key || String(p.slug) === key
  );
  const local = placesData.find(
    (p) => String(p.place_id) === key || String(p.id) === key || String(p.slug) === key
  );
  return Promise.resolve(normalizePlace(adminHit || local)).then(async (seed) => {
    try {
      const remote = await fetchPlaceByIdHandler(id);
      if (remote) return normalizePlace({ ...seed, ...remote });
    } catch {
      /* keep seed */
    }
    return seed;
  });
}

export function getRelatedPlaces(place, limit = 3) {
  if (!place) return [];
  const cat = place.category;
  const id = String(place.place_id ?? place.id);
  return placesData
    .filter((p) => String(p.place_id) !== id && (!cat || p.category === cat))
    .slice(0, limit)
    .map(normalizePlace);
}

export function usePlaces(params = {}) {
  const [rawPlaces, setRawPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('local');

  const category = params.category || params.cat || 'all';
  const query = params.query || params.q || params.search || '';
  const budget = params.budget || 'all';
  const sort = params.sort || 'rating';
  const openNowOnly = Boolean(params.openNowOnly || params.open);
  const matatuOnly = Boolean(params.matatuOnly || params.matatu);
  const eveningOnly = Boolean(params.eveningOnly || params.evening);
  const userLocation = params.userLocation || null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let list = placesData.map(normalizePlace);
      let fromApi = false;
      try {
        const remote = await fetchPlacesHandler({
          category: category !== 'all' ? category : undefined,
          q: query || undefined,
        });
        if (Array.isArray(remote) && remote.length) {
          list = remote.map(normalizePlace);
          fromApi = true;
        }
      } catch {
        /* seed */
      }
      list = mergeWithAdminPlaces(list);
      setRawPlaces(list);
      setSource(fromApi ? 'api' : 'local');
    } catch (e) {
      setError(e);
      setRawPlaces(mergeWithAdminPlaces(placesData.map(normalizePlace)));
      setSource('local');
    } finally {
      setLoading(false);
    }
  }, [category, query]);

  useEffect(() => {
    load();
    const onAdmin = () => load();
    window.addEventListener(ADMIN_CHANGED, onAdmin);
    window.addEventListener('storage', onAdmin);
    return () => {
      window.removeEventListener(ADMIN_CHANGED, onAdmin);
      window.removeEventListener('storage', onAdmin);
    };
  }, [load]);

  const places = useMemo(() => {
    let list = rawPlaces;

    if (category && category !== 'all') {
      list = list.filter(
        (p) => String(p.category || '').toLowerCase() === String(category).toLowerCase()
      );
    }

    const q = String(query || '')
      .toLowerCase()
      .trim();
    if (q) {
      list = list.filter((p) => {
        const blob = [p.title, p.name, p.location, p.town, p.description, ...(p.vibes || []), ...(p.tags || [])]
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      });
    }

    if (budget && budget !== 'all') {
      list = list.filter((p) => matchesBudget(p, budget));
    }

    if (openNowOnly) {
      list = list.filter((p) => {
        if (typeof p.openNow === 'boolean') return p.openNow;
        if (p.hours) {
          const status = isOpenNow(p.hours);
          return status === true;
        }
        return true;
      });
    }

    if (matatuOnly) {
      list = list.filter((p) => {
        const m = String(p.matatu || p.matatu_route || '').trim();
        return m.length > 0;
      });
    }

    if (eveningOnly) {
      list = list.filter((p) => {
        const cat = String(p.category || '').toLowerCase();
        const peak = String(p.peakHours || p.peak_hours || p.bestTime || p.best_time || '').toLowerCase();
        const hours = String(p.hours || p.opening_hours || '').toLowerCase();
        if (cat === 'nightlife') return true;
        if (/evening|night|sunset|pm|after/.test(peak)) return true;
        if (/pm|evening|night/.test(hours)) return true;
        return false;
      });
    }

    return sortPlaces(list, sort, userLocation);
  }, [rawPlaces, category, query, budget, sort, openNowOnly, matatuOnly, eveningOnly, userLocation]);

  return {
    places,
    total: places.length,
    isEmpty: !loading && places.length === 0,
    loading,
    error,
    source,
    reload: load,
  };
}

export function usePlaceDetail(id) {
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPlaceById(id).then((p) => {
      if (!cancelled) {
        setPlace(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);
  return { place, loading };
}
