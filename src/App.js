import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CommentProvider } from './context/CommentContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import CommentList from './components/CommentList';
import './styles/App.scss';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <main className="container">
            <CommentProvider>
              <Routes>
                <Route path="/" element={<CommentList />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CommentProvider>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;