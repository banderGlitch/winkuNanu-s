import api from './axiosInstance';
import { jwtDecode } from 'jwt-decode';
import { saveTokens, clearTokens, getStoredTokens } from './tokenUtils';

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  dob: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  data?: any;
}

// Authentication API functions
export const loginUser = async (credentials: LoginCredentials): Promise<ApiResponse> => {
  try {
    console.log('🔍 Attempting login with credentials:', credentials);
    console.log('🌐 Making request to:', '/api/v1/auth/login');
    
    const response = await api.post('/api/v1/auth/login', credentials);
    
    console.log('✅ Login response received:', response);
    console.log('📊 Response status:', response.status);
    console.log('📄 Response data:', response.data);
    
    if (response.data && response.data.token) {
      console.log('🎫 Token found in response, saving tokens...');
      // Save tokens to storage
      await saveTokens({
        token: response.data.token,
        refreshToken: response.data.refreshToken || '',
      });
      
      console.log('💾 Tokens saved successfully');
      
      return {
        success: true,
        message: 'Login successful',
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        data: response.data
      };
    }
    
    console.log('❌ No token found in response');
    return {
      success: false,
      message: 'Invalid response from server'
    };
  } catch (error: any) {
    console.error('💥 Login error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      request: error.request,
      config: error.config
    });
    
    if (error.response) {
      console.log('📡 Server responded with error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.log('🌐 No response received from server');
      console.log('🔗 Request details:', error.request);
    } else {
      console.log('⚙️ Error in request setup:', error.message);
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed. Please try again.'
    };
  }
};

export const registerUser = async (userData: RegisterData): Promise<ApiResponse> => {
  try {
    console.log('🔍 Attempting registration with data:', userData);
    console.log('🌐 Making request to:', '/api/v1/auth/register');
    
    const response = await api.post('/api/v1/auth/register', userData);
    
    console.log('✅ Registration response received:', response);
    console.log('📊 Response status:', response.status);
    console.log('📄 Response data:', response.data);
    
    return {
      success: true,
      message: 'Registration successful',
      data: response.data
    };
  } catch (error: any) {
    console.error('💥 Registration error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      request: error.request,
      config: error.config
    });
    
    if (error.response) {
      console.log('📡 Server responded with error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.log('🌐 No response received from server');
      console.log('🔗 Request details:', error.request);
    } else {
      console.log('⚙️ Error in request setup:', error.message);
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed. Please try again.'
    };
  }
};

export const logoutUser = async (): Promise<ApiResponse> => {
  try {
    await api.post('/api/v1/auth/logout');
    await clearTokens();
    
    return {
      success: true,
      message: 'Logout successful'
    };
  } catch (error: any) {
    console.error('Logout error:', error);
    // Even if logout fails, clear local tokens
    await clearTokens();
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }
};

export const refreshToken = async (refreshToken: string): Promise<ApiResponse> => {
  try {
    const response = await api.post('/api/v1/auth/refresh', { refreshToken });
    
    if (response.data && response.data.token) {
      await saveTokens({
        token: response.data.token,
        refreshToken: response.data.refreshToken || refreshToken,
      });
      
      return {
        success: true,
        message: 'Token refreshed successfully',
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        data: response.data
      };
    }
    
    return {
      success: false,
      message: 'Invalid response from server'
    };
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Token refresh failed'
    };
  }
};

// User management functions
export const fetchCurrentUser = async (): Promise<ApiResponse> => {
  try {
    const response = await api.get('/api/v1/auth/me');
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Fetch current user error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch user data'
    };
  }
};

