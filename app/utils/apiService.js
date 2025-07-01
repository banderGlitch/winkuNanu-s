import api from './axiosInstance';


// Feeds API for infinite scroll
export const fetchFeeds = async () => {
  // Adjust the endpoint and params as per your backend
  const res = await api.get(`/api/v1/post/feed`);
  return res.data;
};

// Fetch Picture for Profile   
export const fetchPicture = async (id) => {
  const res = await api.get(`/api/v1/images/view/${id}`, { responseType: 'blob' });
  return res.data; // This is a Blob
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

// Toggle Like API
export const toggleLike = async (postId) => {
    const res = await api.post(`/api/v1/post/toggleLike/${postId}`);
    return res.data;
}

// Fetch comments for a post (paginated)
export const fetchComments = async ({ postId, page = 0, size = 10 }) => {
  const res = await api.get(`/api/v1/post/comments/${postId}`, {
    params: { page, size },
  });
  return res.data;
};

// Post a comment to a post (or reply to a comment)
export const postComment = async ({ postId, commentText, parentCommentId }) => {
  const params = { postId, commentText };
  if (parentCommentId) params.parentCommentId = parentCommentId;
  const res = await api.post(`/api/v1/post/comment`, null, {
    params,
  });
  return res.data;
};
