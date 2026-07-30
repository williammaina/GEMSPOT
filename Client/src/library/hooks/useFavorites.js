import { useCallback, useEffect, useState } from 'react';
import {
  fetchFavoritesHandler,
  addFavoriteHandler,
  removeFavoriteHandler,
} from '../handlers/apiHandler.js';
import { getToken } from '../../app/site/private/authentication/authService.js';

const STORAGE_KEY = 'gemspot-favorites';

function readLocal() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function extractIds(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      return String(item.place_id || item.placeId || item.id || item.slug || '');
    })
    .filter(Boolean);
}

/**
 * Favorites: syncs with /api/favorites when authenticated,
 * otherwise persists locally.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(() => readLocal());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    writeLocal(favorites);
  }, [favorites]);

  // Hydrate from API when token exists
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!getToken()) return;
      setSyncing(true);
      try {
        const remote = await fetchFavoritesHandler();
        if (!cancelled && Array.isArray(remote)) {
          const ids = extractIds(remote);
          if (ids.length) setFavorites(ids);
        }
      } catch {
        // keep local
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback(
    (id) => favorites.includes(String(id)),
    [favorites]
  );

  const toggleFavorite = useCallback(async (id) => {
    const key = String(id);
    const currently = favorites.includes(key);
    // optimistic
    setFavorites((prev) =>
      currently ? prev.filter((x) => x !== key) : [...prev, key]
    );

    if (!getToken()) return;

    try {
      if (currently) {
        await removeFavoriteHandler(key);
      } else {
        await addFavoriteHandler(key);
      }
    } catch {
      // revert on failure
      setFavorites((prev) =>
        currently ? [...prev, key] : prev.filter((x) => x !== key)
      );
    }
  }, [favorites]);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    count: favorites.length,
    syncing,
  };
}
