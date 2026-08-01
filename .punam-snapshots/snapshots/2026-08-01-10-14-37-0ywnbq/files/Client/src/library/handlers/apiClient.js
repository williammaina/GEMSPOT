import axios from 'axios';

/**
 * GemSpot KE API client
 *
 * Flask serves routes under /api/*  (e.g. /api/places, /api/events)
 *
 * Env:
 *   VITE_API_BASE_URL=http://localhost:5000/api
 *   VITE_BACKEND_URL  (legacy alias)
 *
 * If the env value is missing /api, it is appended automatically.
 */
function resolveBaseUrl() {
  const raw =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    'http://localhost:5000/api';

  let url = String(raw).trim().replace(/\/$/, '');

  // User often sets http://localhost:5000 — ensure /api suffix
  if (!/\/api(\/v\d+)?$/i.test(url)) {
    url = `${url}/api`;
  }

  return url;
}

const BASE_URL = resolveBaseUrl();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

if (import.meta.env.DEV) {
  console.info('[GemSpot] API base URL:', BASE_URL);
}

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    if (import.meta.env.DEV) {
      const full =
        (error?.config?.baseURL || '') + (error?.config?.url || '');
      console.warn(
        '[GemSpot API]',
        error?.config?.method?.toUpperCase(),
        full,
        error?.response?.status || error.message
      );
    }
    return Promise.reject(error);
  }
);

const LIST_KEYS = [
  'data',
  'items',
  'results',
  'places',
  'events',
  'reviews',
  'favorites',
  'categories',
  'vibes',
  'users',
  'records',
  'rows',
  'list',
];

export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const key of LIST_KEYS) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    for (const key of LIST_KEYS) {
      if (Array.isArray(payload.data[key])) return payload.data[key];
    }
  }

  if (Array.isArray(payload.result)) return payload.result;

  return [];
}

export function unwrapItem(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return payload[0] ?? null;

  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    if (payload.data.place && typeof payload.data.place === 'object') return payload.data.place;
    if (payload.data.event && typeof payload.data.event === 'object') return payload.data.event;
    return payload.data;
  }

  if (payload.place && typeof payload.place === 'object') return payload.place;
  if (payload.event && typeof payload.event === 'object') return payload.event;
  if (payload.user && typeof payload.user === 'object') return payload.user;
  if (payload.result && typeof payload.result === 'object' && !Array.isArray(payload.result)) {
    return payload.result;
  }

  return payload;
}

export { BASE_URL as API_BASE_URL };
