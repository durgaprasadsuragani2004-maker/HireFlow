'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthContext';
import { api } from '../../lib/api';
import { AdminDashboard } from '../../components/dashboard/AdminDashboard';
import { CompanyDashboard } from '../../components/dashboard/CompanyDashboard';
import { RecruiterDashboard } from '../../components/dashboard/RecruiterDashboard';
import { ApplicantDashboard } from '../../components/dashboard/ApplicantDashboard';
import { Skeleton } from '../../components/ui/Skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AuthGuard } from '../../components/layout/AuthGuard';

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
      else if (user.role === 'COMPANY') endpoint = '/dashboard/company';
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

  return (
    <AuthGuard>
      {authLoading || loading ? (
        <div className="space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-3xl" />
            <Skeleton className="h-80 rounded-3xl" />
          </div>
        </div>
      ) : error ? (
        <div className="p-8 text-center skeuo-card border border-[#E4E3EF] rounded-3xl max-w-lg mx-auto my-12">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3 border border-rose-500/20 shadow-inner">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#202033]">Unable to Load Telemetry</h3>
          <p className="text-xs text-[#68677D] mt-1 max-w-sm mx-auto leading-relaxed">{error}</p>
          <Button onClick={fetchDashboardData} variant="primary" size="sm" className="mt-5">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
        </div>
      ) : user?.role === 'SUPER_ADMIN' ? (
        <AdminDashboard data={data} onRefresh={fetchDashboardData} />
      ) : user?.role === 'COMPANY' ? (
        <CompanyDashboard data={data} onRefresh={fetchDashboardData} />
      ) : user?.role === 'RECRUITER' ? (
        <RecruiterDashboard data={data} onRefresh={fetchDashboardData} />
      ) : (
        <ApplicantDashboard data={data} />
      )}
    </AuthGuard>
  );
}
