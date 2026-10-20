'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useToast } from './ToastContext';

export interface User {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'RECRUITER' | 'APPLICANT';
  status: 'ACTIVE' | 'SUSPENDED';
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
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoUser: (demoKey: 'admin' | 'recruiter_technova' | 'recruiter_quantum' | 'applicant_alex' | 'applicant_elena') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_ACCOUNTS = {
  admin: { email: 'admin@hireflow.dev', password: 'Admin@123456', label: 'Super Admin' },
  recruiter_technova: { email: 'sarah.recruiter@technova.com', password: 'Recruiter@123456', label: 'Recruiter (TechNova)' },
  recruiter_quantum: { email: 'marcus.recruiter@quantum.ai', password: 'Recruiter@123456', label: 'Recruiter (QuantumLabs)' },
  applicant_alex: { email: 'alex.dev@gmail.com', password: 'Applicant@123456', label: 'Applicant (Alex - Full Stack)' },
  applicant_elena: { email: 'elena.frontend@gmail.com', password: 'Applicant@123456', label: 'Applicant (Elena - Frontend)' },
};

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
      localStorage.removeItem('hireflow_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: loggedInUser, tokens } = res.data.data;
      localStorage.setItem('hireflow_token', tokens.accessToken);
      localStorage.setItem('hireflow_refresh_token', tokens.refreshToken);
      setUser(loggedInUser);
      showToast(`Welcome back, ${loggedInUser.email}!`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      const { user: registeredUser, tokens } = res.data.data;
      localStorage.setItem('hireflow_token', tokens.accessToken);
      localStorage.setItem('hireflow_refresh_token', tokens.refreshToken);
      setUser(registeredUser);
      showToast('Account registered successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed.';
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('hireflow_token');
    localStorage.removeItem('hireflow_refresh_token');
    setUser(null);
    showToast('You have been logged out', 'info');
  };

  const switchDemoUser = async (
    demoKey: 'admin' | 'recruiter_technova' | 'recruiter_quantum' | 'applicant_alex' | 'applicant_elena'
  ) => {
    const demo = DEMO_ACCOUNTS[demoKey];
    if (demo) {
      await login(demo.email, demo.password);
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
        switchDemoUser,
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
