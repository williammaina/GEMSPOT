import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1';

export const getPlaces = async (params = {}) => {
  const response = await axios.get(`${API_URL}/places`, { params });
  return response.data;
};

export const getPlaceById = async (id) => {
  const response = await axios.get(`${API_URL}/places/${id}`);
  return response.data;
};