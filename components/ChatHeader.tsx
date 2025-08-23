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
import { router } from 'expo-router';

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

interface ChatInfo {
  id: string;
  user: ChatUser;
  unreadCount: number;
  isTyping: boolean;
}

interface ChatHeaderProps {
  chatInfo: ChatInfo;
}

export default function ChatHeader({ chatInfo }: ChatHeaderProps) {
  const { user, isTyping } = chatInfo;

  const handleBack = () => {
    router.back();
  };

  const handleProfile = () => {
    // Navigate to user profile
    console.log('Navigate to profile:', user.id);
  };

  const handleMore = () => {
    // Show more options menu
    console.log('Show more options');
  };

  return (
    <View style={styles.header}>
      {/* Left Section - Back Button & User Info */}
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.userInfo} onPress={handleProfile}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <View style={[
              styles.statusIndicator,
              { backgroundColor: user.isOnline ? '#10b981' : '#94a3b8' }
            ]} />
          </View>
          
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user.fullName}</Text>
              {user.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
                </View>
              )}
            </View>
            
            <View style={styles.statusRow}>
              {isTyping ? (
                <Text style={styles.typingText}>typing...</Text>
              ) : (
                <Text style={styles.statusText}>
                  {user.isOnline ? 'online' : user.lastSeen}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Right Section - Actions */}
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
    backgroundColor: '#667eea',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 6,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}); 