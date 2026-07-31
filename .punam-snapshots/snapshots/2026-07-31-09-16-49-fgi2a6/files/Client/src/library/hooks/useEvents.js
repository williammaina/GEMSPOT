import { useEffect, useMemo, useState } from 'react';
import { eventsData } from '../json/eventsData.js';
import { fetchEventsHandler, fetchEventByIdHandler } from '../handlers/apiHandler.js';
import { mergeWithAdminEvents, ADMIN_CHANGED } from '../helpers/adminStore.js';

const EVENT_CATEGORY_ALIASES = {
  all: [],
  music: ['music', 'live music', 'concert', 'afrobeats', 'jazz'],
  food: ['food', 'cafe', 'cafes', 'eats', 'brunch', 'dining'],
  sports: ['sports', 'run', 'race', 'fitness'],
  nightlife: ['nightlife', 'club', 'party', 'dj', 'vibes'],
  arts: ['arts', 'art', 'culture', 'exhibition', 'comedy'],
  nature: ['nature', 'outdoors', 'hike', 'trail', 'tea'],
  adventure: ['adventure', 'action', 'play', 'kart', 'climb'],
};

export function normalizeEvent(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  const id = raw.event_id ?? raw.id ?? raw._id;
  const start = raw.startDate || raw.start_date || raw.starts_at || raw.start;
  let day = raw.day;
  let month = raw.month;
  let weekday = raw.weekday;

  if (start && (!day || !month)) {
    try {
      const d = new Date(start);
      if (!Number.isNaN(d.getTime())) {
        day = String(d.getDate()).padStart(2, '0');
        month = d.toLocaleString('en', { month: 'short' }).toUpperCase();
        weekday = d.toLocaleString('en', { weekday: 'short' }).toUpperCase();
      }
    } catch {
      // ignore
    }
  }

  let category = raw.category;
  if (category && typeof category === 'object') {
    category = category.name || category.slug || '';
  }

  const priceRaw = raw.price ?? raw.ticket_price ?? raw.cost ?? raw.entry_fee;
  const price =
    priceRaw === 0 || priceRaw === '0'
      ? 'Free Entry'
      : typeof priceRaw === 'number'
        ? `KES ${priceRaw.toLocaleString()}`
        : priceRaw || '';

  return {
    ...raw,
    id: id != null ? String(id) : undefined,
    event_id: id,
    title: raw.title || raw.name || 'Untitled event',
    date: raw.date || raw.display_date || '',
    day,
    month,
    weekday,
    time: raw.time || raw.start_time || '',
    location: raw.location || raw.venue_name || raw.venue || raw.address || '',
    price,
    category: String(category || raw.type || raw.event_type || '').toLowerCase(),
    categoryLabel: String(category || ''),
    description: raw.description || raw.summary || raw.about || '',
    image:
      raw.image ||
      raw.image_url ||
      raw.banner ||
      raw.cover_image ||
      raw.photo ||
      '',
    featured: Boolean(raw.featured || raw.is_featured),
    startDate: start,
    endDate: raw.endDate || raw.end_date || raw.ends_at || raw.end,
    status: raw.status || 'Upcoming',
    ticket_price: raw.ticket_price,
    google_calendar_link: raw.google_calendar_link,
  };
}

function matchesCategory(event, filterKey) {
  if (!filterKey || filterKey === 'all') return true;
  const aliases = EVENT_CATEGORY_ALIASES[filterKey] || [filterKey];
  const blob = [
    event.category,
    event.categoryLabel,
    event.title,
    event.description,
  ]
    .join(' ')
    .toLowerCase();
  return aliases.some((a) => blob.includes(a));
}

export function useEvents({ query = '', category = 'all' } = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('local');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const params = {};
      if (query) {
        params.q = query;
        params.search = query;
      }
      if (category && category !== 'all') params.category = category;

      try {
        const remote = await fetchEventsHandler(params);
        if (cancelled) return;
        const normalized = mergeWithAdminEvents((Array.isArray(remote) ? remote : []).map(normalizeEvent));
        setEvents(normalized);
        setSource('api');
        setLoading(false);
        if (import.meta.env.DEV) {
          console.info(`[GemSpot] events from API: ${normalized.length}`);
        }
        return;
      } catch (err) {
        if (!cancelled) {
          setError(err);
          if (import.meta.env.DEV) {
            console.warn('[GemSpot] events API failed — local seed', err?.message || err);
          }
        }
      }

      if (cancelled) return;
      setEvents(mergeWithAdminEvents(eventsData.map(normalizeEvent)));
      setSource('local');
      setLoading(false);
    }

    load();
    const onAdmin = () => { cancelled = false; load(); };
    window.addEventListener(ADMIN_CHANGED, onAdmin);
    return () => {
      cancelled = true;
      window.removeEventListener(ADMIN_CHANGED, onAdmin);
    };
  }, [query, category]);

  const filtered = useMemo(() => {
    let list = events;
    const q = (query || '').trim().toLowerCase();

    if (category && category !== 'all') {
      const matched = list.filter((e) => matchesCategory(e, category));
      // Only apply if we get hits — avoids wiping when backend categories differ
      if (matched.length > 0) list = matched;
    }

    if (q) {
      list = list.filter((e) => {
        const blob = [e.title, e.location, e.category, e.description]
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return list;
  }, [events, query, category]);

  const featured = useMemo(
    () => filtered.find((e) => e.featured) || filtered[0] || null,
    [filtered]
  );

  const upcoming = useMemo(
    () => filtered.filter((e) => !featured || String(e.id) !== String(featured.id)),
    [filtered, featured]
  );

  return {
    events: filtered,
    featured,
    upcoming,
    loading,
    error,
    source,
    total: filtered.length,
  };
}

export async function getEventById(id) {
  if (id == null || id === '') return null;

  try {
    const remote = await fetchEventByIdHandler(id);
    if (remote && typeof remote === 'object') return normalizeEvent(remote);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[GemSpot] event detail API', id, err?.response?.status || err?.message);
    }
  }

  // Fallback: search list endpoint then local
  try {
    const all = await fetchEventsHandler({});
    const found = (Array.isArray(all) ? all : []).find(
      (e) => String(e.event_id ?? e.id) === String(id)
    );
    if (found) return normalizeEvent(found);
  } catch {
    // ignore
  }

  return eventsData.find((e) => String(e.id) === String(id)) || null;
}
