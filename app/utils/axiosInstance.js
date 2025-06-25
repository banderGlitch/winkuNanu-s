import axios from 'axios';
import { saveTokens, clearTokens } from './tokenUtils';
import { showToast } from '../components/Toast';

const api = axios.create({});

// Request interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          if (res.status === 200 && res.data.token) {
            saveTokens({
              token: res.data.token,
              refreshToken: res.data.refreshToken || refreshToken,
            });
            // Update Authorization header and retry original request
            originalRequest.headers['Authorization'] = `Bearer ${res.data.token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, fall through to logout
        }
      }
      // If refresh fails or no refresh token, logout
      clearTokens();
      window.location.href = '/'; // or '/login'
      showToast('Session expired. Please log in again.', 'error');
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
    return Promise.reject(error);
  }
);

export default api; 


// // Test token 

// eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMSIsInVzZXJJZCI6Ijc0ODA0N2JjLWNhODctNDllZC1hMWMxLWY2YTg5OTg2NTMzMyIsImlhdCI6MTc1MDY5MzAyMSwiZXhwIjoxNzUwNzc5NDIxfQ.baa0qQWmD1XAzQhLbb-ziRqUlWinvzp0tyoQ_03fo4U