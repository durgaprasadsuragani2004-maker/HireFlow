'use client';

import React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface RecruiterDashboardProps {
  data: any;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#6366f1', '#10b981', '#f43f5e'];

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ data }) => {
  const m = data?.metrics || {};
  const funnel = data?.funnel || [];
  const jobs = data?.jobs || [];
  const upcomingInterviews = data?.upcomingInterviews || [];

  const statCards = [
    { label: 'Active Jobs', value: m.activeJobs || 0, icon: Briefcase, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Total Applications', value: m.totalApplications || 0, icon: Users, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
    { label: 'In Screening', value: m.candidatesInScreening || 0, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Shortlisted', value: m.shortlistedCandidates || 0, icon: CheckCircle2, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Interviews Scheduled', value: m.interviewsCount || 0, icon: Calendar, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Offers / Selected', value: m.selectedCandidates || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Rejected', value: m.rejectedCandidates || 0, icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recruitment Hub</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pipeline health, applicant conversion, and scheduled interviews.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/jobs/new"
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Post New Job</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 truncate">{card.label}</span>
                <div className={`p-1.5 rounded-lg ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Funnel & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Recruitment Pipeline Funnel</h3>
              <p className="text-xs text-slate-500">Live candidate counts across pipeline stages</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {funnel.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scheduled Interviews */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Interviews</h3>
                <p className="text-xs text-slate-500">Scheduled candidate technical and managerial rounds</p>
              </div>
              <Link
                href="/interviews"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Calendar <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingInterviews.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No upcoming interviews scheduled
                </div>
              ) : (
                upcomingInterviews.map((iv: any) => (
                  <div key={iv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {iv.application?.applicant?.fullName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {iv.application?.job?.title} • {iv.date} at {iv.startTime}
                      </div>
                    </div>
                    {iv.meetingLink ? (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg flex items-center gap-1"
                      >
                        Join <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <Badge variant="outline">{iv.interviewType}</Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Active Postings & Kanban Boards</h3>
            <p className="text-xs text-slate-500">Click any job to open its interactive Kanban pipeline</p>
          </div>
          <Link
            href="/jobs"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Jobs <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job: any) => (
            <div
              key={job.id}
              className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant={job.status === 'PUBLISHED' ? 'success' : 'outline'}>
                    {job.status}
                  </Badge>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {job.applicationsCount} applicants
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">
                  {job.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{job.location}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href={`/applications/kanban/${job.id}`}
                  className="w-full text-center px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open Kanban Pipeline</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
