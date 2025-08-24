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
  onStoryPress?: (storyId: string) => void;
}

export default function StoryCarousel({ stories, onStoryPress }: StoryCarouselProps) {
  const handleStoryPress = (storyId: string) => {
    if (onStoryPress) {
      onStoryPress(storyId);
    }
  };

  const renderStoryItem = (story: Story, index: number) => (
    <TouchableOpacity
      key={story.id}
      style={styles.storyItem}
      onPress={() => handleStoryPress(story.id)}
      activeOpacity={0.8}
    >
      <View style={styles.storyContainer}>
        {/* Story Ring */}
        <View
          style={[
            styles.storyRing,
            story.hasUnreadStory && styles.storyRingUnread,
          ]}
        >
          <Image source={{ uri: story.user.avatar }} style={styles.storyAvatar} />
        </View>
        
        {/* Username */}
        <Text style={styles.storyUsername} numberOfLines={1}>
          {story.user.username}
        </Text>
        
        {/* Verification Badge */}
        {story.user.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#1DA1F2" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderAddStoryButton = () => (
    <TouchableOpacity style={styles.storyItem} activeOpacity={0.8}>
      <View style={styles.storyContainer}>
        <View style={styles.addStoryContainer}>
          <View style={styles.addStoryButton}>
            <Ionicons name="add" size={24} color="#667eea" />
          </View>
        </View>
        <Text style={styles.storyUsername}>Add Story</Text>
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
        {renderAddStoryButton()}
        {stories.map(renderStoryItem)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  storyRingUnread: {
    backgroundColor: '#667eea',
    padding: 3,
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  storyUsername: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
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
  addStoryContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
}); 