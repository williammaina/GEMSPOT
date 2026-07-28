import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1';

// Helper to attach authorization header
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

export const submitPlaceReview = async (placeId, reviewData) => {
  const response = await axios.post(
    `${API_URL}/places/${placeId}/reviews`,
    reviewData,
    getAuthHeaders()
  );
  return response.data;
};