import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const CommentContext = createContext();

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
  
  const isMounted = useRef(true);
  const socketRef = useRef(null);

  // Initialize Socket.IO
  useEffect(() => {
    if (socketRef.current) return;

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleCommentCreated = (newComment) => {
      if (!isMounted.current) return;
      
      if (!newComment.parentComment) {
        setComments(prev => {
          const exists = prev.some(c => c._id === newComment._id);
          if (exists) return prev;
          return [newComment, ...prev];
        });
      } else {
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
    };

    const handleCommentUpdated = (updatedComment) => {
      if (!isMounted.current) return;
      updateCommentInState(updatedComment);
    };

    const handleCommentDeleted = ({ id }) => {
      if (!isMounted.current) return;
      
      setComments(prev => {
        const filtered = prev.filter(c => c._id !== id);
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
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:updated', handleCommentUpdated);
    socket.on('comment:deleted', handleCommentDeleted);
    socket.on('comment:liked', handleCommentUpdated);
    socket.on('comment:disliked', handleCommentUpdated);

    return () => {
      socket.off('comment:created');
      socket.off('comment:updated');
      socket.off('comment:deleted');
      socket.off('comment:liked');
      socket.off('comment:disliked');
    };
  }, [socket]);

  const updateCommentInState = useCallback((updatedComment) => {
    if (!updatedComment || !updatedComment._id) return;

    setComments(prev => prev.map(comment => {
      if (comment._id === updatedComment._id) {
        return { ...comment, ...updatedComment };
      }
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
  }, []);

  // Fetch comments - NOW USES api INSTANCE
  const fetchComments = useCallback(async (page = 1, sortBy = 'newest') => {
    try {
      setLoading(true);
      
      const res = await api.get('/comments', { // ✅ Uses base URL
        params: { 
          page, 
          limit: pagination.limit, 
          sort: sortBy 
        }
      });

      if (isMounted.current) {
        setComments(res.data.comments);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchComments(pagination.page, sort);
  }, [pagination.page, sort, fetchComments]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Create comment - NOW USES api INSTANCE
  const createComment = useCallback(async (content, parentComment = null) => {
    try {
      const payload = { content };
      if (parentComment) {
        payload.parentComment = parentComment;
      }
      
      const res = await api.post('/comments', payload); // ✅ Uses base URL
      return res.data;
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  }, []);

  // Update comment - NOW USES api INSTANCE
  const updateComment = useCallback(async (id, content) => {
    try {
      const res = await api.put(`/comments/${id}`, { content }); // ✅ Uses base URL
      return res.data;
    } catch (error) {
      console.error('Failed to update comment:', error);
      throw error;
    }
  }, []);

  // Delete comment - NOW USES api INSTANCE
  const deleteComment = useCallback(async (id) => {
    try {
      await api.delete(`/comments/${id}`); // ✅ Uses base URL
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  }, []);

  // Like comment - NOW USES api INSTANCE
  const likeComment = useCallback(async (id) => {
    try {
      const res = await api.post(`/comments/${id}/like`); // ✅ Uses base URL
      return res.data;
    } catch (error) {
      console.error('Failed to like comment:', error);
      throw error;
    }
  }, []);

  // Dislike comment - NOW USES api INSTANCE
  const dislikeComment = useCallback(async (id) => {
    try {
      const res = await api.post(`/comments/${id}/dislike`); // ✅ Uses base URL
      return res.data;
    } catch (error) {
      console.error('Failed to dislike comment:', error);
      throw error;
    }
  }, []);

  const changePage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const changeSort = useCallback((newSort) => {
    setSort(newSort);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const refreshComments = useCallback(() => {
    fetchComments(pagination.page, sort);
  }, [fetchComments, pagination.page, sort]);

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

