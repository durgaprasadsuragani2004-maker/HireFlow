'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthContext';
import { Skeleton } from '../ui/Skeleton';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('SUPER_ADMIN' | 'COMPANY' | 'RECRUITER' | 'APPLICANT')[];
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.replace(redirectTo);
      }
    }
  }, [user, loading, redirectTo, router]);

  // While checking authentication, show clean loading skeleton to eliminate content flashing
  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="space-y-4 pt-2">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-dark-card border border-rose-800/40 rounded-3xl shadow-card text-dark-text">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/40 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-800/40">
          <ShieldAlert className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-dark-text">Access Restricted</h2>
        <p className="text-xs text-dark-muted mt-2 leading-relaxed">
          Your current account role (<span className="font-bold text-brand-300">{user.role}</span>) is not authorized to access this workspace section.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 mt-6 px-4 py-2 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-subtle transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
