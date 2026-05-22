import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserSession = async () => {
    const token = localStorage.getItem('aura_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/api/v1/auth/me');
      if (res.success) {
        setUser(res.user);
      } else {
        localStorage.removeItem('aura_token');
      }
    } catch (err) {
      console.warn('Session verification failed, resetting token cache:', err.message);
      localStorage.removeItem('aura_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/v1/auth/login', { email, password });
      if (res.success) {
        localStorage.setItem('aura_token', res.token);
        setUser(res.user);
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'An error occurred during authentication.' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/api/v1/auth/register', userData);
      if (res.success) {
        localStorage.setItem('aura_token', res.token);
        setUser(res.user);
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to complete registration.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('aura_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
