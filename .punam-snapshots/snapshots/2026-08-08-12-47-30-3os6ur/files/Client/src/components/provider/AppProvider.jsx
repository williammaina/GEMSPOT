import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppContext } from '../../library/contexts/AppContext.js';
import { useFavorites } from '../../library/hooks/useFavorites.js';
import { useGeolocation } from '../../library/hooks/useGeolocation.js';
import {
  pullUserState,
  pushUserState,
  attachOnlineFlush,
  flushSyncQueue,
  getSyncMeta,
} from '../../library/helpers/syncService.js';
import {
  ensureNotificationPermission,
  tickReminders,
  scheduleReminder,
  remindPlanInOneHour,
  remindEvent,
  getNotifyPref,
  setNotifyPref,
  whatsappRemindLink,
} from '../../library/helpers/notifications.js';
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
    goingEventIds: readJSON(scopedKey('gemspot-going-events', user), []),
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
  const [goingEventIds, setGoingEventIds] = useState(
    () => loadUserBundle(getStoredUser() || {}).goingEventIds || []
  );
  const [planStops, setPlanStops] = useState(() => loadUserBundle(getStoredUser() || {}).planStops);
  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef(new Map());
  const scopeRef = useRef(scopeId(user));

  const {
    location: userLocation,
    status: locationStatus,
    error: locationError,
    request: requestLocation,
  } = useGeolocation({ enabled: true });

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
    setGoingEventIds(bundle.goingEventIds || []);
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
    writeJSON(scopedKey('gemspot-going-events', user), (goingEventIds || []).slice(0, 40));
  }, [goingEventIds, user]);

  useEffect(() => {
    writeJSON(scopedKey('gemspot-plan-stops', user), planStops.slice(0, 12));
  }, [planStops, user]);

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

  const pushToast = useCallback((message, tone = 'info', options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = options.undo ? 5600 : options.duration || 3200;
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        tone,
        undoLabel: options.undoLabel || (options.undo ? 'Undo' : null),
        onUndo: options.undo || null,
      },
    ]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      toastTimers.current.delete(id);
    }, duration);
    toastTimers.current.set(id, timer);
    return id;
  }, []);


  // Cloud sync: pull when signed in with real token
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.isAuthenticated) return;
      const remote = await pullUserState();
      if (cancelled || !remote) return;
      if (Array.isArray(remote.favorites) && remote.favorites.length) {
        // favorites managed by useFavorites — dispatch storage event after write
        try {
          const key = scopedKey('gemspot-favorites', user);
          // useFavorites may own this; write ids if empty local
        } catch { /* */ }
      }
      if (Array.isArray(remote.planStops)) setPlanStops(remote.planStops);
      if (Array.isArray(remote.interestedEvents)) setInterestedEvents(remote.interestedEvents);
      if (Array.isArray(remote.goingEventIds)) setGoingEventIds(remote.goingEventIds);
      if (remote.planStops?.length || remote.interestedEvents?.length || remote.goingEventIds?.length) {
        pushToast?.('Synced from cloud', 'success');
      }
    })();
    return () => { cancelled = true; };
  }, [user?.isAuthenticated, user?.email]);

  // Push local lists when they change (debounced via short timeout)
  useEffect(() => {
    if (!user?.isAuthenticated) return undefined;
    const t = setTimeout(() => {
      pushUserState({
        favorites: favoritesApi.favorites || [],
        planStops,
        interestedEvents,
        goingEventIds,
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [user?.isAuthenticated, favoritesApi.favorites, planStops, interestedEvents, goingEventIds]);

  // Flush queue when back online
  useEffect(() => attachOnlineFlush(() => {
    flushSyncQueue().then((r) => {
      if (r?.flushed) pushToast?.(`Synced ${r.flushed} queued change(s)`, 'success');
    });
  }), [pushToast]);

  // Local notification ticker
  useEffect(() => {
    tickReminders();
    const id = setInterval(() => tickReminders(), 30000);
    return () => clearInterval(id);
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
    let removed = false;
    setInterestedEvents((prev) => {
      const exists = prev.some((e) => String(e.id) === id);
      if (exists) {
        removed = true;
        return prev.filter((e) => String(e.id) !== id);
      }
      return [
        {
          id,
          title: event.title,
          location: event.location || event.venue_name,
          image: event.image || event.banner,
          startDate: event.startDate || event.start_date || event.weekday,
          type: 'event',
        },
        ...prev,
      ].slice(0, 20);
    });
    // Also drop from plan if un-saving
    if (removed) {
      setPlanStops((prev) => prev.filter((p) => p.id !== id));
      pushToast('Removed from saved events', 'info');
    } else {
      pushToast('Saved event · open My list to add to plan', 'success');
    }
  }, [pushToast]);

  const isInterestedEvent = useCallback(
    (id) => interestedEvents.some((e) => String(e.id) === String(id)),
    [interestedEvents]
  );

  const isGoingEvent = useCallback(
    (id) => (goingEventIds || []).some((x) => String(x) === String(id)),
    [goingEventIds]
  );

  /**
   * Live going count = seed base + local community increments (this browser)
   * + 1 if current user marked going.
   * Community deltas stored globally so multiple sessions on same device stack.
   */
  const getEventGoingCount = useCallback((event) => {
    if (!event) return 0;
    const id = String(event.id ?? event.event_id ?? '');
    const base = Number(event.goingCount ?? event.going_count ?? event.attendees ?? 12) || 12;
    let community = 0;
    try {
      const raw = localStorage.getItem('gemspot-going-community');
      const map = raw ? JSON.parse(raw) : {};
      community = Number(map[id] || 0) || 0;
    } catch {
      community = 0;
    }
    return Math.max(0, base + community);
  }, []);

  const toggleGoingEvent = useCallback(
    (event) => {
      if (!event) return;
      const id = String(event.id ?? event.event_id ?? '');
      if (!id) return;
      setGoingEventIds((prev) => {
        const on = prev.some((x) => String(x) === id);
        try {
          const raw = localStorage.getItem('gemspot-going-community');
          const map = raw ? JSON.parse(raw) : {};
          const cur = Number(map[id] || 0) || 0;
          map[id] = on ? Math.max(0, cur - 1) : cur + 1;
          localStorage.setItem('gemspot-going-community', JSON.stringify(map));
        } catch {
          /* */
        }
        if (on) {
          pushToast?.('You are no longer marked as going', 'info');
          return prev.filter((x) => String(x) !== id);
        }
        pushToast?.("You're going — count updated live", 'success');
        // auto-save to interested when marking going
        setInterestedEvents((list) => {
          if (list.some((e) => String(e.id) === id)) return list;
          const row = {
            id,
            title: event.title || event.name || 'Event',
            image: event.image || event.image_url || '',
            location: event.location || event.venue_name || '',
            date: event.date || event.starts_at || '',
            type: 'event',
          };
          return [row, ...list].slice(0, 20);
        });
        return [id, ...prev.filter((x) => String(x) !== id)].slice(0, 40);
      });
    },
    [pushToast]
  );

  const addToPlan = useCallback(
    (place) => {
      if (!place) return false;
      const isEvent =
        place.type === 'event' ||
        place.kind === 'event' ||
        Boolean(place.startDate || place.start_date || place.event_id);
      const id = String(place.place_id ?? place.event_id ?? place.id ?? '');
      if (!id) return false;
      const entry = {
        id,
        title: place.title || place.name,
        location: place.location || place.venue_name || place.town,
        image: place.image || place.featured_image || place.banner,
        category: place.category,
        type: isEvent ? 'event' : 'place',
        startDate: place.startDate || place.start_date || place.weekday || null,
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
      if (added) pushToast(`Added “${entry.title}” to plan`, 'success');
      else pushToast(`“${entry.title}” is already in your plan`, 'info');
      return added;
    },
    [pushToast]
  );

  const removeFromPlan = useCallback(
    (id) => {
      const key = String(id);
      let removed = null;
      setPlanStops((prev) => {
        removed = prev.find((p) => p.id === key) || null;
        return prev.filter((p) => p.id !== key);
      });
      pushToast('Removed from your plan', 'info', {
        undo: () => {
          if (!removed) return;
          setPlanStops((prev) => {
            if (prev.some((x) => x.id === removed.id)) return prev;
            return [...prev, removed];
          });
        },
      });
    },
    [pushToast]
  );

  const isInPlan = useCallback(
    (id) => planStops.some((p) => p.id === String(id)),
    [planStops]
  );

  const clearPlan = useCallback(() => {
    setPlanStops((prev) => {
      const snapshot = prev;
      pushToast('Plan cleared', 'info', {
        undo: () => setPlanStops(snapshot),
      });
      return [];
    });
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
    setGoingEventIds(bundle.goingEventIds || []);
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
      goingEventIds,
      toggleGoingEvent,
      isGoingEvent,
      getEventGoingCount,
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
      locationStatus,
      locationError,
      requestLocation,
      enableNotifications: async () => {
        const r = await ensureNotificationPermission();
        if (r === 'granted') {
          setNotifyPref({ enabled: true });
          pushToast?.('Notifications on', 'success');
        } else {
          pushToast?.('Notifications blocked — enable in browser settings', 'info');
        }
        return r;
      },
      scheduleReminder,
      remindPlanInOneHour,
      remindEvent,
      whatsappRemindLink,
      getNotifyPref,
      getSyncMeta,
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
      goingEventIds,
      toggleGoingEvent,
      isGoingEvent,
      getEventGoingCount,
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
      locationStatus,
      locationError,
      requestLocation,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}