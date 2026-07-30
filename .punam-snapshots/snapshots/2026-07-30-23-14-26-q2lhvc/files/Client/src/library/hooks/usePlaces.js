import { useEffect, useState, useCallback, useMemo } from 'react';
import { placesData } from '../json/placesData.js';
import { fetchPlacesHandler, fetchPlaceByIdHandler } from '../handlers/apiHandler.js';
import { calculateDistance } from '../helpers/calculateDistance.js';
import { isOpenNow } from '../helpers/openingHours.js';

function normalizePlace(p) {
  if (!p) return null;
  return {
    ...p,
    place_id: p.place_id ?? p.id ?? p.slug,
    id: p.id ?? p.place_id ?? p.slug,
    title: p.title || p.name,
    name: p.name || p.title,
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
  const local = placesData.find(
    (p) => String(p.place_id) === key || String(p.id) === key || String(p.slug) === key
  );
  return Promise.resolve(normalizePlace(local)).then(async (seed) => {
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
      setRawPlaces(list);
      setSource(fromApi ? 'api' : 'local');
    } catch (e) {
      setError(e);
      setRawPlaces(placesData.map(normalizePlace));
      setSource('local');
    } finally {
      setLoading(false);
    }
  }, [category, query]);

  useEffect(() => {
    load();
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

    return sortPlaces(list, sort, userLocation);
  }, [rawPlaces, category, query, budget, sort, openNowOnly, userLocation]);

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
