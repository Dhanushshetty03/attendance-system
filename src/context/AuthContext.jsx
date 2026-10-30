import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('logisys_user_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('logisys_user_info', JSON.stringify(res.user));
      } else {
        setUser(null);
        api.setToken(null);
        localStorage.removeItem('logisys_user_info');
      }
    } catch (err) {
      console.error('Failed to restore user session:', err);
      setUser(null);
      api.setToken(null);
      localStorage.removeItem('logisys_user_info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success) {
      api.setToken(res.token);
      setUser(res.user);
      localStorage.setItem('logisys_user_info', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    localStorage.removeItem('logisys_user_info');
    window.location.href = '/login';
  };

  // Demo accounts helper for instant evaluation
  const switchDemoAccount = async (roleType) => {
    const credentials = {
      STUDENT_RAHUL: { email: 'student.rahul@logisys.edu', password: 'Student@123' },
      STUDENT_PRIYA: { email: 'student.priya@logisys.edu', password: 'Student@123' },
      FACULTY_SHARMA: { email: 'faculty.sharma@logisys.edu', password: 'Faculty@123' },
      FACULTY_PATEL: { email: 'faculty.patel@logisys.edu', password: 'Faculty@123' },
      ADMIN: { email: 'admin@logisys.edu', password: 'Admin@123' },
    };

    const creds = credentials[roleType] || credentials.ADMIN;
    return await login(creds.email, creds.password);
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refreshUser: fetchCurrentUser,
    switchDemoAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
