'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, downloadResumeFile, getAuthenticatedResumeUrl } from '../../../../lib/api';
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
          // Sort available jobs so active jobs with applications come first
          const sortedJobs = [...res.data.data].sort((a: any, b: any) => {
            const aExpired =
              a.status !== 'PUBLISHED' || (a.deadline && new Date(a.deadline) < new Date());
            const bExpired =
              b.status !== 'PUBLISHED' || (b.deadline && new Date(b.deadline) < new Date());
            if (aExpired !== bExpired) return aExpired ? 1 : -1;
            const aCount = a._count?.applications ?? 0;
            const bCount = b._count?.applications ?? 0;
            return bCount - aCount;
          });

          // Recruiter company isolation: recruiters only manage their company's jobs
          let companyScopedJobs = sortedJobs;
          if (user?.role === 'RECRUITER' && user.recruiterProfile?.companyId) {
            companyScopedJobs = sortedJobs.filter(
              (j: any) => j.companyId === user.recruiterProfile?.companyId
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
        // Fallback
        setLoading(false);
      }
    };
    fetchAvailableJobs();
  }, [rawJobId, router, user]);

  // Load Kanban applications for the selected job
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
      showToast('Candidate notes updated', 'success');

      // Update local state
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

  const isCurrentJobExpired =
    currentJob &&
    (currentJob.status !== 'PUBLISHED' ||
      (currentJob.deadline && new Date(currentJob.deadline) < new Date()));

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'RECRUITER']}>
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span className="text-slate-400">/</span>
          <Link href="/jobs" className="hover:text-blue-600 transition-colors">
            Job Postings
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-xs">
            {currentJob?.title || 'Recruitment Pipeline'}
          </span>
        </nav>

        {/* Header with Job Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Recruitment Kanban Pipeline
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag candidates across stages to trigger automated workflows, notifications, and stage history.
            </p>
          </div>

          {/* Job Selector Dropdown */}
          {availableJobs.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-slate-500">Pipeline Job:</span>
                <select
                  value={rawJobId}
                  onChange={(e) => router.push(`/applications/kanban/${e.target.value}`)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs sm:max-w-md truncate"
                >
                  {availableJobs.map((j) => {
                    const isExpired =
                      j.status !== 'PUBLISHED' ||
                      (j.deadline && new Date(j.deadline) < new Date());
                    const appCount = j._count?.applications;
                    return (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.company?.name}) — {isExpired ? '⚠️ Closed/Expired' : '🟢 Active'}
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

        {/* Expired Job Notice Banner */}
        {isCurrentJobExpired && (
          <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Notice:</strong> This job posting is currently <strong>closed/expired</strong> (
              {currentJob?.status !== 'PUBLISHED'
                ? `Status: ${currentJob?.status}`
                : `Expired on ${new Date(currentJob?.deadline).toLocaleDateString()}`}
              ). You are viewing historical candidate records ({totalApplications} total applications).
            </span>
          </div>
        )}

        {/* Empty State when no jobs available */}
        {availableJobs.length === 0 && !loading ? (
          <div className="max-w-md mx-auto py-16 text-center space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-slate-500">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                No Job Postings Found
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {user?.role === 'RECRUITER'
                  ? 'Your company has no active job postings yet. Create your first job posting to view its recruitment pipeline and track candidate applications.'
                  : 'No jobs are currently available in the system.'}
              </p>
            </div>
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Job Posting</span>
            </Link>
          </div>
        ) : error ? (
          /* Error State with Retry */
          <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600" />
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Failed to Load Candidate Pipeline
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rawJobId && fetchKanban(rawJobId)}
              className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Pipeline</span>
            </Button>
          </div>
        ) : loading || !kanbanData ? (
          /* Structured Stage Columns while loading — always visible labels and counts */
          <div className="flex gap-4 overflow-x-auto pb-6">
            {STAGES.map((stage) => (
              <div
                key={stage}
                className="flex flex-col w-72 sm:w-80 shrink-0 bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-pulse" />
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 tracking-wider">
                      {stage}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500">
                    0
                  </span>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-28 rounded-xl" />
                  <Skeleton className="h-28 rounded-xl opacity-60" />
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
              <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedApplication.applicant?.fullName}
                  </div>
                  <div className="text-slate-500 font-mono mt-0.5">
                    {selectedApplication.applicant?.user?.email}
                  </div>
                  {selectedApplication.applicant?.headline && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {selectedApplication.applicant.headline}
                    </div>
                  )}
                  {selectedApplication.applicant?.resumeUrl && (
                    <div className="mt-2.5 flex items-center gap-2">
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Resume Document</span>
                      </button>
                      <a
                        href={getAuthenticatedResumeUrl(selectedApplication.applicant.resumeUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                      >
                        Open Tab
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant="info">{selectedApplication.currentStage}</Badge>
                  <span className="text-[11px] text-slate-400">
                    Applied: {new Date(selectedApplication.appliedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Skills */}
              {selectedApplication.applicant?.skills && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Key Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApplication.applicant.skills.map((s: any) => (
                      <Badge key={s.id} variant="outline">
                        {s.name} {s.yearsOfExperience ? `(${s.yearsOfExperience}y)` : ''}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {selectedApplication.coverLetter && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Cover Letter / Statement
                  </h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap border border-slate-200 dark:border-slate-700">
                    {selectedApplication.coverLetter}
                  </div>
                </div>
              )}

              {/* Recruiter Evaluation & Notes */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Recruiter Notes & Rating</span>
                  </h4>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-0.5 transition-colors ${
                          star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
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
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveNotes}
                    size="sm"
                    loading={savingNotes}
                    disabled={savingNotes}
                  >
                    Save Notes & Rating
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInterviewModalApp(selectedApplication)}
                  className="flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Schedule Interview</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedApplication(null)}
                >
                  Close
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
