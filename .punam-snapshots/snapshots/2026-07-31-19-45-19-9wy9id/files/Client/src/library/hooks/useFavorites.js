import { useState, useCallback, useEffect, useRef } from 'react';
import {
  fetchFavoritesHandler,
  addFavoriteHandler,
  removeFavoriteHandler,
} from '../handlers/apiHandler.js';

const KEY = 'gemspot-favorites';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function extractPlaceId(item) {
  if (item == null) return null;
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  return String(
    item.place_id ??
      item.placeId ??
      item.place?.place_id ??
      item.place?.id ??
      item.id ??
      ''
  );
}

/**
 * Favorites: localStorage always, sync to Flask /api/favorites when a JWT is present.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(() =>
    typeof window !== 'undefined' ? read() : []
  );
  const synced = useRef(false);

  useEffect(() => {
    write(favorites);
  }, [favorites]);

  // Hydrate from API once if logged in
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const token = localStorage.getItem('token');
    if (!token || synced.current) return undefined;
    let cancelled = false;
    fetchFavoritesHandler()
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        const ids = list.map(extractPlaceId).filter(Boolean);
        if (!ids.length) return;
        synced.current = true;
        setFavorites((prev) => {
          const set = new Set([...prev.map(String), ...ids]);
          return Array.from(set);
        });
      })
      .catch(() => {
        /* offline / unauthenticated — keep local */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback(
    (id) => favorites.some((f) => String(f) === String(id)),
    [favorites]
  );

  const toggleFavorite = useCallback(async (placeId) => {
    const id = String(placeId);
    let nextOn = false;
    setFavorites((prev) => {
      const exists = prev.some((f) => String(f) === id);
      nextOn = !exists;
      return exists ? prev.filter((f) => String(f) !== id) : [...prev, id];
    });
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return nextOn;
    try {
      if (nextOn) await addFavoriteHandler(id);
      else await removeFavoriteHandler(id);
    } catch {
      /* local already updated */
    }
    return nextOn;
  }, []);

  const addFavorite = useCallback(async (placeId) => {
    const id = String(placeId);
    setFavorites((prev) => (prev.some((f) => String(f) === id) ? prev : [...prev, id]));
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        await addFavoriteHandler(id);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const removeFavorite = useCallback(async (placeId) => {
    const id = String(placeId);
    setFavorites((prev) => prev.filter((f) => String(f) !== id));
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        await removeFavoriteHandler(id);
      } catch {
        /* ignore */
      }
    }
  }, []);

  return { favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite };
}
