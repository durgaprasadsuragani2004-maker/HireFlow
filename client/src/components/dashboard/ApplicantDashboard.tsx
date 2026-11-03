'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowRight,
  Sparkles,
  History,
  Clock,
  Video,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { getStageColor, formatDate } from '../../lib/utils';
import { StageHistoryModal } from '../kanban/StageHistoryModal';

interface ApplicantDashboardProps {
  data: any;
}

export const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({ data }) => {
  const m = data?.metrics || {};
  const recentApplications = data?.recentApplications || [];
  const upcomingInterviews = data?.upcomingInterviews || [];
  const [selectedTimelineApp, setSelectedTimelineApp] = useState<any | null>(null);

  const statCards = [
    {
      label: 'Applications Submitted',
      value: m.appliedJobs || 0,
      icon: FileText,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'In Review / Progress',
      value: m.inProgress || 0,
      icon: Briefcase,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Interviews Scheduled',
      value: m.interviewsScheduled || 0,
      icon: Calendar,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Offers / Selected 🎉',
      value: m.selected || 0,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Not Selected',
      value: m.rejected || 0,
      icon: XCircle,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-[#151F32] rounded-3xl text-white shadow-card border border-[#2B3950] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Candidate Career Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-[#F1F5F9]">
            Application Progress Tracker
          </h1>
          <p className="text-xs sm:text-sm text-[#A1AEC2] mt-1 max-w-xl leading-relaxed">
            Monitor real-time stage progressions, interview invitations, and active company submissions.
          </p>
        </div>

        <Link
          href="/jobs"
          className="relative z-10 px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md hover:shadow-glow-primary flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <span>Explore Job Openings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-[#151F32] border border-[#2B3950] rounded-2xl p-4 shadow-card hover:shadow-card-hover hover:border-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#A1AEC2] truncate">{card.label}</span>
                <div className={`p-1.5 rounded-lg border ${card.color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#F1F5F9] mt-2">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Interviews Alert */}
      {upcomingInterviews.length > 0 && (
        <div className="bg-[#151F32] border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm sm:text-base text-[#F1F5F9]">
              Upcoming Scheduled Interviews
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {upcomingInterviews.map((iv: any) => (
              <div
                key={iv.id}
                className="bg-[#101726] p-4 rounded-2xl border border-[#2B3950] flex items-center justify-between gap-3 shadow-subtle hover:border-indigo-500/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-[#F1F5F9] truncate">
                    {iv.application?.job?.title}
                  </div>
                  <div className="text-xs text-[#A1AEC2] mt-0.5 truncate">
                    {iv.application?.job?.company?.name} • <span className="font-semibold text-[#F1F5F9]">{iv.date}</span> at {iv.startTime}
                  </div>
                  <div className="text-[11px] text-indigo-300 mt-1 font-medium capitalize">
                    Round: {iv.interviewType || iv.type || 'Interview'}
                  </div>
                </div>
                {iv.meetingLink && (
                  <a
                    href={iv.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Applications List */}
      <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#2B3950]">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#F1F5F9] flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Recent Job Applications</span>
            </h3>
            <p className="text-xs text-[#A1AEC2] mt-0.5">Live status of your submitted candidacies</p>
          </div>
          <Link
            href="/applications/my"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            All Applications <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748B]">
            You haven't submitted any applications yet.{' '}
            <Link href="/jobs" className="text-indigo-400 underline font-semibold">
              Browse current openings
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#2B3950]">
            {recentApplications.map((app: any) => {
              const colors = getStageColor(app.currentStage);
              return (
                <div key={app.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#F1F5F9] truncate">
                        {app.job?.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
                      >
                        {app.currentStage}
                      </span>
                    </div>
                    <div className="text-xs text-[#A1AEC2] mt-0.5">
                      {app.job?.company?.name} • Submitted {formatDate(app.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedTimelineApp(app)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#A1AEC2] hover:text-[#F1F5F9] hover:bg-[#1C2940] rounded-xl border border-[#2B3950] transition-colors flex items-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>Timeline</span>
                    </button>
                    <Link
                      href={`/jobs/${app.jobId}`}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 rounded-xl transition-colors"
                    >
                      View Job
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stage Timeline Modal */}
      {selectedTimelineApp && (
        <StageHistoryModal
          isOpen={Boolean(selectedTimelineApp)}
          onClose={() => setSelectedTimelineApp(null)}
          application={selectedTimelineApp}
        />
      )}
    </div>
  );
};
