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

export async function createPlaceHandler(payload) {
  const response = await apiClient.post('/places', payload);
  return unwrapItem(response.data);
}

export async function updatePlaceHandler(id, payload) {
  const response = await apiClient.put(`/places/${id}`, payload);
  return unwrapItem(response.data);
}

export async function deletePlaceHandler(id) {
  const response = await apiClient.delete(`/places/${id}`);
  return response.data;
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

export async function createEventHandler(payload) {
  const response = await apiClient.post('/events', payload);
  return unwrapItem(response.data);
}

export async function updateEventHandler(id, payload) {
  const response = await apiClient.put(`/events/${id}`, payload);
  return unwrapItem(response.data);
}

export async function deleteEventHandler(id) {
  const response = await apiClient.delete(`/events/${id}`);
  return response.data;
}

/* ===================== Reviews ===================== */

export async function fetchReviewsHandler(params = {}) {
  try {
    const response = await apiClient.get('/reviews', { params });
    return unwrapList(response.data);
  } catch {
    const placeId = params.place_id || params.placeId;
    if (placeId) {
      const response = await apiClient.get(`/reviews/place/${placeId}`);
      return unwrapList(response.data);
    }
    throw new Error('Unable to fetch reviews');
  }
}

export async function submitReviewHandler(reviewData) {
  const placeId = reviewData?.place_id || reviewData?.placeId;
  try {
    const response = await apiClient.post('/reviews', {
      ...reviewData,
      place_id: placeId,
    });
    return unwrapItem(response.data);
  } catch (err) {
    if (placeId) {
      const response = await apiClient.post(`/reviews/place/${placeId}`, reviewData);
      return unwrapItem(response.data);
    }
    throw err;
  }
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

export async function fetchVibesHandler(params = {}) {
  try {
    const response = await apiClient.get('/vibes', { params });
    return unwrapList(response.data);
  } catch {
    const response = await apiClient.get('/vibes/reels');
    return unwrapList(response.data);
  }
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

/* ===================== Admin ===================== */

export async function fetchAdminStatsHandler() {
  const response = await apiClient.get('/admin');
  return response.data?.data ?? response.data;
}

/* ===================== Health ===================== */

export async function fetchApiHealthHandler() {
  const response = await apiClient.get('/');
  return response.data;
}
