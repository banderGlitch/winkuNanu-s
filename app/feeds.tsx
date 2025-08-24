import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../utils/authContext';

import PostCard from '../components/feed/PostCard';
import StoryCarousel from '../components/feed/StoryCarousel';
import CreatePostButton from '../components/feed/CreatePostButton';
import ProtectedRoute from '../components/ui/ProtectedRoute';

const { width, height } = Dimensions.get('window');

// Mock data for feeds
const mockPosts = [
  {
    id: '1',
    user: {
      id: '1',
      username: 'john_doe',
      fullName: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
    },
    content: {
      text: 'Just finished an amazing hike! The views were absolutely breathtaking. Nature never fails to amaze me. 🌲⛰️ #hiking #nature #adventure',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
      ],
      location: 'Mountain Trail, Colorado',
    },
    stats: {
      likes: 1247,
      comments: 89,
      shares: 23,
      saves: 156,
    },
    timestamp: '2 hours ago',
    isLiked: false,
    isSaved: false,
  },
  {
    id: '2',
    user: {
      id: '2',
      username: 'sarah_wilson',
      fullName: 'Sarah Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      isVerified: false,
    },
    content: {
      text: 'Coffee and coding - the perfect combination for a productive morning! ☕💻 Working on some exciting new features.',
      images: [],
      location: 'Home Office',
    },
    stats: {
      likes: 342,
      comments: 12,
      shares: 5,
      saves: 28,
    },
    timestamp: '4 hours ago',
    isLiked: true,
    isSaved: false,
  },
  {
    id: '3',
    user: {
      id: '3',
      username: 'mike_chen',
      fullName: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
    },
    content: {
      text: 'New restaurant discovery! This place has the best sushi I\'ve ever tasted. Highly recommend! 🍣✨',
      images: [
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
      ],
      location: 'Sakura Sushi Bar',
    },
    stats: {
      likes: 892,
      comments: 67,
      shares: 34,
      saves: 89,
    },
    timestamp: '6 hours ago',
    isLiked: false,
    isSaved: true,
  },
  {
    id: '4',
    user: {
      id: '4',
      username: 'emma_rodriguez',
      fullName: 'Emma Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      isVerified: false,
    },
    content: {
      text: 'Weekend vibes with my favorite people! Sometimes the best moments are the simple ones. 💕',
      images: [
        'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&h=300&fit=crop',
      ],
      location: 'Central Park',
    },
    stats: {
      likes: 2156,
      comments: 134,
      shares: 78,
      saves: 234,
    },
    timestamp: '1 day ago',
    isLiked: true,
    isSaved: false,
  },
];

const mockStories = [
  {
    id: '1',
    user: {
      id: '1',
      username: 'john_doe',
      fullName: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
    },
    hasUnreadStory: true,
  },
  {
    id: '2',
    user: {
      id: '2',
      username: 'sarah_wilson',
      fullName: 'Sarah Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      isVerified: false,
    },
    hasUnreadStory: true,
  },
  {
    id: '3',
    user: {
      id: '3',
      username: 'mike_chen',
      fullName: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
    },
    hasUnreadStory: false,
  },
  {
    id: '4',
    user: {
      id: '4',
      username: 'emma_rodriguez',
      fullName: 'Emma Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      isVerified: false,
    },
    hasUnreadStory: true,
  },
  {
    id: '5',
    user: {
      id: '5',
      username: 'alex_kumar',
      fullName: 'Alex Kumar',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      isVerified: false,
    },
    hasUnreadStory: false,
  },
];

export default function FeedsScreen() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState(mockPosts);
  const [stories, setStories] = useState(mockStories);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('forYou');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  }, []);

  const handleLikePost = useCallback((postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              stats: {
                ...post.stats,
                likes: post.isLiked ? post.stats.likes - 1 : post.stats.likes + 1,
              },
            }
          : post
      )
    );
  }, []);

  const handleSavePost = useCallback((postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isSaved: !post.isSaved,
              stats: {
                ...post.stats,
                saves: post.isSaved ? post.stats.saves - 1 : post.stats.saves + 1,
              },
            }
          : post
      )
    );
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>Winku</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
          </View>
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome, {user.fullName}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/chat-list')}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: logout }
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'forYou' && styles.activeTab]}
          onPress={() => setActiveTab('forYou')}
        >
          <Text style={[styles.tabText, activeTab === 'forYou' && styles.activeTabText]}>
            For You
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trending' && styles.activeTab]}
          onPress={() => setActiveTab('trending')}
        >
          <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
            Trending
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPost = useCallback(({ item }: { item: any }) => (
    <PostCard
      post={item}
      onLike={handleLikePost}
      onSave={handleSavePost}
      onComment={() => {}}
      onShare={() => {}}
    />
  ), [handleLikePost, handleSavePost]);

  const renderStories = () => (
    <View style={styles.storiesContainer}>
      <StoryCarousel stories={stories} />
    </View>
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.mainContainer}>
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={keyExtractor}
            ListHeaderComponent={
              <>
                {renderHeader()}
                {renderStories()}
              </>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
                colors={['#fff']}
              />
            }
            showsVerticalScrollIndicator={false}
          />
          <CreatePostButton />
        </View>
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 30,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#fff',
  },
  storiesContainer: {
    marginBottom: 20,
  },
  userInfo: {
    marginLeft: 15,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
}); 