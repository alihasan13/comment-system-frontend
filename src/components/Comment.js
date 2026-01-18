import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CommentContext } from '../context/CommentContext';
import { FaThumbsUp, FaThumbsDown, FaReply, FaEdit, FaTrash, FaTimes, FaCheck, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import CommentForm from './CommentForm';
import '../styles/Comment.scss';

const Comment = ({ comment, isReply = false }) => {
  const { user } = useContext(AuthContext);
  const { updateComment, deleteComment, likeComment, dislikeComment } = useContext(CommentContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false); // NEW: Control reply visibility
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);

  // Safety check for author - prevent white screen
  if (!comment || !comment.author || !comment.author._id) {
    console.error('Comment missing required data:', comment);
    return null;
  }

  // Check if current user is the author
  const isAuthor = user && user.id === comment.author._id;
  const hasLiked = user && comment.likes && comment.likes.includes(user.id);
  const hasDisliked = user && comment.dislikes && comment.dislikes.includes(user.id);
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleEdit = async () => {
    if (!editContent.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await updateComment(comment._id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
      // Show user-friendly error message
      if (error.response?.status === 403) {
        alert('You can only edit your own comments.');
      } else {
        alert('Failed to update comment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      setLoading(true);
      try {
        await deleteComment(comment._id);
      } catch (error) {
        console.error('Failed to delete comment:', error);
        // Show user-friendly error message
        if (error.response?.status === 403) {
          alert('You can only delete your own comments.');
        } else {
          alert('Failed to delete comment. Please try again.');
        }
        setLoading(false);
      }
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Please login to like comments');
      return;
    }
    try {
      await likeComment(comment._id);
    } catch (error) {
      console.error('Failed to like comment:', error);
      alert('Failed to like comment. Please try again.');
    }
  };

  const handleDislike = async () => {
    if (!user) {
      alert('Please login to dislike comments');
      return;
    }
    try {
      await dislikeComment(comment._id);
    } catch (error) {
      console.error('Failed to dislike comment:', error);
      alert('Failed to dislike comment. Please try again.');
    }
  };

  const handleReplyClick = () => {
    if (!user) {
      alert('Please login to reply to comments');
      return;
    }
    setIsReplying(!isReplying);
    // Also show replies when user clicks reply
    if (!isReplying) {
      setShowReplies(true);
    }
  };

  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const formatDate = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now - commentDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return commentDate.toLocaleDateString();
  };

  return (
    <div className={`comment ${isReply ? 'reply' : ''}`}>
      <div className="comment-header">
        <img src={comment.author.avatar} alt={comment.author.username} className="avatar" />
        <div className="comment-info">
          <span className="username">{comment.author.username}</span>
          <span className="timestamp">
            {formatDate(comment.createdAt)}
            {comment.isEdited && <span className="edited"> (edited)</span>}
          </span>
        </div>
      </div>

      <div className="comment-body">
        {isEditing ? (
          <div className="edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength="1000"
              disabled={loading}
              autoFocus
            />
            <div className="char-count">{editContent.length}/1000</div>
            <div className="edit-actions">
              <button onClick={handleEdit} className="btn-primary btn-small" disabled={loading}>
                <FaCheck /> {loading ? 'Saving...' : 'Save'}
              </button>
              <button onClick={handleCancelEdit} className="btn-secondary btn-small" disabled={loading}>
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-content">{comment.content}</p>
        )}
      </div>

      <div className="comment-actions">
        <button
          className={`action-btn ${hasLiked ? 'active liked' : ''}`}
          onClick={handleLike}
          disabled={loading}
          title="Like this comment"
        >
          <FaThumbsUp /> <span>{comment.likes ? comment.likes.length : 0}</span>
        </button>
        <button
          className={`action-btn ${hasDisliked ? 'active disliked' : ''}`}
          onClick={handleDislike}
          disabled={loading}
          title="Dislike this comment"
        >
          <FaThumbsDown /> <span>{comment.dislikes ? comment.dislikes.length : 0}</span>
        </button>
        
        {/* Only show Reply button for top-level comments */}
        {!isReply && (
          <button 
            className="action-btn" 
            onClick={handleReplyClick}
            disabled={loading}
            title="Reply to this comment"
          >
            <FaReply /> Reply
          </button>
        )}

        {/* Only show Edit/Delete buttons if user is the author */}
        {isAuthor && !isEditing && (
          <>
            <button 
              className="action-btn" 
              onClick={() => setIsEditing(true)}
              disabled={loading}
              title="Edit this comment"
            >
              <FaEdit /> Edit
            </button>
            <button 
              className="action-btn delete" 
              onClick={handleDelete}
              disabled={loading}
              title="Delete this comment"
            >
              <FaTrash /> Delete
            </button>
          </>
        )}

        {/* Toggle replies button - only show if there are replies */}
        {!isReply && hasReplies && (
          <button 
            className="action-btn toggle-replies" 
            onClick={handleToggleReplies}
            title={showReplies ? "Hide replies" : "Show replies"}
          >
            {showReplies ? <FaChevronUp /> : <FaChevronDown />}
            <span>{comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}</span>
          </button>
        )}
      </div>

      {/* Reply form - only show when isReplying is true */}
      {isReplying && (
        <div className="reply-form">
          <CommentForm
            parentComment={comment._id}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}

      {/* Replies section - only show when showReplies is true */}
      {!isReply && hasReplies && showReplies && (
        <div className="replies">
          {comment.replies.map(reply => {
            // Safety check - only render if reply has required data
            if (!reply || !reply._id || !reply.author) {
              return null;
            }
            return <Comment key={reply._id} comment={reply} isReply={true} />;
          })}
        </div>
      )}
    </div>
  );
};

export default Comment;
