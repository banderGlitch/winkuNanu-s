import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { fetchFeeds } from '../utils/apiService';

function FeedSkeleton() {
  // Render 5 skeleton cards, full viewport height
  return (
    <div style={{ width: '100%', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="central-meta item" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 0 8px #eee', padding: 24, margin: '0 auto', maxWidth: 600, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', animation: 'skeleton-loading 1.2s infinite', marginRight: 16 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: 120, height: 14, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', borderRadius: 4, marginBottom: 8, animation: 'skeleton-loading 1.2s infinite' }} />
              <div style={{ width: 80, height: 12, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', borderRadius: 4, animation: 'skeleton-loading 1.2s infinite' }} />
            </div>
          </div>
          <div style={{ width: '100%', height: 120, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', borderRadius: 8, marginBottom: 16, animation: 'skeleton-loading 1.2s infinite' }} />
          <div style={{ width: '80%', height: 16, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', borderRadius: 4, marginBottom: 8, animation: 'skeleton-loading 1.2s infinite' }} />
          <div style={{ width: '60%', height: 14, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', borderRadius: 4, animation: 'skeleton-loading 1.2s infinite' }} />
        </div>
      ))}
      <style>{`
        @keyframes skeleton-loading {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
      `}</style>
    </div>
  );
}

const InfiniteFeeds = forwardRef(function InfiniteFeeds(props, ref) {
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
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  // Update feeds when data changes
  useEffect(() => {
    if (data) {
      setFeeds(data);
    }
  }, [data]);

  // Expose a method to refresh feeds from parent (e.g., after post)
  useImperativeHandle(ref, () => ({
    refetchFeeds: () => {
      setIsRefreshing(true);
      return refetch().finally(() => setIsRefreshing(false));
    }
  }));

  if (isLoading) {
    return <FeedSkeleton />;
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
      <div style={{ textAlign: 'center', padding: 16 }}>
        <button 
          onClick={() => {
            setIsRefreshing(true);
            refetch().finally(() => setIsRefreshing(false));
          }}
          disabled={isRefreshing}
          style={{ 
            background: '#4bb5ef', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 20, 
            padding: '8px 20px', 
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            opacity: isRefreshing ? 0.6 : 1
          }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Feeds'}
        </button>
      </div>
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
});

export default InfiniteFeeds; 