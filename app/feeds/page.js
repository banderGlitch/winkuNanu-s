'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoutes from '../components/ProtectedRoutes';
import { getFeeds, createPost } from '../utils/apiService';

export default function Feeds() {
  const [content, setContent] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // useEffect(() => {
  //   const fetchFeeds = async () => {
  //     const response = await getFeeds();
  //     console.log(response);
  //   };
  //   fetchFeeds();
  // }, []);

  const handleContentChange = (e) => setContent(e.target.value);
  const handleModalContentChange = (e) => setModalContent(e.target.value);
  const handleImageChange = (e) => setImage(e.target.files[0]);

  // post to the feed
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPost({ content, visibility, image });
      setContent('');
      setVisibility('PUBLIC');
      setImage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // modal for photo upload

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPost({ content: modalContent, visibility, image });
      setModalContent('');
      setVisibility('PUBLIC');
      setImage(null);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoIconClick = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setImage(null);
    setModalContent('');
  };

  return (
    <>
      <ProtectedRoutes>
        <Header />
        <div className="theme-layout">
          <div className="feed-desktop-center feed-mobile-center">
            <div className="col-lg-6">
              <div className="central-meta">
                <div className="new-postbox">
                  <figure>
                    <img src="/images/resources/admin2.jpg" alt="" />
                  </figure>
                  <div className="newpst-input">
                    <form onSubmit={handleSubmit}>
                      <textarea
                        rows="2"
                        placeholder="write something"
                        value={content}
                        onChange={handleContentChange}
                        required
                      ></textarea>
                      <div className="attachments">
                        <ul>
                          <li>
                            <i className="fa fa-image" style={{ cursor: 'pointer', fontSize: 18 , marginRight: 10 }} title="Add photo" onClick={handlePhotoIconClick}></i>
                          </li>
                          <li>
                            <i className="fa fa-video-camera" style={{ cursor: 'pointer', fontSize: 18 , marginRight: 10 }} title="Add video"></i>
                          </li>
                          <li>
                            <i className="fa fa-camera" style={{ cursor: 'pointer', fontSize: 18 , marginRight: 10 }} title="Take photo"></i>
                          </li>
                          <li>
                            <button type="submit" disabled={loading}>{loading ? 'Posting...' : 'Post'}</button>
                          </li>
                        </ul>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="loadMore">
                {/* Example Post */}
                <div className="central-meta item">
                  <div className="user-post">
                    <div className="friend-info">
                      <figure>
                        <img src="/images/resources/friend-avatar10.jpg" alt="" />
                      </figure>
                      <div className="friend-name">
                        <ins><a href="/time-line">Janice Griffith</a></ins>
                        <span>published: june,2 2018 19:PM</span>
                      </div>
                      <div className="post-meta">
                        <img src="/images/resources/user-post.jpg" alt="" />
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
                                  <div className="btn btn-icon"><a href="#"><i className="fa fa-html5"></i></a></div>
                                </div>
                                <div className="rotater">
                                  <div className="btn btn-icon"><a href="#"><i className="fa fa-facebook"></i></a></div>
                                </div>
                                <div className="rotater">
                                  <div className="btn btn-icon"><a href="#"><i className="fa fa-google-plus"></i></a></div>
                                </div>
                                <div className="rotater">
                                  <div className="btn btn-icon"><a href="#"><i className="fa fa-twitter"></i></a></div>
                                </div>
                                <div className="rotater">
                                  <div className="btn btn-icon"><a href="#"><i className="fa fa-css3"></i></a></div>
                                </div>
                                <div className="rotater">
                                  <div className="btn btn-icon"><a href="#"><i className="fa fa-instagram"></i></a></div>
                                </div>
                                <div className="rotater">
                                  <div className="btn btn-icon"><a href="#"><i className="fa fa-dribbble"></i></a></div>
                                </div>
                                <div className="rotater">
                                  <div className="btn btn-icon"><a href="#"><i className="fa fa-pinterest"></i></a></div>
                                </div>
                              </div>
                            </li>
                          </ul>
                        </div>
                        <div className="description">
                          <p>
                            World&apos most beautiful car in Curabitur <a href="#">#test drive booking !</a> the most beautiful car available in America and Saudi Arabia, you can book your test drive by our official website
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="coment-area">
                      <ul className="we-comet">
                        <li>
                          <div className="comet-avatar">
                            <img src="/images/resources/comet-1.jpg" alt="" />
                          </div>
                          <div className="we-comment">
                            <div className="coment-head">
                              <h5><a href="/time-line">Jason borne</a></h5>
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
                                  <h5><a href="/time-line">alexendra dadrio</a></h5>
                                  <span>1 month ago</span>
                                  <a className="we-reply" href="#" title="Reply"><i className="fa fa-reply"></i></a>
                                </div>
                                <p>yes, really very awesome car i see the features of this car in the official website of <a href="#">#Mercedes-Benz</a> and really impressed :-)</p>
                              </div>
                            </li>
                            <li>
                              <div className="comet-avatar">
                                <img src="/images/resources/comet-3.jpg" alt="" />
                              </div>
                              <div className="we-comment">
                                <div className="coment-head">
                                  <h5><a href="/time-line">Olivia</a></h5>
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
                              <h5><a href="/time-line">Donald Trump</a></h5>
                              <span>1 week ago</span>
                              <a className="we-reply" href="#" title="Reply"><i className="fa fa-reply"></i></a>
                            </div>
                            <p>we are working for the dance and sing songs. this video is very awesome for the youngster. please vote this video and like our channel
                              <i className="em em-smiley"></i>
                            </p>
                          </div>
                        </li>
                        <li>
                          <a href="#" className="showmore underline">more comments</a>
                        </li>
                        <li className="post-comment">
                          <div className="comet-avatar">
                            <img src="/images/resources/comet-1.jpg" alt="" />
                          </div>
                          <div className="post-comt-box">
                            <form>
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
                {/* Repeat the above .central-meta.item for each post */}
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoutes>
      {/* Modal for photo upload */}
      {showModal && (
        <div className="modal fade show" tabIndex="-1" role="dialog" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header" style={{ borderBottom: '1px solid #e9ecef', background: '#fafbfc' }}>
                <h5 className="modal-title">Add Photo to Post</h5>
                <button type="button" className="close" onClick={handleModalClose} aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <form onSubmit={handleModalSubmit}>
                <div className="modal-body">
                  <textarea
                    rows="2"
                    placeholder="Write something..."
                    value={modalContent}
                    onChange={handleModalContentChange}
                    required
                    className="form-control"
                    style={{ resize: 'none', marginBottom: 8 }}
                  ></textarea>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="form-control"
                    style={{ marginBottom: 8 }}
                  />
                  {image && (
                    <div style={{ marginBottom: 8 }}>
                      <img src={URL.createObjectURL(image)} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid #e9ecef', background: '#fafbfc' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleModalClose}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 