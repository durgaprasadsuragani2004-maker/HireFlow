'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, downloadResumeFile, getAuthenticatedResumeUrl } from '../../../lib/api';
import { useToast } from '../../../providers/ToastContext';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { getStageColor, formatDate } from '../../../lib/utils';
import { AuthGuard } from '../../../components/layout/AuthGuard';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Download,
  Linkedin,
  Github,
  Globe,
  Briefcase,
  GraduationCap,
  Layers,
} from 'lucide-react';

export default function CandidateDetailPage() {
  const params = useParams();
  const candidateId = params?.id as string;
  const { showToast } = useToast();

  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingResume, setDownloadingResume] = useState(false);

  useEffect(() => {
    const fetchCandidate = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/candidates/${candidateId}`);
        if (res.data.success) {
          setCandidate(res.data.data);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    };
    if (candidateId) fetchCandidate();
  }, [candidateId]);

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'RECRUITER']}>
      {loading ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : !candidate ? (
        <div className="max-w-xl mx-auto text-center py-16">
          <h2 className="text-xl font-bold">Candidate Not Found</h2>
          <Link href="/applicants" className="text-xs text-blue-600 underline mt-2 inline-block">
            Back to Candidates
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6 py-2">

      <Link
        href="/applicants"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Candidate Pool</span>
      </Link>

      {/* Candidate Profile Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            {candidate.fullName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {candidate.fullName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {candidate.headline || 'Software Engineer'}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {candidate.user?.email}
              </span>
              {candidate.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {candidate.phone}
                </span>
              )}
              {candidate.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {candidate.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Resume Download Action */}
        {candidate.resumeUrl && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={async () => {
                setDownloadingResume(true);
                try {
                  await downloadResumeFile(candidate.resumeUrl, candidate.fullName);
                  showToast('Resume downloaded successfully', 'success');
                } catch (err: any) {
                  showToast(
                    err.response?.data?.message || err.message || 'Failed to download resume',
                    'error'
                  );
                } finally {
                  setDownloadingResume(false);
                }
              }}
              disabled={downloadingResume}
              className="px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingResume ? 'Downloading...' : 'Download Resume'}</span>
            </button>
            <a
              href={getAuthenticatedResumeUrl(candidate.resumeUrl)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
              title="Open in new browser tab"
            >
              Open in Tab
            </a>
          </div>
        )}
      </div>

      {/* Professional Links */}
      {(candidate.linkedinUrl || candidate.githubUrl || candidate.portfolioUrl) && (
        <div className="flex flex-wrap items-center gap-3">
          {candidate.linkedinUrl && (
            <a
              href={candidate.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:text-blue-600 flex items-center gap-1.5 shadow-xs"
            >
              <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn
            </a>
          )}
          {candidate.githubUrl && (
            <a
              href={candidate.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:text-blue-600 flex items-center gap-1.5 shadow-xs"
            >
              <Github className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" /> GitHub
            </a>
          )}
          {candidate.portfolioUrl && (
            <a
              href={candidate.portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:text-blue-600 flex items-center gap-1.5 shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" /> Portfolio
            </a>
          )}
        </div>
      )}

      {/* Summary */}
      {candidate.summary && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Professional Summary</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
            {candidate.summary}
          </p>
        </div>
      )}

      {/* Skills */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Verified Skills & Proficiency</h2>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map((s: any) => (
              <Badge key={s.id} variant="info" className="text-xs py-1 px-3">
                {s.name} • {s.level || 'Expert'} {s.yearsOfExperience ? `(${s.yearsOfExperience} yrs)` : ''}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Application History */}
      {candidate.applications && candidate.applications.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Application Journey</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {candidate.applications.map((app: any) => {
              const stageColors = getStageColor(app.currentStage);
              return (
                <div key={app.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {app.job.title}
                    </span>
                    <div className="text-[11px] text-slate-500">
                      {app.job.company.name} • Applied {formatDate(app.appliedAt)}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${stageColors.bg} ${stageColors.text} ${stageColors.border}`}
                  >
                    {app.currentStage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )}
</AuthGuard>
);
}
