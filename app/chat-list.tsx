import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import ChatListItem from '../components/chat/ChatListItem';
import SearchBar from '../components/ui/SearchBar';

const { width, height } = Dimensions.get('window');

// Mock data for chat list
const mockChats = [
  {
    id: '1',
    user: {
      id: '1',
      username: 'sarah_wilson',
      fullName: 'Sarah Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
      isOnline: true,
      lastSeen: '2 minutes ago',
    },
    lastMessage: {
      text: 'That sounds amazing! I\'ve been working on the backend API integration.',
      timestamp: '10:40 AM',
      isRead: false,
    },
    unreadCount: 2,
    isTyping: false,
  },
  {
    id: '2',
    user: {
      id: '2',
      username: 'mike_chen',
      fullName: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
      isOnline: false,
      lastSeen: '1 hour ago',
    },
    lastMessage: {
      text: 'Perfect! How about 2 PM? I\'ll send you a calendar invite.',
      timestamp: '9:30 AM',
      isRead: true,
    },
    unreadCount: 0,
    isTyping: false,
  },
  {
    id: '3',
    user: {
      id: '3',
      username: 'emma_rodriguez',
      fullName: 'Emma Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      isVerified: false,
      isOnline: true,
      lastSeen: '5 minutes ago',
    },
    lastMessage: {
      text: 'Weekend vibes with my favorite people! 💕',
      timestamp: 'Yesterday',
      isRead: true,
    },
    unreadCount: 0,
    isTyping: true,
  },
  {
    id: '4',
    user: {
      id: '4',
      username: 'alex_kumar',
      fullName: 'Alex Kumar',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      isVerified: false,
      isOnline: false,
      lastSeen: '3 hours ago',
    },
    lastMessage: {
      text: 'Thanks for the help with the project setup!',
      timestamp: 'Yesterday',
      isRead: true,
    },
    unreadCount: 0,
    isTyping: false,
  },
  {
    id: '5',
    user: {
      id: '5',
      username: 'john_doe',
      fullName: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
      isOnline: false,
      lastSeen: '2 days ago',
    },
    lastMessage: {
      text: 'Just finished an amazing hike! The views were breathtaking.',
      timestamp: '2 days ago',
      isRead: true,
    },
    unreadCount: 0,
    isTyping: false,
  },
];

export default function ChatListScreen() {
  const [chats, setChats] = useState(mockChats);
  const [searchQuery, setSearchQuery] = useState('');

  const handleChatPress = useCallback((chatId: string) => {
    router.push(`/chat?id=${chatId}`);
  }, []);

  const handleNewChat = useCallback(() => {
    // TODO: Navigate to new chat or contact selection
    console.log('Start new chat');
  }, []);

  const filteredChats = chats.filter(chat =>
    chat.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = useCallback(({ item }: { item: any }) => (
    <ChatListItem
      chat={item}
      onPress={() => handleChatPress(item.id)}
    />
  ), [handleChatPress]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>Messages</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="chatbubbles" size={20} color="#1DA1F2" />
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleNewChat}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header */}
      {renderHeader()}
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search conversations..."
        />
      </View>

      {/* Chat List */}
      <View style={styles.chatListContainer}>
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatList}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  chatListContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatList: {
    paddingBottom: 20,
  },
}); 