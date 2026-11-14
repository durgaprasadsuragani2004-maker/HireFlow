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
  FileText,
  ExternalLink,
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
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'COMPANY', 'RECRUITER']}>
      {loading ? (
        <div className="max-w-4xl mx-auto space-y-6 py-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : !candidate ? (
        <div className="max-w-xl mx-auto text-center py-16">
          <h2 className="text-xl font-bold text-[#202033]">Candidate Not Found</h2>
          <Link href="/applicants" className="text-xs text-indigo-400 font-bold underline mt-2 inline-block">
            Back to Candidate Pool
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6 py-2">
          <Link
            href="/applicants"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68677D] hover:text-[#202033] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Candidate Pool</span>
          </Link>

          {/* Candidate Profile Header Card (Skeuomorphic solid surface) */}
          <div className="skeuo-card p-6 sm:p-8 border border-[#E4E3EF] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-indigo-500 to-indigo-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-neu-primary border border-white/20 shrink-0">
                {candidate.fullName[0]}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#202033] tracking-tight">
                  {candidate.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-[#68677D] mt-0.5">
                  {candidate.headline || 'Software Engineering Professional'}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#68677D] mt-2 font-mono">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>{candidate.user?.email}</span>
                  </span>
                  {candidate.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{candidate.phone}</span>
                    </span>
                  )}
                  {candidate.location && (
                    <span className="flex items-center gap-1 font-sans">
                      <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{candidate.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Resume Download Action */}
            {candidate.resumeUrl && (
              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <button
                  type="button"
                  disabled={downloadingResume}
                  onClick={async () => {
                    setDownloadingResume(true);
                    try {
                      await downloadResumeFile(candidate.resumeUrl, candidate.fullName);
                      showToast('Resume downloaded successfully', 'success');
                    } catch (err: any) {
                      showToast(err.response?.data?.message || 'Failed to download resume', 'error');
                    } finally {
                      setDownloadingResume(false);
                    }
                  }}
                  className="neu-btn-primary px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingResume ? 'Downloading...' : 'Download Resume'}</span>
                </button>
                <a
                  href={getAuthenticatedResumeUrl(candidate.resumeUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Document Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Social Links & Summary */}
          <div className="skeuo-card p-6 sm:p-8 border border-[#E4E3EF] space-y-6">
            {(candidate.linkedinUrl || candidate.githubUrl || candidate.portfolioUrl) && (
              <div className="flex flex-wrap items-center gap-2.5 pb-4 border-b border-[#24334C]">
                {candidate.linkedinUrl && (
                  <a
                    href={candidate.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="neu-btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
                {candidate.githubUrl && (
                  <a
                    href={candidate.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="neu-btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  >
                    <Github className="w-3.5 h-3.5 text-[#68677D]" />
                    <span>GitHub</span>
                  </a>
                )}
                {candidate.portfolioUrl && (
                  <a
                    href={candidate.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="neu-btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            )}

            {candidate.summary && (
              <div>
                <h3 className="text-sm font-bold text-[#202033] mb-2">Executive Summary</h3>
                <p className="text-xs text-[#68677D] leading-relaxed whitespace-pre-line">
                  {candidate.summary}
                </p>
              </div>
            )}

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#202033] mb-2.5">Technical Competencies</h3>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((s: any) => (
                    <span
                      key={s.id || s.name}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#EAE7FF] text-[#6C5CE7] border border-[#8B7CF6]/30 shadow-sm"
                    >
                      {s.name} {s.yearsOfExperience ? `(${s.yearsOfExperience}y)` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Applications Submitted */}
          <div className="skeuo-card p-6 sm:p-8 border border-[#E4E3EF]">
            <h3 className="text-sm font-bold text-[#202033] mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Application History in Ecosystem</span>
            </h3>

            {!candidate.applications || candidate.applications.length === 0 ? (
              <p className="text-xs text-[#64748B] py-4 text-center">
                No job applications recorded for this candidate.
              </p>
            ) : (
              <div className="divide-y divide-[#24334C]">
                {candidate.applications.map((app: any) => {
                  const colors = getStageColor(app.currentStage);
                  return (
                    <div key={app.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/jobs/${app.jobId}`}
                            className="font-bold text-sm text-[#202033] hover:text-indigo-400 transition-colors"
                          >
                            {app.job?.title}
                          </Link>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colors.bg} ${colors.text} ${colors.border} shadow-inner`}
                          >
                            {app.currentStage}
                          </span>
                        </div>
                        <div className="text-xs text-[#68677D] mt-0.5">
                          {app.job?.company?.name} • Submitted {formatDate(app.appliedAt)}
                        </div>
                      </div>

                      <Link
                        href={`/applications/kanban/${app.jobId}`}
                        className="neu-btn-secondary px-3.5 py-1.5 text-xs font-bold text-indigo-300 hover:text-white rounded-xl flex items-center gap-1 self-start sm:self-auto"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>View in Pipeline</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
