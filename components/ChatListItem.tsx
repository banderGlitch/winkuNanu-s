import React from 'react';
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

interface ChatUser {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
}

interface LastMessage {
  text: string;
  timestamp: string;
  isRead: boolean;
}

interface Chat {
  id: string;
  user: ChatUser;
  lastMessage: LastMessage;
  unreadCount: number;
  isTyping: boolean;
}

interface ChatListItemProps {
  chat: Chat;
  onPress: () => void;
}

export default function ChatListItem({ chat, onPress }: ChatListItemProps) {
  const { user, lastMessage, unreadCount, isTyping } = chat;

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={[
            styles.statusIndicator,
            { backgroundColor: user.isOnline ? '#10b981' : '#94a3b8' }
          ]} />
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.topRow}>
          <View style={styles.nameSection}>
            <Text style={styles.userName}>{user.fullName}</Text>
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" />
              </View>
            )}
          </View>
          
          <View style={styles.timeSection}>
            <Text style={styles.timestamp}>{lastMessage.timestamp}</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.messageSection}>
            {isTyping ? (
              <View style={styles.typingContainer}>
                <Text style={styles.typingText}>typing...</Text>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            ) : (
              <Text style={[
                styles.lastMessage,
                !lastMessage.isRead && styles.unreadMessage
              ]}>
                {truncateText(lastMessage.text)}
              </Text>
            )}
          </View>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 6,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  timeSection: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageSection: {
    flex: 1,
    marginRight: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  unreadMessage: {
    color: '#1f2937',
    fontWeight: '500',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typingText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
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
    backgroundColor: '#10b981',
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
  unreadBadge: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
}); 