import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface ChatInfo {
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
  unreadCount: number;
  isTyping: boolean;
}

interface ChatHeaderProps {
  chatInfo: ChatInfo;
}

export default function ChatHeader({ chatInfo }: ChatHeaderProps) {
  const handleBack = () => {
    router.back();
  };

  const handleProfile = () => {
    // TODO: Navigate to user profile
    console.log('Navigate to profile:', chatInfo.user.id);
  };

  const handleMore = () => {
    // TODO: Show more options menu
    console.log('Show more options');
  };

  return (
    <View style={styles.header}>
      {/* Left Section - Back Button & User Info */}
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.userInfo} onPress={handleProfile}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: chatInfo.user.avatar }} style={styles.avatar} />
            <View
              style={[
                styles.onlineIndicator,
                { backgroundColor: chatInfo.user.isOnline ? '#10b981' : '#94a3b8' },
              ]}
            />
          </View>
          
          <View style={styles.userDetails}>
            <View style={styles.nameContainer}>
              <Text style={styles.fullName}>{chatInfo.user.fullName}</Text>
              {chatInfo.user.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
              )}
            </View>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {chatInfo.isTyping ? 'typing...' : chatInfo.user.lastSeen}
              </Text>
              {chatInfo.isTyping && (
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Right Section - Action Buttons */}
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call-outline" size={22} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="videocam-outline" size={22} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleMore}>
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  fullName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
}); 