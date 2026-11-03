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
          <h2 className="text-xl font-bold text-dark-text">Candidate Not Found</h2>
          <Link href="/applicants" className="text-xs text-brand-400 font-bold underline mt-2 inline-block">
            Back to Candidate Pool
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6 py-2">
          <Link
            href="/applicants"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-dark-dim hover:text-dark-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Candidate Pool</span>
          </Link>

          {/* Candidate Profile Header Card */}
          <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-glow shrink-0">
                {candidate.fullName[0]}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-dark-text tracking-tight">
                  {candidate.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-dark-muted mt-0.5">
                  {candidate.headline || 'Software Engineering Professional'}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-dark-muted mt-2 font-mono">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-dark-dim" />
                    <span>{candidate.user?.email}</span>
                  </span>
                  {candidate.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-dark-dim" />
                      <span>{candidate.phone}</span>
                    </span>
                  )}
                  {candidate.location && (
                    <span className="flex items-center gap-1 font-sans">
                      <MapPin className="w-3.5 h-3.5 text-dark-dim" />
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
                  className="px-4 py-2.5 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-subtle transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingResume ? 'Downloading...' : 'Download Resume'}</span>
                </button>
                <a
                  href={getAuthenticatedResumeUrl(candidate.resumeUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-brand-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Document Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Social Links & Summary */}
          <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
            {(candidate.linkedinUrl || candidate.githubUrl || candidate.portfolioUrl) && (
              <div className="flex flex-wrap items-center gap-2.5 pb-4 border-b border-dark-border">
                {candidate.linkedinUrl && (
                  <a
                    href={candidate.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-input hover:bg-dark-hover text-dark-muted border border-dark-border transition-colors"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-input hover:bg-dark-hover text-dark-muted border border-dark-border transition-colors"
                  >
                    <Github className="w-3.5 h-3.5 text-dark-muted" />
                    <span>GitHub</span>
                  </a>
                )}
                {candidate.portfolioUrl && (
                  <a
                    href={candidate.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-input hover:bg-dark-hover text-dark-muted border border-dark-border transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-brand-400" />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            )}

            {candidate.summary && (
              <div>
                <h3 className="text-sm font-bold text-dark-text mb-2">Executive Summary</h3>
                <p className="text-xs text-dark-muted leading-relaxed whitespace-pre-line">
                  {candidate.summary}
                </p>
              </div>
            )}

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-dark-text mb-2.5">Technical Competencies</h3>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((s: any) => (
                    <span
                      key={s.id || s.name}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20"
                    >
                      {s.name} {s.yearsOfExperience ? `(${s.yearsOfExperience}y)` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Applications Submitted */}
          <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 shadow-card">
            <h3 className="text-sm font-bold text-dark-text mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Application History in Ecosystem</span>
            </h3>

            {!candidate.applications || candidate.applications.length === 0 ? (
              <p className="text-xs text-dark-dim py-4 text-center">
                No job applications recorded for this candidate.
              </p>
            ) : (
              <div className="divide-y divide-dark-border">
                {candidate.applications.map((app: any) => {
                  const colors = getStageColor(app.currentStage);
                  return (
                    <div key={app.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/jobs/${app.jobId}`}
                            className="font-bold text-sm text-dark-text hover:text-brand-400 transition-colors"
                          >
                            {app.job?.title}
                          </Link>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            {app.currentStage}
                          </span>
                        </div>
                        <div className="text-xs text-dark-muted mt-0.5">
                          {app.job?.company?.name} • Submitted {formatDate(app.appliedAt)}
                        </div>
                      </div>

                      <Link
                        href={`/applications/kanban/${app.jobId}`}
                        className="px-3 py-1.5 text-xs font-bold text-brand-300 bg-brand-500/15 hover:bg-brand-500 hover:text-white rounded-xl border border-brand-500/20 transition-all flex items-center gap-1 self-start sm:self-auto"
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
