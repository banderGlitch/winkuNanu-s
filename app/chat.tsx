import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ChatHeader from '../components/chat/ChatHeader';
import ChatBubble from '../components/chat/ChatBubble';
import ChatInput from '../components/chat/ChatInput';

const { width, height } = Dimensions.get('window');

// Mock data for chat
const mockMessages = [
  {
    id: '1',
    text: 'Hey! How are you doing today? 😊',
    sender: 'them',
    timestamp: '10:30 AM',
    status: 'read',
  },
  {
    id: '2',
    text: 'I\'m doing great! Just finished working on some exciting new features for our app. How about you?',
    sender: 'me',
    timestamp: '10:32 AM',
    status: 'read',
  },
  {
    id: '3',
    text: 'That sounds amazing! I\'ve been working on the backend API integration. We should definitely collaborate on this!',
    sender: 'them',
    timestamp: '10:35 AM',
    status: 'read',
  },
  {
    id: '4',
    text: 'Absolutely! Let\'s schedule a call tomorrow to discuss the integration points. What time works for you?',
    sender: 'me',
    timestamp: '10:37 AM',
    status: 'sent',
  },
  {
    id: '5',
    text: 'Perfect! How about 2 PM? I\'ll send you a calendar invite with the meeting details.',
    sender: 'them',
    timestamp: '10:40 AM',
    status: 'read',
  },
  {
    id: '6',
    text: 'Sounds great! Looking forward to it. Also, I wanted to show you the new UI components I\'ve been working on.',
    sender: 'me',
    timestamp: '10:42 AM',
    status: 'sending',
  },
];

const mockChatInfo = {
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
  unreadCount: 0,
  isTyping: false,
};

export default function ChatScreen() {
  const [messages, setMessages] = useState(mockMessages);
  const [chatInfo, setChatInfo] = useState(mockChatInfo);
  const [isTyping, setIsTyping] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'me' as const,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending' as const,
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Simulate message being sent
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      );
    }, 1000);

    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const renderMessage = useCallback(({ item }: { item: any }) => (
    <ChatBubble
      message={item}
      isOwnMessage={item.sender === 'me'}
    />
  ), []);

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    );
  };

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Chat Header */}
      <ChatHeader chatInfo={chatInfo} />
      
      {/* Messages List */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
          ListFooterComponent={renderTypingIndicator}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      </View>

      {/* Chat Input */}
      <ChatInput onSendMessage={sendMessage} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: width * 0.6,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
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
}); 