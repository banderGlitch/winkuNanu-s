'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SockJS from 'sockjs-client';
import { jwtDecode } from "jwt-decode";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FixedSizeList as List } from 'react-window';
import { fetchUserConversations, fetchConversationMessages, acceptIntroductoryMessage } from '../utils/apiService';

// Import Stomp from the installed package
import { Client } from '@stomp/stompjs';

export default function ChatBox({ selectedConversationId }) {
  // Basic state
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);

  // Handle approval/decline of introductory message
  const handleApproveMessage = async () => {
    if (!pendingMessage) return;
    
    try {
      console.log('✅ ChatBox: Approving introductory message for conversation:', pendingMessage.conversationId);
      
      const response = await acceptIntroductoryMessage(pendingMessage.conversationId);
      if (response.success) {
        console.log('✅ Message approved successfully');
        setShowApprovalPopup(false);
        setPendingMessage(null);
        
        // Update the conversation status to remove isNewConversation flag
        if (selectedConversation) {
          setSelectedConversation(prev => ({
            ...prev,
            isNewConversation: false
          }));
        }
        
        // Refresh conversations to update status
        refetchConversations();
        
        // Show success message
        alert('Message approved! You can now continue chatting.');
      } else {
        console.error('❌ Failed to approve message:', response);
        alert('Failed to approve message. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error approving message:', error);
      alert('Error approving message. Please try again.');
    }
  };

  const handleDeclineMessage = () => {
    console.log('❌ ChatBox: Declining introductory message for conversation:', pendingMessage?.conversationId);
    setShowApprovalPopup(false);
    setPendingMessage(null);
    
    // Remove the conversation from the list since it was declined
    if (selectedConversation) {
      setSelectedConversation(null);
    }
    
    console.log('❌ Message declined');
    alert('Message declined. The conversation has been removed.');
  };

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

   // Get other participant in conversation - Define early to avoid initialization error
   const getOtherParticipant = (conversation) => {
     if (!currentUser) return null;
     
     if (conversation.participantIds && Array.isArray(conversation.participantIds)) {
       const otherParticipantId = conversation.participantIds.find(id => id !== currentUser.userId);
       return otherParticipantId;
     }
     
     return null;
   };

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

  // Merge conversations with pending chat user
  const allConversations = useMemo(() => {
    const pendingChatUser = localStorage.getItem('pendingChatUser');
    if (pendingChatUser) {
      try {
        const userData = JSON.parse(pendingChatUser);
        console.log('💬 ChatBox: Found pending chat user:', userData);
        
        // Check if this user is already in conversations
        const existingConversation = conversations.find(conv => 
          conv.participantIds && conv.participantIds.includes(userData.userId)
        );
        
        if (!existingConversation) {
          // Add as a new "conversation" in the list
          const pendingConversation = {
            conversationId: `pending-${userData.userId}`,
            participantIds: [currentUser?.userId, userData.userId],
            isPendingChat: true,
            receiverName: userData.userName,
            lastMessage: 'Click to start chatting...',
            lastMessageTime: new Date().toISOString()
          };
          
          console.log('💬 ChatBox: Adding pending conversation:', pendingConversation);
          return [pendingConversation, ...conversations];
        }
      } catch (error) {
        console.error('❌ ChatBox: Error parsing pending chat user:', error);
      }
    }
    
    return conversations;
  }, [conversations, currentUser]);

  // Handle new conversation from Friends component
  useEffect(() => {
    console.log('🔍 ChatBox: selectedConversationId changed:', selectedConversationId);
    console.log('🔍 ChatBox: current conversations:', conversations);
    console.log('🔍 ChatBox: currentUser:', currentUser);
    
    if (selectedConversationId) {
      // Find the conversation in the list or create a temporary one
      const conversation = conversations.find(conv => conv.conversationId === selectedConversationId);
      console.log('🔍 ChatBox: Found existing conversation:', conversation);
      
      if (conversation) {
        console.log('✅ ChatBox: Setting existing conversation');
        setSelectedConversation(conversation);
      } else {
        // Create a temporary conversation object for new conversations
        const newConversationData = localStorage.getItem('newConversation');
        console.log('🔍 ChatBox: newConversationData from localStorage:', newConversationData);
        
        if (newConversationData) {
          const data = JSON.parse(newConversationData);
          console.log('✅ ChatBox: Creating temporary conversation with data:', data);
          
          const tempConversation = {
            conversationId: selectedConversationId,
            participantIds: [currentUser?.userId, data.receiverId],
            isNewConversation: true,
            receiverName: data.receiverName
          };
          
          console.log('✅ ChatBox: Setting temporary conversation:', tempConversation);
          setSelectedConversation(tempConversation);
          localStorage.removeItem('newConversation');
        } else {
          console.warn('⚠️ ChatBox: No newConversation data found in localStorage');
        }
      }
    } else {
      console.log('🔍 ChatBox: No selectedConversationId, clearing selectedConversation');
      setSelectedConversation(null);
    }
  }, [selectedConversationId, conversations, currentUser]);

  // React Query: Fetch messages for selected conversation
  const { 
    data: messagesData, 
    isLoading: isLoadingMessages,
    refetch: refetchMessages 
  } = useQuery({
    queryKey: ['messages', selectedConversation?.conversationId],
    queryFn: () => fetchConversationMessages(selectedConversation.conversationId, 0, 20), // Reduced to 20 for better performance
    enabled: !!selectedConversation?.conversationId && !selectedConversation?.isPendingChat, // Don't fetch for pending chats
  });

  // Ensure messages are in correct order (oldest at top, newest at bottom)
  const messages = React.useMemo(() => {
    // For pending chats, start with empty message list (will be populated via WebSocket)
    if (selectedConversation?.isPendingChat) {
      return [];
    }
    
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
    const client = new Client({
      webSocketFactory: () => {
        console.log('🔌 WebSocket: Creating SockJS connection to:', `${WS_URL}?token=${token ? token.substring(0, 20) + '...' : 'NO_TOKEN'}`);
        return new SockJS(`${WS_URL}?token=${token}`);
      },
      debug: (str) => console.log('🔌 WebSocket Debug:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
       console.log('🔌 WebSocket: Connected to STOMP:', frame);
      setIsConnected(true);
      stompClientRef.current = client;

       // Add a small delay to ensure STOMP client is ready
       setTimeout(() => {
         console.log('🔌 WebSocket: STOMP client ready, setting up subscriptions');
         
         // Subscribe to personal messages
      client.subscribe('/user/queue/messages', (msg) => {
           console.log('📨 WebSocket: Personal message received:', msg.body);
        try {
          const notification = JSON.parse(msg.body);
             console.log('📨 WebSocket: Parsed notification:', notification);
             // Use the ref to get the latest handleMessageNotification function
             if (handleMessageNotificationRef.current) {
               handleMessageNotificationRef.current(notification);
             }
        } catch (error) {
             console.error('❌ WebSocket: Error parsing message notification:', error);
        }
      });

      // Subscribe to conversation updates
      client.subscribe('/user/queue/conversations', (msg) => {
           console.log('📨 WebSocket: Conversation update:', msg.body);
        refetchConversations(); // Refresh conversations
      });

      // Subscribe to typing notifications
      client.subscribe('/user/queue/typing', (msg) => {
           console.log('⌨️ WebSocket: Typing notification:', msg.body);
      });

      // Subscribe to seen notifications
      client.subscribe('/user/queue/message-seen', (msg) => {
           console.log('👁 WebSocket: Seen notification:', msg.body);
      });

      // Subscribe to conversation accepted
      client.subscribe('/user/queue/conversation-accepted', (msg) => {
           console.log('✅ WebSocket: Conversation Accepted message received:', msg.body);
           try {
             const data = JSON.parse(msg.body);
             console.log('✅ WebSocket: Parsed conversation accepted data:', data);
             console.log('✅ WebSocket: Current selectedConversation:', selectedConversation);
             console.log('✅ WebSocket: Comparing conversationId:', data.conversationId, 'with:', selectedConversation?.conversationId);
             
             // Show approval popup for the receiver
             if (data.conversationId === selectedConversation?.conversationId) {
               console.log('✅ WebSocket: Conversation IDs match, showing approval popup');
               setPendingMessage({
                 conversationId: data.conversationId,
                 acceptedBy: data.acceptedBy
               });
               setShowApprovalPopup(true);
             } else {
               console.log('⚠️ WebSocket: Conversation IDs do not match, not showing popup');
             }
           } catch (error) {
             console.error('❌ WebSocket: Error parsing conversation accepted:', error);
           }
         });

         // Subscribe to conversation status updates (for sender to know when accepted)
         client.subscribe('/user/queue/conversation-status', (msg) => {
           console.log('🔄 WebSocket: Conversation status update received:', msg.body);
           try {
             const data = JSON.parse(msg.body);
             console.log('🔄 WebSocket: Parsed conversation status data:', data);
             
             // If this conversation was accepted, update the UI
             if (data.conversationId === selectedConversation?.conversationId && data.status === 'ACCEPTED') {
               console.log('✅ WebSocket: Conversation accepted, updating UI');
               
               // Update the conversation to remove isNewConversation flag
               setSelectedConversation(prev => ({
                 ...prev,
                 isNewConversation: false
               }));
               
               // Show success message
               alert('Your introductory message was accepted! You can now continue chatting.');
               
               // Refresh conversations to get updated status
               refetchConversations();
             }
           } catch (error) {
             console.error('❌ WebSocket: Error parsing conversation status:', error);
           }
      });

      // Subscribe to ACK
      client.subscribe('/user/queue/ack', (msg) => {
           console.log('✅ WebSocket: Success ACK:', msg.body);
      });

      // Subscribe to errors
      client.subscribe('/user/queue/errors', (msg) => {
           console.log('❌ WebSocket: Error ACK:', msg.body);
      });

      // Subscribe to test messages
      client.subscribe('/user/queue/test', (msg) => {
           console.log('✅ WebSocket: Test message:', msg.body);
      });

         console.log('🔌 WebSocket: All subscriptions set up successfully');
       }, 100); // Small delay to ensure STOMP is ready
    };

    client.onStompError = (frame) => {
      console.error('❌ WebSocket STOMP error:', frame);
      console.error('❌ Error details:', frame.headers, frame.body);
      setIsConnected(false);
    };

    client.onWebSocketError = (error) => {
      console.error('❌ WebSocket error:', error);
      setIsConnected(false);
    };

    client.onWebSocketClose = (event) => {
      console.log('🔌 WebSocket: Connection closed:', event);
      setIsConnected(false);
    };

    client.onDisconnect = (frame) => {
      console.log('🔌 WebSocket: Disconnected:', frame);
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

        let receiverId, conversationId;
    
    // Handle pending chat - just send message like chatTest.html (no conversationId needed for first message)
    if (selectedConversation.isPendingChat) {
      console.log('💬 ChatBox: Sending first message to new user (like chatTest.html)');
      receiverId = selectedConversation.participantIds[1]; // The other user's ID
      conversationId = null; // Don't include conversationId for first message, backend will create it
    } else {
      // Existing conversation
      receiverId = getOtherParticipant(selectedConversation);
      conversationId = selectedConversation.conversationId;
      
    if (!receiverId) {
      console.error('❌ No valid receiver found');
      alert('No valid receiver found. Please check conversation data.');
      return;
      }
    }

    // Create payload like in chatTest.html
    const payload = {
      receiverId,
      content: message.trim()
    };
    
    // Only add conversationId if it exists (for existing conversations)
    if (conversationId) {
      payload.conversationId = conversationId;
    }
    
    console.log('📤 ChatBox: Sending message payload (like chatTest.html):', payload);
    console.log('📤 ChatBox: selectedConversation:', selectedConversation);
    
    await sendMessageViaWebSocket(payload);
  };

  // Helper function to send message via WebSocket
  const sendMessageViaWebSocket = async (payload) => {
    
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
          {allConversations.map((conv) => (
            <div
              key={conv.conversationId}
              onClick={() => {
                console.log('💬 ChatBox: Conversation clicked:', conv);
                if (conv.isPendingChat) {
                  // Remove from localStorage and create fresh conversation
                  localStorage.removeItem('pendingChatUser');
                  console.log('💬 ChatBox: Starting new conversation with:', conv.receiverName);
                }
                setSelectedConversation(conv);
              }}
              style={{
                padding: '15px 20px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                background: selectedConversation?.conversationId === conv.conversationId ? '#e3f2fd' : 'transparent',
                transition: 'background 0.2s',
                // Highlight pending conversations
                borderLeft: conv.isPendingChat ? '4px solid #ff9800' : 'none'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                {conv.isPendingChat ? (
                  <>
                    <span>💬 {conv.receiverName}</span>
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '10px', 
                      background: '#ff9800', 
                      color: 'white', 
                      padding: '2px 6px', 
                      borderRadius: '10px' 
                    }}>
                      New
                    </span>
                  </>
                ) : (
                  getOtherParticipant(conv) ? `User ${getOtherParticipant(conv).slice(0, 8)}...` : 'Unknown User'
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {conv.isPendingChat ? 'Click to start chatting...' : (conv.lastMessageContent || 'No messages yet')}
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
                    {selectedConversation.isNewConversation && (
                      <span style={{
                        background: '#ff9800',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        marginLeft: '8px'
                      }}>
                        New Conversation
                      </span>
                    )}
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
              gap: '10px',
              flexDirection: 'column'
            }}>
              {/* New Conversation Notice */}
              {selectedConversation.isNewConversation && messages.length === 0 && (
                <div style={{
                  background: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '10px',
                  fontSize: '12px',
                  color: '#856404'
                }}>
                  💬 <strong>New Conversation:</strong> You can send one introductory message. The receiver will need to approve it to continue chatting.
                </div>
              )}
              
              {/* Message Limit Notice */}
              {selectedConversation.isNewConversation && messages.length > 0 && (
                <div style={{
                  background: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '10px',
                  fontSize: '12px',
                  color: '#721c24'
                }}>
                  ⏳ <strong>Waiting for approval:</strong> Your introductory message has been sent. Please wait for the receiver to accept your request.
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    selectedConversation.isNewConversation && messages.length > 0 
                      ? "Waiting for approval..." 
                      : "Type a message..."
                  }
                  disabled={selectedConversation.isNewConversation && messages.length > 0}
                style={{
                  flex: 1,
                  padding: '10px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                    outline: 'none',
                    opacity: selectedConversation.isNewConversation && messages.length > 0 ? 0.6 : 1
                }}
              />
              <button
                type="submit"
                  disabled={selectedConversation.isNewConversation && messages.length > 0}
                style={{
                  padding: '10px 20px',
                    background: selectedConversation.isNewConversation && messages.length > 0 ? '#ccc' : '#2196f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                    cursor: selectedConversation.isNewConversation && messages.length > 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedConversation.isNewConversation && messages.length > 0 ? 0.6 : 1
                }}
              >
                  {selectedConversation.isNewConversation && messages.length > 0 ? 'Waiting...' : 'Send'}
              </button>
              </div>
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

        {/* Debug button for testing */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}>
            <button
              onClick={() => {
                console.log('🧪 Debug: Testing conversation creation flow');
                console.log('🧪 Debug: selectedConversationId:', selectedConversationId);
                console.log('🧪 Debug: selectedConversation:', selectedConversation);
                console.log('🧪 Debug: currentUser:', currentUser);
                console.log('🧪 Debug: localStorage newConversation:', localStorage.getItem('newConversation'));
              }}
              style={{
                padding: '8px 12px',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Debug State
            </button>
            <button
              onClick={() => {
                console.log('🧪 Debug: Testing WebSocket connection');
                console.log('🧪 Debug: isConnected:', isConnected);
                console.log('🧪 Debug: stompClientRef.current:', stompClientRef.current);
                if (stompClientRef.current && stompClientRef.current.connected) {
                  console.log('✅ WebSocket is connected');
                  // Send a test message
                  stompClientRef.current.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify({
                      receiverId: 'test-receiver',
                      content: 'Test message from debug',
                      conversationId: 'test-conversation'
                    })
                  });
                  console.log('✅ Test message sent via WebSocket');
                } else {
                  console.log('❌ WebSocket is not connected');
                }
              }}
              style={{
                padding: '8px 12px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Test WebSocket
            </button>
            <button
              onClick={() => {
                console.log('🧪 Debug: Testing conversation creation flow');
                // Simulate the conversation creation flow
                const testConversationData = {
                  conversationId: 'test-conversation-' + Date.now(),
                  receiverId: 'test-receiver-id',
                  receiverName: 'Test User'
                };
                
                console.log('🧪 Debug: Storing test conversation data:', testConversationData);
                localStorage.setItem('newConversation', JSON.stringify(testConversationData));
                
                // Dispatch the event
                window.dispatchEvent(new CustomEvent('switchToChat', {
                  detail: { conversationId: testConversationData.conversationId }
                }));
                
                console.log('🧪 Debug: Test conversation creation event dispatched');
              }}
              style={{
                padding: '8px 12px',
                background: '#9c27b0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Test Conversation
            </button>
            <button
              onClick={() => {
                console.log('🔑 Debug: Setting fresh authentication token');
                
                // Set a fresh test token
                const testToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMSIsInVzZXJJZCI6Ijc0ODA0N2JjLWNhODctNDllZC1hMWMxLWY2YTg5OTg2NTMzMyIsImlhdCI6MTc1MDY5MzAyMSwiZXhwIjoxNzUwNzc5NDIxfQ.baa0qQWmD1XAzQhLbb-ziRqUlWinvzp0tyoQ_03fo4U';
                localStorage.setItem('accessToken', testToken);
                
                console.log('✅ Test token set in localStorage');
                console.log('🔑 Token:', testToken);
                
                // Reload the page to reinitialize with the new token
                window.location.reload();
              }}
              style={{
                padding: '8px 12px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Set Auth Token
            </button>
            <button
              onClick={() => {
                console.log('🔌 Debug: Manually reconnecting WebSocket');
                if (stompClientRef.current) {
                  stompClientRef.current.deactivate();
                }
                setIsConnected(false);
                
                // Trigger re-connection
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }}
              style={{
                padding: '8px 12px',
                background: isConnected ? '#4caf50' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {isConnected ? 'Connected ✅' : 'Reconnect ❌'}
            </button>
          </div>
        )}

        {/* Approval Popup for Introductory Messages */}
        {showApprovalPopup && pendingMessage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>
                New Message Request
              </h3>
              <p style={{ 
                marginBottom: '25px', 
                color: '#666',
                lineHeight: '1.5'
              }}>
                Someone wants to start a conversation with you. 
                You can approve to continue chatting or decline to ignore.
              </p>
              
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={handleDeclineMessage}
                  style={{
                    padding: '12px 24px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Decline
                </button>
                <button
                  onClick={handleApproveMessage}
                  style={{
                    padding: '12px 24px',
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 