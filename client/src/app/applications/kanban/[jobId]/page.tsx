'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../providers/AuthContext';
import { KanbanBoard } from '../../../../components/kanban/KanbanBoard';
import { ScheduleInterviewModal } from '../../../../components/interviews/ScheduleInterviewModal';
import { Modal } from '../../../../components/ui/Modal';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { useToast } from '../../../../providers/ToastContext';
import {
  Layers,
  ChevronDown,
  Star,
  FileText,
  Calendar,
  ExternalLink,
  Download,
  Building,
  RefreshCw,
} from 'lucide-react';

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
        if (res.data.success && res.data.data.length > 0) {
          setAvailableJobs(res.data.data);

          if (rawJobId === 'default') {
            const myCompanyJob = user?.recruiterProfile?.companyId
              ? res.data.data.find((j: any) => j.companyId === user?.recruiterProfile?.companyId)
              : null;
            const targetJob = myCompanyJob || res.data.data[0];
            router.replace(`/applications/kanban/${targetJob.id}`);
          }
        }
      } catch {
        // Ignore
      }
    };
    fetchAvailableJobs();
  }, [rawJobId, router]);

  // Load Kanban applications for the selected job
  const fetchKanban = async (id: string) => {
    if (!id || id === 'default') return;
    setLoading(true);
    try {
      const res = await api.get(`/applications/kanban/${id}`);
      if (res.data.success) {
        setCurrentJob(res.data.data.job);
        setKanbanData(res.data.data.kanbanData);
        setTotalApplications(res.data.data.totalApplications);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load pipeline', 'error');
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

  return (
    <div className="space-y-4">
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500">Active Job:</span>
            <select
              value={rawJobId}
              onChange={(e) => router.push(`/applications/kanban/${e.target.value}`)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.company?.name})
                </option>
              ))}
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
      </div>

      {/* Kanban Board Container */}
      {loading || !kanbanData ? (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="w-80 h-[500px] rounded-2xl shrink-0" />
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
          <div className="space-y-5">
            {/* Candidate Header */}
            <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {selectedApplication.applicant?.fullName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedApplication.applicant?.headline || 'Candidate'}
                </p>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {selectedApplication.applicant?.user?.email}
                </div>
              </div>

              <div className="text-right">
                <Badge variant="info">{selectedApplication.currentStage}</Badge>
                {selectedApplication.applicant?.resumeUrl && (
                  <a
                    href={selectedApplication.applicant.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline block"
                  >
                    <Download className="w-3 h-3" /> View Resume
                  </a>
                )}
              </div>
            </div>

            {/* Candidate Cover Letter */}
            {selectedApplication.coverLetter && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cover Letter / Introduction
                </h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-200 dark:border-slate-700">
                  {selectedApplication.coverLetter}
                </div>
              </div>
            )}

            {/* Candidate Skills */}
            {selectedApplication.applicant?.skills && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Technical Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApplication.applicant.skills.map((s: any) => (
                    <Badge key={s.id || s.name} variant="outline" className="text-xs">
                      {s.name} {s.level ? `(${s.level})` : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Rating Selector */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Candidate Score / Rating (1 - 5)
              </h4>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRating(val)}
                    className={`p-2 rounded-xl border transition-all ${
                      rating >= val
                        ? 'bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/40'
                        : 'border-slate-200 dark:border-slate-700 text-slate-300 hover:text-slate-400'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-2">
                  {rating > 0 ? `${rating} / 5 Stars` : 'Unrated'}
                </span>
              </div>
            </div>

            {/* Recruiter Private Notes */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recruiter Internal Evaluation Notes
              </h4>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log candidate strengths, gaps, interview impressions, or salary expectations..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInterviewModalApp(selectedApplication);
                  setSelectedApplication(null);
                }}
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                Schedule Interview
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApplication(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={savingNotes}
                  onClick={handleSaveNotes}
                >
                  Save Evaluation
                </Button>
              </div>
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
          onSuccess={() => rawJobId && fetchKanban(rawJobId)}
        />
      )}
    </div>
  );
}
