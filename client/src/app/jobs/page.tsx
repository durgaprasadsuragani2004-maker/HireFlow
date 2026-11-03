'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthContext';
import { JobCard } from '../../components/jobs/JobCard';
import { JobFilter } from '../../components/jobs/JobFilter';
import { ApplyModal } from '../../components/jobs/ApplyModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { Briefcase, Plus, ChevronLeft, ChevronRight, Home, AlertCircle, RefreshCw } from 'lucide-react';

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  // Apply Modal state
  const [selectedJobToApply, setSelectedJobToApply] = useState<any | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '9',
      });
      if (search) params.append('search', search);
      if (location) params.append('location', location);
      if (employmentType) params.append('employmentType', employmentType);
      if (experienceLevel) params.append('experienceLevel', experienceLevel);

      const res = await api.get(`/jobs?${params.toString()}`);
      if (res.data.success) {
        setJobs(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
        setTotalPages(res.data.meta?.totalPages || 1);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Unable to load job listings at this time. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, search, location, employmentType, experienceLevel]);

  const canPostJob =
    user?.role === 'RECRUITER' || user?.role === 'COMPANY' || user?.role === 'SUPER_ADMIN';

  const isEmployer = user?.role === 'RECRUITER' || user?.role === 'COMPANY';

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#A1AEC2]">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span className="text-[#64748B]">/</span>
        <span className="text-[#F1F5F9] font-semibold">
          {isEmployer ? 'Job Postings' : 'Career Opportunities'}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-tight">
            {isEmployer ? 'Company Job Postings' : 'Career Opportunities'}
          </h1>
          <p className="text-xs text-[#A1AEC2] mt-0.5">
            Discover active positions or manage candidates through recruitment pipeline stages.
          </p>
        </div>

        {canPostJob && (
          <Link
            href="/jobs/new"
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-sm hover:shadow-glow-primary flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job</span>
          </Link>
        )}
      </div>

      {/* Filter Component */}
      <JobFilter
        search={search}
        setSearch={setSearch}
        location={location}
        setLocation={setLocation}
        employmentType={employmentType}
        setEmploymentType={setEmploymentType}
        experienceLevel={experienceLevel}
        setExperienceLevel={setExperienceLevel}
      />

      {/* Jobs Grid or Feedback */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      ) : errorMessage ? (
        <div className="p-8 text-center bg-[#151F32] border border-[#2B3950] rounded-3xl shadow-card max-w-lg mx-auto my-8">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-[#F1F5F9]">Failed to Load Opportunities</h3>
          <p className="text-xs text-[#A1AEC2] mt-1">{errorMessage}</p>
          <Button onClick={fetchJobs} variant="primary" size="sm" className="mt-4">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No Positions Found"
          description="Try broadening your search query or removing active filters to view all available roles."
          actionLabel={canPostJob ? 'Post a New Job' : 'Clear Filters'}
          onAction={() => {
            if (canPostJob) {
              window.location.assign('/jobs/new');
            } else {
              setSearch('');
              setLocation('');
              setEmploymentType('');
              setExperienceLevel('');
            }
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={user?.role === 'APPLICANT' ? (j) => setSelectedJobToApply(j) : undefined}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-[#2B3950]">
              <span className="text-xs text-[#A1AEC2]">
                Showing <span className="font-semibold text-[#F1F5F9]">{jobs.length}</span> of{' '}
                <span className="font-semibold text-[#F1F5F9]">{total}</span> positions
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-xs font-semibold px-2 text-[#F1F5F9]">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Apply Modal */}
      {selectedJobToApply && (
        <ApplyModal
          isOpen={Boolean(selectedJobToApply)}
          onClose={() => setSelectedJobToApply(null)}
          job={selectedJobToApply}
          onSuccess={() => {
            fetchJobs();
          }}
        />
      )}
    </div>
  );
}
