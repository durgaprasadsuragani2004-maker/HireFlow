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
  Plus,
  TrendingUp,
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

const STAGE_BAR_COLORS = [
  '#38BDF8', // APPLIED (sky)
  '#A78BFA', // SCREENING (violet)
  '#FBBF24', // SHORTLISTED (amber)
  '#818CF8', // INTERVIEW (indigo)
  '#34D399', // SELECTED (emerald)
  '#FB7185', // REJECTED (rose)
];

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ data }) => {
  const m = data?.metrics || {};
  const funnel = data?.funnel || [];
  const jobs = data?.jobs || [];
  const upcomingInterviews = data?.upcomingInterviews || [];

  const statCards = [
    { label: 'Active Jobs', value: m.activeJobs || 0, icon: Briefcase, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Applications', value: m.totalApplications || 0, icon: Users, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { label: 'In Screening', value: m.candidatesInScreening || 0, icon: Clock, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    { label: 'Shortlisted', value: m.shortlistedCandidates || 0, icon: CheckCircle2, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Interviews', value: m.interviewsCount || 0, icon: Calendar, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Offers / Hired', value: m.selectedCandidates || 0, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Rejected', value: m.rejectedCandidates || 0, icon: XCircle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  ];

  const hasFunnelData = funnel.some((f: any) => f.count > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-tight">Recruiter Operations Hub</h1>
          <p className="text-xs sm:text-sm text-[#A1AEC2] mt-0.5">
            Real-time pipeline progression, candidate conversion funnel, and scheduled interviews.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/jobs/new"
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-sm hover:shadow-glow-primary flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post New Job</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
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
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#F1F5F9] mt-2">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Funnel & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2B3950]">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#F1F5F9] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Pipeline Conversion Funnel</span>
                </h3>
                <p className="text-xs text-[#A1AEC2] mt-0.5">Live candidate counts distributed across stages</p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                {m.totalApplications || 0} Total
              </span>
            </div>

            {!hasFunnelData ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#64748B]">
                <Layers className="w-8 h-8 mb-2 text-[#64748B]" />
                <span className="text-xs font-medium text-[#F1F5F9]">No candidate stage movements recorded yet</span>
                <span className="text-[11px] text-[#A1AEC2] mt-0.5">Candidates will appear here as they enter the pipeline</span>
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#2B3950' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#2B3950' }} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                      contentStyle={{
                        backgroundColor: '#1C2940',
                        borderColor: '#2B3950',
                        borderRadius: '0.75rem',
                        color: '#F1F5F9',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {funnel.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STAGE_BAR_COLORS[index % STAGE_BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Interviews */}
        <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2B3950]">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#F1F5F9] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Upcoming Interviews</span>
                </h3>
                <p className="text-xs text-[#A1AEC2] mt-0.5">Scheduled candidate technical and managerial rounds</p>
              </div>
              <Link
                href="/interviews"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Calendar <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#2B3950]">
              {upcomingInterviews.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#64748B]">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-[#64748B]" />
                  <span className="font-medium text-[#F1F5F9]">No upcoming interviews scheduled</span>
                  <p className="text-[11px] text-[#A1AEC2] mt-0.5">Schedule rounds directly from candidate cards or the interview tab.</p>
                </div>
              ) : (
                upcomingInterviews.slice(0, 5).map((iv: any) => (
                  <div key={iv.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-[#F1F5F9] truncate">
                        {iv.application?.applicant?.fullName}
                      </div>
                      <div className="text-xs text-[#A1AEC2] truncate mt-0.5">
                        {iv.application?.job?.title} • <span className="font-medium text-[#F1F5F9]">{iv.date}</span> at {iv.startTime}
                      </div>
                    </div>
                    {iv.meetingLink ? (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-bold bg-indigo-500/15 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-xl border border-indigo-500/30 transition-all flex items-center gap-1 shrink-0"
                      >
                        <span>Join</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <Badge variant="outline" className="text-[10px] shrink-0">{iv.interviewType || 'Interview'}</Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Overview */}
      <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#2B3950]">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#F1F5F9] flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Active Postings & Kanban Pipelines</span>
            </h3>
            <p className="text-xs text-[#A1AEC2] mt-0.5">Select any job to launch its real-time Kanban pipeline</p>
          </div>
          <Link
            href="/jobs"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            All Postings <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748B]">
            No active jobs found. Post your first job opening to start receiving candidates.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job: any) => (
              <div
                key={job.id}
                className="p-4 border border-[#2B3950] rounded-2xl bg-[#101726] hover:border-indigo-500/40 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={job.status === 'PUBLISHED' ? 'success' : 'outline'}>
                      {job.status}
                    </Badge>
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      {job.applicationsCount} {job.applicationsCount === 1 ? 'applicant' : 'applicants'}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#F1F5F9] text-sm line-clamp-1">
                    {job.title}
                  </h4>
                  <p className="text-xs text-[#A1AEC2] mt-0.5 line-clamp-1">{job.location} • {job.employmentType?.replace('_', ' ')}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2B3950] flex items-center justify-between">
                  <Link
                    href={`/applications/kanban/${job.id}`}
                    className="w-full text-center px-3 py-2 text-xs font-bold bg-[#1C2940] hover:bg-indigo-600 hover:text-white text-[#F1F5F9] rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Launch Kanban Pipeline</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
