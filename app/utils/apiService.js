import api from './axiosInstance';

// Feeds API
export const getFeeds = () => api.get('/api/v1/post/feed'); 