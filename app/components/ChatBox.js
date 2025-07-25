import React, { useState, useEffect } from 'react';
import { fetchUserConversations, fetchConversationMessages, fetchFollowers, fetchConnectedUsers, getUserIdFromToken } from '../utils/apiService';
import { jwtDecode } from 'jwt-decode';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export default function ChatBox() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [message, setMessage] = useState('');
  const chatEndRef = React.useRef(null);
  const stompClient = React.useRef(null);
  const [typingStatus, setTypingStatus] = useState(false);
  const typingTimeoutRef = React.useRef(null);

  // Get current user from JWT
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
      } catch (e) {
        setCurrentUser(null);
      }
    }
  }, []);

  // Fetch conversations
  useEffect(() => {
    if (!currentUser) return;
    setLoadingConversations(true);
    fetchUserConversations().then(data => {
      setConversations(data || []);
      setLoadingConversations(false);
    });
  }, [currentUser]);

  // Fetch online users
  useEffect(() => {
    fetchConnectedUsers().then(setOnlineUsers);
  }, []);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;
    setLoadingMessages(true);
    fetchConversationMessages(selectedConversation.conversationId).then(data => {
      setMessages(data?.messages || []);
      setLoadingMessages(false);
    });
  }, [selectedConversation]);

  // WebSocket connect/disconnect logic
  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    if (stompClient.current) {
      stompClient.current.deactivate();
      stompClient.current = null;
    }
    const client = new Client({
      webSocketFactory: () => new SockJS(`http://host.docker.internal:8080/ws?token=${token}`),
      onConnect: () => {
        client.subscribe('/user/queue/messages', (msg) => {
          const body = JSON.parse(msg.body);
          if (selectedConversation && body.conversationId === selectedConversation.conversationId) {
            setMessages((prev) => [...prev, body]);
          }
        });
        client.subscribe('/user/queue/typing', (msg) => {
          const body = JSON.parse(msg.body);
          if (selectedConversation && body.conversationId === selectedConversation.conversationId) {
            setTypingStatus(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setTypingStatus(false), 2000);
          }
        });
      },
      onStompError: () => {},
      debug: () => {},
    });
    stompClient.current = client;
    client.activate();
    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
        stompClient.current = null;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [currentUser, selectedConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Helper: get the other participant (not current user)
  function getOtherParticipant(conv) {
    if (!currentUser) return null;
    // Use participantIds from API response
    const ids = conv.participantIds || conv.participants || [];
    // Try both userId and uuid for compatibility
    return ids.find(id => id !== currentUser.userId && id !== currentUser.uuid);
  }

  // Send message via WebSocket
  function handleSendMessage(e) {
    e.preventDefault();
    if (!message.trim() || !selectedConversation || !stompClient.current || !stompClient.current.active) return;
    const receiverId = getOtherParticipant(selectedConversation);
    const payload = {
      receiverId,
      content: message,
      conversationId: selectedConversation.conversationId,
    };
    stompClient.current.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
    setMessages((prev) => [...prev, { senderId: currentUser.userId, content: message }]);
    setMessage('');
  }

  // Send typing event
  function handleTyping() {
    if (!selectedConversation || !stompClient.current || !stompClient.current.active) return;
    const receiverId = getOtherParticipant(selectedConversation);
    const payload = {
      receiverId,
      conversationId: selectedConversation.conversationId,
      type: 'TYPING_START',
    };
    stompClient.current.publish({ destination: '/app/chat.typing', body: JSON.stringify(payload) });
  }

  if (!currentUser) return <div>Loading chat...</div>;

  return (
    <div style={{ display: 'flex', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', minHeight: 500, marginTop: 32 }}>
      {/* Sidebar: Conversations */}
      <div style={{ width: 260, borderRight: '1px solid #eee', background: '#fafbfc' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #eee', fontWeight: 600 }}>All Messages</div>
        {loadingConversations ? (
          <div style={{ padding: 16 }}>Loading...</div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: 16 }}>No conversations found.</div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {conversations.map(conv => {
              const otherId = getOtherParticipant(conv);
              if (!otherId) return null;
              const isOnline = onlineUsers.includes(otherId);
              return (
                <li key={conv.conversationId}
                  onClick={() => setSelectedConversation(conv)}
                  style={{ display: 'flex', alignItems: 'center', padding: 12, cursor: 'pointer', background: selectedConversation && selectedConversation.conversationId === conv.conversationId ? '#f0f8ff' : 'transparent' }}>
                  <img src={'/images/resources/friend-avatar3.jpg'} alt={otherId} style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 12 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{otherId}</div>
                    {conv.lastMessage && <div style={{ fontSize: 12, color: '#888', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.lastMessage}</div>}
                    {conv.unread > 0 && <span style={{ fontSize: 11, color: '#fff', background: '#2196f3', borderRadius: 8, padding: '2px 8px', marginLeft: 4 }}>{conv.unread}</span>}
                    {isOnline && <span style={{ fontSize: 11, color: '#4caf50', marginLeft: 4 }}>Online</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* Chat Window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {selectedConversation ? (
          <>
            <div style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', position: 'relative' }}>
              <img src={'/images/resources/friend-avatar3.jpg'} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 12 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{getOtherParticipant(selectedConversation)}</div>
                {typingStatus && (
                  <div style={{ fontSize: 13, color: '#4caf50', marginTop: 2 }}>
                    Typing...
                  </div>
                )}
                {onlineUsers.includes(getOtherParticipant(selectedConversation)) && <span style={{ fontSize: 12, color: '#4caf50', marginLeft: 8 }}>Online</span>}
              </div>
            </div>
            {/* Chat messages area with fixed height and scroll */}
            <div style={{ flex: 1, minHeight: 0, maxHeight: 400, height: '60vh', overflowY: 'auto', background: '#f7f7f7', position: 'relative', padding: 16 }}>
              {loadingMessages ? (
                <div>Loading messages...</div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, minHeight: 300 }}>
                  {messages.map((msg, idx) => (
                    <li key={msg.id || idx} style={{ display: 'flex', justifyContent: msg.senderId === currentUser.userId ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                      {msg.senderId !== currentUser.userId && <img src={'/images/resources/friend-avatar3.jpg'} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 8 }} />}
                      <div style={{ background: msg.senderId === currentUser.userId ? '#e0f7fa' : '#e8f5e9', color: '#333', padding: '8px 14px', borderRadius: 16, maxWidth: 320, fontSize: 15 }}>
                        {msg.content}
                      </div>
                      {msg.senderId === currentUser.userId && <img src={'/images/resources/user-avatar.jpg'} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', marginLeft: 8 }} />}
                    </li>
                  ))}
                  <div ref={chatEndRef} />
                </ul>
              )}
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid #eee', padding: 12, background: '#fff', position: 'relative', zIndex: 20 }}>
              <input type="text" value={message} onChange={e => setMessage(e.target.value)} onInput={handleTyping} placeholder="Type a message..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, background: 'transparent' }} />
              <button type="submit" style={{ background: 'none', border: 'none', marginLeft: 8, color: '#2196f3', fontSize: 22, cursor: 'pointer' }}>
                <i className="fa fa-paper-plane"></i>
              </button>
            </form>
          </>
        ) : (
          <div style={{ padding: 32, color: '#888', textAlign: 'center' }}>Select a conversation to start chatting.</div>
        )}
      </div>
    </div>
  );
} 