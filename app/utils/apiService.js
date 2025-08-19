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

// Fetch all users for friends/suggestions
export const fetchAllUsers = async () => {
  const res = await api.get('/api/v1/users/all');
  return res.data;
};

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

// ============================================================================
// NEW API FUNCTIONS (keeping all existing names unchanged)
// ============================================================================

// Follow a user (from your image)
export const followUser = async (userId) => {
  const res = await api.post(`/api/v1/follow/follow/${userId}`);
  return res.data;
};

// Unfollow a user
export const unfollowUser = async (userId) => {
  const res = await api.delete(`/api/v1/follow/unfollow/${userId}`);
  return res.data;
};

// Get followers list for specific user
export const fetchUserFollowers = async (userId, page = 0, size = 20) => {
  const res = await api.get(`/api/v1/follow/followers/${userId}`, {
    params: { page, size }
  });
  return res.data;
};

// Get following list for specific user
export const fetchUserFollowing = async (userId, page = 0, size = 20) => {
  const res = await api.get(`/api/v1/follow/following/${userId}`, {
    params: { page, size }
  });
  return res.data;
};

// Check if following a user
export const checkFollowStatus = async (userId) => {
  const res = await api.get(`/api/v1/follow/status/${userId}`);
  return res.data;
};

// Get follow count
export const getFollowCount = async (userId) => {
  const res = await api.get(`/api/v1/follow/count/${userId}`);
  return res.data;
};

// User login
export const loginUser = async (credentials) => {
  const res = await api.post('/api/v1/auth/login', credentials);
  return res.data;
};

// User registration
export const registerUser = async (userData) => {
  const res = await api.post('/api/v1/auth/register', userData);
  return res.data;
};

// User logout
export const logoutUser = async () => {
  const res = await api.post('/api/v1/auth/logout');
  return res.data;
};

// Refresh access token
export const refreshToken = async (refreshToken) => {
  const res = await api.post('/api/v1/auth/refresh', { refreshToken });
  return res.data;
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  const res = await api.put('/api/v1/profile/update', profileData);
  return res.data;
};

// Upload profile picture
export const uploadProfilePicture = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  const res = await api.post('/api/v1/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

// Search users
export const searchUsers = async (query, page = 0, size = 20) => {
  const res = await api.get('/api/v1/users/search', {
    params: { q: query, page, size }
  });
  return res.data;
};

// Get post by ID
export const fetchPostById = async (postId) => {
  const res = await api.get(`/api/v1/post/${postId}`);
  return res.data;
};

// Update post
export const updatePost = async (postId, postData) => {
  const res = await api.put(`/api/v1/post/${postId}`, postData);
  return res.data;
};

// Delete post
export const deletePost = async (postId) => {
  const res = await api.delete(`/api/v1/post/${postId}`);
  return res.data;
};

// Get user posts
export const fetchUserPosts = async (userId, page = 0, size = 10) => {
  const res = await api.get(`/api/v1/post/user/${userId}`, {
    params: { page, size }
  });
  return res.data;
};

// Get post likes
export const getPostLikes = async (postId, page = 0, size = 20) => {
  const res = await api.get(`/api/v1/post/${postId}/likes`, {
    params: { page, size }
  });
  return res.data;
};

// Update comment
export const updateComment = async (commentId, commentText) => {
  const res = await api.put(`/api/v1/post/comment/${commentId}`, { commentText });
  return res.data;
};

// Delete comment
export const deleteComment = async (commentId) => {
  const res = await api.delete(`/api/v1/post/comment/${commentId}`);
  return res.data;
};

// Like/unlike comment
export const toggleCommentLike = async (commentId) => {
  const res = await api.post(`/api/v1/post/comment/${commentId}/like`);
  return res.data;
};

// Send a message
export const sendMessage = async (conversationId, message) => {
  const res = await api.post(`/api/v1/chat/conversations/${conversationId}/messages`, {
    content: message
  });
  return res.data;
};

// Create new conversation
export const createConversation = async (participantIds) => {
  const res = await api.post('/api/v1/chat/conversations', {
    participantIds
  });
  return res.data;
};

// Mark conversation as read
export const markConversationAsRead = async (conversationId) => {
  const res = await api.put(`/api/v1/chat/conversations/${conversationId}/read`);
  return res.data;
};

// Upload image
export const uploadImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  const res = await api.post('/api/v1/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

// Delete image
export const deleteImage = async (imageId) => {
  const res = await api.delete(`/api/v1/images/${imageId}`);
  return res.data;
};

// Get user notifications
export const fetchNotifications = async (page = 0, size = 20) => {
  const res = await api.get('/api/v1/notifications', {
    params: { page, size }
  });
  return res.data;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  const res = await api.put(`/api/v1/notifications/${notificationId}/read`);
  return res.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  const res = await api.put('/api/v1/notifications/read-all');
  return res.data;
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  const res = await api.delete(`/api/v1/notifications/${notificationId}`);
  return res.data;
};

// Check if user is online
export const checkUserOnlineStatus = async (userId) => {
  const res = await api.get(`/api/v1/users/${userId}/online-status`);
  return res.data;
};

// Get user statistics
export const getUserStats = async (userId) => {
  const res = await api.get(`/api/v1/users/${userId}/stats`);
  return res.data;
};

// Report user or content
export const reportContent = async (reportData) => {
  const res = await api.post('/api/v1/reports', reportData);
  return res.data;
};

// Block user
export const blockUser = async (userId) => {
  const res = await api.post(`/api/v1/users/${userId}/block`);
  return res.data;
};

// Unblock user
export const unblockUser = async (userId) => {
  const res = await api.delete(`/api/v1/users/${userId}/block`);
  return res.data;
};

// Get blocked users
export const getBlockedUsers = async (page = 0, size = 20) => {
  const res = await api.get('/api/v1/users/blocked', {
    params: { page, size }
  });
  return res.data;
};

// Send friend request
export const sendFriendRequest = async (receiverId) => {
  const res = await api.post(`/api/v1/follow/follow/${receiverId}`);
  return res.data;
};

// Accept or reject follow request
export const respondToFollowRequest = async (requestId, action) => {
  const res = await api.post(`/api/v1/follow/follow-requests/${requestId}?action=${action}`);
  return res.data;
};

// Get pending follow requests
export const getPendingFollowRequests = async () => {
  const res = await api.get('/api/v1/follow/incoming');
  return res.data;
};

// Get sent follow requests
export const getSentFollowRequests = async () => {
  const res = await api.get('/api/v1/follow/follow-requests/sent');
  return res.data;
};

// Get all friends (paginated)
export const getAllFriends = async (page = 0, size = 20) => {
  const res = await api.post('/api/v1/users/friends', { page, size });
  return res.data;
};
