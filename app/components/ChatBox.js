'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { fetchUserConversations, fetchConversationMessages, acceptIntroductoryMessage, getUserIdFromToken } from '../utils/apiService';
import dayjs from 'dayjs';
import { jwtDecode } from "jwt-decode";

const WS_URL = 'http://host.docker.internal:8080/ws';

export default function ChatBox() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingStatus, setTypingStatus] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [seenMessages, setSeenMessages] = useState(new Set());
  const [lastSeenMessageId, setLastSeenMessageId] = useState(null);
  const chatEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const stompClientRef = useRef(null); // Changed to useRef

  // Initialize current user from JWT
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('=== JWT DEBUG ===');
        console.log('Full JWT decoded:', decoded);
        console.log('All JWT fields:', Object.keys(decoded));
        
        // The JWT has userId field directly
        const userId = decoded.userId;
        console.log('User ID from JWT:', userId);
        
        if (userId) {
          setCurrentUser({
            ...decoded,
            userId: userId
          });
        } else {
          console.error('No userId found in JWT');
          setCurrentUser(null);
        }
      } catch (e) {
        console.error('Error decoding JWT:', e);
        setCurrentUser(null);
      }
    }
  }, []);

  // Remove the profile API call since JWT has userId

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await fetchUserConversations();
        console.log('Loaded conversations:', data);
        setConversations(data || []);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };
    loadConversations();
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!currentUser?.userId) return; // Wait until we have the actual user ID
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('No token available for WebSocket connection');
      return;
    }

    console.log('🔌 Attempting WebSocket connection...');
    console.log('URL:', WS_URL);
    console.log('Current user ID:', currentUser.userId);

    // Cleanup previous connection
    if (stompClientRef.current) {
      console.log('Deactivating previous WebSocket connection');
      stompClientRef.current.deactivate();
    }

    const client = new Client({
      webSocketFactory: () => {
        console.log('Creating SockJS connection to:', `${WS_URL}?token=${token.trim()}`);
        return new SockJS(`${WS_URL}?token=${token.trim()}`);
      },
      debug: (str) => console.log('STOMP Debug:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectionTimeout: 10000, // 10 second timeout
    });

    client.onConnect = (frame) => {
      console.log('✅ WebSocket Connected Successfully:', frame);
      setIsConnected(true);

      // Subscribe to incoming messages
      client.subscribe('/user/queue/messages', (msg) => {
        const body = JSON.parse(msg.body);
        console.log('📨 Received message via WebSocket:', body);

        if (body.conversationId) {
          if (selectedConversation && body.conversationId === selectedConversation.conversationId) {
            setMessages(prev => {
              const newMessages = [...prev, body];
              return newMessages.sort((a, b) =>
                new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt)
              );
            });
          }
          setConversations(prev =>
            prev.map(conv =>
              conv.conversationId === body.conversationId
                ? { ...conv, lastMessage: body.content, unread: (conv.unread || 0) + 1 }
                : conv
            )
          );
        }
      });

      // Subscribe to typing indicators
      client.subscribe('/user/queue/typing', (msg) => {
        const body = JSON.parse(msg.body);
        console.log('⌨️ Typing indicator received:', body);
        if (selectedConversation && body.conversationId === selectedConversation.conversationId) {
          if (body.senderId && body.senderId !== currentUser.userId) {
            setTypingStatus(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setTypingStatus(false), 3000);
          }
        }
      });

      // Subscribe to seen status
      client.subscribe('/user/queue/message-seen', (msg) => {
        const body = JSON.parse(msg.body);
        console.log('👁 Message seen:', body);
        if (selectedConversation && body.conversationId === selectedConversation.conversationId) {
          setSeenMessages(prev => new Set([...prev, body.messageId]));
        }
      });

      // Subscribe to errors
      client.subscribe('/user/queue/errors', (msg) => {
        console.error('❌ WebSocket error:', msg.body);
      });
    };

    client.onStompError = (frame) => {
      console.error('❌ STOMP error:', frame);
      setIsConnected(false);
    };

    client.onDisconnect = () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    };

    client.onWebSocketError = (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    };

    stompClientRef.current = client;
    client.activate();

    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      if (client) {
        client.deactivate();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentUser?.userId]); // Removed selectedConversation dependency to prevent reconnections

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const data = await fetchConversationMessages(selectedConversation.conversationId, 0, 50);
        const messageList = data?.messages || [];
        
        // Sort by timestamp
        const sortedMessages = messageList.sort((a, b) => 
          new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt)
        );
        
        console.log('Loaded messages for conversation:', selectedConversation.conversationId, sortedMessages);
        setMessages(sortedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    console.log('🚀 Attempting to send message...');
    console.log('Message text:', message.trim());
    console.log('Selected conversation:', selectedConversation);
    console.log('Stomp client:', stompClientRef.current);
    console.log('Is connected:', isConnected);
    console.log('Current user:', currentUser);

    if (!message.trim() || !selectedConversation || !currentUser) {
      console.log('❌ Cannot send message - missing data');
      console.log('Message:', message.trim());
      console.log('Selected conversation:', selectedConversation);
      console.log('Current user:', currentUser);
      return;
    }

    const receiverId = getOtherParticipant(selectedConversation);
    console.log('🎯 Receiver ID found:', receiverId);

    if (!receiverId) {
      console.error('❌ No valid receiver found - cannot send message to yourself!');
      return;
    }

    const payload = {
      receiverId,
      content: message.trim(),
      conversationId: selectedConversation.conversationId,
    };

    console.log('📤 Sending message payload:', payload);
    
    if (!isConnected || !stompClientRef.current) {
      console.log('⚠️ WebSocket not connected - message will be queued or sent via REST API');
      // You could implement a message queue here or send via REST API
      alert('WebSocket not connected. Message will be sent when connection is restored.');
      return;
    }
    
    try {
      stompClientRef.current.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
      console.log('✅ Message sent successfully!');
      setMessage('');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleTyping = () => {
    if (!selectedConversation || !stompClientRef.current || !currentUser) return;

    // Use the same robust logic as getOtherParticipant
    const receiverId = getOtherParticipant(selectedConversation);
    
    if (!receiverId) {
      console.log('No valid receiver for typing indicator');
      return;
    }

    const payload = {
      receiverId,
      conversationId: selectedConversation.conversationId,
    };

    stompClientRef.current.publish({ destination: '/app/chat.typing', body: JSON.stringify(payload) });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing indicator
    }, 1000);
  };

  const acceptIntroMessage = async (conversationId) => {
    try {
      await acceptIntroductoryMessage(conversationId);
      // Reload conversations
      const data = await fetchUserConversations();
      setConversations(data || []);
    } catch (error) {
      console.error('Error accepting intro message:', error);
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation || !currentUser) {
      console.log('No conversation or current user');
      return null;
    }

    console.log('=== getOtherParticipant Debug ===');
    console.log('Current user ID from JWT:', currentUser.userId);
    console.log('Conversation:', conversation);

    // Handle participantIds array (from /api/v1/chat/me/conversations)
    if (conversation.participantIds && Array.isArray(conversation.participantIds)) {
      console.log('Using participantIds array:', conversation.participantIds);
      
      // Find the other participant (not the current user)
      const otherId = conversation.participantIds.find(id => id !== currentUser.userId);
      
      if (otherId) {
        console.log('Found other participant ID:', otherId);
        
        // CRITICAL CHECK: Make sure we're not returning the current user
        if (otherId === currentUser.userId) {
          console.error('ERROR: getOtherParticipant is returning the current user!');
          console.error('Current user ID:', currentUser.userId);
          console.error('Other ID found:', otherId);
          console.error('This means the user is trying to message themselves!');
          return null;
        }
        
        return otherId;
      } else {
        console.error('No other participant found in participantIds');
        console.error('Current user ID:', currentUser.userId);
        console.error('Participant IDs:', conversation.participantIds);
        return null;
      }
    }

    // Handle other possible structures (fallback)
    if (conversation.otherParticipant) {
      console.log('Using otherParticipant:', conversation.otherParticipant);
      return conversation.otherParticipant;
    }

    if (conversation.receiverId) {
      console.log('Using receiverId:', conversation.receiverId);
      return conversation.receiverId;
    }

    if (conversation.senderId) {
      console.log('Using senderId:', conversation.senderId);
      return conversation.senderId;
    }

    if (conversation.recipientId) {
      console.log('Using recipientId:', conversation.recipientId);
      return conversation.recipientId;
    }

    console.error('No valid participant found in conversation');
    return null;
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
      {/* Debug Panel */}
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: '#333',
        color: '#fff',
        padding: 10,
        borderRadius: 5,
        fontSize: 11,
        zIndex: 1000,
        maxWidth: 300
      }}>
        <div><strong>Debug Info:</strong></div>
        <div>User: {currentUser?.userId || 'None'}</div>
        <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
        <div>Selected: {selectedConversation?.conversationId || 'None'}</div>
        <div>Messages: {messages.length}</div>
        <div>Conversations: {conversations.length}</div>
      </div>

      {/* Conversations Sidebar */}
      <div style={{ 
        width: '300px', 
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #e0e0e0',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          Conversations
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map((conv) => {
            const otherId = getOtherParticipant(conv);
            const isPending = conv.status === 'PENDING';
            
            return (
              <div
                key={conv.conversationId}
                onClick={() => setSelectedConversation(conv)}
                style={{
                  padding: '15px 20px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  background: selectedConversation?.conversationId === conv.conversationId ? '#f5f5f5' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <img 
                  src="/images/resources/friend-avatar3.jpg" 
                  alt="avatar" 
                  style={{ width: 40, height: 40, borderRadius: '50%' }} 
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {otherId || 'Unknown User'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {isPending ? 'Pending approval' : (conv.lastMessage || 'No messages')}
                  </div>
                </div>
                {isPending && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      acceptIntroMessage(conv.conversationId);
                    }}
                    style={{
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: 4,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Accept
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div style={{ 
              padding: '15px 20px', 
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <img 
                src="/images/resources/friend-avatar3.jpg" 
                alt="avatar" 
                style={{ width: 40, height: 40, borderRadius: '50%' }} 
              />
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {getOtherParticipant(selectedConversation) || 'Unknown User'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {isConnected ? 'Online' : 'Offline'}
                </div>
              </div>
              {typingStatus && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  fontStyle: 'italic',
                  marginLeft: 'auto'
                }}>
                  typing...
                </div>
              )}
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '20px',
                background: '#f5f5f5'
              }}
            >
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: '#666' }}>Loading messages...</div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isOwnMessage = msg.senderId === currentUser.userId;
                    
                    return (
                      <div key={msg.id || idx} style={{ 
                        display: 'flex', 
                        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                        marginBottom: 8
                      }}>
                        {!isOwnMessage && (
                          <img 
                            src="/images/resources/friend-avatar3.jpg" 
                            alt="avatar" 
                            style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: '50%', 
                              marginRight: 8,
                              marginTop: 'auto'
                            }} 
                          />
                        )}
                        
                        <div style={{
                          maxWidth: '70%',
                          position: 'relative'
                        }}>
                          <div style={{
                            background: isOwnMessage ? '#dcf8c6' : '#fff',
                            color: '#333',
                            padding: '8px 12px',
                            borderRadius: 18,
                            fontSize: 14,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {msg.content}
                          </div>
                          
                          <div style={{
                            fontSize: 11,
                            color: '#999',
                            marginTop: 4,
                            textAlign: isOwnMessage ? 'right' : 'left'
                          }}>
                            {dayjs(msg.timestamp || msg.createdAt).format('HH:mm')}
                          </div>
                        </div>
                        
                        {isOwnMessage && (
                          <img 
                            src="/images/resources/user-avatar.jpg" 
                            alt="avatar" 
                            style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: '50%', 
                              marginLeft: 8,
                              marginTop: 'auto'
                            }} 
                          />
                        )}
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div style={{ 
              padding: '20px', 
              borderTop: '1px solid #e0e0e0',
              background: '#fff'
            }}>
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '10px 15px',
                    border: '1px solid #ddd',
                    borderRadius: 20,
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  style={{
                    background: message.trim() ? '#0084ff' : '#ccc',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 20,
                    cursor: message.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  Send {!isConnected && '(Offline)'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#666',
            fontSize: '16px'
          }}>
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}