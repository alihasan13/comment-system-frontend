import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults
  useEffect(() => {
    const setupAxios = () => {
      // Set base URL
      axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      // Set auth token if it exists
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        loadUser();
      } else {
        setLoading(false);
      }
    };

    setupAxios();
  }, [token]);

  // Load user data from token
  const loadUser = async () => {
    try {
      const res = await axios.get('/auth/me');
      const userData = res.data.user;
      
      // Ensure user has both id and _id for compatibility
      const normalizedUser = {
        ...userData,
        id: userData.id || userData._id,
        _id: userData._id || userData.id
      };
      
      console.log('User loaded:', normalizedUser);
      setUser(normalizedUser);
    } catch (error) {
      console.error('Failed to load user:', error);
      // If token is invalid, clear it
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', {
        email,
        password
      });

      const { token: newToken, user: userData } = res.data;

      // Normalize user data to have both id and _id
      const normalizedUser = {
        ...userData,
        id: userData.id || userData._id,
        _id: userData._id || userData.id
      };

      // Save token to localStorage
      localStorage.setItem('token', newToken);
      
      // Update state
      setToken(newToken);
      setUser(normalizedUser);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      console.log('User logged in:', normalizedUser);
      return res.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      const res = await axios.post('/auth/register', {
        username,
        email,
        password
      });

      const { token: newToken, user: userData } = res.data;

      // Normalize user data to have both id and _id
      const normalizedUser = {
        ...userData,
        id: userData.id || userData._id,
        _id: userData._id || userData.id
      };

      // Save token to localStorage
      localStorage.setItem('token', newToken);
      
      // Update state
      setToken(newToken);
      setUser(normalizedUser);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      console.log('User registered:', normalizedUser);
      return res.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Clear state
    setToken(null);
    setUser(null);
    
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
  };

  // Context value
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