import React, { useContext } from 'react';
import { CommentContext } from '../context/CommentContext';
import Comment from './Comment';
import CommentForm from './CommentForm';
import '../styles/CommentList.scss';

const CommentList = () => {
  const { comments, loading, pagination, sort, changePage, changeSort } = useContext(CommentContext);

  const handleSortChange = (e) => {
    changeSort(e.target.value);
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      changePage(pagination.page - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      changePage(pagination.page + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading && comments.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="comment-section">
      <div className="comment-section-header">
        <h2>Comments ({pagination.total})</h2>
        <div className="sort-controls">
          <label htmlFor="sort-select">Sort by:</label>
          <select 
            id="sort-select"
            value={sort} 
            onChange={handleSortChange}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="mostLiked">Most Liked</option>
            <option value="mostDisliked">Most Disliked</option>
          </select>
        </div>
      </div>

      <CommentForm />

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <>
            {comments.map(comment => (
              <Comment key={comment._id} comment={comment} />
            ))}
          </>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={handlePreviousPage}
            disabled={pagination.page === 1 || loading}
            className="btn-secondary"
          >
            ← Previous
          </button>
          <span className="page-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={pagination.page === pagination.pages || loading}
            className="btn-secondary"
          >
            Next →
          </button>
        </div>
      )}

      {loading && comments.length > 0 && (
        <div className="loading-overlay">
          <div className="loading">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default CommentList;