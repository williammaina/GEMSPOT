import { apiClient, unwrapItem } from '../../../../library/handlers/apiClient.js';

const TOKEN_KEY = 'token';
const USER_KEY = 'gemspot-user';

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

export async function loginUser(credentials) {
  // Support both email and username keys for Flask backends
  const body = {
    email: credentials.email || credentials.username,
    username: credentials.username || credentials.email,
    password: credentials.password,
  };
  const response = await apiClient.post('/auth/login', body);
  const { token, user, raw } = extractAuth(response.data);

  if (token) {
    setSession({ token, user });
  }

  return { ...raw, token, user };
}

export async function registerUser(payload) {
  const response = await apiClient.post('/auth/register', payload);
  const { token, user, raw } = extractAuth(response.data);

  if (token) {
    setSession({ token, user });
  }

  return { ...raw, token, user };
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
  const response = await apiClient.get('/users/me');
  const user = unwrapItem(response.data);
  if (user) {
    setSession({ token: getToken(), user });
  }
  return user;
}

export function isAuthenticated() {
  return Boolean(getToken());
}
