'use client';
import React, { useState, useEffect } from 'react';
import { fetchAllUsers, createConversation } from '../utils/apiService';

// Mock data for friends - you can replace this with real API calls
const mockFriends = [
  {
    id: 1,
    name: 'Jhon Kates',
    profession: 'Ftv Model',
    avatar: '/images/resources/friend-avatar9.jpg',
    isFriend: true
  },
  {
    id: 2,
    name: 'Sophia Gate',
    profession: 'Tv Actresses',
    avatar: '/images/resources/nearly1.jpg',
    isFriend: true
  },
  {
    id: 3,
    name: 'Sara Grey',
    profession: 'Work at IBM',
    avatar: '/images/resources/nearly2.jpg',
    isFriend: true
  },
  {
    id: 4,
    name: 'Sexy Cat',
    profession: 'Student',
    avatar: '/images/resources/nearly3.jpg',
    isFriend: true
  },
  {
    id: 5,
    name: 'Sara Grey',
    profession: 'Ftv Model',
    avatar: '/images/resources/nearly4.jpg',
    isFriend: true
  },
  {
    id: 6,
    name: 'Amy Watson',
    profession: 'Study in university',
    avatar: '/images/resources/nearly5.jpg',
    isFriend: true
  },
  {
    id: 7,
    name: 'Caty Lasbo',
    profession: 'Work as dancers',
    avatar: '/images/resources/nearly6.jpg',
    isFriend: true
  },
  {
    id: 8,
    name: 'Ema Watson',
    profession: 'Personal business',
    avatar: '/images/resources/nearly2.jpg',
    isFriend: true
  }
];

const mockFriendRequests = [
  {
    id: 1,
    name: 'Amy Watson',
    profession: 'Ftv Model',
    avatar: '/images/resources/nearly5.jpg',
    isFriend: false
  },
  {
    id: 2,
    name: 'Sophia Gate',
    profession: 'Ftv Model',
    avatar: '/images/resources/nearly1.jpg',
    isFriend: false
  },
  {
    id: 3,
    name: 'Caty Lasbo',
    profession: 'Ftv Model',
    avatar: '/images/resources/nearly6.jpg',
    isFriend: false
  },
  {
    id: 4,
    name: 'Jhon Kates',
    profession: 'Ftv Model',
    avatar: '/images/resources/friend-avatar9.jpg',
    isFriend: false
  },
  {
    id: 5,
    name: 'Sara Grey',
    profession: 'Ftv Model',
    avatar: '/images/resources/nearly2.jpg',
    isFriend: false
  },
  {
    id: 6,
    name: 'Sara Grey',
    profession: 'Ftv Model',
    avatar: '/images/resources/nearly4.jpg',
    isFriend: false
  },
  {
    id: 7,
    name: 'Sexy Cat',
    profession: 'Ftv Model',
    avatar: '/images/resources/nearly3.jpg',
    isFriend: false
  },
  {
    id: 8,
    name: 'Jhon Kates',
    profession: 'Ftv Model',
    avatar: '/images/resources/friend-avatar9.jpg',
    isFriend: false
  }
];

const mockFollowers = [
  {
    id: 1,
    name: 'Kelly Bill',
    avatar: '/images/resources/friend-avatar2.jpg'
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

const mockSuggestions = [
  {
    id: 1,
    name: 'Emma Wilson',
    profession: 'Software Engineer',
    avatar: '/images/resources/friend-avatar7.jpg',
    mutualFriends: 3
  },
  {
    id: 2,
    name: 'Michael Brown',
    profession: 'Graphic Designer',
    avatar: '/images/resources/friend-avatar5.jpg',
    mutualFriends: 5
  },
  {
    id: 3,
    name: 'Lisa Anderson',
    profession: 'Marketing Manager',
    avatar: '/images/resources/friend-avatar1.jpg',
    mutualFriends: 2
  },
  {
    id: 4,
    name: 'David Clark',
    profession: 'Photographer',
    avatar: '/images/resources/friend-avatar9.jpg',
    mutualFriends: 4
  },
  {
    id: 5,
    name: 'Sarah Johnson',
    profession: 'Teacher',
    avatar: '/images/resources/friend-avatar2.jpg',
    mutualFriends: 1
  },
  {
    id: 6,
    name: 'Robert Taylor',
    profession: 'Chef',
    avatar: '/images/resources/friend-avatar3.jpg',
    mutualFriends: 3
  }
];

export default function Friends() {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState(mockFriends);
  const [friendRequests, setFriendRequests] = useState(mockFriendRequests);
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const [followers] = useState(mockFollowers);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all users from API
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

  const handleConfirmRequest = (requestId) => {
    const request = friendRequests.find(req => req.id === requestId);
    if (request) {
      setFriends([...friends, { ...request, isFriend: true }]);
      setFriendRequests(friendRequests.filter(req => req.id !== requestId));
    }
  };

  const handleAddSuggestion = (suggestionId) => {
    const suggestion = suggestions.find(sug => sug.id === suggestionId);
    if (suggestion) {
      setFriends([...friends, { ...suggestion, isFriend: true }]);
      setSuggestions(suggestions.filter(sug => sug.id !== suggestionId));
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
                  handleDeleteRequest(friend.id);
                }}
              >
                Delete Request
              </a>
              <a 
                href="#" 
                title="" 
                className="add-butn" 
                data-ripple=""
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirmRequest(friend.id);
                }}
              >
                Confirm
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
            <ul className="nearby-contct">
              {friends.map(friend => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </ul>
            <div className="lodmore">
              <button className="btn-view btn-load-more">Load More</button>
            </div>
          </div>
          
          <div className={`tab-pane ${activeTab === 'requests' ? 'active fade show' : 'fade'}`} id="requests">
            <ul className="nearby-contct">
              {friendRequests.map(request => (
                <FriendCard key={request.id} friend={request} isRequest={true} />
              ))}
            </ul>
            <div className="lodmore">
              <button className="btn-view btn-load-more">Load More</button>
            </div>
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