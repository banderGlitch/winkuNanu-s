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

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Get stored token
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUser) {
        // TODO: Validate token with backend
        // For now, we'll assume the token is valid if it exists
        const userData = JSON.parse(storedUser);
        
        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Redirect to feeds if authenticated
        router.replace('/feeds');
      } else {
        // No token found, redirect to login
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
        const { token: authToken } = response.data;
        
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
        
        // Store token and user data
        await AsyncStorage.setItem('authToken', authToken);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 