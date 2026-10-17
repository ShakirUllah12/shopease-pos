import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(true);

  // Check initial setup status (whether owner exists in DB)
  const checkSetupStatus = useCallback(async () => {
    try {
      const res = await api.get('/auth/setup-status');
      setIsInitialized(res.data.isInitialized);
      return res.data.isInitialized;
    } catch (err) {
      console.error('Error checking setup status:', err);
      return true;
    }
  }, []);

  // Fetch currently authenticated user
  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('shopease_token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setToken(savedToken);
    } catch (err) {
      localStorage.removeItem('shopease_token');
      localStorage.removeItem('shopease_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await checkSetupStatus();
      await fetchCurrentUser();
    }
    init();
  }, [checkSetupStatus, fetchCurrentUser]);

  // Login handler
  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: jwtToken, user: userData } = res.data;

    localStorage.setItem('shopease_token', jwtToken);
    localStorage.setItem('shopease_user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  // Safe initial owner setup
  const setupInitialOwner = async (data) => {
    const res = await api.post('/auth/setup-initial-owner', data);
    const { token: jwtToken, user: userData } = res.data;

    localStorage.setItem('shopease_token', jwtToken);
    localStorage.setItem('shopease_user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
    setIsInitialized(true);
    return userData;
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore errors if offline
    } finally {
      localStorage.removeItem('shopease_token');
      localStorage.removeItem('shopease_user');
      setToken(null);
      setUser(null);
    }
  };

  const isOwner = user?.role === 'owner';
  const isCashier = user?.role === 'cashier';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isInitialized,
        isAuthenticated: !!user,
        isOwner,
        isCashier,
        login,
        setupInitialOwner,
        logout,
        checkSetupStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
