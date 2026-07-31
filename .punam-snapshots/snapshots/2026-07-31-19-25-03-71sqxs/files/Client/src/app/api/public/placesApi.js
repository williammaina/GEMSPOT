import {
  fetchPlacesHandler,
  fetchPlaceByIdHandler,
  fetchEventsHandler,
  fetchEventByIdHandler,
  fetchCategoriesHandler,
  fetchVibesHandler,
  fetchReviewsHandler,
} from '../../../library/handlers/apiHandler.js';

export const getPlaces = (params = {}) => fetchPlacesHandler(params);
export const getPlaceById = (id) => fetchPlaceByIdHandler(id);
export const getEvents = (params = {}) => fetchEventsHandler(params);
export const getEventById = (id) => fetchEventByIdHandler(id);
export const getCategories = () => fetchCategoriesHandler();
export const getVibes = () => fetchVibesHandler();
export const getReviews = (params = {}) => fetchReviewsHandler(params);
