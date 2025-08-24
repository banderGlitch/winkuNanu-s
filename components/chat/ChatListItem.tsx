import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Chat {
  id: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    isVerified: boolean;
    isOnline: boolean;
    lastSeen: string;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
  isTyping: boolean;
}

interface ChatListItemProps {
  chat: Chat;
  onPress: () => void;
}

export default function ChatListItem({ chat, onPress }: ChatListItemProps) {
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: chat.user.avatar }} style={styles.avatar} />
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: chat.user.isOnline ? '#10b981' : '#94a3b8' },
            ]}
          />
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.fullName}>{chat.user.fullName}</Text>
            {chat.user.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" />
            )}
          </View>
          <Text style={styles.timestamp}>{chat.lastMessage.timestamp}</Text>
        </View>

        <View style={styles.messageRow}>
          {chat.isTyping ? (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>typing</Text>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          ) : (
            <Text
              style={[
                styles.lastMessage,
                !chat.lastMessage.isRead && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {truncateText(chat.lastMessage.text)}
            </Text>
          )}
        </View>
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {chat.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount.toString()}
            </Text>
          </View>
        )}
        
        {chat.lastMessage.isRead && chat.unreadCount === 0 && (
          <View style={styles.readIndicator}>
            <Ionicons name="checkmark-done" size={16} color="#667eea" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarSection: {
    marginRight: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentSection: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  unreadMessage: {
    color: '#1e293b',
    fontWeight: '500',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingText: {
    fontSize: 14,
    color: '#667eea',
    fontStyle: 'italic',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#667eea',
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
  },
  unreadBadge: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  readIndicator: {
    padding: 4,
  },
}); 