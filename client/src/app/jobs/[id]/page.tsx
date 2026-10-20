'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ApplyModal } from '../../../components/jobs/ApplyModal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../../lib/utils';
import {
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobId = params?.id as string;

  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${jobId}`);
      if (res.data.success) {
        setJob(res.data.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Job Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">This job may have been archived or unpublished.</p>
        <Link href="/jobs" className="mt-4 inline-block text-xs font-semibold text-blue-600 underline">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const isRecruiter = user?.role === 'RECRUITER';
  const isMyCompany = isRecruiter && user?.recruiterProfile?.companyId === job.companyId;
  const isExpired = Boolean(job.deadline && new Date(job.deadline) < new Date());

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Job Listings</span>
      </Link>

      {isExpired && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-rose-500 shrink-0" />
          <span>The application deadline for this position has passed ({formatDate(job.deadline)}). New applications are closed.</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {job.company?.name}
            </span>
            <Badge variant={job.status === 'PUBLISHED' ? 'success' : 'outline'}>
              {job.status}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              {job.employmentType?.replace('_', ' ')}
            </span>
            {(job.salaryMin || job.salaryMax) && (
              <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                <DollarSign className="w-4 h-4 text-slate-400 -mr-1" />
                {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Posted {formatDate(job.createdAt)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isMyCompany || user?.role === 'SUPER_ADMIN' ? (
            <Link
              href={`/applications/kanban/${job.id}`}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Open Kanban Pipeline</span>
            </Link>
          ) : job.hasApplied ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Applied ({job.applicationInfo?.currentStage})</span>
            </div>
          ) : isExpired ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold">
              <Clock className="w-4 h-4 text-rose-500" />
              <span>Applications Closed</span>
            </div>
          ) : (
            <Button
              onClick={() => setApplyModalOpen(true)}
              variant="primary"
              size="lg"
            >
              Apply for this Role
            </Button>
          )}
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">About the Position</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Responsibilities */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Core Responsibilities</h2>
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {job.responsibilities}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Candidate Requirements</h2>
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {job.requirements}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Required Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {job.skills?.split(',').map((skill: string, idx: number) => (
                <Badge key={idx} variant="info" className="text-xs py-1 px-2.5">
                  {skill.trim()}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Company Overview</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {job.company?.description || 'Leading enterprise company hiring top technical talent.'}
            </p>
            {job.company?.website && (
              <a
                href={job.company.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline block"
              >
                Visit Website ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {applyModalOpen && (
        <ApplyModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          job={job}
          onSuccess={fetchJob}
        />
      )}
    </div>
  );
}
