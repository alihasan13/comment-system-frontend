import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      // Set auth token for the axios instance
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Also set for global axios (for backward compatibility)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Load user data from token
  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me'); // ✅ Uses base URL
      const userData = res.data.user;
      
      const normalizedUser = {
        ...userData,
        id: userData.id || userData._id,
        _id: userData._id || userData.id
      };
      
      setUser(normalizedUser);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { // ✅ Uses base URL
        email,
        password
      });

      const { token: newToken, user: userData } = res.data;

      const normalizedUser = {
        ...userData,
        id: userData.id || userData._id,
        _id: userData._id || userData.id
      };

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(normalizedUser);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return res.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      const res = await api.post('/auth/register', { // ✅ Uses base URL
        username,
        email,
        password
      });

      const { token: newToken, user: userData } = res.data;

      const normalizedUser = {
        ...userData,
        id: userData.id || userData._id,
        _id: userData._id || userData.id
      };

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(normalizedUser);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return res.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

