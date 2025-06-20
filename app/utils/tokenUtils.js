'use client';

/**
 * Token management utility functions
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
 * Save authentication tokens to localStorage
 * @param {Object} tokens - Object containing token and refreshToken
 */
export const saveTokens = (tokens) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, tokens.token);
    localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(
      TOKEN_CONFIG.TOKEN_EXPIRY_KEY, 
      new Date().getTime() + TOKEN_CONFIG.TOKEN_VALIDITY
    );
  }
};

/**
 * Clear all authentication tokens from localStorage
 */
export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_CONFIG.TOKEN_EXPIRY_KEY);
  }
};

/**
 * Get stored tokens from localStorage
 * @returns {Object} Object containing accessToken, refreshToken and tokenExpiry
 */
export const getStoredTokens = () => {
  if (typeof window !== 'undefined') {
    return {
      accessToken: localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY),
      refreshToken: localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY),
      tokenExpiry: localStorage.getItem(TOKEN_CONFIG.TOKEN_EXPIRY_KEY)
    };
  }
  return { accessToken: null, refreshToken: null, tokenExpiry: null };
};

/**
 * Check if the access token is expired
 * @returns {boolean} True if token is expired, false otherwise
 */
export const isTokenExpired = () => {
  if (typeof window !== 'undefined') {
    const expiry = localStorage.getItem(TOKEN_CONFIG.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return new Date().getTime() > parseInt(expiry);
  }
  return true;
};

/**
 * Get the authorization header value for API requests
 * @returns {string|null} Bearer token string or null if no token exists
 */
export const getAuthHeader = () => {
  const { accessToken } = getStoredTokens();
  return accessToken ? `Bearer ${accessToken}` : null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid tokens, false otherwise
 */
export const isAuthenticated = () => {
  const { accessToken } = getStoredTokens();
  return !!accessToken && !isTokenExpired();
}; 