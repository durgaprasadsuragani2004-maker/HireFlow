'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getStageColor, formatDate } from '../../../lib/utils';
import {
  FileText,
  Building,
  Calendar,
  ExternalLink,
  Clock,
  ArrowRight,
  CheckCircle2,
  History,
  Building2,
  MapPin,
} from 'lucide-react';
import { StageHistoryModal } from '../../../components/kanban/StageHistoryModal';
import { AuthGuard } from '../../../components/layout/AuthGuard';

export default function MyApplicationsPage() {
  return (
    <AuthGuard allowedRoles={['APPLICANT']}>
      <MyApplicationsContent />
    </AuthGuard>
  );
}

function MyApplicationsContent() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimelineApp, setSelectedTimelineApp] = useState<any | null>(null);

  const fetchMyApps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications/my');
      if (res.data.success) {
        setApplications(res.data.data.applications);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyApps();
    }
  }, [user]);

  const stages = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-bold text-dark-text tracking-tight">
            My Job Applications
          </h1>
        </div>
        <p className="text-xs text-dark-muted mt-1 ml-10">
          Track stage progression, interview invitations, and status updates across your candidacies.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          title="No Applications Submitted"
          description="Explore open opportunities on our job board and submit your profile with a single click."
          actionLabel="Browse Open Jobs"
          onAction={() => window.location.assign('/jobs')}
        />
      ) : (
        <div className="space-y-5">
          {applications.map((app) => {
            const stageColors = getStageColor(app.currentStage);
            const isRejected = app.currentStage === 'REJECTED';
            const scheduledInterview = app.interviews?.find((i: any) => i.status === 'SCHEDULED');

            return (
              <div
                key={app.id}
                className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-7 shadow-card hover:border-brand-500/40 hover:-translate-y-0.5 transition-all duration-200 space-y-5"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-border">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-400">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{app.job.company.name}</span>
                      <span className="text-dark-border">•</span>
                      <span className="text-dark-muted font-normal">{app.job.location}</span>
                    </div>
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="text-lg font-bold text-dark-text hover:text-brand-400 transition-colors block mt-1"
                    >
                      {app.job.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${stageColors.bg} ${stageColors.text} ${stageColors.border}`}
                    >
                      {app.currentStage}
                    </span>
                  </div>
                </div>

                {/* Visual Pipeline Progress Bar */}
                {!isRejected && (
                  <div className="py-2 px-2 sm:px-6">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-dark-border -translate-y-1/2 z-0" />
                      {stages.map((stageName, idx) => {
                        const currentIdx = stages.indexOf(app.currentStage);
                        const isDone = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div key={stageName} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                isCurrent
                                  ? 'bg-brand-500 border-dark-card text-white ring-4 ring-brand-500/20 shadow-glow'
                                  : isDone
                                  ? 'bg-emerald-500 border-dark-card text-white'
                                  : 'bg-dark-input border-dark-border text-dark-dim'
                              }`}
                            >
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] font-semibold mt-1.5 hidden sm:block ${
                                isCurrent
                                  ? 'text-brand-300 font-bold'
                                  : isDone
                                  ? 'text-dark-text'
                                  : 'text-dark-dim'
                              }`}
                            >
                              {stageName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Scheduled Interview Callout */}
                {scheduledInterview && (
                  <div className="p-4 bg-brand-950/25 border border-brand-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-brand-500 text-white rounded-xl shadow-sm shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-dark-text">
                          {scheduledInterview.interviewType} Interview Scheduled
                        </div>
                        <div className="text-dark-muted mt-0.5">
                          {scheduledInterview.date} from {scheduledInterview.startTime} to {scheduledInterview.endTime}
                        </div>
                      </div>
                    </div>

                    {scheduledInterview.meetingLink && (
                      <a
                        href={scheduledInterview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-subtle transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                      >
                        <span>Join Meeting</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Footer Meta & Actions */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-dark-dim">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-dark-dim" />
                    <span>Submitted on {formatDate(app.appliedAt)}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTimelineApp(app)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-dark-text hover:text-white bg-dark-input hover:bg-dark-hover rounded-xl border border-dark-border transition-colors flex items-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5 text-dark-dim" />
                      <span>Stage Timeline</span>
                    </button>
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="px-3.5 py-1.5 text-xs font-bold text-brand-300 bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/20 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <span>View Job</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline Modal */}
      {selectedTimelineApp && (
        <StageHistoryModal
          isOpen={Boolean(selectedTimelineApp)}
          onClose={() => setSelectedTimelineApp(null)}
          application={selectedTimelineApp}
        />
      )}
    </div>
  );
}
