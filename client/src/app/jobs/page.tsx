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
        setJobs(res.data.data);
        setTotal(res.data.meta.total);
        setTotalPages(res.data.meta.totalPages);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Unable to load job listings at this time. Please check your connection and retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, search, location, employmentType, experienceLevel]);

  const canPostJob = user?.role === 'RECRUITER' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-800 dark:text-slate-200 font-semibold">
          {user?.role === 'RECRUITER' ? 'Company Job Postings' : 'Career Opportunities'}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {user?.role === 'RECRUITER' ? 'Company Job Postings' : 'Career Opportunities'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover active positions or manage candidates through pipeline stages.
          </p>
        </div>

        {canPostJob && (
          <Link
            href="/jobs/new"
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Job</span>
          </Link>
        )}
      </div>

      {/* Filter bar */}
      <JobFilter
        search={search}
        setSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        location={location}
        setLocation={(val) => {
          setLocation(val);
          setPage(1);
        }}
        employmentType={employmentType}
        setEmploymentType={(val) => {
          setEmploymentType(val);
          setPage(1);
        }}
        experienceLevel={experienceLevel}
        setExperienceLevel={(val) => {
          setExperienceLevel(val);
          setPage(1);
        }}
      />

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobs}
            className="border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-2xl" />
          ))}
        </div>
      ) : !errorMessage && jobs.length === 0 ? (
        <EmptyState
          title="No Job Postings Found"
          description="Try broadening your search keywords or resetting filters to view more opportunities."
          actionLabel={canPostJob ? 'Create First Job' : undefined}
          onAction={() => window.location.assign('/jobs/new')}
        />
      ) : !errorMessage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={(j) => setSelectedJobToApply(j)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!errorMessage && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            Page <strong className="text-slate-900 dark:text-white">{page}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{totalPages}</strong> ({total} positions)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Quick Apply Modal */}
      {selectedJobToApply && (
        <ApplyModal
          job={selectedJobToApply}
          isOpen={!!selectedJobToApply}
          onClose={() => setSelectedJobToApply(null)}
          onSuccess={() => {
            setSelectedJobToApply(null);
            fetchJobs();
          }}
        />
      )}
    </div>
  );
}
