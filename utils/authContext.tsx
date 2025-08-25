import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import { loginUser, registerUser, LoginCredentials, RegisterData } from './apiService';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  handleAuthFailure: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Handle authentication failures (called when tokens are expired)
  const handleAuthFailure = async () => {
    console.log('🚨 AuthContext: Handling authentication failure...');
    try {
      // Clear all stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userData');
      
      // Clear state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('🧹 AuthContext: All tokens cleared, redirecting to login');
      
      // Redirect to login
      router.replace('/auth/login');
    } catch (error) {
      console.error('❌ AuthContext: Error handling auth failure:', error);
      // Force redirect even if clearing fails
      router.replace('/auth/login');
    }
  };

  // Check if token is expired (similar to web implementation)
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode(token) as any;
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  // Check authentication status on app start
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Get stored tokens and user data
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUser) {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          console.log('⚠️ AuthContext: Access token expired, attempting refresh...');
          
          // Try to refresh the token automatically
          if (storedRefreshToken) {
            try {
              const response = await fetch('http://192.168.1.12:8080/api/v1/auth/refresh', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: storedRefreshToken }),
              });

              if (response.ok) {
                const data = await response.json();
                if (data.token) {
                  console.log('✅ AuthContext: Token refreshed automatically on app start');
                  
                  // Save new tokens
                  await AsyncStorage.setItem('authToken', data.token);
                  if (data.refreshToken) {
                    await AsyncStorage.setItem('refreshToken', data.refreshToken);
                  }
                  
                  // Update state and redirect to feeds
                  const userData = JSON.parse(storedUser);
                  setToken(data.token);
                  setUser(userData);
                  setIsAuthenticated(true);
                  router.replace('/feeds');
                  return;
                }
              }
            } catch (refreshError) {
              console.log('❌ AuthContext: Auto-refresh failed on app start:', refreshError);
            }
          }
          
          // If refresh failed, clear tokens and redirect to login
          console.log('❌ AuthContext: Auto-refresh failed, redirecting to login');
          await handleAuthFailure();
          return;
        }
        
        // Token is still valid
        if (storedRefreshToken) {
          console.log('✅ Found both access token and refresh token');
        } else {
          console.log('⚠️ Found access token but no refresh token');
        }
        
        const userData = JSON.parse(storedUser);
        
        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Redirect to feeds if authenticated
        router.replace('/feeds');
      } else {
        // No token found, redirect to login
        console.log('❌ No authentication tokens found');
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On error, redirect to login
      router.replace('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await loginUser(credentials);
      
      if (response.success && response.data) {
        const { token: authToken, refreshToken } = response.data;
        
        // Decode JWT token to get user information
        let userData;
        try {
          const decodedToken = jwtDecode(authToken) as any;
          console.log('Decoded JWT token:', decodedToken);
          userData = {
            id: decodedToken.id || decodedToken.userId || decodedToken.sub || '1',
            username: decodedToken.username || credentials.username,
            fullName: decodedToken.fullName || decodedToken.name || credentials.username,
            email: decodedToken.email || '',
            avatar: decodedToken.avatar || undefined,
            isVerified: decodedToken.isVerified || decodedToken.verified || true,
          };
          
          console.log('Created user data:', userData);
        } catch (decodeError) {
          console.warn('Failed to decode JWT token, using fallback user data:', decodeError);
          // Fallback user data if JWT decoding fails
          userData = {
            id: '1',
            username: credentials.username,
            fullName: credentials.username,
            email: '',
            avatar: undefined,
            isVerified: true,
          };
        }
        
        // Store both tokens and user data
        await AsyncStorage.setItem('authToken', authToken);
        if (refreshToken) {
          await AsyncStorage.setItem('refreshToken', refreshToken);
          console.log('✅ Refresh token stored');
        } else {
          console.log('⚠️ No refresh token in response');
        }
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        // Update state
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Redirect to feeds
        router.replace('/feeds');
        
        return true;
      } else {
        console.error('Login failed:', response.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await registerUser(data);
      
      if (response.success) {
        // Registration successful, but user needs to login
        return true;
      } else {
        console.error('Registration failed:', response.message);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userData');
      
      // Clear state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Redirect to login
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuthStatus,
    handleAuthFailure,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 