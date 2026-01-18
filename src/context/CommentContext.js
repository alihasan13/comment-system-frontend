import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const CommentContext = createContext();

export const CommentProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [sort, setSort] = useState('newest');
  const [socket, setSocket] = useState(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Set up Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle new comment created
    socket.on('comment:created', (newComment) => {
      console.log('New comment received:', newComment);
      
      if (!newComment.parentComment) {
        // It's a top-level comment
        setComments(prev => {
          // Check if comment already exists
          const exists = prev.some(c => c._id === newComment._id);
          if (exists) return prev;
          return [newComment, ...prev];
        });
      } else {
        // It's a reply
        setComments(prev => prev.map(comment => {
          if (comment._id === newComment.parentComment) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment]
            };
          }
          return comment;
        }));
      }
    });

    // Handle comment updated
    socket.on('comment:updated', (updatedComment) => {
      console.log('Comment updated:', updatedComment);
      
      setComments(prev => prev.map(comment => {
        if (comment._id === updatedComment._id) {
          return { ...comment, ...updatedComment };
        }
        // Update in replies if it's a reply
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply._id === updatedComment._id ? { ...reply, ...updatedComment } : reply
            )
          };
        }
        return comment;
      }));
    });

    // Handle comment deleted
    socket.on('comment:deleted', ({ id }) => {
      console.log('Comment deleted:', id);
      
      setComments(prev => {
        // Remove top-level comment
        const filtered = prev.filter(c => c._id !== id);
        
        // Remove from replies
        return filtered.map(comment => {
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply._id !== id)
            };
          }
          return comment;
        });
      });
    });

    // Handle comment liked
    socket.on('comment:liked', (updatedComment) => {
      console.log('Comment liked:', updatedComment);
      updateCommentInState(updatedComment);
    });

    // Handle comment disliked
    socket.on('comment:disliked', (updatedComment) => {
      console.log('Comment disliked:', updatedComment);
      updateCommentInState(updatedComment);
    });

    // Cleanup listeners
    return () => {
      socket.off('comment:created');
      socket.off('comment:updated');
      socket.off('comment:deleted');
      socket.off('comment:liked');
      socket.off('comment:disliked');
    };
  }, [socket]);

  // Helper function to update comment in state
  const updateCommentInState = (updatedComment) => {
    // Check if updatedComment has required fields
    if (!updatedComment || !updatedComment._id || !updatedComment.author) {
      console.error('Invalid comment data received:', updatedComment);
      return;
    }

    setComments(prev => prev.map(comment => {
      if (comment._id === updatedComment._id) {
        return { ...comment, ...updatedComment };
      }
      // Update in replies if it's a reply
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: comment.replies.map(reply =>
            reply._id === updatedComment._id ? { ...reply, ...updatedComment } : reply
          )
        };
      }
      return comment;
    }));
  };

  // Fetch comments when page or sort changes
  useEffect(() => {
    fetchComments(pagination.page, sort);
  }, [pagination.page, sort]);

  // Fetch comments from API
  const fetchComments = async (page = 1, sortBy = 'newest') => {
    try {
      setLoading(true);
      const res = await axios.get('/comments', {
        params: { 
          page, 
          limit: pagination.limit, 
          sort: sortBy 
        }
      });

      setComments(res.data.comments);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new comment
  const createComment = async (content, parentComment = null) => {
    try {
      const payload = { content };
      
      // Only include parentComment if it exists
      if (parentComment) {
        payload.parentComment = parentComment;
      }
      
      const res = await axios.post('/comments', payload);
      
      // Don't manually update state - let Socket.IO handle it
      return res.data;
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  };

  // Update a comment
  const updateComment = async (id, content) => {
    try {
      const res = await axios.put(`/comments/${id}`, {
        content
      });
      
      // Don't manually update state - let Socket.IO handle it
      return res.data;
    } catch (error) {
      console.error('Failed to update comment:', error);
      throw error;
    }
  };

  // Delete a comment
  const deleteComment = async (id) => {
    try {
      await axios.delete(`/comments/${id}`);
      
      // Don't manually update state - let Socket.IO handle it
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  };

  // Like a comment
  const likeComment = async (id) => {
    try {
      const res = await axios.post(`/comments/${id}/like`);
      
      // Don't manually update state - let Socket.IO handle it
      return res.data;
    } catch (error) {
      console.error('Failed to like comment:', error);
      throw error;
    }
  };

  // Dislike a comment
  const dislikeComment = async (id) => {
    try {
      const res = await axios.post(`/comments/${id}/dislike`);
      
      // Don't manually update state - let Socket.IO handle it
      return res.data;
    } catch (error) {
      console.error('Failed to dislike comment:', error);
      throw error;
    }
  };

  // Change page
  const changePage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Change sort
  const changeSort = (newSort) => {
    setSort(newSort);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Refresh comments
  const refreshComments = () => {
    fetchComments(pagination.page, sort);
  };

  // Context value
  const value = {
    comments,
    loading,
    pagination,
    sort,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    dislikeComment,
    changePage,
    changeSort,
    fetchComments,
    refreshComments
  };

  return (
    <CommentContext.Provider value={value}>
      {children}
    </CommentContext.Provider>
  );
};
