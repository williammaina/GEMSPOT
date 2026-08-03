import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppContext } from '../../library/contexts/AppContext.js';
import { useFavorites } from '../../library/hooks/useFavorites.js';
import {
  getStoredUser,
  getToken,
  loginUser as apiLogin,
  logoutUser as apiLogout,
  registerUser as apiRegister,
  fetchMe,
} from '../../app/site/private/authentication/authService.js';

function readJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/** Stable per-user storage scope */
function scopeId(user) {
  if (!user || !user.isAuthenticated) return 'guest';
  return String(user.email || user.user_id || user.id || 'guest').toLowerCase();
}

function scopedKey(base, user) {
  return `${base}:${scopeId(user)}`;
}

function loadUserBundle(user) {
  return {
    recentSearches: readJSON(scopedKey('gemspot-recent-searches', user), []),
    recentPlaces: readJSON(scopedKey('gemspot-recent-places', user), []),
    interestedEvents: readJSON(scopedKey('gemspot-interested-events', user), []),
    planStops: readJSON(scopedKey('gemspot-plan-stops', user), []),
  };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = getStoredUser();
    if (stored && getToken()) {
      return {
        name: stored.name || stored.username || 'Guest',
        email: stored.email,
        isAuthenticated: true,
        preferences: stored.preferences || [],
        ...stored,
      };
    }
    return { name: 'Guest', isAuthenticated: false, preferences: [] };
  });

  const [theme, setTheme] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('gemspot-theme') || 'light' : 'light'
  );

  const [recentSearches, setRecentSearches] = useState(() => loadUserBundle(getStoredUser() || {}).recentSearches);
  const [recentPlaces, setRecentPlaces] = useState(() => loadUserBundle(getStoredUser() || {}).recentPlaces);
  const [interestedEvents, setInterestedEvents] = useState(
    () => loadUserBundle(getStoredUser() || {}).interestedEvents
  );
  const [planStops, setPlanStops] = useState(() => loadUserBundle(getStoredUser() || {}).planStops);
  const [toasts, setToasts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const toastTimers = useRef(new Map());
  const scopeRef = useRef(scopeId(user));

  const favoritesApi = useFavorites(user);

  // When the signed-in identity changes, swap personal data (no cross-user bleed)
  useEffect(() => {
    const next = scopeId(user);
    if (next === scopeRef.current) return;
    scopeRef.current = next;
    const bundle = loadUserBundle(user);
    setRecentSearches(bundle.recentSearches);
    setRecentPlaces(bundle.recentPlaces);
    setInterestedEvents(bundle.interestedEvents);
    setPlanStops(bundle.planStops);
    favoritesApi.reloadForUser?.(user);
  }, [user?.email, user?.user_id, user?.id, user?.isAuthenticated]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gemspot-theme', theme);
  }, [theme]);

  useEffect(() => {
    writeJSON(scopedKey('gemspot-recent-searches', user), recentSearches.slice(0, 8));
  }, [recentSearches, user]);

  useEffect(() => {
    writeJSON(scopedKey('gemspot-recent-places', user), recentPlaces.slice(0, 12));
  }, [recentPlaces, user]);

  useEffect(() => {
    writeJSON(scopedKey('gemspot-interested-events', user), interestedEvents.slice(0, 20));
  }, [interestedEvents, user]);

  useEffect(() => {
    writeJSON(scopedKey('gemspot-plan-stops', user), planStops.slice(0, 12));
  }, [planStops, user]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return undefined;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (!getToken()) return undefined;
    let cancelled = false;
    fetchMe()
      .then((profile) => {
        if (cancelled || !profile) return;
        setUser((prev) => ({
          ...prev,
          ...profile,
          name: profile.name || profile.username || prev.name,
          email: profile.email || prev.email,
          isAuthenticated: true,
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const pushToast = useCallback((message, tone = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      toastTimers.current.delete(id);
    }, 3200);
    toastTimers.current.set(id, t);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
    const t = toastTimers.current.get(id);
    if (t) clearTimeout(t);
    toastTimers.current.delete(id);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const addRecentSearch = useCallback((q) => {
    const term = String(q || '').trim();
    if (!term) return;
    setRecentSearches((prev) => [term, ...prev.filter((x) => x !== term)].slice(0, 8));
  }, []);

  const trackPlaceView = useCallback((place) => {
    if (!place) return;
    const id = String(place.place_id ?? place.id ?? '');
    if (!id) return;
    const entry = {
      id,
      title: place.title || place.name,
      location: place.location || place.town || place.address,
      image: place.image || place.featured_image,
      category: place.category,
      viewedAt: Date.now(),
    };
    setRecentPlaces((prev) => [entry, ...prev.filter((p) => p.id !== id)].slice(0, 12));
  }, []);

  const toggleInterestedEvent = useCallback((event) => {
    if (!event) return;
    const id = String(event.id || event.event_id || '');
    if (!id) return;
    setInterestedEvents((prev) => {
      const exists = prev.some((e) => String(e.id) === id);
      if (exists) return prev.filter((e) => String(e.id) !== id);
      return [
        {
          id,
          title: event.title,
          location: event.location || event.venue_name,
          image: event.image || event.banner,
          startDate: event.startDate || event.start_date,
        },
        ...prev,
      ].slice(0, 20);
    });
  }, []);

  const isInterestedEvent = useCallback(
    (id) => interestedEvents.some((e) => String(e.id) === String(id)),
    [interestedEvents]
  );

  const addToPlan = useCallback(
    (place) => {
      if (!place) return false;
      const id = String(place.place_id ?? place.id ?? '');
      if (!id) return false;
      const entry = {
        id,
        title: place.title || place.name,
        location: place.location || place.town,
        image: place.image || place.featured_image,
        category: place.category,
      };
      let added = false;
      setPlanStops((prev) => {
        if (prev.some((p) => p.id === id)) {
          return prev;
        }
        added = true;
        return [entry, ...prev].slice(0, 12);
      });
      setRecentPlaces((prev) => {
        const r = { ...entry, viewedAt: Date.now() };
        return [r, ...prev.filter((p) => p.id !== id)].slice(0, 12);
      });
      if (added) pushToast(`Added “${entry.title}” to plan · open My list`, 'success');
      else pushToast(`“${entry.title}” is already in your plan`, 'info');
      return added;
    },
    [pushToast]
  );

  const removeFromPlan = useCallback(
    (id) => {
      const key = String(id);
      setPlanStops((prev) => prev.filter((p) => p.id !== key));
      pushToast('Removed from your plan', 'info');
    },
    [pushToast]
  );

  const isInPlan = useCallback(
    (id) => planStops.some((p) => p.id === String(id)),
    [planStops]
  );

  const clearPlan = useCallback(() => {
    setPlanStops([]);
    pushToast('Your plan cleared', 'info');
  }, [pushToast]);

  const reorderPlan = useCallback((nextStops) => {
    if (!Array.isArray(nextStops)) return;
    setPlanStops(nextStops.slice(0, 12));
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await apiLogin(credentials);
    const profile = data.user || data;
    const nextUser = {
      name: profile.name || profile.username || 'User',
      email: profile.email,
      isAuthenticated: true,
      preferences: profile.preferences || [],
      ...profile,
    };
    setUser(nextUser);
    // Load this user's personal data immediately
    const bundle = loadUserBundle(nextUser);
    scopeRef.current = scopeId(nextUser);
    setRecentSearches(bundle.recentSearches);
    setRecentPlaces(bundle.recentPlaces);
    setInterestedEvents(bundle.interestedEvents);
    setPlanStops(bundle.planStops);
    favoritesApi.reloadForUser?.(nextUser);
    return data;
  }, [favoritesApi]);

  const register = useCallback(async (payload) => {
    const data = await apiRegister(payload);
    const profile = data.user || data;
    const nextUser = {
      name: profile.name || profile.username || 'User',
      email: profile.email,
      isAuthenticated: true,
      preferences: profile.preferences || [],
      ...profile,
    };
    setUser(nextUser);
    scopeRef.current = scopeId(nextUser);
    setRecentSearches([]);
    setRecentPlaces([]);
    setInterestedEvents([]);
    setPlanStops([]);
    favoritesApi.reloadForUser?.(nextUser);
    return data;
  }, [favoritesApi]);

  const logout = useCallback(async () => {
    await apiLogout();
    const guest = { name: 'Guest', isAuthenticated: false, preferences: [] };
    setUser(guest);
    scopeRef.current = 'guest';
    setRecentSearches([]);
    setRecentPlaces([]);
    setInterestedEvents([]);
    setPlanStops([]);
    favoritesApi.clearLocal?.();
    favoritesApi.reloadForUser?.(guest);
  }, [favoritesApi]);

  const toggleFavorite = useCallback(
    async (placeId) => {
      const id = String(placeId);
      const wasOn = favoritesApi.isFavorite?.(id);
      const result = await favoritesApi.toggleFavorite?.(id);
      pushToast(wasOn ? 'Removed from favorites' : 'Saved to favorites', 'success');
      return result;
    },
    [favoritesApi, pushToast]
  );

  const value = useMemo(
    () => ({
      user,
      setUser,
      theme,
      toggleTheme,
      recentSearches,
      addRecentSearch,
      recentPlaces,
      trackPlaceView,
      planStops,
      addToPlan,
      removeFromPlan,
      isInPlan,
      interestedEvents,
      toggleInterestedEvent,
      isInterestedEvent,
      clearPlan,
      reorderPlan,
      favorites: favoritesApi.favorites || [],
      isFavorite: favoritesApi.isFavorite,
      toggleFavorite,
      login,
      register,
      logout,
      pushToast,
      dismissToast,
      toasts,
      userLocation,
    }),
    [
      user,
      theme,
      toggleTheme,
      recentSearches,
      addRecentSearch,
      recentPlaces,
      trackPlaceView,
      planStops,
      addToPlan,
      removeFromPlan,
      isInPlan,
      interestedEvents,
      toggleInterestedEvent,
      isInterestedEvent,
      clearPlan,
      reorderPlan,
      favoritesApi.favorites,
      favoritesApi.isFavorite,
      toggleFavorite,
      login,
      register,
      logout,
      pushToast,
      dismissToast,
      toasts,
      userLocation,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
