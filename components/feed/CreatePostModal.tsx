import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: (newPostData: any) => void;
}

interface PostData {
  content: string;
  visibility: string;
  images: string[];
}

export default function CreatePostModal({ visible, onClose, onPostCreated }: CreatePostModalProps) {
  const [postData, setPostData] = useState<PostData>({
    content: '',
    visibility: 'PUBLIC',
    images: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Pick images from gallery
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setPostData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
        console.log('📸 Images selected:', newImages);
      }
    } catch (error) {
      console.error('❌ Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  // Remove image by index
  const removeImage = (index: number) => {
    setPostData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Create post with form-data
  const handleCreatePost = async () => {
    if (!postData.content.trim() && postData.images.length === 0) {
      Alert.alert('Error', 'Please add some content or select images');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 Creating post with data:', postData);
      
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        return;
      }

      // Create FormData exactly like Postman
      const formData = new FormData();
      formData.append('content', postData.content.trim());
      formData.append('visibility', postData.visibility);
      
      // Add images if provided
      if (postData.images.length > 0) {
        postData.images.forEach((imageUri, index) => {
          const imageFile = {
            uri: imageUri,
            type: 'image/jpeg',
            name: `image_${index}.jpg`
          } as any;
          
          formData.append('images', imageFile);
          console.log(`📸 Added image ${index}:`, imageUri);
        });
      }

      console.log('📤 Sending POST request to: http://192.168.1.12:8080/api/v1/post/createPost');
      console.log('📋 FormData content:');
      console.log('  - content:', postData.content);
      console.log('  - visibility:', postData.visibility);
      console.log('  - images count:', postData.images.length);

      const response = await fetch('http://192.168.1.12:8080/api/v1/post/createPost', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let the browser set it with boundary
        },
        body: formData,
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        Alert.alert('Error', `Failed to create post: ${response.status}`);
        return;
      }

      const responseData = await response.json();
      console.log('✅ Post created successfully:', responseData);

      Alert.alert('Success', 'Post created successfully!');
      setPostData({ content: '', visibility: 'PUBLIC', images: [] });
      onPostCreated(responseData);
      onClose();

    } catch (error) {
      console.error('❌ Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (postData.content.trim() || postData.images.length > 0) {
      Alert.alert(
        'Discard Post?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => {
            setPostData({ content: '', visibility: 'PUBLIC', images: [] });
            onClose();
          }}
        ]
      );
    } else {
      onClose();
    }
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#667eea" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity 
            onPress={handleCreatePost}
            disabled={isLoading || (!postData.content.trim() && postData.images.length === 0)}
            style={[styles.postButton, ((!postData.content.trim() && postData.images.length === 0) || isLoading) && styles.postButtonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Visibility Selector */}
          <View style={styles.visibilityContainer}>
            <Text style={styles.sectionTitle}>Visibility</Text>
            <View style={styles.visibilityButtons}>
              {['PUBLIC', 'FRIENDS', 'PRIVATE'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.visibilityButton,
                    postData.visibility === option && styles.visibilityButtonActive
                  ]}
                  onPress={() => setPostData(prev => ({ ...prev, visibility: option }))}
                >
                  <Text style={[
                    styles.visibilityButtonText,
                    postData.visibility === option && styles.visibilityButtonTextActive
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content Input */}
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#9ca3af"
              value={postData.content}
              onChangeText={(content) => setPostData(prev => ({ ...prev, content }))}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>
              {postData.content.length}/1000
            </Text>
          </View>

          {/* Image Picker */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Images</Text>
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImages}>
              <Ionicons name="image" size={20} color="#667eea" />
              <Text style={styles.imagePickerButtonText}>Add Images</Text>
            </TouchableOpacity>
            
            {/* Selected Images Preview */}
            {postData.images.length > 0 && (
              <View style={styles.imagesPreview}>
                <Text style={styles.imagesPreviewText}>Selected Images ({postData.images.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {postData.images.map((uri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.previewImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  postButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userInfo: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  userUsername: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  textInputContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  textInput: {
    fontSize: 18,
    color: '#1f2937',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 5,
  },
  inputSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  visibilityContainer: {
    marginBottom: 20,
  },
  visibilityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  visibilityButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  visibilityButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  visibilityButtonTextActive: {
    color: '#fff',
  },
  imageSection: {
    marginBottom: 20,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  imagePickerButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  imagesPreview: {
    marginTop: 12,
  },
  imagesPreviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
}); 