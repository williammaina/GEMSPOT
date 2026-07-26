import axios from 'axios';

// Base Axios instance configured for the Gemspot API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.gemspot.co.ke/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Handler function to fetch places/venues
export const fetchPlacesHandler = async (category = '') => {
  try {
    const response = await api.get(`/places${category ? `?category=${category}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch places:', error);
    throw error;
  }
};

// Handler function to submit a new user review
export const submitReviewHandler = async (placeId, reviewData) => {
  try {
    const response = await api.post(`/places/${placeId}/reviews`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Failed to submit review:', error);
    throw error;
  }
};