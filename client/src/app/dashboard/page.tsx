'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthContext';
import { api } from '../../lib/api';
import { AdminDashboard } from '../../components/dashboard/AdminDashboard';
import { RecruiterDashboard } from '../../components/dashboard/RecruiterDashboard';
import { ApplicantDashboard } from '../../components/dashboard/ApplicantDashboard';
import { Skeleton } from '../../components/ui/Skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/dashboard/applicant';
      if (user.role === 'SUPER_ADMIN') endpoint = '/dashboard/admin';
      else if (user.role === 'RECRUITER') endpoint = '/dashboard/recruiter';

      const res = await api.get(endpoint);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchDashboardData();
      }
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Unable to Load Dashboard</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
        <Button onClick={fetchDashboardData} variant="primary" size="sm" className="mt-4">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  if (user?.role === 'SUPER_ADMIN') {
    return <AdminDashboard data={data} />;
  }

  if (user?.role === 'RECRUITER') {
    return <RecruiterDashboard data={data} />;
  }

  return <ApplicantDashboard data={data} />;
}
