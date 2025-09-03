import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const POST_PADDING = 32; // 16px padding on each side
const AVAILABLE_WIDTH = width - POST_PADDING;

// Component for dynamic image sizing
interface DynamicImageProps {
  imageUri: string;
  style?: any;
  containerStyle?: any;
}

function DynamicImage({ imageUri, style, containerStyle }: DynamicImageProps) {
  const [imageHeight, setImageHeight] = useState(200); // Default height
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupImage = async () => {
      try {
        setIsLoading(true);
        
        // Get image dimensions
        const { width: imgWidth, height: imgHeight } = await new Promise<{width: number, height: number}>((resolve, reject) => {
          Image.getSize(imageUri, (width, height) => {
            resolve({ width, height });
          }, reject);
        });
        
        // Calculate height based on available width while maintaining aspect ratio
        const aspectRatio = imgHeight / imgWidth;
        const calculatedHeight = AVAILABLE_WIDTH * aspectRatio;
        
        // Set reasonable limits (min 150px, max 600px)
        const finalHeight = Math.max(150, Math.min(600, calculatedHeight));
        
        setImageHeight(finalHeight);
        console.log(`📐 Image dimensions: ${imgWidth}x${imgHeight}, calculated height: ${finalHeight}`);
      } catch (error) {
        console.error('❌ Error setting up image:', error);
        setImageHeight(200); // Fallback height
      } finally {
        setIsLoading(false);
      }
    };

    setupImage();
  }, [imageUri]);

  if (isLoading) {
    return (
      <View style={[styles.imagePlaceholder, { height: imageHeight }, containerStyle]}>
        <Ionicons name="image-outline" size={40} color="#d1d5db" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={[style, { height: imageHeight }]}
      resizeMode="contain"
    />
  );
}

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
  onComment: () => void;
  onShare: () => void;
}

export default function PostCard({
  post,
  onLike,
  onSave,
  onComment,
  onShare,
}: PostCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderImages = () => {
    if (post.content.images.length === 0) return null;

    if (post.content.images.length === 1) {
      return (
        <DynamicImage
          imageUri={post.content.images[0]}
          style={styles.singleImage}
        />
      );
    }

    if (post.content.images.length === 2) {
      return (
        <View style={styles.twoImagesContainer}>
          <DynamicImage
            imageUri={post.content.images[0]}
            style={styles.twoImage}
          />
          <DynamicImage
            imageUri={post.content.images[1]}
            style={styles.multipleImageSmall}
          />
        </View>
      );
    }

    return (
      <View style={styles.multipleImagesContainer}>
        <DynamicImage
          imageUri={post.content.images[0]}
          style={styles.multipleImageMain}
        />
        <View style={styles.multipleImagesRight}>
          <DynamicImage
            imageUri={post.content.images[1]}
            style={styles.multipleImageSmall}
          />
          {post.content.images.length > 2 && (
            <View style={styles.moreImagesOverlay}>
              <Text style={styles.moreImagesText}>
                +{post.content.images.length - 2}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
          <View style={styles.userDetails}>
            <View style={styles.nameContainer}>
              <Text style={styles.fullName}>{post.user.fullName}</Text>
              {post.user.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
              )}
            </View>
            <Text style={styles.username}>@{post.user.username}</Text>
            <Text style={styles.timestamp}>{post.timestamp}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.postText}>{post.content.text}</Text>
        {post.content.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text style={styles.locationText}>{post.content.location}</Text>
          </View>
        )}
      </View>

      {/* Images */}
      {renderImages()}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={post.isLiked ? '#ef4444' : '#64748b'}
          />
          <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
            {formatNumber(post.stats.likes)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={24} color="#64748b" />
          <Text style={styles.actionText}>{formatNumber(post.stats.comments)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share-outline" size={24} color="#64748b" />
          <Text style={styles.actionText}>{formatNumber(post.stats.shares)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSave(post.id)}
        >
          <Ionicons
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={post.isSaved ? '#667eea' : '#64748b'}
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
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  username: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
  },
  singleImage: {
    width: '100%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  twoImagesContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  twoImage: {
    flex: 1,
    minHeight: 150,
  },
  multipleImagesContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  multipleImageMain: {
    flex: 2,
    minHeight: 150,
  },
  multipleImagesRight: {
    flex: 1,
    gap: 2,
  },
  multipleImageSmall: {
    flex: 1,
    minHeight: 75,
  },
  imagePlaceholder: {
    width: '100%',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  moreImagesOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  likedText: {
    color: '#ef4444',
  },
  savedText: {
    color: '#667eea',
  },
}); 