'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, downloadResumeFile, getAuthenticatedResumeUrl } from '../../../../lib/api';
import { normalizeJobStatus, formatDate } from '../../../../lib/utils';
import { useAuth } from '../../../../providers/AuthContext';
import { KanbanBoard } from '../../../../components/kanban/KanbanBoard';
import { ScheduleInterviewModal } from '../../../../components/interviews/ScheduleInterviewModal';
import { Modal } from '../../../../components/ui/Modal';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { useToast } from '../../../../providers/ToastContext';
import { AuthGuard } from '../../../../components/layout/AuthGuard';
import {
  Layers,
  Star,
  FileText,
  Calendar,
  ExternalLink,
  Download,
  Building,
  RefreshCw,
  AlertTriangle,
  Home,
  AlertCircle,
  Plus,
  Briefcase,
} from 'lucide-react';

const STAGES = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];

export default function KanbanPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const rawJobId = params?.jobId as string;

  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [currentJob, setCurrentJob] = useState<any | null>(null);
  const [kanbanData, setKanbanData] = useState<Record<string, any[]> | null>(null);
  const [totalApplications, setTotalApplications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Candidate Details Modal state
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [savingNotes, setSavingNotes] = useState(false);

  // Schedule Interview Modal state
  const [interviewModalApp, setInterviewModalApp] = useState<any | null>(null);

  // Load available jobs for switcher
  useEffect(() => {
    const fetchAvailableJobs = async () => {
      try {
        const res = await api.get('/jobs?limit=50');
        if (res.data.success && Array.isArray(res.data.data)) {
          const sortedJobs = [...res.data.data].sort((a: any, b: any) => {
            const aNorm = normalizeJobStatus(a);
            const bNorm = normalizeJobStatus(b);
            if (aNorm.isOpen !== bNorm.isOpen) return aNorm.isOpen ? -1 : 1;
            const aCount = a._count?.applications ?? 0;
            const bCount = b._count?.applications ?? 0;
            return bCount - aCount;
          });

          let companyScopedJobs = sortedJobs;
          const userCompanyId = user?.companyId || user?.recruiterProfile?.companyId;
          if ((user?.role === 'RECRUITER' || user?.role === 'COMPANY') && userCompanyId) {
            companyScopedJobs = sortedJobs.filter(
              (j: any) => j.companyId === userCompanyId
            );
          }

          setAvailableJobs(companyScopedJobs);

          if (rawJobId === 'default') {
            if (companyScopedJobs.length > 0) {
              router.replace(`/applications/kanban/${companyScopedJobs[0].id}`);
            } else {
              setLoading(false);
            }
          }
        }
      } catch {
        setLoading(false);
      }
    };
    fetchAvailableJobs();
  }, [rawJobId, router, user]);

  const fetchKanban = async (id: string) => {
    if (!id || id === 'default') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/applications/kanban/${id}`);
      if (res.data.success) {
        setCurrentJob(res.data.data.job);
        setKanbanData(res.data.data.kanbanData);
        setTotalApplications(res.data.data.totalApplications);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load recruitment pipeline';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rawJobId && rawJobId !== 'default') {
      fetchKanban(rawJobId);
    }
  }, [rawJobId]);

  const handleOpenDetails = (app: any) => {
    setSelectedApplication(app);
    setNotes(app.notes || '');
    setRating(app.rating || 0);
  };

  const handleSaveNotes = async () => {
    if (!selectedApplication) return;
    setSavingNotes(true);
    try {
      await api.patch(`/applications/${selectedApplication.id}/notes`, {
        notes,
        rating,
      });
      showToast('Candidate evaluation notes updated', 'success');

      if (kanbanData && rawJobId) {
        fetchKanban(rawJobId);
      }
      setSelectedApplication((prev: any) => ({ ...prev, notes, rating }));
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const currentJobStatus = normalizeJobStatus(currentJob);

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'COMPANY', 'RECRUITER']}>
      <div className="space-y-4 max-w-full">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-dark-dim">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-brand-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span className="text-dark-border">/</span>
          <Link href="/jobs" className="hover:text-brand-400 transition-colors">
            Job Postings
          </Link>
          <span className="text-dark-border">/</span>
          <span className="text-dark-text font-semibold truncate max-w-xs">
            {currentJob?.title || 'Recruitment Pipeline'}
          </span>
        </nav>

        {/* Header with Job Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-dark-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-dark-text tracking-tight">
                Interactive Kanban Pipeline
              </h1>
            </div>
            <p className="text-xs text-dark-muted mt-0.5">
              Drag candidates across stages to trigger automated workflows, notifications, and stage history.
            </p>
          </div>

          {/* Job Selector Dropdown */}
          {availableJobs.length > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-dark-muted hidden sm:inline">Active Job:</span>
                <select
                  value={rawJobId}
                  onChange={(e) => router.push(`/applications/kanban/${e.target.value}`)}
                  className="px-3.5 py-2 rounded-xl border border-dark-border bg-dark-input text-dark-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 max-w-xs sm:max-w-md truncate"
                >
                  {availableJobs.map((j) => {
                    const norm = normalizeJobStatus(j);
                    const appCount = j._count?.applications;
                    return (
                      <option key={j.id} value={j.id} className="bg-dark-card text-dark-text">
                        {j.title} ({j.company?.name || 'Company'}) • {norm.label}
                        {typeof appCount === 'number' ? ` [${appCount} applicants]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <Button
                onClick={() => rawJobId && fetchKanban(rawJobId)}
                variant="outline"
                size="sm"
                title="Refresh Kanban"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Expired / Closed Job Notice Banner */}
        {currentJob && !currentJobStatus.isOpen && !currentJobStatus.isInvalid && (
          <div className="flex items-center gap-2.5 p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-2xl text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong className="text-amber-100">Historical Archive Notice:</strong> This position is currently{' '}
              <strong className="text-amber-100">
                {currentJobStatus.isClosed ? 'closed/archived' : currentJobStatus.isDraft ? 'draft' : 'expired'}
              </strong>
              {currentJobStatus.isExpired && currentJob?.deadline ? (
                <span> (Deadline: {formatDate(currentJob.deadline)})</span>
              ) : currentJobStatus.isClosed ? (
                <span> (Status: {currentJobStatus.rawStatus || 'ARCHIVED'})</span>
              ) : null}
              . You are viewing historical candidate records ({totalApplications} total applications).
            </span>
          </div>
        )}

        {/* Empty State when no jobs available */}
        {availableJobs.length === 0 && !loading ? (
          <div className="max-w-md mx-auto py-16 text-center space-y-4">
            <div className="p-4 bg-dark-card border border-dark-border rounded-2xl w-16 h-16 mx-auto flex items-center justify-center text-dark-muted">
              <Layers className="w-8 h-8 text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-text">
                No Job Postings Found
              </h2>
              <p className="text-xs text-dark-muted mt-1 leading-relaxed">
                {user?.role === 'RECRUITER' || user?.role === 'COMPANY'
                  ? 'Your company has no active job postings yet. Create your first job posting to view its recruitment pipeline and track candidate applications.'
                  : 'No jobs are currently available in the system.'}
              </p>
            </div>
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-subtle transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Job Posting</span>
            </Link>
          </div>
        ) : error ? (
          <div className="p-8 bg-rose-950/20 border border-rose-800/40 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 max-w-md mx-auto my-8">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <h3 className="text-sm font-bold text-rose-200">
              Failed to Load Candidate Pipeline
            </h3>
            <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rawJobId && fetchKanban(rawJobId)}
              className="border-rose-700 text-rose-300 hover:bg-rose-900/30 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Pipeline</span>
            </Button>
          </div>
        ) : loading || !kanbanData ? (
          <div className="flex gap-4 overflow-x-auto pb-6">
            {STAGES.map((stage) => (
              <div
                key={stage}
                className="flex flex-col w-72 sm:w-80 shrink-0 bg-dark-card/60 rounded-3xl p-3.5 border border-dark-border space-y-3"
              >
                <div className="flex items-center justify-between pb-3 px-1 border-b border-dark-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse" />
                    <h4 className="font-bold text-xs text-dark-text tracking-wider">
                      {stage}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-dark-border bg-dark-input text-dark-muted">
                    0
                  </span>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-28 rounded-2xl" />
                  <Skeleton className="h-28 rounded-2xl opacity-60" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <KanbanBoard
            key={rawJobId}
            initialKanbanData={kanbanData}
            jobId={rawJobId}
            onViewCandidateDetails={handleOpenDetails}
            onScheduleInterview={(app) => setInterviewModalApp(app)}
          />
        )}

        {/* Candidate Details & Recruiter Notes Modal */}
        {selectedApplication && (
          <Modal
            isOpen={!!selectedApplication}
            onClose={() => setSelectedApplication(null)}
            title={`Candidate Review: ${selectedApplication.applicant?.fullName}`}
            maxWidth="max-w-2xl"
          >
            <div className="space-y-5 text-xs">
              <div className="flex items-start justify-between p-4 bg-dark-input/60 rounded-2xl border border-dark-border">
                <div>
                  <div className="text-base font-bold text-dark-text">
                    {selectedApplication.applicant?.fullName}
                  </div>
                  <div className="text-dark-muted font-mono mt-0.5">
                    {selectedApplication.applicant?.user?.email}
                  </div>
                  {selectedApplication.applicant?.headline && (
                    <div className="text-xs text-dark-muted mt-1">
                      {selectedApplication.applicant.headline}
                    </div>
                  )}
                  {selectedApplication.applicant?.resumeUrl && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await downloadResumeFile(
                              selectedApplication.applicant.resumeUrl,
                              selectedApplication.applicant.fullName
                            );
                            showToast('Resume downloaded successfully', 'success');
                          } catch (err: any) {
                            showToast(
                              err.response?.data?.message || err.message || 'Failed to download resume',
                              'error'
                            );
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 border border-brand-500/30 rounded-xl transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Resume</span>
                      </button>
                      <a
                        href={getAuthenticatedResumeUrl(selectedApplication.applicant.resumeUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-dark-card hover:bg-dark-hover text-dark-muted border border-dark-border rounded-xl transition"
                      >
                        <span>Open in New Tab</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant="primary">{selectedApplication.currentStage}</Badge>
                  <span className="text-[11px] text-dark-dim">
                    Applied: {new Date(selectedApplication.appliedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Skills */}
              {selectedApplication.applicant?.skills && (
                <div>
                  <h4 className="font-bold text-dark-text mb-2">Verified Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApplication.applicant.skills.map((s: any) => (
                      <span
                        key={s.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-dark-input text-dark-muted border border-dark-border"
                      >
                        {s.name} {s.yearsOfExperience ? `(${s.yearsOfExperience}y)` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {selectedApplication.coverLetter && (
                <div>
                  <h4 className="font-bold text-dark-text mb-1">
                    Candidate Cover Note
                  </h4>
                  <div className="p-3.5 bg-dark-input/60 rounded-2xl text-dark-text leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap border border-dark-border">
                    {selectedApplication.coverLetter}
                  </div>
                </div>
              )}

              {/* Recruiter Evaluation & Notes */}
              <div className="p-4 bg-brand-950/20 border border-brand-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-dark-text flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-400" />
                    <span>Recruiter Evaluation & Score</span>
                  </h4>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-0.5 transition-colors ${
                          star <= rating ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record interview notes, technical screening feedback, or team thoughts..."
                  className="w-full p-3 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder-dark-dim"
                />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveNotes}
                    size="sm"
                    loading={savingNotes}
                    disabled={savingNotes}
                  >
                    Save Evaluation
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-dark-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInterviewModalApp(selectedApplication)}
                  className="flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-brand-400" />
                  <span>Schedule Interview</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedApplication(null)}
                >
                  Close Review
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Schedule Interview Modal */}
        {interviewModalApp && (
          <ScheduleInterviewModal
            isOpen={!!interviewModalApp}
            onClose={() => setInterviewModalApp(null)}
            application={interviewModalApp}
            onSuccess={() => {
              setInterviewModalApp(null);
              if (rawJobId) fetchKanban(rawJobId);
            }}
          />
        )}
      </div>
    </AuthGuard>
  );
}
