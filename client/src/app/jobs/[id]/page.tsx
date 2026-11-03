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
import { formatCurrency, formatDate, normalizeJobStatus } from '../../../lib/utils';
import {
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Home,
  Edit,
  XCircle,
  Building2,
  Globe,
  Award,
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
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
          <div>
            <Skeleton className="h-72 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-[#F1F5F9]">Job Not Found</h2>
        <p className="text-xs text-[#A1AEC2] mt-1">This job may have been archived or unpublished.</p>
        <Link href="/jobs" className="mt-4 inline-block text-xs font-bold text-indigo-400 underline">
          Back to Career Board
        </Link>
      </div>
    );
  }

  const isRecruiter = user?.role === 'RECRUITER';
  const isCompany = user?.role === 'COMPANY';
  const isMyCompany =
    (isRecruiter || isCompany) &&
    (user?.companyId === job.companyId || user?.recruiterProfile?.companyId === job.companyId);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canManage = isMyCompany || isSuperAdmin;
  const jobStatus = normalizeJobStatus(job);

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
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
        <Link href="/jobs" className="hover:text-indigo-400 transition-colors">
          Job Board
        </Link>
        <span className="text-[#64748B]">/</span>
        <span className="text-[#F1F5F9] font-semibold truncate max-w-xs">{job.title}</span>
      </nav>

      {/* Top Bar with Back and Admin Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A1AEC2] hover:text-[#F1F5F9] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Openings</span>
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            <Link
              href={`/jobs/${job.id}/edit`}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#F1F5F9] bg-[#1C2940] hover:bg-[#28374E] rounded-xl border border-[#2B3950] transition-colors flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </Link>
            <Link
              href={`/applications/kanban/${job.id}`}
              className="px-3.5 py-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-600 hover:text-white rounded-xl border border-indigo-500/30 transition-all flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Job Content (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 sm:p-8 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {job.company?.name || 'HireFlow Partner'}
              </span>
              <div className="flex items-center gap-2">
                {jobStatus.isExpired && (
                  <Badge variant="danger" className="text-[10px]">
                    Application Deadline Passed
                  </Badge>
                )}
                <Badge variant={jobStatus.badgeVariant}>
                  {jobStatus.label}
                </Badge>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F1F5F9] tracking-tight">
              {job.title}
            </h1>

            {/* Quick Meta Pills */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-[#2B3950] text-xs text-[#A1AEC2]">
              <span className="flex items-center gap-1.5 bg-[#101726] border border-[#2B3950] px-3 py-1.5 rounded-xl font-medium text-[#F1F5F9]">
                <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                <span>{job.location}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-[#101726] border border-[#2B3950] px-3 py-1.5 rounded-xl font-medium text-[#F1F5F9]">
                <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                <span>{job.employmentType?.replace('_', ' ')}</span>
              </span>
              {job.experienceLevel && (
                <span className="flex items-center gap-1.5 bg-[#101726] border border-[#2B3950] px-3 py-1.5 rounded-xl font-medium text-[#F1F5F9]">
                  <Award className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{job.experienceLevel?.replace('_', ' ')}</span>
                </span>
              )}
              {(job.salaryMin || job.salaryMax) && (
                <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl font-bold">
                  <DollarSign className="w-3.5 h-3.5 -mr-1" />
                  <span>{formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Role Overview */}
          <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9] mb-3">About the Role</h2>
              <p className="text-sm text-[#A1AEC2] leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {job.responsibilities && (
              <div className="pt-4 border-t border-[#2B3950]">
                <h3 className="text-sm font-bold text-[#F1F5F9] mb-3">Core Responsibilities</h3>
                <div className="text-sm text-[#A1AEC2] leading-relaxed whitespace-pre-line">
                  {job.responsibilities}
                </div>
              </div>
            )}

            {job.requirements && (
              <div className="pt-4 border-t border-[#2B3950]">
                <h3 className="text-sm font-bold text-[#F1F5F9] mb-3">Qualifications & Requirements</h3>
                <div className="text-sm text-[#A1AEC2] leading-relaxed whitespace-pre-line">
                  {job.requirements}
                </div>
              </div>
            )}

            {job.skills && (
              <div className="pt-4 border-t border-[#2B3950]">
                <h3 className="text-sm font-bold text-[#F1F5F9] mb-3">Required Technical Competencies</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.split(',').map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#1E293B] text-[#A1AEC2] border border-[#2B3950]"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Apply Action (Right 1 col) */}
        <div className="space-y-6 lg:sticky lg:top-20">
          {/* Action Card */}
          <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-[#F1F5F9]">Application Status</h3>

            {job.hasApplied ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Application Submitted</span>
                </div>
                <div className="text-xs text-[#A1AEC2]">
                  Status:{' '}
                  <span className="font-bold text-[#F1F5F9]">
                    {job.applicationInfo?.currentStage || 'APPLIED'}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Applied: {formatDate(job.applicationInfo?.createdAt)}
                </div>
              </div>
            ) : !jobStatus.isOpen ? (
              <div className="p-4 bg-[#101726] border border-[#2B3950] rounded-2xl text-[#A1AEC2] text-xs">
                {jobStatus.isExpired
                  ? 'The application deadline for this position has passed.'
                  : 'This position is closed and no longer accepting new submissions.'}
              </div>
            ) : user?.role === 'APPLICANT' ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full text-xs font-bold"
                onClick={() => setApplyModalOpen(true)}
              >
                Apply for this Position
              </Button>
            ) : !user ? (
              <div className="space-y-2.5">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full text-xs font-bold"
                  onClick={() => router.push('/login')}
                >
                  Sign in to Apply
                </Button>
                <p className="text-[11px] text-[#A1AEC2] text-center">
                  Create an account or sign in as a candidate to apply.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-[#101726] border border-[#2B3950] rounded-2xl text-[11px] text-[#A1AEC2]">
                Logged in as <strong className="text-[#F1F5F9]">{user.role.replace('_', ' ')}</strong>. Job applications are open to candidate accounts.
              </div>
            )}

            <div className="pt-3 border-t border-[#2B3950] space-y-2 text-xs text-[#A1AEC2]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Total Applicants:</span>
                <span className="font-bold text-[#F1F5F9]">{job._count?.applications || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Posted On:</span>
                <span className="font-semibold text-[#F1F5F9]">{formatDate(job.createdAt)}</span>
              </div>
              {job.deadline && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Deadline:</span>
                  <span className="font-semibold text-[#F1F5F9]">{formatDate(job.deadline)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned HR / Recruiter Lead */}
          {job.recruiter && (
            <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 shadow-card space-y-3">
              <h4 className="font-bold text-xs text-[#A1AEC2] uppercase tracking-wider">Assigned HR / Recruiter Lead</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {job.recruiter.user?.email?.[0]?.toUpperCase() || 'R'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#F1F5F9] truncate">
                    {job.recruiter.user?.email}
                  </div>
                  <div className="text-[11px] text-[#A1AEC2]">
                    {job.recruiter.title || 'Talent Acquisition'}{job.recruiter.department ? ` • ${job.recruiter.department}` : ''}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Company Info Box */}
          {job.company && (
            <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 shadow-card space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-base shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#F1F5F9]">{job.company.name}</h4>
                  <p className="text-[11px] text-[#A1AEC2]">{job.company.industry || 'Technology Partner'}</p>
                </div>
              </div>

              {job.company.description && (
                <p className="text-xs text-[#A1AEC2] leading-relaxed pt-2 border-t border-[#2B3950]">
                  {job.company.description}
                </p>
              )}

              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 pt-1"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Visit company website</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {applyModalOpen && (
        <ApplyModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          job={job}
          onSuccess={() => {
            fetchJob();
          }}
        />
      )}
    </div>
  );
}
