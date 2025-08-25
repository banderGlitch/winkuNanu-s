import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
const api = axios.create({
  baseURL: 'http://192.168.1.12:8080', // Backend server - Your actual IP
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Function to refresh the token - matches web implementation
const refreshToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 axiosInstance: Attempting to refresh token...');
    
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.log('❌ axiosInstance: No refresh token found');
      return null;
    }

    console.log('🔍 axiosInstance: Using refresh token:', refreshToken.substring(0, 20) + '...');
    console.log('🌐 axiosInstance: Making refresh request to: http://192.168.1.12:8080/api/v1/auth/refresh');

    const response = await axios.post('http://192.168.1.12:8080/api/v1/auth/refresh', {
      refreshToken: refreshToken
    }, {
      timeout: 10000,
    });

    console.log('📡 axiosInstance: Refresh response status:', response.status);
    console.log('📡 axiosInstance: Refresh response data:', response.data);
    console.log('📡 axiosInstance: Refresh response headers:', response.headers);
    console.log('🔍 axiosInstance: Checking if response.data.token exists:', !!response.data?.token);
    console.log('🔍 axiosInstance: Token type:', typeof response.data?.token);
    console.log('🔍 axiosInstance: Token length:', response.data?.token?.length);
    console.log('🔍 axiosInstance: Full response.data structure:', JSON.stringify(response.data, null, 2));
    console.log('🔍 axiosInstance: response.data keys:', Object.keys(response.data || {}));
    
    if (response.data && response.data.token) {
      console.log('✅ axiosInstance: Token refreshed successfully');
      console.log('🔍 axiosInstance: New token:', response.data.token.substring(0, 20) + '...');
      
      // Save new tokens
      await AsyncStorage.setItem('authToken', response.data.token);
      if (response.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        console.log('✅ axiosInstance: New refresh token also stored');
      }
      
      // Verify the token was saved
      const savedToken = await AsyncStorage.getItem('authToken');
      console.log('🔍 axiosInstance: Verified saved token:', savedToken ? savedToken.substring(0, 20) + '...' : 'null');
      
      return response.data.token;
    } else {
      console.log('❌ axiosInstance: Invalid refresh response');
      return null;
    }
  } catch (error: any) {
    console.error('❌ axiosInstance: Token refresh failed:', error.response?.status, error.response?.data);
    console.error('❌ axiosInstance: Token refresh error details:', error.message);
    return null;
  }
};

// Request interceptor: Attach access token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('🔍 axiosInstance: Token from storage:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('🔍 axiosInstance: Request URL:', config.url);
      console.log('🔍 axiosInstance: Request method:', config.method);
      
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('🔐 axiosInstance: Using token for request to:', config.url);
        console.log('🔐 axiosInstance: Authorization header:', `Bearer ${token.substring(0, 20)}...`);
        
        // Log all headers being sent
        console.log('📋 axiosInstance: Final request headers:', config.headers);
      } else {
        console.log('⚠️ axiosInstance: No token found for request to:', config.url);
      }
    } catch (error) {
      console.error('❌ axiosInstance: Error in request interceptor:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 errors and refresh tokens - matches web implementation
api.interceptors.response.use(
  (response) => {
    console.log('✅ axiosInstance: Response received:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.log('❌ axiosInstance: Response error:', error.response?.status, error.config?.url);
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, add to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (token) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          } else {
            // Token refresh failed, redirect to login
            throw new Error('Authentication failed. Please login again.');
          }
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 axiosInstance: Starting token refresh process...');
        console.log('🔍 axiosInstance: Original request details:');
        console.log('   - URL:', originalRequest.url);
        console.log('   - Method:', originalRequest.method);
        console.log('   - Base URL:', originalRequest.baseURL);
        console.log('   - Full URL:', `${originalRequest.baseURL}${originalRequest.url}`);
        
        const newToken = await refreshToken();
        
        if (newToken) {
          console.log('✅ axiosInstance: Got new token, updating request and retrying...');
          
          // Update the failed request with new token
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          // Process queue and retry original request
          processQueue(null, newToken);
          
          // Retry the original request with new token
          console.log('🔄 axiosInstance: Retrying original request with new token...');
          console.log('🔐 axiosInstance: Retry Authorization header:', `Bearer ${newToken.substring(0, 20)}...`);
          console.log('🌐 axiosInstance: Retry URL:', originalRequest.url);
          console.log('🌐 axiosInstance: Retry method:', originalRequest.method);
          
          // Update the original request with new token (like web implementation)
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          // Use the SAME api instance for retry (like web implementation)
          console.log('🔄 axiosInstance: Using same api instance for retry...');
          const retryResponse = await api(originalRequest);
          
          console.log('✅ axiosInstance: Retry response received:', retryResponse.status, retryResponse.data);
          isRefreshing = false;
          console.log('✅ axiosInstance: Retry successful with new token');
          return retryResponse;
        } else {
          // Refresh failed, process queue with error
          console.log('❌ axiosInstance: Token refresh failed, processing queue with error');
          processQueue(new Error('Token refresh failed'));
          isRefreshing = false;
          
          // Don't clear tokens here - let the auth context handle it
          // Just reject the promise so the calling code can handle it
          return Promise.reject(new Error('Authentication failed. Please login again.'));
        }
      } catch (refreshError) {
        // Refresh failed, process queue with error
        console.log('❌ axiosInstance: Token refresh error:', refreshError);
        processQueue(refreshError);
        isRefreshing = false;
        
        return Promise.reject(new Error('Authentication failed. Please login again.'));
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Test function to manually test token refresh
export const testTokenRefresh = async () => {
  try {
    console.log('🧪 Testing token refresh manually...');
    const result = await refreshToken();
    if (result) {
      console.log('✅ Manual token refresh test: SUCCESS');
      return { success: true, token: result.substring(0, 20) + '...' };
    } else {
      console.log('❌ Manual token refresh test: FAILED');
      return { success: false, error: 'No token returned' };
    }
  } catch (error: any) {
    console.log('❌ Manual token refresh test: ERROR', error.message);
    return { success: false, error: error.message };
  }
}; 