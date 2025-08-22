import axios from 'axios';
import { saveTokens, clearTokens, getAuthHeader } from './tokenUtils';
// Expo project 
// Create axios instance
const api = axios.create({
  baseURL: 'http://192.168.1.12:8080', // Backend server - Your actual IP
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach access token
api.interceptors.request.use(
  async (config) => {
    try {
      const authHeader = await getAuthHeader();
      if (authHeader) {
        config.headers['Authorization'] = authHeader;
        console.log('🔐 API: Using token for request to:', config.url);
      } else {
        console.log('⚠️ API: No token found for request to:', config.url);
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
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
      
      try {
        // Get refresh token from storage
        const { refreshToken } = await import('./tokenUtils').then(utils => utils.getStoredTokens());
        
        if (refreshToken) {
          // Try to refresh the token
          const refreshResponse = await axios.post('http://192.168.1.12:8080/api/v1/auth/refresh', { 
            refreshToken 
          }, {
            baseURL: 'http://192.168.1.12:8080',
            timeout: 10000,
          });
          
          if (refreshResponse.status === 200 && refreshResponse.data.token) {
            // Save new tokens
            await saveTokens({
              token: refreshResponse.data.token,
              refreshToken: refreshResponse.data.refreshToken || refreshToken,
            });
            
            // Update Authorization header and retry original request
            originalRequest.headers['Authorization'] = `Bearer ${refreshResponse.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // If refresh fails or no refresh token, clear tokens
      await clearTokens();
      console.log('Session expired. Please log in again.');
      
      // You might want to navigate to login screen here
      // For now, we'll just reject the promise
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
    
    return Promise.reject(error);
  }
);

export default api; 