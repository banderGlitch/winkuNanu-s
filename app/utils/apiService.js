import api from './axiosInstance';
import { jwtDecode } from "jwt-decode";



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

// Fetch all conversations for the current user
export const fetchUserConversations = async () => {
  const res = await api.get('/api/v1/chat/me/conversations');
  return res.data;
};

// Fetch messages for a specific conversation
export const fetchConversationMessages = async (conversationId, page = 0, size = 20) => {
  const res = await api.get(`/api/v1/chat/conversations/${conversationId}/messages`, {
    params: { page, size, sort: 'asc' }, // Use ascending order (oldest first) for chat
  });
  return res.data;
};

// Fetch followers for the current user
export const fetchFollowers = async () => {
  const res = await api.get('/api/v1/follow/followers');
  return res.data;
};

// Accept an introductory message/conversation
export const acceptIntroductoryMessage = async (conversationId) => {
  // Adjust the payload/params as per your backend's requirements
  const res = await api.post('/api/v1/chat/accept', { conversationId });
  return res.data;
};

// Fetch current logged-in user
export const fetchCurrentUser = async () => {
  const res = await api.get('/api/v1/auth/me');
  return res.data;
};

// Decode JWT to get user UUID
export function getUserIdFromToken() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    console.log(decoded);
    // Adjust this depending on your JWT structure
    return decoded.sub || decoded.userId || decoded.uuid;
  } catch (e) {
    return null;
  }
}

// Fetch connected WebSocket users
export const fetchConnectedUsers = async () => {
  const res = await api.get('/api/v1/chat/ws/users');
  return res.data;
};

// Fetch user profile by UUID
export async function fetchUserProfile(uuid) {
  const res = await api.get(`/api/v1/profile/${uuid}`);
  return res.data;
}
