'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, DollarSign, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../providers/AuthContext';

interface JobCardProps {
  job: any;
  onApply?: (job: any) => void;
  hasApplied?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply, hasApplied }) => {
  const { user } = useAuth();
  const isRecruiter = user?.role === 'RECRUITER';
  const isMyCompanyJob = isRecruiter && user?.recruiterProfile?.companyId === job.companyId;
  const isExpired = Boolean(job.deadline && new Date(job.deadline) < new Date());

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {job.company?.name || 'HireFlow Partner'}
            </span>
            <Link
              href={`/jobs/${job.id}`}
              className="block font-bold text-base text-slate-900 dark:text-white hover:text-blue-600 transition-colors mt-0.5"
            >
              {job.title}
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            {isExpired && (
              <Badge variant="danger" className="text-[10px]">
                Closed
              </Badge>
            )}
            <Badge variant={job.status === 'PUBLISHED' ? 'success' : 'outline'}>
              {job.status}
            </Badge>
          </div>
        </div>

        {/* Location & Metadata */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {job.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {job.employmentType?.replace('_', ' ')}
          </span>
          {(job.salaryMin || job.salaryMax) && (
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <DollarSign className="w-3.5 h-3.5 -mr-1" />
              {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
            </span>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Skills */}
        {job.skills && (
          <div className="flex flex-wrap gap-1 mt-3">
            {job.skills
              .split(',')
              .slice(0, 4)
              .map((s: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-[10px]">
                  {s.trim()}
                </Badge>
              ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {job._count?.applications ?? 0} applicants
        </span>

        <div className="flex items-center gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Details
          </Link>

          {isMyCompanyJob ? (
            <Link
              href={`/applications/kanban/${job.id}`}
              className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1"
            >
              <span>Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : hasApplied ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Applied
            </span>
          ) : isExpired ? (
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
              Closed
            </span>
          ) : (
            onApply && (
              <button
                onClick={() => onApply(job)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors"
              >
                Apply Now
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
