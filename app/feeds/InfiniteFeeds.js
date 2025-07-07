'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import styles from '../components/Styles/Spinner.module.css';
import { fetchFeeds, fetchPicture, toggleLike, fetchComments, postComment } from '../utils/apiService';

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

// Avatar for comments/replies
function CommentAvatar({ imageId }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(!!imageId);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!imageId) return;
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
  if (!imageId || error) {
    return <img src="/images/resources/comet-2.jpg" alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  if (loading) {
    return <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee' }} />;
  }
  return <img src={imgUrl} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />;
}

function CommentsSection({ postId }) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // comment id being replied to
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const queryClient = useQueryClient();

  // Fetch comments
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments({ postId, page: 0, size: 10 }),
  });

  // Post comment
  const mutation = useMutation({
    mutationFn: ({ postId, commentText }) => postComment({ postId, commentText }),
    onSuccess: async () => {
      setCommentText('');
      setIsSubmitting(true);
      await refetch();
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="coment-area">
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 8 }}>Loading comments...</div>
      ) : isError ? (
        <div style={{ color: 'red', textAlign: 'center', padding: 8 }}>Failed to load comments</div>
      ) : (
        <ul className="we-comet">
          {data?.data && data.data.length > 0 ? (
            (showAll ? data.data : data.data.slice(0, 3)).map((comment) => (
              <li key={comment.id}>
                <div className="comet-avatar">
                  <CommentAvatar imageId={comment.imageId} />
                </div>
                <div className="we-comment">
                  <div className="coment-head">
                    <h5><a href={`/timeline/${comment.userId || 'user'}`} title="">{comment.username || 'User'}</a></h5>
                    <span>{comment.commentedAt ? new Date(comment.commentedAt).toLocaleString() : ''}</span>
                    <a className="we-reply" href="#" title="Reply" onClick={e => { e.preventDefault(); setReplyingTo(comment.id); setReplyText(''); }}><i className="fa fa-reply"></i></a>
                  </div>
                  <p>{comment.comment}</p>
                  {/* Reply input, only for the comment being replied to */}
                  {replyingTo === comment.id && (
                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        if (!replyText.trim()) return;
                        setIsReplying(true);
                        await postComment({ postId, commentText: replyText, parentCommentId: comment.id });
                        setIsReplying(false);
                        setReplyingTo(null);
                        setReplyText('');
                        await refetch();
                      }}
                      style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #eee' }}
                        disabled={isReplying}
                        autoFocus
                      />
                      <button
                        type="submit"
                        style={{ padding: '6px 16px', borderRadius: 4, background: '#4bb5ef', color: '#fff', border: 'none', minWidth: 60, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        disabled={isReplying || !replyText.trim()}
                      >
                        {isReplying ? (
                          <div className={styles.spinner} style={{ width: 18, height: 18, margin: 0 }}>
                            <div className={styles.bounce1}></div>
                            <div className={styles.bounce2}></div>
                            <div className={styles.bounce3}></div>
                          </div>
                        ) : 'Reply'}
                      </button>
                      <button type="button" onClick={() => { setReplyingTo(null); setReplyText(''); }} style={{ marginLeft: 4, background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>Cancel</button>
                    </form>
                  )}
                  {/* Render replies if any */}
                  {comment.replies && comment.replies.length > 0 && (
                    <ul className="we-comet" style={{ marginLeft: 40 }}>
                      {comment.replies.map(reply => (
                        <li key={reply.id}>
                          <div className="comet-avatar">
                            <CommentAvatar imageId={reply.imageId} />
                          </div>
                          <div className="we-comment">
                            <div className="coment-head">
                              <h5><a href={`/timeline/${reply.userId || 'user'}`} title="">{reply.username || 'User'}</a></h5>
                              <span>{reply.commentedAt ? new Date(reply.commentedAt).toLocaleString() : ''}</span>
                              <a className="we-reply" href="#" title="Reply" 
                                onClick={e => { 
                                  if (reply.username === comment.username) return; // Disable if replying to own reply
                                  e.preventDefault(); 
                                  setReplyingTo(reply.id); 
                                  setReplyText(''); 
                                }}
                                style={reply.username === comment.username ? { pointerEvents: 'none', opacity: 0.5, cursor: 'not-allowed' } : {}}
                              ><i className="fa fa-reply"></i></a>
                            </div>
                            <p>{reply.comment}</p>
                            {/* Reply input, only for the reply being replied to */}
                            {replyingTo === reply.id && (
                              <form
                                onSubmit={async e => {
                                  e.preventDefault();
                                  if (!replyText.trim()) return;
                                  setIsReplying(true);
                                  await postComment({ postId, commentText: replyText, parentCommentId: reply.id });
                                  setIsReplying(false);
                                  setReplyingTo(null);
                                  setReplyText('');
                                  await refetch();
                                }}
                                style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}
                              >
                                <input
                                  type="text"
                                  placeholder="Write a reply..."
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #eee' }}
                                  disabled={isReplying}
                                  autoFocus
                                />
                                <button
                                  type="submit"
                                  style={{ padding: '6px 16px', borderRadius: 4, background: '#4bb5ef', color: '#fff', border: 'none', minWidth: 60, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  disabled={isReplying || !replyText.trim()}
                                >
                                  {isReplying ? (
                                    <div className={styles.spinner} style={{ width: 18, height: 18, margin: 0 }}>
                                      <div className={styles.bounce1}></div>
                                      <div className={styles.bounce2}></div>
                                      <div className={styles.bounce3}></div>
                                    </div>
                                  ) : 'Reply'}
                                </button>
                                <button type="button" onClick={() => { setReplyingTo(null); setReplyText(''); }} style={{ marginLeft: 4, background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>Cancel</button>
                              </form>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li><div style={{ textAlign: 'center', color: '#888' }}>No comments yet.</div></li>
          )}
          {/* More Comments Button */}
          {data?.data && data.data.length > 3 && !showAll && (
            <li style={{ textAlign: 'center' }}>
              <a href="#" title="" className="showmore underline" onClick={e => { e.preventDefault(); setShowAll(true); }}>
                more comments
              </a>
            </li>
          )}
        </ul>
      )}
      {/* Post comment form */}
      <div className="post-comment" style={{ marginTop: 12 }}>
        <div className="comet-avatar">
          <img src="/images/resources/comet-1.jpg" alt="" />
        </div>
        <div className="post-comt-box">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!commentText.trim()) return;
              setIsSubmitting(true);
              mutation.mutate({ postId, commentText });
            }}
          >
            <input
              type="text"
              placeholder="Post your comment"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              style={{ width: '80%', padding: 6, borderRadius: 4, border: '1px solid #eee' }}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              style={{ marginLeft: 8, padding: '6px 16px', borderRadius: 4, background: '#4bb5ef', color: '#fff', border: 'none', minWidth: 60, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              disabled={isSubmitting || !commentText.trim()}
            >
              {isSubmitting ? (
                <div className={styles.spinner} style={{ width: 18, height: 18, margin: 0 }}>
                  <div className={styles.bounce1}></div>
                  <div className={styles.bounce2}></div>
                  <div className={styles.bounce3}></div>
                </div>
              ) : 'Post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const InfiniteFeeds = forwardRef(function InfiniteFeeds(props, ref) {
  const [feeds, setFeeds] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likeStates, setLikeStates] = useState({}); // { [postId]: { liked: boolean, likeCount: number } }


  // Like mutation
  const likeMutation = useMutation({
    mutationFn: (postId) => toggleLike(postId),
    onSuccess: (postId) => {
      setLikeStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          likeCounter: (prev[postId]?.likeCounter ?? feeds.find(f => f.id === postId)?.likeCounter ?? 0) + 1
        }
      }));
    //   queryClient.invalidateQueries(['all-feeds']);
    }
  });
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
    refetchFeeds: async () => {
      setIsRefreshing(true);
      try {
        return await refetch();
      } finally {
        return setIsRefreshing(false);
      }
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
      {feeds.map(feed => {
        const postState = likeStates[feed.id] || { liked: false, likeCount: feed.likeCounter ?? 0 };
        const handleLike = () => {
          likeMutation.mutate(feed.id, {
            onSuccess: (data) => {
              if (data && data.message === 'Post liked') {
                setLikeStates(prev => ({
                  ...prev,
                  [feed.id]: {
                    liked: true,
                    likeCount: postState.likeCount + 1
                  }
                }));
              } else if (data && data.message === 'Post unliked') {
                setLikeStates(prev => ({
                  ...prev,
                  [feed.id]: {
                    liked: false,
                    likeCount: postState.likeCount - 1
                  }
                }));
              }
            }
          });
        };
        return (
          <div className="central-meta item" key={feed.id}>
            <div className="user-post">
              <div className="friend-info">
                <figure>
                 <CommentAvatar imageId={feed.profileImageId} size={40} />
                </figure>
                <div className="friend-name">
                  <ins><a href={`/timeline/${feed.authorId || 'user'}`}>{feed.authorName || 'User'}</a></ins>
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
                  {/* Like, comment, and share UI (no dislike) */}
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
                        <span className={`like${postState.liked ? ' active' : ''}`} title="like" style={{ cursor: 'pointer' }} onClick={handleLike}>
                          <i className="ti-heart"></i>
                          <ins style={{ color: postState.liked ? 'green' : '#222' }}>{postState.likeCount}</ins>
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
                  <CommentsSection postId={feed.id} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default InfiniteFeeds; 