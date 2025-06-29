'use client'
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import styles from '../components/Styles/Spinner.module.css';
import { fetchFeeds, fetchPicture } from '../utils/apiService';

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

function FeedImage({ imageId }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);
    setImgUrl(null);
    fetchPicture(imageId)
      .then(blob => {
        if (isMounted) {
          setImgUrl(URL.createObjectURL(blob));
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [imageId]);

  if (loading) {
    return (
      <div style={{ width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.spinner}>
          <div className={styles.bounce1}></div>
          <div className={styles.bounce2}></div>
          <div className={styles.bounce3}></div>
        </div>
      </div>
    );
  }
  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', padding: 8 }}>Image failed to load</div>;
  }
  return (
    <img src={imgUrl} alt="post" style={{ maxWidth: '100%', marginBottom: 8,  objectFit: 'cover', borderRadius: 8 , height:'100%'}} />
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
                {/* Render image if present */}
                {feed.images && feed.images.length > 0 && feed.images[0]?.id ? (
                  <FeedImage imageId={feed.images[0].id} />
                ) : null}
                <div className="description">
                  <p>{feed.content}</p>
                </div>
                {/* Restored like, dislike, comment, and share UI */}
                <div className="we-video-info">
                  <ul>
                    <li>
                      <span className="views" title="views">
                        <i className="fa fa-eye"></i>
                        <ins>1.2k</ins>
                      </span>
                    </li>
                    <li>
                      <span className="comment" title="Comments">
                        <i className="fa fa-comments-o"></i>
                        <ins>52</ins>
                      </span>
                    </li>
                    <li>
                      <span className="like" title="like">
                        <i className="ti-heart"></i>
                        <ins>2.2k</ins>
                      </span>
                    </li>
                    <li>
                      <span className="dislike" title="dislike">
                        <i className="ti-heart-broken"></i>
                        <ins>200</ins>
                      </span>
                    </li>
                    <li className="social-media">
                      <div className="menu">
                        <div className="btn trigger"><i className="fa fa-share-alt"></i></div>
                        <div className="rotater">
                          <div className="btn btn-icon"><a href="#" title=""><i className="fa fa-html5"></i></a></div>
                        </div>
                        <div className="rotater">
                          <div className="btn btn-icon"><a href="#" title=""><i className="fa fa-facebook"></i></a></div>
                        </div>
                        <div className="rotater">
                          <div className="btn btn-icon"><a href="#" title=""><i className="fa fa-google-plus"></i></a></div>
                        </div>
                        <div className="rotater">
                          <div className="btn btn-icon"><a href="#" title=""><i className="fa fa-twitter"></i></a></div>
                        </div>
                        <div className="rotater">
                          <div className="btn btn-icon"><a href="#" title=""><i className="fa fa-css3"></i></a></div>
                        </div>
                        <div className="rotater">
                          <div className="btn btn-icon"><a href="#" title=""><i className="fa fa-instagram"></i></a></div>
                        </div>
                        <div className="rotater">
                          <div className="btn btn-icon"><a href="#" title=""><i className="fa fa-dribbble"></i></a></div>
                        </div>
                        <div className="rotater">
                          <div className="btn btn-icon"><a href="#" title=""><i className="fa fa-pinterest"></i></a></div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                {/* Static comments section, copied from index.html */}
                <div className="coment-area">
                  <ul className="we-comet">
                    <li>
                      <div className="comet-avatar">
                        <img src="/images/resources/comet-1.jpg" alt="" />
                      </div>
                      <div className="we-comment">
                        <div className="coment-head">
                          <h5><a href="/time-line" title="">Jason Borne</a></h5>
                          <span>1 year ago</span>
                          <a className="we-reply" href="#" title="Reply"><i className="fa fa-reply"></i></a>
                        </div>
                        <p>we are working for the dance and sing songs. this car is very awesome for the youngster. please vote this car and like our post</p>
                      </div>
                      <ul>
                        <li>
                          <div className="comet-avatar">
                            <img src="/images/resources/comet-2.jpg" alt="" />
                          </div>
                          <div className="we-comment">
                            <div className="coment-head">
                              <h5><a href="/time-line" title="">Alexendra Dadrio</a></h5>
                              <span>1 month ago</span>
                              <a className="we-reply" href="#" title="Reply"><i className="fa fa-reply"></i></a>
                            </div>
                            <p>yes, really very awesome car i see the features of this car in the official website of <a href="#" title="">#Mercedes-Benz</a> and really impressed :-)</p>
                          </div>
                        </li>
                        <li>
                          <div className="comet-avatar">
                            <img src="/images/resources/comet-3.jpg" alt="" />
                          </div>
                          <div className="we-comment">
                            <div className="coment-head">
                              <h5><a href="/time-line" title="">Olivia</a></h5>
                              <span>16 days ago</span>
                              <a className="we-reply" href="#" title="Reply"><i className="fa fa-reply"></i></a>
                            </div>
                            <p>i like lexus cars, lexus cars are most beautiful with the awesome features, but this car is really outstanding than lexus</p>
                          </div>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <div className="comet-avatar">
                        <img src="/images/resources/comet-1.jpg" alt="" />
                      </div>
                      <div className="we-comment">
                        <div className="coment-head">
                          <h5><a href="/time-line" title="">Donald Trump</a></h5>
                          <span>1 week ago</span>
                          <a className="we-reply" href="#" title="Reply"><i className="fa fa-reply"></i></a>
                        </div>
                        <p>we are working for the dance and sing songs. this video is very awesome for the youngster. please vote this video and like our channel <i className="em em-smiley"></i></p>
                      </div>
                    </li>
                    <li>
                      <a href="#" title="" className="showmore underline">more comments</a>
                    </li>
                    <li className="post-comment">
                      <div className="comet-avatar">
                        <img src="/images/resources/comet-1.jpg" alt="" />
                      </div>
                      <div className="post-comt-box">
                        <form method="post">
                          <textarea placeholder="Post your comment"></textarea>
                          <div className="add-smiles">
                            <span className="em em-expressionless" title="add icon"></span>
                          </div>
                          <div className="smiles-bunch">
                            <i className="em em---1"></i>
                            <i className="em em-smiley"></i>
                            <i className="em em-anguished"></i>
                            <i className="em em-laughing"></i>
                            <i className="em em-angry"></i>
                            <i className="em em-astonished"></i>
                            <i className="em em-blush"></i>
                            <i className="em em-disappointed"></i>
                            <i className="em em-worried"></i>
                            <i className="em em-kissing_heart"></i>
                            <i className="em em-rage"></i>
                            <i className="em em-stuck_out_tongue"></i>
                          </div>
                          <button type="submit"></button>
                        </form>
                      </div>
                    </li>
                  </ul>
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