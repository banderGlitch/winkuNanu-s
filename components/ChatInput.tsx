import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ChatInputProps {
  onSendMessage: (text: string) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording functionality
    console.log('Voice recording:', !isRecording);
  };

  const handleAttachment = () => {
    // TODO: Implement attachment functionality
    console.log('Open attachment picker');
  };

  const handleEmoji = () => {
    // TODO: Implement emoji picker
    console.log('Open emoji picker');
  };

  const isMessageEmpty = !message.trim();

  return (
    <View style={styles.container}>
      {/* Input Container */}
      <View style={styles.inputContainer}>
        {/* Attachment Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleAttachment}>
          <Ionicons name="add-circle-outline" size={24} color="#667eea" />
        </TouchableOpacity>

        {/* Text Input */}
        <View style={styles.textInputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        </View>

        {/* Emoji Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleEmoji}>
          <Ionicons name="happy-outline" size={24} color="#667eea" />
        </TouchableOpacity>

        {/* Voice Record / Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            isMessageEmpty ? styles.voiceButton : styles.sendButtonActive
          ]}
          onPress={isMessageEmpty ? handleVoiceRecord : handleSend}
        >
          <Ionicons
            name={isMessageEmpty ? 'mic' : 'send'}
            size={20}
            color={isMessageEmpty ? '#667eea' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
          <TouchableOpacity style={styles.stopRecordingButton}>
            <Ionicons name="stop" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 120,
  },
  textInput: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  voiceButton: {
    backgroundColor: '#f1f5f9',
  },
  sendButtonActive: {
    backgroundColor: '#667eea',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  stopRecordingButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
}); 