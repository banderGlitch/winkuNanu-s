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

  // Message history loading state
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);

     // WebSocket
   const stompClientRef = useRef(null);
   const chatEndRef = useRef(null);
   const listRef = useRef(null);
   const messagesContainerRef = useRef(null);
   const handleMessageNotificationRef = useRef(null);

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
    queryFn: () => fetchConversationMessages(selectedConversation.conversationId, 0, 20), // Reduced to 20 for better performance
    enabled: !!selectedConversation?.conversationId,
  });

  // Ensure messages are in correct order (oldest at top, newest at bottom)
  const messages = React.useMemo(() => {
    if (!messagesData?.messages) return [];

    // The API returns messages in chronological order (oldest first)
    // Just normalize timestamps and return as-is
    const now = new Date();
    const normalizedMessages = messagesData.messages.map(msg => {
      const msgDate = new Date(msg.timestamp);

      // If the message timestamp is in the future, use current time
      if (msgDate > now) {
        console.warn('⚠️ Future timestamp detected:', msg.timestamp, 'using current time instead');
        return {
          ...msg,
          timestamp: now.toISOString()
        };
      }

      return msg;
    });

    // Ensure proper chronological order (oldest first, newest last)
    const sortedMessages = normalizedMessages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB; // Ascending order (oldest first)
    });

    console.log('📅 Message processing:', {
      originalCount: messagesData.messages.length,
      processedCount: sortedMessages.length,
      firstMessage: sortedMessages[0]?.timestamp,
      lastMessage: sortedMessages[sortedMessages.length - 1]?.timestamp,
      currentTime: now.toISOString()
    });

    return sortedMessages;
  }, [messagesData?.messages]);

  // Debug function to log message state
  const logMessageState = useCallback((action, data) => {
    console.log(`🔍 [${action}] Messages count: ${messages.length}`, data);
  }, [messages.length]);

  // Function to normalize timestamps and prevent future dates
  const normalizeTimestamp = useCallback((timestamp) => {
    try {
      const msgDate = new Date(timestamp);
      const now = new Date();

      // If timestamp is in the future, use current time
      if (msgDate > now) {
        console.warn('⚠️ Future timestamp detected:', timestamp, 'using current time instead');
        return now.toISOString();
      }

      return timestamp;
    } catch (error) {
      console.error('❌ Error parsing timestamp:', timestamp, error);
      return new Date().toISOString();
    }
  }, []);

  // Cache for normalized timestamps to prevent changing times
  const timestampCache = useRef(new Map());

  // Function to get cached normalized timestamp
  const getCachedTimestamp = useCallback((originalTimestamp, messageId) => {
    const cacheKey = `${messageId}-${originalTimestamp}`;

    if (timestampCache.current.has(cacheKey)) {
      return timestampCache.current.get(cacheKey);
    }

    const normalizedTimestamp = normalizeTimestamp(originalTimestamp);
    timestampCache.current.set(cacheKey, normalizedTimestamp);

    return normalizedTimestamp;
  }, [normalizeTimestamp]);

     // Handle message notifications from WebSocket - Improved synchronization
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

           // Normalize the timestamp to prevent future dates
           const normalizedMessage = {
             ...latestMessage,
             timestamp: normalizeTimestamp(latestMessage.timestamp)
           };

           logMessageState('NEW_MESSAGE', normalizedMessage);

           // Update messages cache with new message
           queryClient.setQueryData(
             ['messages', notification.conversationId],
             (oldData) => {
               if (!oldData) return { messages: [normalizedMessage] };

               // Check if message already exists
               const messageExists = oldData.messages.some(msg => msg.id === normalizedMessage.id);
               if (!messageExists) {
                 console.log('✅ Adding new message to cache');
                 logMessageState('ADDING_MESSAGE', { oldCount: oldData.messages.length, newMessage: normalizedMessage });

                 // Create new messages array with the new message at the end
                 const updatedMessages = [...oldData.messages, normalizedMessage];

                 // Only auto-scroll if user is near the bottom (WhatsApp behavior)
                 const totalHeight = updatedMessages.length * 80;
                 const isNearBottom = scrollPosition > (totalHeight - 400);
                 
                 if (isNearBottom) {
                   setTimeout(() => {
                     if (listRef.current) {
                       listRef.current.scrollToItem(updatedMessages.length - 1, 'end');
                     }
                   }, 100);
                 } else {
                   console.log('📱 New message received but user is scrolling up - maintaining position');
                 }

                 return {
                   ...oldData,
                   messages: updatedMessages
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
   }, [selectedConversation?.conversationId, queryClient, normalizeTimestamp, logMessageState, refetchConversations]);

   // Store the latest handleMessageNotification in ref
   handleMessageNotificationRef.current = handleMessageNotification;

    // Load old messages via REST API - Primary method now
  const loadOldMessagesViaAPI = useCallback(async (conversationId, page, size = 20) => {
    console.log(`📚 Loading old messages via REST API for conversation ${conversationId}, page ${page}, size ${size}`);
    
    try {
      setIsLoadingHistory(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('History request timeout')), 10000)
      );
      
      const historyDataPromise = fetchConversationMessages(conversationId, page, size);
      const historyData = await Promise.race([historyDataPromise, timeoutPromise]);
      
      console.log('📚 REST API history response:', historyData);
      
      // Check if we have more data
      if (!historyData.messages || historyData.messages.length === 0) {
        console.log('📚 No more messages available');
        setHasMoreHistory(false);
        setIsLoadingHistory(false);
        return;
      }
      
      // Normalize timestamps in the history data
      const normalizedMessages = (historyData.messages || []).map(msg => ({
        ...msg,
        timestamp: normalizeTimestamp(msg.timestamp)
      }));
      
      // Create the history response format
      const historyResponse = {
        messages: normalizedMessages,
        hasNext: historyData.hasNext || false,
        conversationId: conversationId
      };
      
      // Update hasMoreHistory based on API response
      setHasMoreHistory(historyData.hasNext || false);
      
      // Process the history response
      handleHistoryResponse(historyResponse);
      
    } catch (error) {
      console.error('❌ Error loading history via REST API:', error);
      setIsLoadingHistory(false);
    }
  }, [normalizeTimestamp]);

    // Load old messages via REST API - Primary method
  const loadOldMessages = useCallback((conversationId, page, size = 20) => {
    console.log(`📚 Loading old messages for conversation ${conversationId}, page ${page}, size ${size}`);
    
    // Use REST API directly for history loading
    loadOldMessagesViaAPI(conversationId, page, size);
  }, [loadOldMessagesViaAPI]);



    // Handle history response from REST API - Fixed order
  const handleHistoryResponse = useCallback((historyData) => {
    console.log('📚 Processing history response:', historyData);
    
    const { messages: newMessages, hasNext, conversationId } = historyData;
    
    if (!newMessages || newMessages.length === 0) {
      console.log('📚 No more messages in history');
      setHasMoreHistory(false);
      setIsLoadingHistory(false);
      return;
    }

    // Get current scroll position
    let scrollOffset = 0;
    if (listRef.current) {
      scrollOffset = listRef.current.state.scrollOffset;
    }

    // Update messages cache by adding new messages to the beginning
    queryClient.setQueryData(
      ['messages', conversationId],
      (oldData) => {
        if (!oldData) {
          // Normalize timestamps for new messages
          const normalizedMessages = newMessages.map(msg => ({
            ...msg,
            timestamp: normalizeTimestamp(msg.timestamp)
          }));
          return { messages: normalizedMessages };
        }

        // Check for duplicates - but be more lenient to avoid false positives
        const existingIds = new Set(oldData.messages.map(msg => msg.id));
        const existingTimestamps = new Set(oldData.messages.map(msg => msg.timestamp));

        const uniqueNewMessages = newMessages.filter(msg => {
          // Check both ID and timestamp to avoid false duplicates
          const idExists = existingIds.has(msg.id);
          const timestampExists = existingTimestamps.has(msg.timestamp);

          // Only consider it a duplicate if both ID and timestamp match
          return !(idExists && timestampExists);
        });

        console.log('📚 Duplicate check:', {
          newMessagesCount: newMessages.length,
          uniqueNewMessagesCount: uniqueNewMessages.length,
          existingMessagesCount: oldData.messages.length,
          existingIds: Array.from(existingIds).slice(0, 5), // Show first 5 IDs for debugging
          existingTimestamps: Array.from(existingTimestamps).slice(0, 3) // Show first 3 timestamps for debugging
        });

        if (uniqueNewMessages.length === 0) {
          console.log('📚 All messages already exist in cache - this might be a false positive');
          // Don't set hasMoreHistory to false here, as it might be a duplicate detection issue
          setIsLoadingHistory(false);
          return oldData;
        }

        console.log(`📚 Adding ${uniqueNewMessages.length} new messages to history`);

        // Normalize timestamps for new messages
        const normalizedNewMessages = uniqueNewMessages.map(msg => ({
          ...msg,
          timestamp: normalizeTimestamp(msg.timestamp)
        }));

        // Create a complete chronological list by merging old and new messages
        // This ensures smooth scrolling and proper message flow
        const allMessages = [...normalizedNewMessages, ...oldData.messages];

        // Sort to ensure proper chronological order (oldest first)
        const sortedMessages = allMessages.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB; // Ascending order (oldest first)
        });

        console.log('📚 Message merge result:', {
          newMessages: normalizedNewMessages.length,
          oldMessages: oldData.messages.length,
          totalMessages: sortedMessages.length,
          firstMessage: sortedMessages[0]?.timestamp,
          lastMessage: sortedMessages[sortedMessages.length - 1]?.timestamp,
          messageCountChange: sortedMessages.length - oldData.messages.length
        });

        const updatedMessages = sortedMessages;

        // Safety check: Ensure we're not losing messages unexpectedly
        if (updatedMessages.length < oldData.messages.length) {
          console.warn('⚠️ Message count decreased unexpectedly:', {
            oldCount: oldData.messages.length,
            newCount: updatedMessages.length,
            difference: oldData.messages.length - updatedMessages.length
          });
        }

        // Maintain scroll position after adding older messages
        setTimeout(() => {
          if (listRef.current && normalizedNewMessages.length > 0) {
            // Adjust scroll position to account for new messages at the top
            const newScrollOffset = scrollOffset + (normalizedNewMessages.length * 80); // 80 is itemSize
            console.log('📚 Adjusting scroll position:', {
              oldScrollOffset: scrollOffset,
              newScrollOffset,
              addedMessages: normalizedNewMessages.length
            });
            listRef.current.scrollTo(newScrollOffset);
          }
        }, 50); // Slightly longer delay to ensure DOM updates

        return {
          ...oldData,
          messages: updatedMessages
        };
      }
         );

     // hasMoreHistory is already set in loadOldMessagesViaAPI based on API response
     setIsLoadingHistory(false);
   }, [queryClient, normalizeTimestamp]);

  // Handle scroll to load more messages - WhatsApp style
  const handleScroll = useCallback(({ scrollOffset, scrollDirection }) => {
    setScrollPosition(scrollOffset);

    // WhatsApp logic: Load more messages when user scrolls near the top
    // Threshold is 200px from top for better responsiveness
    if (scrollOffset < 200 && scrollDirection === 'backward' && hasMoreHistory && !isLoadingHistory) {
      console.log('📚 User scrolled to top, loading more messages (WhatsApp style)', {
        scrollOffset,
        scrollDirection,
        hasMoreHistory,
        isLoadingHistory,
        currentPage,
        totalMessages: messages.length
      });
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);

              // Use REST API for history loading with dynamic parameters
        loadOldMessages(selectedConversation.conversationId, nextPage, 20);
    }
  }, [hasMoreHistory, isLoadingHistory, currentPage, selectedConversation, loadOldMessages, messages.length]);

  // Reset history state when conversation changes - WhatsApp style
  useEffect(() => {
    if (selectedConversation) {
      setCurrentPage(0);
      setHasMoreHistory(true);
      setIsLoadingHistory(false);
      setScrollPosition(0);
    }
  }, [selectedConversation?.conversationId]);

     // Auto-scroll to bottom for new messages - Only when user is near bottom (WhatsApp style)
   useEffect(() => {
     if (messages.length > 0 && listRef.current) {
       // Calculate if user is near the bottom (within 200px of the bottom)
       const totalHeight = messages.length * 80; // 80 is itemSize
       const isNearBottom = scrollPosition > (totalHeight - 400); // Within 400px of bottom
       
       // Only auto-scroll if user is already near the bottom
       if (isNearBottom) {
         setTimeout(() => {
           if (listRef.current) {
             listRef.current.scrollToItem(messages.length - 1, 'end');
           }
         }, 50);
       } else {
         // User is scrolling up - don't auto-scroll, maintain their position
         console.log('📱 User is scrolling up, maintaining scroll position');
       }
     }
   }, [messages.length, scrollPosition]);

  // Force scroll to bottom when conversation changes
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollToItem(messages.length - 1, 'end');
        }
      }, 100);
    }
  }, [selectedConversation?.conversationId, messages.length]);

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

       // Ensure the client is properly connected
       setTimeout(() => {
         if (client.connected) {
           console.log('✅ STOMP client is fully connected and ready');
         } else {
           console.log('⚠️ STOMP client connection not ready');
         }
       }, 100);

       // Subscribe to message notifications
       client.subscribe('/user/queue/messages', (msg) => {
         console.log('📩 Message Received:', msg.body);
         try {
           const notification = JSON.parse(msg.body);
           console.log('📨 Parsed notification:', notification);
           // Use the ref to get the latest handleMessageNotification function
           if (handleMessageNotificationRef.current) {
             handleMessageNotificationRef.current(notification);
           }
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

              // Note: History loading now uses REST API directly instead of WebSocket
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
   }, [currentUser]);

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
          timestamp: new Date().toISOString(), // Use current time for local messages
          isLocal: true
        };

        // Update messages cache with local message
        queryClient.setQueryData(
          ['messages', selectedConversation.conversationId],
          (oldData) => {
            if (!oldData) return { messages: [localMessage] };

            // Add the local message (no need to sort, API handles order)
            const updatedMessages = [...oldData.messages, localMessage];

            return {
              ...oldData,
              messages: updatedMessages
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
          timestamp: new Date().toISOString(), // Use current time for local messages
          isLocal: true
        };

        queryClient.setQueryData(
          ['messages', selectedConversation.conversationId],
          (oldData) => {
            if (!oldData) return { messages: [localMessage] };

            // Add the local message (no need to sort, API handles order)
            const updatedMessages = [...oldData.messages, localMessage];

            return {
              ...oldData,
              messages: updatedMessages
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

  // Message row renderer for React Window - WhatsApp Style
  const MessageRow = ({ index, style }) => {
    const msg = messages[index];
    if (!msg) return null;

    const isOwnMessage = msg.senderId === currentUser?.userId;
    const isLocalMessage = msg.isLocal;

    return (
      <div style={style}>
        <div
          style={{
            display: 'flex',
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
            marginBottom: '8px',
            padding: '0 16px',
            alignItems: 'flex-end'
          }}
        >
          <div style={{
            maxWidth: '65%',
            padding: '8px 12px',
            borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isOwnMessage ? '#dcf8c6' : '#fff',
            color: '#000',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            wordWrap: 'break-word',
            position: 'relative',
            border: isOwnMessage ? 'none' : '1px solid #e0e0e0'
          }}>
            <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
              {msg.content}
            </div>
            <div style={{
              fontSize: '11px',
              opacity: 0.6,
              marginTop: '4px',
              textAlign: 'right',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4px'
            }}>
              {(() => {
                try {
                  // Use cached timestamp to prevent changing times
                  const displayTimestamp = getCachedTimestamp(msg.timestamp, msg.id);
                  const displayDate = new Date(displayTimestamp);

                  return displayDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                } catch (error) {
                  console.error('❌ Error parsing timestamp:', msg.timestamp, error);
                  return new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                }
              })()}
              {isLocalMessage && (
                <span style={{ fontSize: '12px' }}>✓</span>
              )}
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
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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
                     {selectedConversation && (
             <div style={{ fontSize: '10px', color: '#999', marginTop: '3px' }}>
               History: Page {currentPage} • {hasMoreHistory ? 'More available' : 'End reached'}
             </div>
           )}
                       {/* Debug Panel - Minimal */}
            {selectedConversation && (
              <div style={{ 
                fontSize: '8px', 
                color: '#999', 
                marginTop: '3px',
                padding: '4px 6px',
                background: '#f8f9fa',
                borderRadius: '3px',
                border: '1px solid #e0e0e0'
              }}>
                <div>Messages: {messages.length} • Scroll: {Math.round(scrollPosition)}px</div>
              </div>
            )}
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
            {/* Chat Header - WhatsApp Style */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e0e0e0',
              background: '#f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#2196f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {getOtherParticipant(selectedConversation) ?
                    getOtherParticipant(selectedConversation).slice(0, 1).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000',
                    marginBottom: '2px'
                  }}>
                    {getOtherParticipant(selectedConversation) ?
                      `User ${getOtherParticipant(selectedConversation).slice(0, 8)}...` : 'Unknown User'}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: isConnected ? '#25d366' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isConnected ? '#25d366' : '#ccc'
                    }}></div>
                    {isConnected ? 'online' : 'offline'} • {messages.length} messages
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {hasMoreHistory && (
                  <button
                    onClick={() => loadOldMessages(selectedConversation.conversationId, currentPage + 1, 20)}
                    disabled={isLoadingHistory}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: isLoadingHistory ? '#ccc' : '#25d366',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '16px',
                      cursor: isLoadingHistory ? 'not-allowed' : 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {isLoadingHistory ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </div>
            </div>

                         {/* Messages with React Window - WhatsApp Style */}
             <div style={{ flex: 1, background: '#f5f5f5', position: 'relative' }}>
                               {/* Visual scroll indicator - Minimal */}
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  fontSize: '8px',
                  zIndex: 50
                }}>
                  {Math.round(scrollPosition)}px
                </div>
              {/* WhatsApp style loading indicator for history */}
              {isLoadingHistory && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '12px',
                  textAlign: 'center',
                  zIndex: 10,
                  fontSize: '13px',
                  color: '#666',
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #e0e0e0',
                    borderTop: '2px solid #2196f3',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Loading older messages...
                </div>
              )}

              {isLoadingMessages ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#666',
                  fontSize: '14px'
                }}>
                  Loading messages...
                </div>
              ) : messages.length > 0 ? (
                                 <List
                   ref={listRef}
                   height={400}
                   itemCount={messages.length}
                   itemSize={80}
                   width="100%"
                   onScroll={handleScroll}
                   overscanCount={5} // Reduced for better performance
                   useIsScrolling={false} // Disabled to reduce glitches
                   key={`messages-${messages.length}`} // More specific key
                 >
                   {MessageRow}
                 </List>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#666',
                  fontSize: '14px',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '48px', opacity: 0.3 }}>💬</div>
                  No messages yet
                  <div style={{ fontSize: '12px', opacity: 0.6 }}>
                    Start a conversation by sending a message
                  </div>
                </div>
              )}

                                             {/* Latest message indicator - Minimal */}
                {messages.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    background: 'rgba(0,255,0,0.6)',
                    color: 'white',
                    padding: '2px 4px',
                    borderRadius: '2px',
                    fontSize: '8px',
                    zIndex: 50
                  }}>
                    {messages[messages.length - 1]?.content?.substring(0, 8)}...
                  </div>
                )}
               
               {/* WhatsApp style: Beginning of conversation indicator */}
               {!hasMoreHistory && messages.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(240, 240, 240, 0.95)',
                  padding: '10px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#666',
                  zIndex: 5,
                  borderBottom: '1px solid #e0e0e0',
                  fontWeight: '500'
                }}>
                  📅 Beginning of conversation
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