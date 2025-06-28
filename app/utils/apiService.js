import api from './axiosInstance';


// Feeds API for infinite scroll
export const fetchFeeds = async () => {
  // Adjust the endpoint and params as per your backend
  const res = await api.get(`/api/v1/post/feed`);
  return res.data;
};


// Create Post API
export const createPost = async ({ content, visibility, image }) => {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('visibility', visibility);
  if (image) formData.append('images', image);
  const response = await api.post('/api/v1/post/createPost', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
  });
  return response.data;
}; 