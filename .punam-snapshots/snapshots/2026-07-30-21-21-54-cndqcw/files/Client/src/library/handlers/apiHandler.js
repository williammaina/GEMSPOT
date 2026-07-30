import { apiClient, unwrapList, unwrapItem } from './apiClient.js';

/* ===================== Places ===================== */

export async function fetchPlacesHandler(params = {}) {
  const response = await apiClient.get('/places', { params });
  return unwrapList(response.data);
}

export async function fetchPlaceByIdHandler(id) {
  const response = await apiClient.get(`/places/${id}`);
  return unwrapItem(response.data);
}

/* ===================== Events ===================== */

export async function fetchEventsHandler(params = {}) {
  const response = await apiClient.get('/events', { params });
  return unwrapList(response.data);
}

export async function fetchEventByIdHandler(id) {
  const response = await apiClient.get(`/events/${id}`);
  return unwrapItem(response.data);
}

/* ===================== Reviews ===================== */

export async function fetchReviewsHandler(params = {}) {
  const response = await apiClient.get('/reviews', { params });
  return unwrapList(response.data);
}

export async function submitReviewHandler(reviewData) {
  // Supports both shapes: { place_id, ... } or placeId in path via placesApi
  const response = await apiClient.post('/reviews', reviewData);
  return unwrapItem(response.data);
}

/* ===================== Favorites ===================== */

export async function fetchFavoritesHandler() {
  const response = await apiClient.get('/favorites');
  return unwrapList(response.data);
}

export async function addFavoriteHandler(placeId) {
  const response = await apiClient.post('/favorites', { place_id: placeId });
  return unwrapItem(response.data);
}

export async function removeFavoriteHandler(placeId) {
  const response = await apiClient.delete(`/favorites/${placeId}`);
  return response.data;
}

/* ===================== Categories & Vibes ===================== */

export async function fetchCategoriesHandler() {
  const response = await apiClient.get('/categories');
  return unwrapList(response.data);
}

export async function fetchVibesHandler() {
  const response = await apiClient.get('/vibes');
  return unwrapList(response.data);
}

/* ===================== Users ===================== */

export async function fetchCurrentUserHandler() {
  const response = await apiClient.get('/users/me');
  return unwrapItem(response.data);
}

export async function updateUserHandler(payload) {
  const response = await apiClient.patch('/users/me', payload);
  return unwrapItem(response.data);
}

/* ===================== Health ===================== */

export async function fetchApiHealthHandler() {
  const response = await apiClient.get('/');
  return response.data;
}
