'use client';

import React from 'react';
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
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { getStageColor } from '../../lib/utils';

interface ApplicantDashboardProps {
  data: any;
}

export const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({ data }) => {
  const m = data?.metrics || {};
  const recentApplications = data?.recentApplications || [];
  const upcomingInterviews = data?.upcomingInterviews || [];

  const statCards = [
    { label: 'Applications Submitted', value: m.appliedJobs || 0, icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'In Review / Progress', value: m.inProgress || 0, icon: Briefcase, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Interviews Scheduled', value: m.interviewsScheduled || 0, icon: Calendar, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Offers / Selected 🎉', value: m.selected || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Not Selected', value: m.rejected || 0, icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">
            Candidate Career Portal
          </span>
          <h2 className="text-2xl font-bold mt-1">Application Tracker</h2>
          <p className="text-sm text-blue-100/90 mt-1">
            Track interview invitations, stage progressions, and discover high-impact roles.
          </p>
        </div>
        <Link
          href="/jobs"
          className="px-4 py-2.5 text-xs font-semibold bg-white text-blue-700 hover:bg-blue-50 rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Explore Job Openings</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Interviews Alert */}
      {upcomingInterviews.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Scheduled Interviews</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingInterviews.map((iv: any) => (
              <div
                key={iv.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-100 dark:border-slate-800 flex items-center justify-between shadow-sm"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">
                    {iv.application?.job?.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {iv.application?.job?.company?.name} • {iv.date} at {iv.startTime}
                  </div>
                </div>
                {iv.meetingLink && (
                  <a
                    href={iv.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 shadow-sm"
                  >
                    Join Call <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Applications Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Active Applications</h3>
            <p className="text-xs text-slate-500">Live recruitment status and stage milestones</p>
          </div>
          <Link
            href="/applications/my"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Full History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentApplications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              You have not applied for any positions yet.{' '}
              <Link href="/jobs" className="text-blue-600 underline">
                Browse open jobs
              </Link>
            </div>
          ) : (
            recentApplications.map((app: any) => {
              const stageColors = getStageColor(app.currentStage);
              return (
                <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600"
                    >
                      {app.job.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {app.job.company.name} • {app.job.location} • Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${stageColors.bg} ${stageColors.text} ${stageColors.border}`}
                    >
                      {app.currentStage}
                    </span>
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
