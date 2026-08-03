import { useState, useCallback, useEffect, useRef } from 'react';
import {
  fetchFavoritesHandler,
  addFavoriteHandler,
  removeFavoriteHandler,
} from '../handlers/apiHandler.js';
import { getStoredUser, getToken, isDemoToken } from '../../app/site/private/authentication/authService.js';

const BASE_KEY = 'gemspot-favorites';

function scopeId(user) {
  if (!user) {
    try {
      const u = getStoredUser();
      if (u?.email) return String(u.email).toLowerCase();
      if (u?.user_id || u?.id) return String(u.user_id || u.id);
    } catch {
      /* ignore */
    }
    return 'guest';
  }
  return String(user.email || user.user_id || user.id || 'guest').toLowerCase();
}

function storageKey(user) {
  return `${BASE_KEY}:${scopeId(user)}`;
}

function read(user) {
  try {
    const raw = localStorage.getItem(storageKey(user));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(user, list) {
  try {
    localStorage.setItem(storageKey(user), JSON.stringify(list));
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
 * Favorites scoped per user. Syncs to /api/favorites when a real JWT is present.
 */
export function useFavorites(user = null) {
  const [favorites, setFavorites] = useState(() =>
    typeof window !== 'undefined' ? read(user) : []
  );
  const synced = useRef(false);
  const scopeRef = useRef(scopeId(user));

  // Reload when user identity changes (login / logout / switch account)
  useEffect(() => {
    const next = scopeId(user);
    if (next !== scopeRef.current) {
      scopeRef.current = next;
      synced.current = false;
      setFavorites(read(user));
    }
  }, [user?.email, user?.user_id, user?.id, user?.isAuthenticated]);

  useEffect(() => {
    write(user, favorites);
  }, [favorites, user?.email, user?.user_id, user?.id]);

  // Hydrate from API once per user session (real JWT only)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const token = getToken();
    if (!token || isDemoToken(token) || synced.current) return undefined;
    if (!user?.isAuthenticated && !getStoredUser()?.isAuthenticated) return undefined;

    let cancelled = false;
    fetchFavoritesHandler()
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        const ids = list.map(extractPlaceId).filter(Boolean);
        synced.current = true;
        // Replace with server list for this user (don't merge another user's local leftovers)
        setFavorites(ids);
        write(user || getStoredUser(), ids);
      })
      .catch(() => {
        /* offline — keep scoped local */
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email, user?.user_id, user?.id, user?.isAuthenticated]);

  const isFavorite = useCallback(
    (id) => favorites.some((f) => String(f) === String(id)),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (placeId) => {
      const id = String(placeId);
      let nextOn = false;
      setFavorites((prev) => {
        const exists = prev.some((f) => String(f) === id);
        nextOn = !exists;
        return exists ? prev.filter((f) => String(f) !== id) : [...prev, id];
      });
      const token = getToken();
      if (!token || isDemoToken(token)) return nextOn;
      try {
        if (nextOn) await addFavoriteHandler(id);
        else await removeFavoriteHandler(id);
      } catch {
        /* local still updated */
      }
      return nextOn;
    },
    []
  );

  const clearLocal = useCallback(() => {
    setFavorites([]);
    write(user, []);
    synced.current = false;
  }, [user]);

  const reloadForUser = useCallback(
    (nextUser) => {
      synced.current = false;
      scopeRef.current = scopeId(nextUser);
      setFavorites(read(nextUser));
    },
    []
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    clearLocal,
    reloadForUser,
  };
}
