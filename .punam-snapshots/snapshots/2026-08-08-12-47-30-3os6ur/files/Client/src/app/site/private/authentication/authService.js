import { apiClient, unwrapItem } from '../../../../library/handlers/apiClient.js';

const TOKEN_KEY = 'token';
const USER_KEY = 'gemspot-user';

/** Demo accounts that work without the Flask API (offline only) */
const DEMO_USERS = [
  {
    email: 'admin@gemspot.co.ke',
    username: 'admin',
    password: 'AdminPass2026!',
    name: 'GemSpot Admin',
    is_admin: true,
    role: 'admin',
  },
  {
    email: 'wanjiku@example.com',
    username: 'wanjiku',
    password: 'Password123!',
    name: 'Wanjiku M.',
    is_admin: false,
    role: 'user',
  },
];

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function isDemoToken(token = getToken()) {
  return Boolean(token && String(token).startsWith('demo.'));
}

export function setSession({ token, user }) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) {
    const normalized = normalizeUser(user);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return user;
  const name =
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.username ||
    user.email ||
    'Explorer';
  return {
    ...user,
    name,
    is_admin: Boolean(user.is_admin || user.isAdmin || user.role === 'admin'),
    isAuthenticated: true,
  };
}

function extractAuth(payload) {
  const data = unwrapItem(payload) || payload || {};
  // unwrapItem may already be the inner object — also check top-level
  const root = payload && typeof payload === 'object' ? payload : {};
  const token =
    data.token ||
    data.access_token ||
    data.accessToken ||
    root.token ||
    root.access_token ||
    data?.data?.token ||
    data?.data?.access_token;
  const user =
    data.user ||
    root.user ||
    data.profile ||
    data?.data?.user ||
    (data.email || data.username ? data : null);
  return { token, user: user ? normalizeUser(user) : null, raw: root?.data || data };
}

function isNetworkError(err) {
  return !err?.response && (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response);
}

function demoLogin(credentials) {
  const email = String(credentials.email || credentials.username || '').trim().toLowerCase();
  const password = String(credentials.password || '');
  const match = DEMO_USERS.find(
    (u) =>
      (u.email.toLowerCase() === email || u.username.toLowerCase() === email) &&
      u.password === password
  );
  if (!match) {
    const err = new Error('Invalid email or password');
    err.response = { data: { message: 'Invalid email or password' }, status: 401 };
    throw err;
  }
  const { password: _pw, ...profile } = match;
  const token = `demo.${btoa(profile.email)}.${Date.now()}`;
  const user = normalizeUser(profile);
  setSession({ token, user });
  return { token, user, ...user };
}

/**
 * Login against the live API. Demo accounts are used only when the API is unreachable.
 * Wrong passwords from real registrations must surface as errors — not silent demo fallback.
 */
export async function loginUser(credentials) {
  const email = String(credentials.email || credentials.username || '').trim().toLowerCase();
  const body = {
    email,
    username: credentials.username || email,
    password: credentials.password,
  };

  try {
    const response = await apiClient.post('/auth/login', body);
    const { token, user, raw } = extractAuth(response.data);
    if (token && user) {
      setSession({ token, user });
      return { ...raw, token, user };
    }
    if (token) {
      setSession({ token, user: user || { email, isAuthenticated: true } });
      return { ...raw, token, user: getStoredUser() };
    }
    throw new Error('Login succeeded but no token was returned');
  } catch (err) {
    // Real API rejected credentials — do not mask with demo
    if (err?.response?.status === 401 || err?.response?.status === 400) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password';
      const e = new Error(msg);
      e.response = err.response;
      throw e;
    }
    // Network / API down → allow known demo accounts only
    if (isNetworkError(err)) {
      return demoLogin(body);
    }
    throw err;
  }
}

/**
 * Register on the live API and persist the real JWT.
 * Offline demo register only when the network is down — never on validation errors.
 */
export async function registerUser(payload) {
  const body = {
    ...payload,
    email: String(payload.email || '').trim().toLowerCase(),
    username: String(payload.username || payload.email || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ''),
    first_name: payload.first_name || (payload.name || '').split(/\s+/)[0] || 'Explorer',
    last_name:
      payload.last_name ||
      (payload.name || '').split(/\s+/).slice(1).join(' ') ||
      'User',
    password: payload.password,
  };

  try {
    const response = await apiClient.post('/auth/register', body);
    const { token, user, raw } = extractAuth(response.data);
    if (token) {
      const profile = user || {
        email: body.email,
        username: body.username,
        first_name: body.first_name,
        last_name: body.last_name,
        name: `${body.first_name} ${body.last_name}`.trim(),
      };
      setSession({ token, user: normalizeUser(profile) });
      return { ...raw, token, user: getStoredUser() };
    }
    throw new Error('Registration succeeded but no token was returned');
  } catch (err) {
    // Validation / conflict from API — surface to UI
    if (err?.response?.status && err.response.status < 500) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed';
      const e = new Error(typeof msg === 'string' ? msg : 'Registration failed');
      e.response = err.response;
      throw e;
    }
    // Network only → offline demo profile (cannot log in via API later)
    if (isNetworkError(err)) {
      const profile = normalizeUser({
        name: `${body.first_name} ${body.last_name}`.trim(),
        email: body.email,
        username: body.username,
        is_admin: false,
        role: 'user',
      });
      const token = `demo.${btoa(body.email || 'user')}.${Date.now()}`;
      setSession({ token, user: profile });
      return { token, user: profile, offline: true };
    }
    throw err;
  }
}

export async function logoutUser() {
  try {
    if (!isDemoToken()) {
      await apiClient.post('/auth/logout');
    }
  } catch {
    // still clear local session
  }
  clearSession();
}

export async function fetchMe() {
  const token = getToken();
  if (!token || isDemoToken(token)) {
    return getStoredUser();
  }
  try {
    const response = await apiClient.get('/users/me');
    const user = unwrapItem(response.data);
    if (user) {
      setSession({ token, user });
      return normalizeUser(user);
    }
  } catch {
    // keep stored
  }
  return getStoredUser();
}

export function isAuthenticated() {
  return Boolean(getToken());
}
