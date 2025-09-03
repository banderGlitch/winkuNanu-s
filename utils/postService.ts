import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.12:8080';

interface CreatePostData {
  content: string;
  visibility: string;
  images?: string[]; // Array of image URIs
}

interface CreatePostResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

class PostService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  async createPost(postData: CreatePostData): Promise<CreatePostResponse> {
    try {
      console.log('🚀 Creating post with data:', postData);
      
      // Create FormData
      const formData = new FormData();
      
      // Add text content
      formData.append('content', postData.content);
      formData.append('visibility', postData.visibility);
      
      // Add images if provided
      if (postData.images && postData.images.length > 0) {
        postData.images.forEach((imageUri, index) => {
          // Create file object from URI
          const imageFile = {
            uri: imageUri,
            type: 'image/jpeg', // Default type, can be enhanced
            name: `image_${index}.jpg`
          } as any;
          
          formData.append('images', imageFile);
          console.log(`📸 Added image ${index}:`, imageUri);
        });
      }
      
      // Get auth headers
      const headers = await this.getAuthHeaders();
      
      console.log('📤 Sending POST request to:', `${BASE_URL}/api/v1/post/createPost`);
      console.log('📋 FormData content:');
      console.log('  - content:', postData.content);
      console.log('  - visibility:', postData.visibility);
      console.log('  - images count:', postData.images?.length || 0);
      
      const response = await fetch(`${BASE_URL}/api/v1/post/createPost`, {
        method: 'POST',
        headers: {
          ...headers,
          // Don't set Content-Type for FormData, let the browser set it with boundary
        },
        body: formData,
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }
      
      const responseData = await response.json();
      console.log('✅ Post created successfully:', responseData);
      
      return {
        success: true,
        data: responseData,
        message: 'Post created successfully',
      };
      
    } catch (error) {
      console.error('❌ Error creating post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getPosts(): Promise<CreatePostResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/api/v1/post/feed`, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }
      
      const responseData = await response.json();
      return {
        success: true,
        data: responseData,
      };
      
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async likePost(postId: string): Promise<CreatePostResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/api/v1/post/toggleLike/${postId}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }
      
      const responseData = await response.json();
      return {
        success: true,
        data: responseData,
      };
      
    } catch (error) {
      console.error('❌ Error liking post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export default new PostService(); 