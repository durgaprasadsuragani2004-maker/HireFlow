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
import { Briefcase, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  // Apply Modal state
  const [selectedJobToApply, setSelectedJobToApply] = useState<any | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
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
    } catch {
      // Ignore
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

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-2xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No Job Postings Found"
          description="Try broadening your search keywords or resetting filters to view more opportunities."
          actionLabel={canPostJob ? 'Create First Job' : undefined}
          onAction={() => window.location.assign('/jobs/new')}
        />
      ) : (
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            Showing Page {page} of {totalPages} ({total} total jobs)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {selectedJobToApply && (
        <ApplyModal
          isOpen={!!selectedJobToApply}
          onClose={() => setSelectedJobToApply(null)}
          job={selectedJobToApply}
          onSuccess={fetchJobs}
        />
      )}
    </div>
  );
}
