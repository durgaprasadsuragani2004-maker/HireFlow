'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, DollarSign, Clock, CheckCircle2, ArrowRight, Layers, Edit } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatCurrency, normalizeJobStatus } from '../../lib/utils';
import { useAuth } from '../../providers/AuthContext';

interface JobCardProps {
  job: any;
  onApply?: (job: any) => void;
  hasApplied?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply, hasApplied }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isRecruiter = user?.role === 'RECRUITER';
  const isCompany = user?.role === 'COMPANY';
  const isApplicant = user?.role === 'APPLICANT';

  // Check if current user is recruiter or company account authorized for this specific job
  const isMyCompanyJob = isCompany && user?.companyId === job.companyId;
  const isMyAssignedJob =
    isRecruiter &&
    user?.recruiterProfile?.companyId === job.companyId &&
    (job.recruiterId === user?.id || job.recruiterId === user?.recruiterProfile?.id);

  // Super Admin can manage all jobs; Employers manage only their own company's jobs; Recruiter only assigned jobs
  const canManage = isSuperAdmin || isMyCompanyJob || isMyAssignedJob;

  const jobStatus = normalizeJobStatus(job);
  const appliedOrActive = Boolean(hasApplied ?? job.hasApplied);
  const isApplicationRejected = job.applicationInfo?.currentStage === 'REJECTED';

  return (
    <div className="bg-[#151F32] border border-[#2B3950] rounded-2xl p-5 sm:p-6 shadow-card hover:shadow-card-hover hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Responsive Header: Prevents status badge overflow across all screen sizes */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-3">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block truncate mb-0.5">
              {job.company?.name || 'HireFlow Partner'}
            </span>
            <Link
              href={`/jobs/${job.id}`}
              className="block font-bold text-base text-[#F1F5F9] hover:text-indigo-400 transition-colors line-clamp-2 break-words"
            >
              {job.title}
            </Link>
          </div>

          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 shrink-0 max-w-full">
            <Badge
              variant={jobStatus.badgeVariant}
              className="text-[10px] whitespace-nowrap"
            >
              {jobStatus.label}
            </Badge>
          </div>
        </div>

        {/* Location & Metadata */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3.5 text-xs text-[#A1AEC2] mt-2">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="truncate">{job.location}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{job.employmentType?.replace('_', ' ')}</span>
          </span>
          {(job.salaryMin || job.salaryMax) && (
            <span className="flex items-center gap-1 font-semibold text-[#F1F5F9]">
              <DollarSign className="w-3.5 h-3.5 text-[#64748B] -mr-1" />
              <span>{formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}</span>
            </span>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-[#A1AEC2] mt-3 line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Skills */}
        {job.skills && (
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {job.skills
              .split(',')
              .slice(0, 4)
              .map((s: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#1E293B] text-[#A1AEC2] border border-[#2B3950]"
                >
                  {s.trim()}
                </span>
              ))}
          </div>
        )}

        {canManage && job.recruiter?.user?.email && (
          <div className="mt-2.5 text-[11px] text-[#A1AEC2] flex items-center gap-1.5">
            <span className="text-[#64748B]">HR Lead:</span>
            <span className="text-teal-400 font-medium truncate">{job.recruiter.user.email}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-[#2B3950] flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[#64748B]">
          {job._count?.applications ?? 0} {job._count?.applications === 1 ? 'applicant' : 'applicants'}
        </span>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/jobs/${job.id}`}
            className="px-2.5 py-1.5 text-xs font-semibold text-[#A1AEC2] hover:text-[#F1F5F9] rounded-xl hover:bg-[#1C2940] transition-colors"
          >
            Details
          </Link>

          {canManage ? (
            <>
              <Link
                href={`/jobs/${job.id}/edit`}
                className="px-2.5 py-1.5 text-xs font-semibold text-[#A1AEC2] hover:text-[#F1F5F9] bg-[#1C2940] hover:bg-[#28374E] rounded-xl border border-[#2B3950] transition-colors flex items-center gap-1"
              >
                <Edit className="w-3 h-3" />
                <span>Edit</span>
              </Link>
              <Link
                href={`/applications/kanban/${job.id}`}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-500/15 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-xl border border-indigo-500/30 transition-all flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </Link>
            </>
          ) : isApplicant ? (
            appliedOrActive ? (
              <span
                className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 border ${
                  isApplicationRejected
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isApplicationRejected ? 'Declined' : 'Applied'}</span>
              </span>
            ) : !jobStatus.isOpen ? (
              <span className="px-3 py-1.5 text-xs font-semibold text-[#64748B] bg-[#1E293B] rounded-xl border border-[#2B3950]">
                {jobStatus.isExpired ? 'Expired' : 'Closed'}
              </span>
            ) : onApply ? (
              <button
                type="button"
                onClick={() => onApply(job)}
                className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm hover:shadow-glow-primary transition-all flex items-center gap-1"
              >
                <span>Apply Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href={`/jobs/${job.id}`}
                className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm hover:shadow-glow-primary transition-all flex items-center gap-1"
              >
                <span>Apply Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )
          ) : !jobStatus.isOpen ? (
            <span className="px-3 py-1.5 text-xs font-semibold text-[#64748B] bg-[#1E293B] rounded-xl border border-[#2B3950]">
              {jobStatus.isExpired ? 'Expired' : 'Closed'}
            </span>
          ) : (
            <Link
              href={`/jobs/${job.id}`}
              className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm hover:shadow-glow-primary transition-all flex items-center gap-1"
            >
              <span>View Opening</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
