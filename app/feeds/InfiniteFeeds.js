import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { fetchFeeds } from '../utils/apiService';

export default function InfiniteFeeds() {
  const [feeds, setFeeds] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all feeds at once
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['all-feeds'],
    queryFn: async () => {
      // Fetch multiple pages to get all feeds
      let allFeeds = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        try {
          const response = await fetchFeeds({ pageParam: page, limit: 20 });
          if (response?.data && response.data.length > 0) {
            allFeeds = [...allFeeds, ...response.data];
            page++;
            // Stop if we get less than 20 items (last page)
            if (response.data.length < 20) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        } catch (error) {
          console.error('Error fetching page:', page, error);
          hasMore = false;
        }
      }
      
      return allFeeds;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Update feeds when data changes
  useEffect(() => {
    if (data) {
      setFeeds(data);
    }
  }, [data]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      refetch().finally(() => setIsRefreshing(false));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p>Loading feeds...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'red' }}>
        Error loading feeds: {error.message}
        <br />
        <button 
          onClick={() => refetch()}
          style={{ marginTop: 10, padding: '8px 16px', background: '#4bb5ef', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!feeds || feeds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <p>No feeds available</p>
      </div>
    );
  }

  return (
    <div className="loadMore">
      {/* Refresh indicator */}
      {/* {isRefreshing && (
        <div style={{ textAlign: 'center', padding: 8, background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
          <small>Refreshing feeds...</small>
        </div>
      )} */}
      
      {/* Simple list of all feeds */}
      {feeds.map(feed => (
        <div className="central-meta item" key={feed.id}>
          <div className="user-post">
            <div className="friend-info">
              <figure>
                <img src="/images/resources/friend-avatar10.jpg" alt="" />
              </figure>
              <div className="friend-name">
                <ins><a href="/time-line">{feed.authorName || 'User'}</a></ins>
                <span>published: {new Date(feed.createdAt).toLocaleString()}</span>
              </div>
              <div className="post-meta">
                {feed.images && feed.images.length > 0 && (
                  <img src={feed.images[0]} alt="post" style={{ maxWidth: '100%', borderRadius: 8 }} />
                )}
                <div className="description">
                  <p>{feed.content}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 