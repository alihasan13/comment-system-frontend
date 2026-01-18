import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CommentContext } from '../context/CommentContext';
import '../styles/CommentForm.scss';

const CommentForm = ({ parentComment = null, onCancel = null }) => {
  const { user } = useContext(AuthContext);
  const { createComment } = useContext(CommentContext);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (content.length > 1000) {
      setError('Comment cannot exceed 1000 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createComment(content, parentComment);
      setContent('');
      if (onCancel) onCancel();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="comment-form-login">
        <p>Please login to {parentComment ? 'reply to this comment' : 'leave a comment'}</p>
      </div>
    );
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      <div className="form-content">
        <img src={user.avatar} alt={user.username} className="user-avatar-small" />
        <textarea
          placeholder={parentComment ? "Write a reply..." : "Write a comment..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength="1000"
          rows={parentComment ? "2" : "3"}
          disabled={loading}
        />
      </div>
      <div className="form-footer">
        <span className="char-count">{content.length}/1000</span>
        <div className="form-actions">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={loading || !content.trim()}>
            {loading ? 'Posting...' : (parentComment ? 'Reply' : 'Comment')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;