import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Token management utility functions for React Native
 */

// Constants
const TOKEN_CONFIG = {
  ACCESS_TOKEN_KEY: 'accessToken',
  REFRESH_TOKEN_KEY: 'refreshToken',
  TOKEN_EXPIRY_KEY: 'tokenExpiry',
  // Default token validity in milliseconds (1 hour)
  TOKEN_VALIDITY: 60 * 60 * 1000
};

/**
 * Save authentication tokens to AsyncStorage
 * @param tokens - Object containing token and refreshToken
 */
export const saveTokens = async (tokens: { token: string; refreshToken: string }) => {
  try {
    await AsyncStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, tokens.token);
    await AsyncStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, tokens.refreshToken);
    await AsyncStorage.setItem(
      TOKEN_CONFIG.TOKEN_EXPIRY_KEY, 
      (new Date().getTime() + TOKEN_CONFIG.TOKEN_VALIDITY).toString()
    );
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
};

/**
 * Clear all authentication tokens from AsyncStorage
 */
export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(TOKEN_CONFIG.TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

/**
 * Get stored tokens from AsyncStorage
 * @returns Object containing accessToken, refreshToken and tokenExpiry
 */
export const getStoredTokens = async () => {
  try {
    const [accessToken, refreshToken, tokenExpiry] = await Promise.all([
      AsyncStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY),
      AsyncStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY),
      AsyncStorage.getItem(TOKEN_CONFIG.TOKEN_EXPIRY_KEY)
    ]);
    
    return {
      accessToken,
      refreshToken,
      tokenExpiry
    };
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    return { accessToken: null, refreshToken: null, tokenExpiry: null };
  }
};

/**
 * Check if the access token is expired
 * @returns True if token is expired, false otherwise
 */
export const isTokenExpired = async (): Promise<boolean> => {
  try {
    const expiry = await AsyncStorage.getItem(TOKEN_CONFIG.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return new Date().getTime() > parseInt(expiry);
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
};

/**
 * Get the authorization header value for API requests
 * @returns Bearer token string or null if no token exists
 */
export const getAuthHeader = async (): Promise<string | null> => {
  try {
    const { accessToken } = await getStoredTokens();
    return accessToken ? `Bearer ${accessToken}` : null;
  } catch (error) {
    console.error('Error getting auth header:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns True if user has valid tokens, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { accessToken } = await getStoredTokens();
    const expired = await isTokenExpired();
    return !!accessToken && !expired;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}; 