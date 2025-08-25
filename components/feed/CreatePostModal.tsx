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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/authContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { createPost, testPostsEndpoint, testCurrentToken } from '../../utils/postService';

const { width, height } = Dimensions.get('window');

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: (newPost: any) => void;
}

interface PostData {
  text: string;
  location: string;
}

export default function CreatePostModal({ visible, onClose, onPostCreated }: CreatePostModalProps) {
  const { user, handleAuthFailure } = useAuth();
  const [postData, setPostData] = useState<PostData>({
    text: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleTestEndpoint = async () => {
    console.log('🧪 Testing endpoint...');
    const result = await testPostsEndpoint();
    console.log('Test result:', result);
    
    if (result.exists) {
      Alert.alert(
        'Endpoint Test Result',
        `Endpoint: ${result.correctEndpoint}\nRequires Auth: ${result.requiresAuth ? 'Yes' : 'No'}`
      );
    } else {
      Alert.alert('Endpoint Test Result', 'No working endpoints found. Check your backend configuration.');
    }
  };

  const handleCreatePost = async () => {
    if (!postData.text.trim()) {
      Alert.alert('Error', 'Please write something for your post');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating post with data:', postData);
      const response = await createPost({
        text: postData.text.trim(),
        location: postData.location.trim(),
      });

      console.log('Post creation response:', response);

      if (response.success && response.data) {
        onPostCreated(response.data);
        setPostData({ text: '', location: '' });
        onClose();
        Alert.alert('Success', 'Post created successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      // Check if it's an authentication error
      if (error.message === 'Authentication failed. Please login again.') {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Close modal first
                onClose();
                // Then handle auth failure
                setTimeout(() => {
                  handleAuthFailure();
                }, 100);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (postData.text.trim()) {
      Alert.alert(
        'Discard Post?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => {
            setPostData({ text: '', location: '' });
            onClose();
          }}
        ]
      );
    } else {
      onClose();
    }
  };

  const handleTestToken = async () => {
    try {
      const isValid = await testCurrentToken();
      if (isValid) {
        Alert.alert('Token Test', '✅ Your current token is valid!');
      } else {
        Alert.alert('Token Test', '❌ Your current token is invalid or expired.');
      }
    } catch (error) {
      Alert.alert('Token Test', '❌ Error testing token: ' + error);
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
            disabled={isLoading || !postData.text.trim()}
            style={[styles.postButton, (!postData.text.trim() || isLoading) && styles.postButtonDisabled]}
          >
            {isLoading ? (
              <LoadingSpinner size="small" color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.userUsername}>@{user?.username || 'user'}</Text>
          </View>

          {/* Test Button */}
          <TouchableOpacity style={styles.testButton} onPress={handleTestEndpoint}>
            <Text style={styles.testButtonText}>🧪 Test Endpoint</Text>
          </TouchableOpacity>
          
          {/* Test Token Button */}
          <TouchableOpacity style={[styles.testButton, { marginTop: 10 }]} onPress={handleTestToken}>
            <Text style={styles.testButtonText}>🔑 Test Current Token</Text>
          </TouchableOpacity>

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#9ca3af"
              value={postData.text}
              onChangeText={(text) => setPostData(prev => ({ ...prev, text }))}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>
              {postData.text.length}/1000
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="Add location (optional)"
                placeholderTextColor="#9ca3af"
                value={postData.location}
                onChangeText={(location) => setPostData(prev => ({ ...prev, location }))}
              />
            </View>
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
  testButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 