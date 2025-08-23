import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Story {
  id: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    isVerified: boolean;
  };
  hasUnreadStory: boolean;
}

interface StoryCarouselProps {
  stories: Story[];
}

export default function StoryCarousel({ stories }: StoryCarouselProps) {
  const renderStory = (story: Story, index: number) => (
    <TouchableOpacity key={story.id} style={styles.storyItem}>
      <View style={styles.storyContainer}>
        {/* Story Ring */}
        <View style={[
          styles.storyRing,
          story.hasUnreadStory ? styles.unreadStoryRing : styles.readStoryRing
        ]}>
          <Image source={{ uri: story.user.avatar }} style={styles.storyAvatar} />
        </View>
        
        {/* Username */}
        <Text style={styles.storyUsername} numberOfLines={1}>
          {story.user.username}
        </Text>
        
        {/* Verified Badge */}
        {story.user.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#1DA1F2" />
          </View>
        )}
        
        {/* Unread Indicator */}
        {story.hasUnreadStory && (
          <View style={styles.unreadIndicator}>
            <View style={styles.unreadDot} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderAddStory = () => (
    <TouchableOpacity style={styles.storyItem}>
      <View style={styles.storyContainer}>
        <View style={styles.addStoryContainer}>
          <View style={styles.addStoryAvatar}>
            <Ionicons name="add" size={24} color="#667eea" />
          </View>
          <View style={styles.addStoryRing}>
            <View style={styles.addStoryPlus}>
              <Ionicons name="add" size={16} color="#fff" />
            </View>
          </View>
        </View>
        <Text style={styles.addStoryText}>Add Story</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={80}
        snapToAlignment="start"
      >
        {renderAddStory()}
        {stories.map(renderStory)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 80,
  },
  storyContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    marginBottom: 8,
  },
  unreadStoryRing: {
    backgroundColor: 'linear-gradient(45deg, #ff6b6b, #ffa726, #ffd54f, #66bb6a, #42a5f5, #ab47bc)',
    borderWidth: 2,
    borderColor: '#fff',
  },
  readStoryRing: {
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  storyUsername: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 70,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 8,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 2,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff6b6b',
    borderWidth: 2,
    borderColor: '#fff',
  },
  addStoryContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  addStoryAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  addStoryRing: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  addStoryPlus: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
  },
}); 