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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Job Applications</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track stage progression, interview schedules, and employer updates in real time.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          title="No Applications Submitted"
          description="Explore open opportunities on our job board and submit your profile with a single click."
          actionLabel="Browse Open Jobs"
          onAction={() => window.location.assign('/jobs')}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const stageColors = getStageColor(app.currentStage);
            const isRejected = app.currentStage === 'REJECTED';
            const scheduledInterview = app.interviews?.find((i: any) => i.status === 'SCHEDULED');

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {app.job.company.name}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{app.job.location}</span>
                    </div>
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors block mt-0.5"
                    >
                      {app.job.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${stageColors.bg} ${stageColors.text} ${stageColors.border}`}
                    >
                      {app.currentStage}
                    </span>
                  </div>
                </div>

                {/* Visual Pipeline Progress Bar */}
                {!isRejected && (
                  <div className="py-2">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
                      {stages.map((stageName, idx) => {
                        const currentIdx = stages.indexOf(app.currentStage);
                        const isDone = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div key={stageName} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                isCurrent
                                  ? 'bg-blue-600 border-white text-white ring-4 ring-blue-100 dark:ring-blue-950'
                                  : isDone
                                  ? 'bg-emerald-600 border-white text-white'
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                              }`}
                            >
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] font-semibold mt-1 hidden sm:block ${
                                isCurrent
                                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                                  : isDone
                                  ? 'text-slate-800 dark:text-slate-200'
                                  : 'text-slate-400'
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
                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-indigo-950 dark:text-indigo-200">
                          {scheduledInterview.interviewType} Interview Scheduled
                        </div>
                        <div className="text-indigo-700 dark:text-indigo-300 mt-0.5">
                          {scheduledInterview.date} from {scheduledInterview.startTime} to {scheduledInterview.endTime}
                        </div>
                      </div>
                    </div>

                    {scheduledInterview.meetingLink && (
                      <a
                        href={scheduledInterview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                      >
                        <span>Join Meeting</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Footer Timestamp */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Applied on {formatDate(app.appliedAt)}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTimelineApp(app)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 transition-colors"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>View Timeline</span>
                    </button>
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View Job Posting <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTimelineApp && (
        <StageHistoryModal
          isOpen={!!selectedTimelineApp}
          onClose={() => setSelectedTimelineApp(null)}
          application={selectedTimelineApp}
        />
      )}
    </div>
  );
}
