'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  History,
  Video,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
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
      trend: 'Active submissions',
    },
    {
      label: 'In Review / Progress',
      value: m.inProgress || 0,
      icon: Briefcase,
      trend: 'Under evaluation',
    },
    {
      label: 'Interviews Scheduled',
      value: m.interviewsScheduled || 0,
      icon: Calendar,
      trend: 'Upcoming rounds',
    },
    {
      label: 'Offers / Selected',
      value: m.selected || 0,
      icon: CheckCircle2,
      trend: 'Hiring offers 🎉',
      highlight: true,
    },
    {
      label: 'Not Selected',
      value: m.rejected || 0,
      icon: XCircle,
      trend: 'Completed cycles',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner (White & Violet skeuomorphic container) */}
      <div className="skeuo-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden border border-[#E4E3EF] shadow-card">
        {/* Soft violet ambient light */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#EAE7FF]/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#EAE7FF] border border-[#8B7CF6]/30 text-[#6C5CE7] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Candidate Career Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-[#202033]">
            Application Progress Tracker
          </h1>
          <p className="text-xs sm:text-sm text-[#68677D] mt-1 max-w-xl leading-relaxed">
            Monitor real-time stage progressions, interview invitations, and active company submissions.
          </p>
        </div>

        <Link
          href="/jobs"
          className="neu-btn-primary relative z-10 px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <span>Explore Job Openings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Metrics Row (4-Column Balanced Grid on Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="skeuo-card-interactive p-5 flex flex-col justify-between border border-[#E4E3EF] shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#68677D] truncate">{card.label}</span>
                <div className="p-2 rounded-xl bg-[#EAE7FF] text-[#6C5CE7] shrink-0 shadow-sm">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-[#202033] tracking-tight">{card.value}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[11px] font-semibold ${card.highlight ? 'text-[#16A878]' : 'text-[#68677D]'}`}>
                    {card.trend}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Interviews Alert */}
      {upcomingInterviews.length > 0 && (
        <div className="skeuo-card p-5 sm:p-6 border border-[#8B7CF6]/40 shadow-card">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E4E3EF]">
            <Calendar className="w-5 h-5 text-[#6C5CE7]" />
            <h3 className="font-bold text-sm sm:text-base text-[#202033]">
              Upcoming Scheduled Interviews
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingInterviews.map((iv: any) => (
              <div
                key={iv.id}
                className="bg-[#F8F8FC] p-4 rounded-2xl border border-[#E4E3EF] shadow-sm flex items-center justify-between gap-3 hover:border-[#8B7CF6] transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-[#202033] truncate">
                    {iv.application?.job?.title}
                  </div>
                  <div className="text-xs text-[#68677D] mt-0.5 truncate">
                    {iv.application?.job?.company?.name} • <span className="font-semibold text-[#202033]">{iv.date}</span> at {iv.startTime}
                  </div>
                  <div className="text-[11px] text-[#6C5CE7] mt-1 font-semibold capitalize">
                    Round: {iv.interviewType || iv.type || 'Interview'}
                  </div>
                </div>
                {iv.meetingLink && (
                  <a
                    href={iv.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="neu-btn-primary px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0"
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
      <div className="skeuo-card p-6 border border-[#E4E3EF] shadow-card">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E4E3EF]">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#202033] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6C5CE7]" />
              <span>Recent Job Applications</span>
            </h3>
            <p className="text-xs text-[#68677D] mt-0.5">Live status of your submitted candidacies</p>
          </div>
          <Link
            href="/applications/my"
            className="text-xs font-bold text-[#6C5CE7] hover:text-[#5B4BD8] flex items-center gap-1"
          >
            All Applications <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#68677D] border border-dashed border-[#E4E3EF] rounded-2xl bg-[#F8F8FC]">
            You haven't submitted any applications yet.{' '}
            <Link href="/jobs" className="text-[#6C5CE7] underline font-semibold">
              Browse current openings
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E3EF]">
            {recentApplications.map((app: any) => {
              return (
                <div key={app.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8F8FC] px-2 rounded-xl transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#202033] truncate">
                        {app.job?.title}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAE7FF] text-[#6C5CE7] border border-[#8B7CF6]/30 shadow-sm"
                      >
                        {app.currentStage}
                      </span>
                    </div>
                    <div className="text-xs text-[#68677D] mt-0.5">
                      {app.job?.company?.name} • Submitted {formatDate(app.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick={() => setSelectedTimelineApp(app)}
                      className="neu-btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-[#6C5CE7]" />
                      <span>Stage History</span>
                    </button>
                    <Link
                      href={`/jobs/${app.jobId}`}
                      className="neu-icon-btn p-2 rounded-xl"
                      title="View Job Details"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-[#6C5CE7]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stage History Modal */}
      {selectedTimelineApp && (
        <StageHistoryModal
          isOpen={!!selectedTimelineApp}
          application={selectedTimelineApp}
          onClose={() => setSelectedTimelineApp(null)}
        />
      )}
    </div>
  );
};
