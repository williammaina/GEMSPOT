import {
  submitReviewHandler,
  fetchFavoritesHandler,
  addFavoriteHandler,
  removeFavoriteHandler,
  fetchCurrentUserHandler,
  updateUserHandler,
} from '../../../library/handlers/apiHandler.js';

export const submitPlaceReview = (reviewData) => submitReviewHandler(reviewData);

export const getFavorites = () => fetchFavoritesHandler();
export const addFavorite = (placeId) => addFavoriteHandler(placeId);
export const removeFavorite = (placeId) => removeFavoriteHandler(placeId);

export const getCurrentUser = () => fetchCurrentUserHandler();
export const updateCurrentUser = (payload) => updateUserHandler(payload);
