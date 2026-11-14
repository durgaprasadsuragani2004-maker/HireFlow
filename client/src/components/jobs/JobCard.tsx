'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, DollarSign, Clock, CheckCircle2, ArrowRight, Layers, Edit, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatCurrency, normalizeJobStatus } from '../../lib/utils';
import { useAuth } from '../../providers/AuthContext';

interface JobCardProps {
  job: any;
  onApply?: (job: any) => void;
  onDelete?: (job: any) => void;
  hasApplied?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply, onDelete, hasApplied }) => {
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
    <div className="skeuo-card-interactive p-5 sm:p-6 flex flex-col justify-between border border-[#E4E3EF] shadow-sm">
      <div>
        {/* Responsive Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-3">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-[#6C5CE7] uppercase tracking-wider block truncate mb-0.5">
              {job.company?.name || 'HireFlow Partner'}
            </span>
            <Link
              href={`/jobs/${job.id}`}
              className="block font-bold text-base text-[#202033] hover:text-[#6C5CE7] transition-colors line-clamp-2 break-words"
            >
              {job.title}
            </Link>
          </div>

          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 shrink-0 max-w-full">
            <Badge
              variant={jobStatus.badgeVariant}
              className="text-[10px] whitespace-nowrap shadow-sm"
            >
              {jobStatus.label}
            </Badge>
          </div>
        </div>

        {/* Location & Metadata */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3.5 text-xs text-[#68677D] mt-2">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#9E9EB3]" />
            <span className="truncate">{job.location}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#9E9EB3]" />
            <span>{job.employmentType?.replace('_', ' ')}</span>
          </span>
          {(job.salaryMin || job.salaryMax) && (
            <span className="flex items-center gap-1 font-bold text-[#202033]">
              <DollarSign className="w-3.5 h-3.5 text-[#9E9EB3] -mr-1" />
              <span>{formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}</span>
            </span>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-[#68677D] mt-3 line-clamp-2 leading-relaxed">
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
                  className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-[#F0F1F8] text-[#68677D] border border-[#E4E3EF]"
                >
                  {s.trim()}
                </span>
              ))}
          </div>
        )}

        {canManage && job.recruiter?.user?.email && (
          <div className="mt-2.5 text-[11px] text-[#68677D] flex items-center gap-1.5">
            <span className="text-[#9E9EB3]">HR Lead:</span>
            <span className="text-[#16A878] font-medium truncate">{job.recruiter.user.email}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-[#E4E3EF] flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[#68677D]">
          {job._count?.applications ?? 0} {job._count?.applications === 1 ? 'applicant' : 'applicants'}
        </span>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/jobs/${job.id}`}
            className="neu-btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl"
          >
            Details
          </Link>

          {canManage ? (
            <>
              <Link
                href={`/jobs/${job.id}/edit`}
                className="neu-btn-secondary px-2.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1"
              >
                <Edit className="w-3 h-3" />
                <span>Edit</span>
              </Link>
              <Link
                href={`/applications/kanban/${job.id}`}
                className="neu-btn-secondary px-3 py-1.5 text-xs font-bold text-[#6C5CE7] hover:text-[#5B4BD8] rounded-xl flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Kanban</span>
              </Link>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(job)}
                  className="neu-icon-btn p-1.5 text-rose-500 hover:text-rose-600 rounded-xl cursor-pointer"
                  title="Delete or Archive Position"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : isApplicant ? (
            appliedOrActive ? (
              <span
                className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 border shadow-sm ${
                  isApplicationRejected
                    ? 'bg-[#E05260]/12 text-[#E05260] border-[#E05260]/30'
                    : 'bg-[#16A878]/12 text-[#16A878] border-[#16A878]/30'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isApplicationRejected ? 'Declined' : 'Applied'}</span>
              </span>
            ) : !jobStatus.isOpen ? (
              <span className="px-3 py-1.5 text-xs font-semibold text-[#68677D] bg-[#F0F1F8] rounded-xl border border-[#E4E3EF]">
                {jobStatus.isExpired ? 'Expired' : 'Closed'}
              </span>
            ) : onApply ? (
              <button
                type="button"
                onClick={() => onApply(job)}
                className="neu-btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <span>Apply Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href={`/jobs/${job.id}`}
                className="neu-btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1"
              >
                <span>Apply Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )
          ) : !jobStatus.isOpen ? (
            <span className="px-3 py-1.5 text-xs font-semibold text-[#68677D] bg-[#F0F1F8] rounded-xl border border-[#E4E3EF]">
              {jobStatus.isExpired ? 'Expired' : 'Closed'}
            </span>
          ) : (
            <Link
              href={`/jobs/${job.id}`}
              className="neu-btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1"
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
