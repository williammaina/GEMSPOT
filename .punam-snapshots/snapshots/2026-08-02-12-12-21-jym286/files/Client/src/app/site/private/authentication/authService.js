import { apiClient, unwrapItem } from '../../../../library/handlers/apiClient.js';

const TOKEN_KEY = 'token';
const USER_KEY = 'gemspot-user';

/** Demo accounts that work without the Flask API */
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

export function setSession({ token, user }) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
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
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function extractAuth(payload) {
  const data = unwrapItem(payload) || payload || {};
  const token =
    data.token ||
    data.access_token ||
    data.accessToken ||
    data?.data?.token ||
    data?.data?.access_token;
  const user =
    data.user ||
    data.profile ||
    data?.data?.user ||
    (data.email || data.username ? data : null);
  return { token, user, raw: data };
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
    err.response = { data: { message: 'Invalid email or password' } };
    throw err;
  }
  const { password: _pw, ...profile } = match;
  const token = `demo.${btoa(profile.email)}.${Date.now()}`;
  setSession({ token, user: profile });
  return { token, user: profile, ...profile };
}

export async function loginUser(credentials) {
  const body = {
    email: credentials.email || credentials.username,
    username: credentials.username || credentials.email,
    password: credentials.password,
  };

  // Prefer live API; fall back to offline demo so login never "glitches" offline
  try {
    const response = await apiClient.post('/auth/login', body);
    const { token, user, raw } = extractAuth(response.data);
    if (token) {
      setSession({ token, user });
      return { ...raw, token, user };
    }
  } catch {
    // API down or wrong credentials — try demo
  }

  return demoLogin(body);
}

export async function registerUser(payload) {
  try {
    const response = await apiClient.post('/auth/register', payload);
    const { token, user, raw } = extractAuth(response.data);
    if (token) {
      setSession({ token, user });
      return { ...raw, token, user };
    }
  } catch {
    // offline demo register
  }
  const profile = {
    name: payload.name || payload.username || 'New explorer',
    email: payload.email,
    username: payload.username || payload.email,
    is_admin: false,
    role: 'user',
  };
  const token = `demo.${btoa(profile.email || 'user')}.${Date.now()}`;
  setSession({ token, user: profile });
  return { token, user: profile, ...profile };
}

export async function logoutUser() {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // still clear local session
  }
  clearSession();
}

export async function fetchMe() {
  try {
    const response = await apiClient.get('/users/me');
    const user = unwrapItem(response.data);
    if (user) {
      setSession({ token: getToken(), user });
      return user;
    }
  } catch {
    // keep stored
  }
  return getStoredUser();
}

export function isAuthenticated() {
  return Boolean(getToken());
}
