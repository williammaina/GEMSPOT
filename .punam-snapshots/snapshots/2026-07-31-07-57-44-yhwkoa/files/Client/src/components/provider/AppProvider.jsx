import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppContext } from '../../library/contexts/AppContext.js';
import { AppProviderStyles as styles } from '@styles';
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

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = getStoredUser();
    if (stored) {
      return {
        name: stored.name || stored.username || 'Guest',
        email: stored.email,
        isAuthenticated: Boolean(getToken()),
        preferences: stored.preferences || [],
        ...stored,
      };
    }
    return { name: 'Guest', isAuthenticated: false, preferences: [] };
  });

  const [theme, setTheme] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('gemspot-theme') || 'light' : 'light'
  );

  const [recentSearches, setRecentSearches] = useState(() =>
    readJSON('gemspot-recent-searches', [])
  );
  const [recentPlaces, setRecentPlaces] = useState(() => readJSON('gemspot-recent-places', []));
  const [interestedEvents, setInterestedEvents] = useState(() =>
    readJSON('gemspot-interested-events', [])
  );
  const [toasts, setToasts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const toastTimers = useRef(new Map());

  const favoritesApi = useFavorites();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gemspot-theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('gemspot-recent-searches', JSON.stringify(recentSearches.slice(0, 8)));
    } catch {
      /* ignore */
    }
  }, [recentSearches]);

  useEffect(() => {
    try {
      localStorage.setItem('gemspot-recent-places', JSON.stringify(recentPlaces.slice(0, 12)));
    } catch {
      /* ignore */
    }
  }, [recentPlaces]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'gemspot-interested-events',
        JSON.stringify(interestedEvents.slice(0, 20))
      );
    } catch {
      /* ignore */
    }
  }, [interestedEvents]);

  // Optional geolocation for distance badges
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return undefined;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        /* user denied — fine */
      },
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

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (message, type = 'info', duration = 3200) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
      const timer = setTimeout(() => dismissToast(id), duration);
      toastTimers.current.set(id, timer);
      return id;
    },
    [dismissToast]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const addRecentSearch = useCallback((term) => {
    const cleaned = String(term || '').trim();
    if (!cleaned) return;
    setRecentSearches((prev) => {
      const next = [cleaned, ...prev.filter((t) => t.toLowerCase() !== cleaned.toLowerCase())];
      return next.slice(0, 8);
    });
  }, []);

  const trackPlaceView = useCallback((place) => {
    if (!place?.id && !place?.place_id) return;
    const entry = {
      id: String(place.place_id ?? place.id),
      title: place.title || place.name,
      location: place.location || place.town || '',
      image: place.image || place.featuredImage || '',
      viewedAt: Date.now(),
    };
    setRecentPlaces((prev) => {
      const next = [entry, ...prev.filter((p) => p.id !== entry.id)];
      return next.slice(0, 12);
    });
  }, []);

  const toggleInterestedEvent = useCallback(
    (event) => {
      if (!event?.id && !event?.event_id) return false;
      const entry = {
        id: String(event.event_id ?? event.id),
        title: event.title || event.name,
        location: event.location || '',
        image: event.image || '',
        startDate: event.startDate || null,
      };
      let nowOn = false;
      setInterestedEvents((prev) => {
        const exists = prev.some((e) => e.id === entry.id);
        nowOn = !exists;
        if (exists) return prev.filter((e) => e.id !== entry.id);
        return [entry, ...prev].slice(0, 20);
      });
      pushToast(
        nowOn ? `Interested in “${entry.title}”` : `Removed interest`,
        'success'
      );
      return nowOn;
    },
    [pushToast]
  );

  const isInterestedEvent = useCallback(
    (id) => interestedEvents.some((e) => e.id === String(id)),
    [interestedEvents]
  );

  const clearPlan = useCallback(() => {
    setRecentPlaces([]);
    setInterestedEvents([]);
    pushToast('Plan cleared', 'info');
  }, [pushToast]);

  const login = useCallback(async (credentials) => {
    const data = await apiLogin(credentials);
    const profile = data.user || data;
    setUser({
      name: profile.name || profile.username || 'User',
      email: profile.email,
      isAuthenticated: true,
      preferences: profile.preferences || [],
      ...profile,
    });
    // Pages own success toasts — avoid double-fire glitch
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await apiRegister(payload);
    const profile = data.user || data;
    setUser({
      name: profile.name || profile.username || 'User',
      email: profile.email,
      isAuthenticated: true,
      preferences: profile.preferences || [],
      ...profile,
    });
    return data;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser({ name: 'Guest', isAuthenticated: false, preferences: [] });
  }, []);

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
      interestedEvents,
      toggleInterestedEvent,
      isInterestedEvent,
      clearPlan,
      userLocation,
      toasts,
      pushToast,
      dismissToast,
      login,
      register,
      logout,
      ...favoritesApi,
      toggleFavorite,
    }),
    [
      user,
      theme,
      toggleTheme,
      recentSearches,
      addRecentSearch,
      recentPlaces,
      trackPlaceView,
      interestedEvents,
      toggleInterestedEvent,
      isInterestedEvent,
      clearPlan,
      userLocation,
      toasts,
      pushToast,
      dismissToast,
      login,
      register,
      logout,
      favoritesApi,
      toggleFavorite,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      <div className={styles.ProviderContainer}>{children}</div>
    </AppContext.Provider>
  );
}
