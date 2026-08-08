import {
  fetchPlacesHandler,
  fetchPlaceByIdHandler,
  createPlaceHandler,
  updatePlaceHandler,
  deletePlaceHandler,
  fetchEventsHandler,
  fetchEventByIdHandler,
  createEventHandler,
  updateEventHandler,
  deleteEventHandler,
  fetchCategoriesHandler,
  fetchVibesHandler,
  fetchReviewsHandler,
} from '../../../library/handlers/apiHandler.js';

export const getPlaces = (params = {}) => fetchPlacesHandler(params);
export const getPlaceById = (id) => fetchPlaceByIdHandler(id);
export const createPlace = (payload) => createPlaceHandler(payload);
export const updatePlace = (id, payload) => updatePlaceHandler(id, payload);
export const deletePlace = (id) => deletePlaceHandler(id);

export const getEvents = (params = {}) => fetchEventsHandler(params);
export const getEventById = (id) => fetchEventByIdHandler(id);
export const createEvent = (payload) => createEventHandler(payload);
export const updateEvent = (id, payload) => updateEventHandler(id, payload);
export const deleteEvent = (id) => deleteEventHandler(id);

export const getCategories = () => fetchCategoriesHandler();
export const getVibes = (params) => fetchVibesHandler(params);
export const getReviews = (params = {}) => fetchReviewsHandler(params);
