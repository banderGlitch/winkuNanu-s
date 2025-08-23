import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
  status: 'sending' | 'sent' | 'read';
}

interface ChatBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function ChatBubble({ message, isOwnMessage }: ChatBubbleProps) {
  const { text, timestamp, status } = message;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={12} color="#94a3b8" />;
      case 'sent':
        return <Ionicons name="checkmark" size={12} color="#94a3b8" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={12} color="#1DA1F2" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'sending...';
      case 'sent':
        return 'sent';
      case 'read':
        return 'read';
      default:
        return '';
    }
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      {/* Message Bubble */}
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble
      ]}>
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {text}
        </Text>
      </View>

      {/* Message Footer */}
      <View style={[
        styles.footer,
        isOwnMessage ? styles.ownFooter : styles.otherFooter
      ]}>
        <Text style={[
          styles.timestamp,
          isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
        ]}>
          {timestamp}
        </Text>
        
        {isOwnMessage && (
          <View style={styles.statusContainer}>
            {getStatusIcon()}
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: width * 0.75,
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ownBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#1f2937',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  ownFooter: {
    justifyContent: 'flex-end',
  },
  otherFooter: {
    justifyContent: 'flex-start',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#94a3b8',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
}); 