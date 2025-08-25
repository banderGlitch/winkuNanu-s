import api from './axiosInstance';

export interface CreatePostData {
  text: string;
  images?: string[];
  location?: string;
  tags?: string[];
}

export interface Post {
  id: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
    isVerified: boolean;
  };
  content: {
    text: string;
    images: string[];
    location?: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  timestamp: string;
  isLiked: boolean;
  isSaved: boolean;
  tags?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// Test function to check endpoint and authentication
export const testPostsEndpoint = async () => {
  const endpoints = [
    '/api/v1/post/feed',
    '/api/v1/post/createPost',
    '/api/posts', 
    '/posts',
    '/api/v1/post',
    '/api/post'
  ];
  
  console.log('🧪 Testing different possible endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint}`);
      const response = await api.get(endpoint);
      console.log(`✅ ${endpoint} - Status: ${response.status}, Requires Auth: false`);
      return { exists: true, requiresAuth: false, correctEndpoint: endpoint };
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log(`✅ ${endpoint} - Status: 401, Requires Auth: true`);
        return { exists: true, requiresAuth: true, correctEndpoint: endpoint };
      } else if (error.response?.status === 404) {
        console.log(`❌ ${endpoint} - Status: 404, Not found`);
      } else {
        console.log(`❌ ${endpoint} - Status: ${error.response?.status}, Error`);
      }
    }
  }
  
  console.log('❌ No working endpoints found');
  return { exists: false, requiresAuth: false, correctEndpoint: null };
};

// Test if the current token is valid
export const testCurrentToken = async () => {
  try {
    console.log('🧪 Testing current token validity...');
    const response = await api.get('/api/v1/post/feed');
    console.log('✅ Token is valid - Status:', response.status);
    return true;
  } catch (error: any) {
    console.log('❌ Token is invalid - Status:', error.response?.status);
    return false;
  }
};

// Create a new post
export const createPost = async (postData: { text: string; location?: string }) => {
  try {
    console.log('📝 postService: Creating post with data:', postData);
    
    // Create FormData to match Postman request
    const formData = new FormData();
    formData.append('content', postData.text);
    formData.append('visibility', 'PUBLIC'); // Hardcoded as PUBLIC like in Postman
    
    // Add location if provided (optional)
    if (postData.location && postData.location.trim()) {
      formData.append('location', postData.location.trim());
    }
    
    console.log('📋 postService: FormData created:', {
      content: postData.text,
      visibility: 'PUBLIC',
      location: postData.location || 'not provided'
    });

    const response = await api.post('/api/v1/post/createPost', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Important for FormData
      },
    });

    console.log('✅ postService: Post created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ postService: Error creating post:', error.response?.status, error.response?.data);
    throw error;
  }
};

// Get all posts (feed)
export const getPosts = async (): Promise<ApiResponse<Post[]>> => {
  try {
    console.log('🚀 postService: Attempting to fetch posts...');
    const response = await api.get('/api/v1/post/feed');
    console.log('✅ postService: Success response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ postService: Error fetching posts:', error);
    
    // Check if it's an authentication error
    if (error.message === 'Authentication failed. Please login again.') {
      console.log('🚨 postService: Authentication failed, need to redirect to login');
      // This will be handled by the calling component
    }
    
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to fetch posts',
    };
  }
};

// Like/unlike a post
export const toggleLikePost = async (postId: string): Promise<ApiResponse<{ isLiked: boolean; likesCount: number }>> => {
  try {
    const response = await api.post(`/api/v1/post/toggleLike/${postId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to toggle like',
    };
  }
};

// Save/unsave a post
export const toggleSavePost = async (postId: string): Promise<ApiResponse<{ isSaved: boolean; savesCount: number }>> => {
  try {
    const response = await api.post(`/api/v1/post/save/${postId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error toggling save:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to toggle save',
    };
  }
};

// Delete a post
export const deletePost = async (postId: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete(`/api/v1/post/delete/${postId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete post',
    };
  }
}; 