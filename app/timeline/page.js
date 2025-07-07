'use client'
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { fetchFeeds, fetchPicture } from '../utils/apiService';
import styles from '../components/Styles/Spinner.module.css';
import ProtectedRoutes from '../components/ProtectedRoutes';
import Header from '../components/Header';

// Avatar component for profile pictures
function ProfileAvatar({ imageId, size = 120 }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(!!imageId);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imageId) return;
    setLoading(true);
    setError(false);
    setImgUrl(null);
    fetchPicture(imageId)
      .then(blob => {
        setImgUrl(URL.createObjectURL(blob));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [imageId]);

  if (!imageId || error) {
    return (
      <img 
        src="/images/resources/user-avatar.jpg" 
        alt="profile" 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          objectFit: 'cover',
          border: '4px solid #fff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }} 
      />
    );
  }

  if (loading) {
    return (
      <div style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        background: '#eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className={styles.spinner}>
          <div className={styles.bounce1}></div>
          <div className={styles.bounce2}></div>
          <div className={styles.bounce3}></div>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={imgUrl} 
      alt="profile" 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        objectFit: 'cover',
        border: '4px solid #fff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }} 
    />
  );
}

// Feed image component
function FeedImage({ imageId }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setImgUrl(null);
    fetchPicture(imageId)
      .then(blob => {
        setImgUrl(URL.createObjectURL(blob));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
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
    <img 
      src={imgUrl} 
      alt="post" 
      style={{ 
        maxWidth: '100%', 
        marginBottom: 8,  
        objectFit: 'cover', 
        borderRadius: 8, 
        height: '100%'
      }} 
    />
  );
}

export default function TimelinePage() {
  const params = useParams();
  const userId = params?.userId || 'default'; // Get userId from URL params

  // Mock user data - in real app, you'd fetch this from API
  const userData = {
    name: 'Janice Griffith',
    role: 'Group Admin',
    followers: 1205,
    profileImageId: null, // Will use default image
    coverImageId: null
  };

  // Fetch user's posts
  const { data: userPosts, isLoading, error } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: async () => {
      // In a real app, you'd have an API endpoint for user posts
      // For now, we'll fetch all feeds and filter by author
      const response = await fetchFeeds({ pageParam: 0, limit: 50 });
      return response?.data?.filter(post => post.authorName === userData.name) || [];
    },
    staleTime: 10000,
  });

  return (
    <ProtectedRoutes>
      <Header />
    <div className="theme-layout">
      {/* Top Area with Cover Photo and Profile */}
      <section>
        <div className="feature-photo">
          <figure>
            <img src="/images/resources/timeline-1.jpg" alt="cover" style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
          </figure>
          <div className="add-btn">
            <span>{userData.followers} followers</span>
            <a href="#" title="" data-ripple="">Add Friend</a>
          </div>
          <form className="edit-phto">
            <i className="fa fa-camera-retro"></i>
            <label className="fileContainer">
              Edit Cover Photo
              <input type="file"/>
            </label>
          </form>
          <div className="container-fluid">
            <div className="row merged">
              <div className="col-lg-2 col-sm-3">
                <div className="user-avatar">
                  <figure>
                    <ProfileAvatar imageId={userData.profileImageId} />
                    <form className="edit-phto">
                      <i className="fa fa-camera-retro"></i>
                      <label className="fileContainer">
                        Edit Display Photo
                        <input type="file"/>
                      </label>
                    </form>
                  </figure>
                </div>
              </div>
              <div className="col-lg-10 col-sm-9">
                <div className="timeline-info">
                  <ul>
                    <li className="admin-name">
                      <h5>{userData.name}</h5>
                      <span>{userData.role}</span>
                    </li>
                    <li>
                      <a className="active" href={`/timeline/${userId}`} title="" data-ripple="">time line</a>
                      <a className="" href={`/timeline/${userId}/photos`} title="" data-ripple="">Photos</a>
                      <a className="" href={`/timeline/${userId}/videos`} title="" data-ripple="">Videos</a>
                      <a className="" href={`/timeline/${userId}/friends`} title="" data-ripple="">Friends</a>
                      <a className="" href={`/timeline/${userId}/groups`} title="" data-ripple="">Groups</a>
                      <a className="" href={`/timeline/${userId}/about`} title="" data-ripple="">about</a>
                      <a className="" href="#" title="" data-ripple="">more</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section>
        <div className="gap gray-bg">
          <div className="container-fluid">
            <div className="row">
              <div className="col-lg-12">
                <div className="row" id="page-contents">
                  {/* Left Sidebar */}
                  <div className="col-lg-3">
                    <aside className="sidebar static">
                      <div className="widget">
                        <h4 className="widget-title">Socials</h4>
                        <ul className="socials">
                          <li className="facebook">
                            <a title="" href="#"><i className="fa fa-facebook"></i> <span>facebook</span> <ins>45 likes</ins></a>
                          </li>
                          <li className="twitter">
                            <a title="" href="#"><i className="fa fa-twitter"></i> <span>twitter</span><ins>25 likes</ins></a>
                          </li>
                          <li className="google">
                            <a title="" href="#"><i className="fa fa-google"></i> <span>google</span><ins>35 likes</ins></a>
                          </li>
                        </ul>
                      </div>
                      <div className="widget">
                        <h4 className="widget-title">Shortcuts</h4>
                        <ul className="naves">
                          <li>
                            <i className="ti-clipboard"></i>
                            <a href="/feeds" title="">News feed</a>
                          </li>
                          <li>
                            <i className="ti-mouse-alt"></i>
                            <a href="/inbox" title="">Inbox</a>
                          </li>
                          <li>
                            <i className="ti-files"></i>
                            <a href="/fav-page" title="">My pages</a>
                          </li>
                          <li>
                            <i className="ti-user"></i>
                            <a href="/timeline/friends" title="">friends</a>
                          </li>
                          <li>
                            <i className="ti-image"></i>
                            <a href="/timeline/photos" title="">images</a>
                          </li>
                          <li>
                            <i className="ti-video-camera"></i>
                            <a href="/timeline/videos" title="">videos</a>
                          </li>
                          <li>
                            <i className="ti-comments-smiley"></i>
                            <a href="/messages" title="">Messages</a>
                          </li>
                          <li>
                            <i className="ti-bell"></i>
                            <a href="/notifications" title="">Notifications</a>
                          </li>
                          <li>
                            <i className="ti-share"></i>
                            <a href="/people-nearby" title="">People Nearby</a>
                          </li>
                          <li>
                            <i className="fa fa-bar-chart-o"></i>
                            <a href="/insights" title="">insights</a>
                          </li>
                          <li>
                            <i className="ti-power-off"></i>
                            <a href="/logout" title="">Logout</a>
                          </li>
                        </ul>
                      </div>
                      <div className="widget">
                        <h4 className="widget-title">Recent Activity</h4>
                        <ul className="activitiez">
                          <li>
                            <div className="activity-meta">
                              <i>10 hours Ago</i>
                              <span><a href="#" title="">Commented on Video posted </a></span>
                              <h6>by <a href="/feeds">black demon.</a></h6>
                            </div>
                          </li>
                          <li>
                            <div className="activity-meta">
                              <i>30 Days Ago</i>
                              <span><a href="/feeds" title="">Posted your status. "Hello guys, how are you?"</a></span>
                            </div>
                          </li>
                          <li>
                            <div className="activity-meta">
                              <i>2 Years Ago</i>
                              <span><a href="#" title="">Share a video on her timeline.</a></span>
                              <h6>"<a href="/feeds">you are so funny mr.been.</a>"</h6>
                            </div>
                          </li>
                        </ul>
                      </div>
                      <div className="widget stick-widget">
                        <h4 className="widget-title">Who's following</h4>
                        <ul className="followers">
                          <li>
                            <figure><img src="/images/resources/friend-avatar2.jpg" alt="" /></figure>
                            <div className="friend-meta">
                              <h4><a href="/timeline/user1" title="">Kelly Bill</a></h4>
                              <a href="#" title="" className="underline">Add Friend</a>
                            </div>
                          </li>
                          <li>
                            <figure><img src="/images/resources/friend-avatar4.jpg" alt="" /></figure>
                            <div className="friend-meta">
                              <h4><a href="/timeline/user2" title="">Issabel</a></h4>
                              <a href="#" title="" className="underline">Add Friend</a>
                            </div>
                          </li>
                          <li>
                            <figure><img src="/images/resources/friend-avatar6.jpg" alt="" /></figure>
                            <div className="friend-meta">
                              <h4><a href="/timeline/user3" title="">Andrew</a></h4>
                              <a href="#" title="" className="underline">Add Friend</a>
                            </div>
                          </li>
                          <li>
                            <figure><img src="/images/resources/friend-avatar8.jpg" alt="" /></figure>
                            <div className="friend-meta">
                              <h4><a href="/timeline/user4" title="">Sophia</a></h4>
                              <a href="#" title="" className="underline">Add Friend</a>
                            </div>
                          </li>
                          <li>
                            <figure><img src="/images/resources/friend-avatar3.jpg" alt="" /></figure>
                            <div className="friend-meta">
                              <h4><a href="/timeline/user5" title="">Allen</a></h4>
                              <a href="#" title="" className="underline">Add Friend</a>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </aside>
                  </div>

                  {/* Center Content - User Posts */}
                  <div className="col-lg-6">
                    <div className="loadMore">
                      {/* Create Post Box */}
                      <div className="central-meta item">
                        <div className="new-postbox">
                          <figure>
                            <img src="/images/resources/admin2.jpg" alt="" />
                          </figure>
                          <div className="newpst-input">
                            <form method="post">
                              <textarea rows="2" placeholder="write something"></textarea>
                              <div className="attachments">
                                <ul>
                                  <li>
                                    <i className="fa fa-music"></i>
                                    <label className="fileContainer">
                                      <input type="file" />
                                    </label>
                                  </li>
                                  <li>
                                    <i className="fa fa-image"></i>
                                    <label className="fileContainer">
                                      <input type="file" />
                                    </label>
                                  </li>
                                  <li>
                                    <i className="fa fa-video-camera"></i>
                                    <label className="fileContainer">
                                      <input type="file" />
                                    </label>
                                  </li>
                                  <li>
                                    <i className="fa fa-camera"></i>
                                    <label className="fileContainer">
                                      <input type="file" />
                                    </label>
                                  </li>
                                  <li>
                                    <button type="submit">Publish</button>
                                  </li>
                                </ul>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>

                      {/* User Posts */}
                      {isLoading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>
                          <div className={styles.spinner}>
                            <div className={styles.bounce1}></div>
                            <div className={styles.bounce2}></div>
                            <div className={styles.bounce3}></div>
                          </div>
                          <p>Loading posts...</p>
                        </div>
                      ) : error ? (
                        <div style={{ textAlign: 'center', padding: 20, color: 'red' }}>
                          Error loading posts: {error.message}
                        </div>
                      ) : userPosts && userPosts.length > 0 ? (
                        userPosts.map(post => (
                          <div className="central-meta item" key={post.id}>
                            <div className="user-post">
                              <div className="friend-info">
                                <figure>
                                  <ProfileAvatar imageId={post.profileImageId} size={40} />
                                </figure>
                                <div className="friend-name">
                                  <ins><a href={`/timeline/${userId}`} title="">{post.authorName || 'User'}</a></ins>
                                  <span>published: {new Date(post.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="post-meta">
                                  {/* Render image if present */}
                                  {post.images && post.images.length > 0 && post.images[0]?.id ? (
                                    <FeedImage imageId={post.images[0].id} />
                                  ) : null}
                                  <div className="description">
                                    <p>{post.content}</p>
                                  </div>
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
                                          <ins>{post.likeCounter || 0}</ins>
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
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: 'center', padding: 20 }}>
                          <p>No posts found for this user.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Sidebar */}
                  <div className="col-lg-3">
                    <aside className="sidebar static">
                      <div className="widget">
                        <div className="banner medium-opacity bluesh">
                          <div style={{ backgroundImage: 'url(/images/resources/baner-widgetbg.jpg)' }} className="bg-image"></div>
                          <div className="baner-top">
                            <span><img src="/images/book-icon.png" alt="" /></span>
                            <i className="fa fa-ellipsis-h"></i>
                          </div>
                          <div className="banermeta">
                            <p>create your own favourit page.</p>
                            <span>like them all</span>
                            <a href="#" title="" data-ripple="">start now!</a>
                          </div>
                        </div>
                      </div>
                      <div className="widget friend-list stick-widget">
                        <h4 className="widget-title">Friends</h4>
                        <div id="searchDir"></div>
                        <ul id="people-list" className="friendz-list">
                          <li>
                            <figure>
                              <img src="/images/resources/friend-avatar.jpg" alt="" />
                              <span className="status f-online"></span>
                            </figure>
                            <div className="friendz-meta">
                              <a href="/timeline/user1">bucky barnes</a>
                              <i>bucky@email.com</i>
                            </div>
                          </li>
                          <li>
                            <figure>
                              <img src="/images/resources/friend-avatar2.jpg" alt="" />
                              <span className="status f-away"></span>
                            </figure>
                            <div className="friendz-meta">
                              <a href="/timeline/user2">Sarah Loren</a>
                              <i>sarah@email.com</i>
                            </div>
                          </li>
                          <li>
                            <figure>
                              <img src="/images/resources/friend-avatar3.jpg" alt="" />
                              <span className="status f-off"></span>
                            </figure>
                            <div className="friendz-meta">
                              <a href="/timeline/user3">jason borne</a>
                              <i>jason@email.com</i>
                            </div>
                          </li>
                          <li>
                            <figure>
                              <img src="/images/resources/friend-avatar4.jpg" alt="" />
                              <span className="status f-off"></span>
                            </figure>
                            <div className="friendz-meta">
                              <a href="/timeline/user4">Cameron diaz</a>
                              <i>cameron@email.com</i>
                            </div>
                          </li>
                          <li>
                            <figure>
                              <img src="/images/resources/friend-avatar5.jpg" alt="" />
                              <span className="status f-online"></span>
                            </figure>
                            <div className="friendz-meta">
                              <a href="/timeline/user5">daniel warber</a>
                              <i>daniel@email.com</i>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </ProtectedRoutes>
  );
} 