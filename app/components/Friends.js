'use client';
import React, { useState, useEffect } from 'react';
import { 
  fetchAllUsers, 
  createConversation, 
  sendFriendRequest, 
  respondToFollowRequest, 
  getPendingFollowRequests,
  getSentFollowRequests,
  getAllFriends
} from '../utils/apiService';

// Mock data for followers - you can replace this with real API calls
const mockFollowers = [
  {
    id: 1,
    name: 'Kelly Bill',
    avatar: '/images/resources/friend-avatar9.jpg'
  },
  {
    id: 2,
    name: 'Issabel',
    avatar: '/images/resources/friend-avatar4.jpg'
  },
  {
    id: 3,
    name: 'Andrew',
    avatar: '/images/resources/friend-avatar6.jpg'
  },
  {
    id: 4,
    name: 'Sophia',
    avatar: '/images/resources/friend-avatar8.jpg'
  },
  {
    id: 5,
    name: 'Allen',
    avatar: '/images/resources/friend-avatar3.jpg'
  }
];

export default function Friends() {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [followers] = useState(mockFollowers);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // Fetch all friends from API
  useEffect(() => {
    const loadFriends = async () => {
      setFriendsLoading(true);
      try {
        console.log('👥 Friends: Starting to fetch all friends');
        const response = await getAllFriends();
        console.log('👥 Friends: getAllFriends response:', response);
        
        if (response.success && response.data) {
          console.log('👥 Friends: Raw friends data:', response.data);
          
          const transformedFriends = response.data.map(friend => ({
            id: friend.userId,
            name: friend.userName || 'Unknown User',
            profession: 'Friend',
            avatar: friend.imageId ? `/api/v1/images/view/${friend.imageId}` : '/images/resources/friend-avatar9.jpg',
            isFriend: true
          }));
          
          console.log('👥 Friends: Transformed friends:', transformedFriends);
          setFriends(transformedFriends);
        } else {
          console.error('❌ Friends: Failed to fetch friends:', response);
          setFriends([]);
        }
      } catch (error) {
        console.error('❌ Friends: Error fetching friends:', error);
        setFriends([]);
      } finally {
        setFriendsLoading(false);
      }
    };
    loadFriends();
  }, []);

  // Fetch all users from API for suggestions
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        console.log('👥 Friends: Starting to fetch all users');
        const response = await fetchAllUsers();
        console.log('👥 Friends: fetchAllUsers response:', response);
        
        if (response.success && response.data) {
          console.log('👥 Friends: Raw user data:', response.data);
          
          const transformedUsers = response.data.map(user => ({
            id: user.userId,
            name: user.userName || 'Unknown User',
            profession: 'User',
            avatar: '/images/resources/friend-avatar9.jpg',
            mutualFriends: Math.floor(Math.random() * 5) + 1,
            isFriend: false
          }));
          
          console.log('👥 Friends: Transformed users:', transformedUsers);
          
          setAllUsers(transformedUsers);
          setSuggestions(transformedUsers.slice(0, 6));
          
          console.log('👥 Friends: Set suggestions (first 6):', transformedUsers.slice(0, 6));
        } else {
          console.error('❌ Friends: Failed to fetch users:', response);
        }
      } catch (error) {
        console.error('❌ Friends: Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Fetch pending follow requests
  useEffect(() => {
    const loadFriendRequests = async () => {
      setRequestsLoading(true);
      try {
        console.log('👥 Friends: Starting to fetch pending follow requests');
        const response = await getPendingFollowRequests();
        console.log('👥 Friends: Pending follow requests response:', response);
        
        if (response.success && response.data) {
          const transformedRequests = response.data.map(request => ({
            id: request.requesterId, // Use requesterId as the main ID
            name: request.fullName || 'Unknown User', // Use fullName from API response
            profession: 'User',
            avatar: '/images/resources/friend-avatar9.jpg',
            isFriend: false,
            requestId: request.id, // Store the actual request ID for accept/reject
            requesterId: request.requesterId,
            requestedAt: request.requestedAt
          }));
          
          console.log('👥 Friends: Transformed friend requests:', transformedRequests);
          setFriendRequests(transformedRequests);
        } else {
          console.error('❌ Friends: Failed to fetch friend requests:', response);
          setFriendRequests([]);
        }
      } catch (error) {
        console.error('❌ Friends: Error fetching friend requests:', error);
        // If API fails, use empty array
        setFriendRequests([]);
      } finally {
        setRequestsLoading(false);
      }
    };
    loadFriendRequests();
  }, []);

  const handleUnfriend = (friendId) => {
    setFriends(friends.filter(friend => friend.id !== friendId));
  };

  const handleAddFriend = (friendId) => {
    // Add friend logic
    console.log('Adding friend:', friendId);
  };

  const handleDeleteRequest = (requestId) => {
    setFriendRequests(friendRequests.filter(request => request.id !== requestId));
  };

  const handleConfirmRequest = async (requestId) => {
    try {
      console.log('✅ Friends: Accepting follow request:', requestId);
      const response = await respondToFollowRequest(requestId, 'ACCEPT');
      
      if (response.success) {
        console.log('✅ Friends: Follow request accepted successfully');
        
        // Find the request and add to friends
        const request = friendRequests.find(req => req.requestId === requestId);
        if (request) {
          setFriends([...friends, { ...request, isFriend: true }]);
          setFriendRequests(friendRequests.filter(req => req.requestId !== requestId));
        }
      } else {
        console.error('❌ Friends: Failed to accept follow request:', response);
        alert('Failed to accept request. Please try again.');
      }
    } catch (error) {
      console.error('❌ Friends: Error accepting follow request:', error);
      alert('Error accepting request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      console.log('❌ Friends: Rejecting follow request:', requestId);
      const response = await respondToFollowRequest(requestId, 'REJECT');
      
      if (response.success) {
        console.log('✅ Friends: Follow request rejected successfully');
        setFriendRequests(friendRequests.filter(req => req.requestId !== requestId));
      } else {
        console.error('❌ Friends: Failed to reject follow request:', response);
        alert('Failed to reject request. Please try again.');
      }
    } catch (error) {
      console.error('❌ Friends: Error rejecting follow request:', error);
      alert('Error rejecting request. Please try again.');
    }
  };

  const handleAddSuggestion = async (suggestionId) => {
    try {
      console.log('👥 Friends: Sending follow request to user:', suggestionId);
      const response = await sendFriendRequest(suggestionId);
      
      if (response.success) {
        console.log('✅ Friends: Follow request sent successfully');
        
        // Remove from suggestions
        setSuggestions(suggestions.filter(sug => sug.id !== suggestionId));
        
        // Show success message
        alert('Friend request sent successfully!');
      } else {
        console.error('❌ Friends: Failed to send follow request:', response);
        alert('Failed to send request. Please try again.');
      }
    } catch (error) {
      console.error('❌ Friends: Error sending follow request:', error);
        alert('Error sending request. Please try again.');
    }
  };

  const handleRemoveSuggestion = (suggestionId) => {
    setSuggestions(suggestions.filter(sug => sug.id !== suggestionId));
  };

  const handleSendMessage = (suggestionId) => {
    console.log('💬 Friends: Send Message clicked for user:', suggestionId);
    
    // Find the user data
    const selectedUser = suggestions.find(s => s.id === suggestionId);
    console.log('💬 Friends: Selected user data:', selectedUser);
    
    if (!selectedUser) {
      console.error('❌ Friends: User not found in suggestions');
      alert('User not found. Please try again.');
      return;
    }
    
    // Store user data for the chat
    const pendingChatUser = {
      userId: suggestionId,
      userName: selectedUser.name,
      isPendingChat: true // Flag to indicate this is a new conversation
    };
    
    console.log('💬 Friends: Storing pending chat user:', pendingChatUser);
    localStorage.setItem('pendingChatUser', JSON.stringify(pendingChatUser));
    
    // Notify ChatBox about new pending chat user
    window.dispatchEvent(new CustomEvent('newPendingChat'));
    
    // Switch to chat tab
    console.log('💬 Friends: Switching to chat tab');
    window.dispatchEvent(new CustomEvent('switchToChat', {
      detail: { 
        userId: suggestionId,
        userName: selectedUser.name,
        type: 'newChat'
      }
    }));
    
    // Show success message
    alert(`Redirecting to chat with ${selectedUser.name}. Click on them in the conversation list to start chatting!`);
  };

  const FriendCard = ({ friend, isRequest = false }) => (
    <li>
      <div className="nearly-pepls">
        <figure>
          <a href={`/timeline/${friend.id}`} title="">
            <img src={friend.avatar} alt={friend.name} />
          </a>
        </figure>
        <div className="pepl-info">
          <h4>
            <a href={`/timeline/${friend.id}`} title="">{friend.name}</a>
          </h4>
          <span>{friend.profession}</span>
          {isRequest ? (
            <>
              <a 
                href="#" 
                title="" 
                className="add-butn more-action" 
                data-ripple=""
                onClick={(e) => {
                  e.preventDefault();
                  handleRejectRequest(friend.requestId);
                }}
              >
                Reject
              </a>
              <a 
                href="#" 
                title="" 
                className="add-butn" 
                data-ripple=""
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirmRequest(friend.requestId);
                }}
              >
                Accept
              </a>
            </>
          ) : (
            <>
              <a 
                href="#" 
                title="" 
                className="add-butn more-action" 
                data-ripple=""
                onClick={(e) => {
                  e.preventDefault();
                  handleUnfriend(friend.id);
                }}
              >
                Unfriend
              </a>
              <a 
                href="#" 
                title="" 
                className="add-butn" 
                data-ripple=""
                onClick={(e) => {
                  e.preventDefault();
                  handleAddFriend(friend.id);
                }}
              >
                Add Friend
              </a>
            </>
          )}
        </div>
      </div>
    </li>
  );

  const FollowerCard = ({ follower }) => (
    <li>
      <figure>
        <img src={follower.avatar} alt={follower.name} />
      </figure>
      <div className="friend-meta">
        <h4>
          <a href={`/timeline/${follower.id}`} title="">{follower.name}</a>
        </h4>
        <a href="#" title="" className="underline">Add Friend</a>
      </div>
    </li>
  );

  const SuggestionCard = ({ suggestion }) => (
    <li>
      <div className="nearly-pepls">
        <figure>
          <a href={`/timeline/${suggestion.id}`} title="">
            <img src={suggestion.avatar} alt={suggestion.name} />
          </a>
        </figure>
        <div className="pepl-info">
          <h4>
            <a href={`/timeline/${suggestion.id}`} title="">{suggestion.name}</a>
          </h4>
          <span>{suggestion.profession}</span>
          <small style={{ color: '#666', fontSize: '12px' }}>
            {suggestion.mutualFriends} mutual friends
          </small>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <a 
              href="#" 
              title="" 
              className="add-butn more-action" 
              data-ripple=""
              onClick={(e) => {
                e.preventDefault();
                console.log('👆 Friends: Send Message clicked for suggestion:', suggestion);
                console.log('👆 Friends: Suggestion ID:', suggestion.id);
                console.log('👆 Friends: Suggestion name:', suggestion.name);
                handleSendMessage(suggestion.id);
              }}
            >
              Send Message
            </a>
            <a 
              href="#" 
              title="" 
              className="add-butn" 
              data-ripple=""
              onClick={(e) => {
                e.preventDefault();
                handleAddSuggestion(suggestion.id);
              }}
            >
              Add Friend
            </a>
          </div>
        </div>
      </div>
    </li>
  );

  return (
    <div className="central-meta">
      <div className="frnds">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <a 
              className={activeTab === 'friends' ? 'active' : ''} 
              href="#friends" 
              data-toggle="tab"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('friends');
              }}
            >
              My Friends
            </a> 
            <span>{friends.length}</span>
          </li>
          <li className="nav-item">
            <a 
              className={activeTab === 'requests' ? 'active' : ''} 
              href="#requests" 
              data-toggle="tab"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('requests');
              }}
            >
              Friend Requests
            </a>
            <span>{friendRequests.length}</span>
          </li>
          <li className="nav-item">
            <a 
              className={activeTab === 'suggestions' ? 'active' : ''} 
              href="#suggestions" 
              data-toggle="tab"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('suggestions');
              }}
            >
              Suggestions
            </a>
            <span>{suggestions.length}</span>
          </li>
        </ul>

        {/* Tab panes */}
        <div className="tab-content">
          <div className={`tab-pane ${activeTab === 'friends' ? 'active fade show' : 'fade'}`} id="friends">
            {friendsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ 
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '10px', color: '#666' }}>Loading friends...</p>
              </div>
            ) : friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No friends yet</p>
              </div>
            ) : (
              <>
                <ul className="nearby-contct">
                  {friends.map(friend => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))}
                </ul>
                <div className="lodmore">
                  <button className="btn-view btn-load-more">Load More</button>
                </div>
              </>
            )}
          </div>
          
          <div className={`tab-pane ${activeTab === 'requests' ? 'active fade show' : 'fade'}`} id="requests">
            {requestsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ 
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '10px', color: '#666' }}>Loading friend requests...</p>
              </div>
            ) : friendRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No pending friend requests</p>
              </div>
            ) : (
              <>
                <ul className="nearby-contct">
                  {friendRequests.map(request => (
                    <FriendCard key={request.id} friend={request} isRequest={true} />
                  ))}
                </ul>
                <div className="lodmore">
                  <button className="btn-view btn-load-more">Load More</button>
                </div>
              </>
            )}
          </div>
          
          <div className={`tab-pane ${activeTab === 'suggestions' ? 'active fade show' : 'fade'}`} id="suggestions">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ 
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '10px', color: '#666' }}>Loading suggestions...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No suggestions available</p>
              </div>
            ) : (
              <>
                <ul className="nearby-contct">
                  {suggestions.map(suggestion => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </ul>
                <div className="lodmore">
                  <button className="btn-view btn-load-more">Load More</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sidebar Friends Widget Component
export function FriendsSidebar() {
  return (
    <div className="widget">
      <h4 className="widget-title">Who's following</h4>
      <ul className="followers">
        {mockFollowers.map(follower => (
          <li key={follower.id}>
            <figure>
              <img src={follower.avatar} alt={follower.name} />
            </figure>
            <div className="friend-meta">
              <h4>
                <a href={`/timeline/${follower.id}`} title="">{follower.name}</a>
              </h4>
              <a href="#" title="" className="underline">Add Friend</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Add CSS animation for spinner
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject the CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinnerStyle;
  document.head.appendChild(style);
}