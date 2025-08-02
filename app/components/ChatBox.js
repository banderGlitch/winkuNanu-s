'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { jwtDecode } from "jwt-decode";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FixedSizeList as List } from 'react-window';
import { fetchUserConversations, fetchConversationMessages } from '../utils/apiService';

// Import Stomp from the installed package
import { Client } from '@stomp/stompjs';

export default function ChatBox() {
  // Basic state
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // WebSocket
  const stompClientRef = useRef(null);
  const chatEndRef = useRef(null);
  const listRef = useRef(null);
  
  // React Query client
  const queryClient = useQueryClient();
  
  // WebSocket URLs
  const WS_URL = 'http://localhost:8080/ws';

  // Initialize current user from token
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser({
          userId: decoded.userId,
          username: decoded.sub
        });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // React Query: Fetch conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchUserConversations,
    enabled: !!currentUser,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // React Query: Fetch messages for selected conversation
  const { 
    data: messagesData, 
    isLoading: isLoadingMessages,
    refetch: refetchMessages 
  } = useQuery({
    queryKey: ['messages', selectedConversation?.conversationId],
    queryFn: () => fetchConversationMessages(selectedConversation.conversationId, 0, 50),
    enabled: !!selectedConversation?.conversationId,
  });

  const messages = messagesData?.messages || [];

  // Handle message notifications from WebSocket
  const handleMessageNotification = useCallback(async (notification) => {
    console.log('📨 Message notification received:', notification);
    
    if (notification.conversationId === selectedConversation?.conversationId) {
      console.log('✅ Notification for current conversation, fetching latest message');
      
      try {
        // Call API to get latest message (page=0&size=1)
        console.log('🔄 Calling API: /api/v1/chat/conversations/' + notification.conversationId + '/messages?page=0&size=1');
        const latestMessageData = await fetchConversationMessages(
          notification.conversationId, 
          0, 
          1
        );
        
        const latestMessage = latestMessageData.messages?.[0];
        
        if (latestMessage) {
          console.log('📨 Latest message fetched:', latestMessage);
          
          // Update messages cache with new message
          queryClient.setQueryData(
            ['messages', notification.conversationId],
            (oldData) => {
              if (!oldData) return { messages: [latestMessage] };
              
              // Check if message already exists
              const messageExists = oldData.messages.some(msg => msg.id === latestMessage.id);
              if (!messageExists) {
                console.log('✅ Adding new message to cache');
                return {
                  ...oldData,
                  messages: [...oldData.messages, latestMessage]
                };
              } else {
                console.log('⚠️ Message already exists in cache');
                return oldData;
              }
            }
          );
        } else {
          console.log('⚠️ No latest message found in API response');
        }
      } catch (error) {
        console.error('❌ Error fetching latest message:', error);
      }
    } else {
      console.log('📨 Notification for different conversation, updating conversation list');
      refetchConversations();
    }
  }, [selectedConversation, queryClient, refetchConversations]);

  // WebSocket Connection
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔌 Connecting to WebSocket...');
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('❌ No access token found for WebSocket connection');
      return;
    }
    
    // Use @stomp/stompjs Client
    const socket = new SockJS(`${WS_URL}?token=${token}`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('WebSocket Debug:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('✅ WebSocket connected:', frame);
      setIsConnected(true);
      stompClientRef.current = client;

      // Subscribe to message notifications
      client.subscribe('/user/queue/messages', (msg) => {
        console.log('📩 Message Received:', msg.body);
        try {
          const notification = JSON.parse(msg.body);
          console.log('📨 Parsed notification:', notification);
          handleMessageNotification(notification);
        } catch (error) {
          console.error('❌ Error parsing message notification:', error);
        }
      });

      // Subscribe to conversation updates
      client.subscribe('/user/queue/conversations', (msg) => {
        console.log('📨 Conversation update:', msg.body);
        refetchConversations(); // Refresh conversations
      });

      // Subscribe to typing notifications
      client.subscribe('/user/queue/typing', (msg) => {
        console.log('⌨️ Typing:', msg.body);
      });

      // Subscribe to seen notifications
      client.subscribe('/user/queue/message-seen', (msg) => {
        console.log('👁 Seen Notification:', msg.body);
      });

      // Subscribe to conversation accepted
      client.subscribe('/user/queue/conversation-accepted', (msg) => {
        console.log('✅ Conversation Accepted:', msg.body);
      });

      // Subscribe to ACK
      client.subscribe('/user/queue/ack', (msg) => {
        console.log('✅ Success ACK:', msg.body);
      });

      // Subscribe to errors
      client.subscribe('/user/queue/errors', (msg) => {
        console.log('❌ Error ACK:', msg.body);
      });

      // Subscribe to test messages
      client.subscribe('/user/queue/test', (msg) => {
        console.log('✅ Test message:', msg.body);
      });
    };

    client.onStompError = (frame) => {
      console.error('❌ WebSocket STOMP error:', frame);
      setIsConnected(false);
    };

    client.onWebSocketError = (error) => {
      console.error('❌ WebSocket error:', error);
      setIsConnected(false);
    };

    client.activate();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [currentUser, handleMessageNotification]);

  // Send message via WebSocket (like chatTest.html)
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedConversation || !currentUser) {
      console.log('❌ Cannot send message - missing data');
      return;
    }

    const receiverId = getOtherParticipant(selectedConversation);
    if (!receiverId) {
      console.error('❌ No valid receiver found');
      alert('No valid receiver found. Please check conversation data.');
      return;
    }

    const payload = {
      receiverId,
      content: message.trim(),
      conversationId: selectedConversation.conversationId
    };

    console.log('📤 Sending message payload:', payload);
    
    try {
      if (isConnected && stompClientRef.current) {
        // Use WebSocket like in chatTest.html
        stompClientRef.current.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
        console.log('✅ Message sent via WebSocket');
        
        // Add message locally immediately
        const localMessage = {
          id: `local-${Date.now()}`,
          senderId: currentUser.userId,
          content: message.trim(),
          conversationId: selectedConversation.conversationId,
          timestamp: new Date().toISOString(),
          isLocal: true
        };
        
        // Update messages cache with local message
        queryClient.setQueryData(
          ['messages', selectedConversation.conversationId],
          (oldData) => {
            if (!oldData) return { messages: [localMessage] };
            return {
              ...oldData,
              messages: [...oldData.messages, localMessage]
            };
          }
        );
      } else {
        console.log('⚠️ WebSocket not connected, using REST API fallback');
        const response = await fetch('/api/v1/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error('REST API failed');
        }
        
        console.log('✅ Message sent via REST API');
        
        // Add message locally
        const localMessage = {
          id: `local-${Date.now()}`,
          senderId: currentUser.userId,
          content: message.trim(),
          conversationId: selectedConversation.conversationId,
          timestamp: new Date().toISOString(),
          isLocal: true
        };
        
        queryClient.setQueryData(
          ['messages', selectedConversation.conversationId],
          (oldData) => {
            if (!oldData) return { messages: [localMessage] };
            return {
              ...oldData,
              messages: [...oldData.messages, localMessage]
            };
          }
        );
      }
      
      setMessage('');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  // Get other participant in conversation
  const getOtherParticipant = (conversation) => {
    if (!currentUser) return null;
    
    if (conversation.participantIds && Array.isArray(conversation.participantIds)) {
      const otherParticipantId = conversation.participantIds.find(id => id !== currentUser.userId);
      return otherParticipantId;
    }
    
    return null;
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatEndRef.current && messages.length > 0) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Message row renderer for React Window
  const MessageRow = ({ index, style }) => {
    const msg = messages[index];
    if (!msg) return null;

    const isOwnMessage = msg.senderId === currentUser?.userId;

    return (
      <div style={style}>
        <div
          style={{
            display: 'flex',
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
            marginBottom: '10px',
            padding: '0 20px'
          }}
        >
          <div style={{
            maxWidth: '70%',
            padding: '10px 15px',
            borderRadius: '15px',
            background: isOwnMessage ? '#2196f3' : '#fff',
            color: isOwnMessage ? '#fff' : '#333',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            wordWrap: 'break-word'
          }}>
            {msg.content}
            <div style={{ 
              fontSize: '10px', 
              opacity: 0.7, 
              marginTop: '5px',
              textAlign: 'right'
            }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      background: '#fff', 
      borderRadius: 8, 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
      height: '600px',
      marginTop: 32 
    }}>
      {/* Conversations List */}
      <div style={{ 
        width: '300px', 
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #e0e0e0',
          background: '#f8f9fa'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>Conversations</h3>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Connected: {isConnected ? '✅' : '❌'}
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map((conv) => (
            <div
              key={conv.conversationId}
              onClick={() => setSelectedConversation(conv)}
              style={{
                padding: '15px 20px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                background: selectedConversation?.conversationId === conv.conversationId ? '#e3f2fd' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {getOtherParticipant(conv) ? `User ${getOtherParticipant(conv).slice(0, 8)}...` : 'Unknown User'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {conv.lastMessageContent || 'No messages yet'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid #e0e0e0',
              background: '#f8f9fa'
            }}>
              <h3 style={{ margin: 0 }}>
                {getOtherParticipant(selectedConversation) ? `User ${getOtherParticipant(selectedConversation).slice(0, 8)}...` : 'Unknown User'}
              </h3>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {isConnected ? 'Online' : 'Offline'}
              </div>
            </div>

            {/* Messages with React Window */}
            <div style={{ flex: 1, background: '#f5f5f5' }}>
              {isLoadingMessages ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  Loading messages...
                </div>
              ) : messages.length > 0 ? (
                <List
                  ref={listRef}
                  height={400}
                  itemCount={messages.length}
                  itemSize={80}
                  width="100%"
                >
                  {MessageRow}
                </List>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: '#666'
                }}>
                  No messages yet
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} style={{ 
              padding: '20px', 
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              gap: '10px'
            }}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: '10px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#2196f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: '#666'
          }}>
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
} 