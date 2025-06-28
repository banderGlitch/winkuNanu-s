'use client';
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoutes from '../components/ProtectedRoutes';
import { createPost } from '../utils/apiService';
import InfiniteFeeds from './InfiniteFeeds';

export default function Feeds() {
  const [content, setContent] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  



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
              <InfiniteFeeds />
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