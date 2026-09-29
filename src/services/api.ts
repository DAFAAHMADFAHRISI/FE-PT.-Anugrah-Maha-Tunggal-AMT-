import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menyematkan JWT Token di setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('amt_erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor tangani token kedaluwarsa / 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('amt_erp_token');
      localStorage.removeItem('amt_erp_user');
      // optional: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