export const getUserIdFromToken = async (): Promise<string | null> => {
  try {
    const { accessToken } = await getStoredTokens();
    if (!accessToken) return null;
    
    const decoded = jwtDecode(accessToken);
    return decoded.sub || decoded.userId || decoded.uuid || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Profile functions
export const fetchUserProfile = async (uuid: string): Promise<ApiResponse> => {
  try {
    const response = await api.get(`/api/v1/profile/${uuid}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Fetch user profile error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch profile'
    };
  }
};

export const updateUserProfile = async (profileData: any): Promise<ApiResponse> => {
  try {
    const response = await api.put('/api/v1/profile/update', profileData);
    return {
      success: true,
      message: 'Profile updated successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update profile'
    };
  }
};

// Feed functions
export const fetchFeeds = async (): Promise<ApiResponse> => {
  try {
    const response = await api.get('/api/v1/post/feed');
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Fetch feeds error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch feeds'
    };
  }
};

// Post functions
export const createPost = async (postData: { content: string; visibility: string; image?: any }): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('content', postData.content);
    formData.append('visibility', postData.visibility);
    if (postData.image) {
      formData.append('images', postData.image);
    }
    
    const response = await api.post('/api/v1/post/createPost', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return {
      success: true,
      message: 'Post created successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('Create post error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create post'
    };
  }
};

export const toggleLike = async (postId: string): Promise<ApiResponse> => {
  try {
    const response = await api.post(`/api/v1/post/toggleLike/${postId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Toggle like error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to toggle like'
    };
  }
};

// Comment functions
export const fetchComments = async (params: { postId: string; page?: number; size?: number }): Promise<ApiResponse> => {
  try {
    const response = await api.get(`/api/v1/post/comments/${params.postId}`, {
      params: { page: params.page || 0, size: params.size || 10 }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Fetch comments error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch comments'
    };
  }
};

export const postComment = async (commentData: { postId: string; commentText: string; parentCommentId?: string }): Promise<ApiResponse> => {
  try {
    const params: any = { postId: commentData.postId, commentText: commentData.commentText };
    if (commentData.parentCommentId) {
      params.parentCommentId = commentData.parentCommentId;
    }
    
    const response = await api.post('/api/v1/post/comment', null, { params });
    return {
      success: true,
      message: 'Comment posted successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('Post comment error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to post comment'
    };
  }
};

// Follow functions
export const followUser = async (userId: string): Promise<ApiResponse> => {
  try {
    const response = await api.post(`/api/v1/follow/follow/${userId}`);
    return {
      success: true,
      message: 'User followed successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('Follow user error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to follow user'
    };
  }
};

export const unfollowUser = async (userId: string): Promise<ApiResponse> => {
  try {
    const response = await api.delete(`/api/v1/follow/unfollow/${userId}`);
    return {
      success: true,
      message: 'User unfollowed successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('Unfollow user error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to unfollow user'
    };
  }
};

export const checkFollowStatus = async (userId: string): Promise<ApiResponse> => {
  try {
    const response = await api.get(`/api/v1/follow/status/${userId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Check follow status error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to check follow status'
    };
  }
};

// User search functions
export const fetchAllUsers = async (): Promise<ApiResponse> => {
  try {
    const response = await api.get('/api/v1/users/all');
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Fetch all users error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch users'
    };
  }
};

export const searchUsers = async (query: string, page: number = 0, size: number = 20): Promise<ApiResponse> => {
  try {
    const response = await api.get('/api/v1/users/search', {
      params: { q: query, page, size }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Search users error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to search users'
    };
  }
};

// Chat functions
export const fetchUserConversations = async (): Promise<ApiResponse> => {
  try {
    const response = await api.get('/api/v1/chat/me/conversations');
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Fetch conversations error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch conversations'
    };
  }
};

export const fetchConversationMessages = async (conversationId: string, page: number = 0, size: number = 20): Promise<ApiResponse> => {
  try {
    const response = await api.get(`/api/v1/chat/conversations/${conversationId}/messages`, {
      params: { page, size, sort: 'asc' }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Fetch messages error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch messages'
    };
  }
};

export const sendMessage = async (conversationId: string, message: string): Promise<ApiResponse> => {
  try {
    const response = await api.post(`/api/v1/chat/conversations/${conversationId}/messages`, {
      content: message
    });
    return {
      success: true,
      message: 'Message sent successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('Send message error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send message'
    };
  }
};

// Image functions
export const fetchPicture = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await api.get(`/api/v1/images/view/${id}`, { 
      responseType: 'blob' 
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Fetch picture error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch picture'
    };
  }
};

export const uploadImage = async (imageFile: any): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post('/api/v1/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return {
      success: true,
      message: 'Image uploaded successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('Upload image error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to upload image'
    };
  }
}; 