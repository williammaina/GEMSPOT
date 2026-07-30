import { useState, useCallback, useEffect } from 'react';

const KEY = 'gemspot-favorites';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => (typeof window !== 'undefined' ? read() : []));

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  const isFavorite = useCallback((id) => favorites.some((f) => String(f) === String(id)), [favorites]);

  const toggleFavorite = useCallback(async (placeId) => {
    const id = String(placeId);
    setFavorites((prev) => (prev.some((f) => String(f) === id) ? prev.filter((f) => String(f) !== id) : [...prev, id]));
  }, []);

  const addFavorite = useCallback(async (placeId) => {
    const id = String(placeId);
    setFavorites((prev) => (prev.some((f) => String(f) === id) ? prev : [...prev, id]));
  }, []);

  const removeFavorite = useCallback(async (placeId) => {
    const id = String(placeId);
    setFavorites((prev) => prev.filter((f) => String(f) !== id));
  }, []);

  return { favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite };
}
