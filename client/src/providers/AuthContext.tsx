'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useToast } from './ToastContext';

export interface User {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY' | 'RECRUITER' | 'APPLICANT';
  status: 'ACTIVE' | 'SUSPENDED';
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
    logo?: string | null;
  } | null;
  recruiterProfile?: {
    id: string;
    companyId: string;
    companyName?: string;
    title?: string;
  } | null;
  applicantProfile?: {
    id: string;
    fullName: string;
    resumeUrl?: string;
    phone?: string | null;
    location?: string | null;
    headline?: string | null;
    summary?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('hireflow_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch {
      localStorage.removeItem('hireflow_token');
      localStorage.removeItem('hireflow_refresh_token');
      localStorage.removeItem('hireflow_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Revalidate session when user navigates using browser back/forward (BFCache)
    const handlePageShow = (e: PageTransitionEvent) => {
      const token = localStorage.getItem('hireflow_token');
      if (e.persisted || !token) {
        refreshUser();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: loggedInUser, tokens } = res.data.data;
      localStorage.setItem('hireflow_token', tokens.accessToken);
      localStorage.setItem('hireflow_refresh_token', tokens.refreshToken);
      setUser(loggedInUser);
      showToast(`Welcome back, ${loggedInUser.email}!`, 'success');
      return loggedInUser;
    } catch (err: any) {
      const errorList = err.response?.data?.errors;
      const detailedMsg = Array.isArray(errorList) && errorList.length > 0
        ? errorList.map((e: any) => e.message).filter(Boolean).join('; ')
        : null;
      const msg = detailedMsg || err.response?.data?.message || 'Login failed. Please check your credentials.';
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any): Promise<User> => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      const { user: registeredUser, tokens } = res.data.data;
      localStorage.setItem('hireflow_token', tokens.accessToken);
      localStorage.setItem('hireflow_refresh_token', tokens.refreshToken);
      setUser(registeredUser);
      showToast('Account registered successfully!', 'success');
      return registeredUser;
    } catch (err: any) {
      const errorList = err.response?.data?.errors;
      const detailedMsg = Array.isArray(errorList) && errorList.length > 0
        ? errorList.map((e: any) => e.message).filter(Boolean).join('; ')
        : null;
      const msg = detailedMsg || err.response?.data?.message || 'Registration failed.';
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      try {
        await api.post('/auth/logout');
      } catch {
        // Continue client logout even if network fails
      }
      localStorage.removeItem('hireflow_token');
      localStorage.removeItem('hireflow_refresh_token');
      localStorage.removeItem('hireflow_user');
      sessionStorage.clear();
      setUser(null);
      showToast('You have been logged out', 'info');
      // Hard redirect to home page to reset all in-memory React query/state caches
      window.location.href = '/';
    } catch {
      showToast('Error during logout', 'error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
