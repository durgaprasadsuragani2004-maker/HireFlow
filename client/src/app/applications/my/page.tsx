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
            const isRejected = app.currentStage === 'REJECTED';
            const scheduledInterview = app.interviews?.find((i: any) => i.status === 'SCHEDULED');

            return (
              <div
                key={app.id}
                className="skeuo-card-interactive rounded-3xl p-6 sm:p-7 space-y-5"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E3EF]/80">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#6C5CE7]">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{app.job.company.name}</span>
                      <span className="text-[#E4E3EF]">•</span>
                      <span className="text-[#68677D] font-normal">{app.job.location}</span>
                    </div>
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="text-lg font-bold text-[#202033] hover:text-[#6C5CE7] transition-colors block mt-1"
                    >
                      {app.job.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Badge variant={isRejected ? 'danger' : 'primary'}>
                      {app.currentStage}
                    </Badge>
                  </div>
                </div>

                {/* Visual Pipeline Progress Bar */}
                {!isRejected && (
                  <div className="py-2 px-2 sm:px-6">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#F0F1F8] border-y border-[#E4E3EF]/60 -translate-y-1/2 z-0 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.6)]" />
                      {stages.map((stageName, idx) => {
                        const currentIdx = stages.indexOf(app.currentStage);
                        const isDone = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div key={stageName} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                isCurrent
                                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 border-[#101726] text-white ring-4 ring-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.6)] scale-110'
                                  : isDone
                                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-[#101726] text-white shadow-sm'
                                  : 'bg-[#F0F1F8] border-[#E4E3EF] text-[#64748B] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]'
                              }`}
                            >
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] font-semibold mt-1.5 hidden sm:block ${
                                isCurrent
                                  ? 'text-indigo-300 font-bold'
                                  : isDone
                                  ? 'text-[#202033]'
                                  : 'text-[#64748B]'
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
                  <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-neu-raised shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-[#202033]">
                          {scheduledInterview.interviewType} Interview Scheduled
                        </div>
                        <div className="text-[#68677D] mt-0.5">
                          {scheduledInterview.date} from {scheduledInterview.startTime} to {scheduledInterview.endTime}
                        </div>
                      </div>
                    </div>

                    {scheduledInterview.meetingLink && (
                      <a
                        href={scheduledInterview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-btn-primary px-4 py-2 text-xs font-bold text-white rounded-xl shadow-neu-raised flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                      >
                        <span>Join Meeting</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Footer Meta & Actions */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#68677D]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Submitted on {formatDate(app.appliedAt)}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTimelineApp(app)}
                      className="neu-btn-secondary px-3.5 py-1.5 text-xs font-semibold rounded-xl text-[#202033] flex items-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>Stage Timeline</span>
                    </button>
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="neu-btn-primary px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-neu-raised flex items-center gap-1"
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
