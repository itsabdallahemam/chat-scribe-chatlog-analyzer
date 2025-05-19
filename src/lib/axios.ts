import axios from 'axios';

// Force localhost for local development
const API_URL = 'http://localhost:3000/api';

console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // No need for withCredentials when using localhost
  withCredentials: false,
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use((config) => {
  console.log(`🔍 Making request to: ${config.baseURL}${config.url}`);
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor for error logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received from: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Error in request to ${error.config?.url}:`, error);
    return Promise.reject(error);
  }
);

export default api;