import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: {
    id: string;
    user: {
      id: string;
      username: string;
      fullName: string;
      avatar: string;
      isVerified: boolean;
    };
    content: {
      text: string;
      images: string[];
      location: string;
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
  };
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}

export default function PostCard({
  post,
  onLike,
  onSave,
  onComment,
  onShare,
}: PostCardProps) {
  const [showFullText, setShowFullText] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleLike = useCallback(() => {
    onLike(post.id);
  }, [post.id, onLike]);

  const handleSave = useCallback(() => {
    onSave(post.id);
  }, [post.id, onSave]);

  const handleComment = useCallback(() => {
    onComment(post.id);
  }, [post.id, onComment]);

  const handleShare = useCallback(() => {
    onShare(post.id);
  }, [post.id, onShare]);

  const renderImage = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.postImage} resizeMode="cover" />
      {post.content.images.length > 1 && (
        <View style={styles.imageIndicator}>
          <Text style={styles.imageIndicatorText}>
            {index + 1} / {post.content.images.length}
          </Text>
        </View>
      )}
    </View>
  );

  const renderImages = () => {
    if (post.content.images.length === 0) return null;
    
    if (post.content.images.length === 1) {
      return (
        <View style={styles.singleImageContainer}>
          <Image 
            source={{ uri: post.content.images[0] }} 
            style={styles.singleImage} 
            resizeMode="cover" 
          />
        </View>
      );
    }

    return (
      <View style={styles.multipleImagesContainer}>
        <FlatList
          data={post.content.images}
          renderItem={renderImage}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
        />
        {post.content.images.length > 1 && (
          <View style={styles.paginationDots}>
            {post.content.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentImageIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.fullName}>{post.user.fullName}</Text>
              {post.user.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
              )}
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.username}>@{post.user.username}</Text>
              <Text style={styles.timestamp}> • {post.timestamp}</Text>
            </View>
            {post.content.location && (
              <Text style={styles.location}>
                <Ionicons name="location-outline" size={12} color="#666" />
                {' '}{post.content.location}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        {post.content.text && (
          <View style={styles.textContainer}>
            <Text style={styles.postText} numberOfLines={showFullText ? undefined : 3}>
              {post.content.text}
            </Text>
            {post.content.text.length > 100 && (
              <TouchableOpacity
                onPress={() => setShowFullText(!showFullText)}
                style={styles.readMoreButton}
              >
                <Text style={styles.readMoreText}>
                  {showFullText ? 'Show less' : 'Read more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {renderImages()}
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={post.isLiked ? '#E91E63' : '#666'}
            />
            <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
              {formatNumber(post.stats.likes)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
            <Ionicons name="chatbubble-outline" size={24} color="#666" />
            <Text style={styles.actionText}>{formatNumber(post.stats.comments)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#666" />
            <Text style={styles.actionText}>{formatNumber(post.stats.shares)}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Ionicons
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={post.isSaved ? '#667eea' : '#666'}
          />
          <Text style={[styles.actionText, post.isSaved && styles.savedText]}>
            {formatNumber(post.stats.saves)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  timestamp: {
    fontSize: 14,
    color: '#999',
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  textContainer: {
    marginBottom: 12,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  readMoreButton: {
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  singleImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: 300,
  },
  multipleImagesContainer: {
    position: 'relative',
  },
  imageContainer: {
    width: width - 32,
    height: 300,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  likedText: {
    color: '#E91E63',
  },
  savedText: {
    color: '#667eea',
  },
}); 