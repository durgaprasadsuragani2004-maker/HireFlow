'use client';

import React, { useState } from 'react';
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
  Video,
  Edit,
  Trash2,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { DeleteJobModal } from '../jobs/DeleteJobModal';
import { sortJobsByActiveAndDeadline } from '../../lib/utils';
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
  onRefresh?: () => void;
}

const STAGE_BAR_COLORS = [
  '#6C5CE7', // APPLIED (primary violet)
  '#8B7CF6', // SCREENING (secondary violet)
  '#E9A23B', // SHORTLISTED (warning amber)
  '#B4A9FB', // INTERVIEW (light violet)
  '#16A878', // SELECTED (success teal)
  '#E05260', // REJECTED (error rose)
];

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ data, onRefresh }) => {
  const [deletingJob, setDeletingJob] = useState<any | null>(null);
  const m = data?.metrics || {};
  const funnel = data?.funnel || [];
  const jobs = sortJobsByActiveAndDeadline(data?.jobs || []);
  const upcomingInterviews = data?.upcomingInterviews || [];
  const recentApplications = data?.recentApplications || [];

  const statCards = [
    { label: 'Active Jobs', value: m.activeJobs || 0, icon: Briefcase, trend: 'Published' },
    { label: 'Applications', value: m.totalApplications || 0, icon: Users, trend: 'Candidates' },
    { label: 'In Screening', value: m.candidatesInScreening || 0, icon: Clock, trend: 'Reviewing' },
    { label: 'Shortlisted', value: m.shortlistedCandidates || 0, icon: CheckCircle2, trend: 'Qualified' },
    { label: 'Interviews', value: m.interviewsCount || 0, icon: Calendar, trend: 'Upcoming' },
    { label: 'Offers / Hired', value: m.selectedCandidates || 0, icon: CheckCircle2, trend: 'Accepted', highlight: true },
    { label: 'Rejected', value: m.rejectedCandidates || 0, icon: XCircle, trend: 'Unsuccessful' },
  ];

  const hasFunnelData = funnel.some((f: any) => f.count > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="skeuo-card p-6 sm:p-7 border border-[#E4E3EF] shadow-card relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#EAE7FF]/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202033] tracking-tight">Recruiter Operations Hub</h1>
          <p className="text-xs sm:text-sm text-[#68677D] mt-1 max-w-xl">
            Real-time pipeline progression, candidate conversion funnel, and scheduled evaluations.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2.5">
          <Link
            href="/jobs/new"
            className="neu-btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post New Job</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Row (4-Column Layout on Desktop, 2 on Tablet) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
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

      {/* Funnel & Upcoming Interviews (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="skeuo-card p-6 flex flex-col justify-between border border-[#E4E3EF] shadow-card">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E3EF]">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#202033] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#6C5CE7]" />
                  <span>Pipeline Conversion Funnel</span>
                </h3>
                <p className="text-xs text-[#68677D] mt-0.5">Live candidate counts distributed across stages</p>
              </div>
              <span className="text-[11px] font-bold text-[#6C5CE7] bg-[#EAE7FF] border border-[#8B7CF6]/30 px-2.5 py-0.5 rounded-full shadow-sm">
                {m.totalApplications || 0} Total
              </span>
            </div>

            {!hasFunnelData ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#68677D] border border-dashed border-[#E4E3EF] rounded-2xl bg-[#F8F8FC]">
                <Layers className="w-8 h-8 mb-2 text-[#9E9EB3]" />
                <span className="text-xs font-semibold text-[#202033]">No candidate stage movements recorded yet</span>
                <span className="text-[11px] text-[#68677D] mt-0.5">Candidates will appear here as they enter the pipeline</span>
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#68677D' }} axisLine={{ stroke: '#E4E3EF' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#68677D' }} axisLine={{ stroke: '#E4E3EF' }} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(108, 92, 231, 0.04)' }}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E4E3EF',
                        borderRadius: '0.75rem',
                        color: '#202033',
                        fontSize: '12px',
                        boxShadow: '0 8px 24px rgba(32, 32, 51, 0.12)',
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
        <div className="skeuo-card p-6 flex flex-col justify-between border border-[#E4E3EF] shadow-card">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E3EF]">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#202033] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#6C5CE7]" />
                  <span>Upcoming Interviews</span>
                </h3>
                <p className="text-xs text-[#68677D] mt-0.5">Scheduled candidate technical and managerial rounds</p>
              </div>
              <Link
                href="/interviews"
                className="text-xs font-bold text-[#6C5CE7] hover:text-[#5B4BD8] flex items-center gap-1"
              >
                Calendar <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#E4E3EF]">
              {upcomingInterviews.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#68677D] border border-dashed border-[#E4E3EF] rounded-2xl bg-[#F8F8FC]">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-[#9E9EB3]" />
                  <span className="font-semibold text-[#202033]">No upcoming interviews scheduled</span>
                  <p className="text-[11px] text-[#68677D] mt-0.5">Schedule rounds directly from candidate cards or the interview tab.</p>
                </div>
              ) : (
                upcomingInterviews.slice(0, 5).map((iv: any) => (
                  <div key={iv.id} className="py-3 flex items-center justify-between gap-3 hover:bg-[#F8F8FC] px-2 rounded-xl transition-colors">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-[#202033] truncate">
                        {iv.application?.applicant?.fullName}
                      </div>
                      <div className="text-xs text-[#68677D] truncate mt-0.5">
                        {iv.application?.job?.title} • <span className="font-semibold text-[#202033]">{iv.date}</span> at {iv.startTime}
                      </div>
                    </div>
                    {iv.meetingLink ? (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-btn-primary px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join</span>
                      </a>
                    ) : (
                      <Badge variant="outline" className="text-[11px] shrink-0">
                        {iv.type}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Jobs Section */}
      <div className="skeuo-card p-6 border border-[#E4E3EF] shadow-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E3EF]">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#202033] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#6C5CE7]" />
              <span>My Active Job Openings</span>
            </h3>
            <p className="text-xs text-[#68677D] mt-0.5">Open requisitions with candidate volume and Kanban pipelines</p>
          </div>
          <Link
            href="/jobs"
            className="text-xs font-bold text-[#6C5CE7] hover:text-[#5B4BD8] flex items-center gap-1"
          >
            Manage Jobs <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {jobs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#68677D] border border-dashed border-[#E4E3EF] rounded-2xl bg-[#F8F8FC]">
              No active jobs posted under your account yet.
            </div>
          ) : (
            jobs.slice(0, 5).map((job: any) => (
              <div
                key={job.id}
                className="p-3.5 bg-[#F8F8FC] border border-[#E4E3EF] rounded-2xl shadow-sm hover:border-[#8B7CF6] transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-bold text-xs sm:text-sm text-[#202033] hover:text-[#6C5CE7] transition-colors truncate"
                    >
                      {job.title}
                    </Link>
                    <Badge variant={job.status === 'PUBLISHED' ? 'success' : 'outline'} className="text-[10px]">
                      {job.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-[#68677D] mt-0.5">
                    {job.location} • {job.employmentType?.replace('_', ' ')} • {job.experienceLevel?.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-semibold text-[#6C5CE7] bg-[#EAE7FF] border border-[#8B7CF6]/30 px-2 py-1 rounded-xl shadow-sm">
                    {job.applicationsCount || 0}
                  </span>
                  <Link
                    href={`/jobs/${job.id}/edit`}
                    className="neu-icon-btn p-1.5 rounded-xl text-[#68677D] hover:text-[#202033]"
                    title="Edit Job"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/applications/kanban/${job.id}`}
                    className="neu-icon-btn p-1.5 rounded-xl"
                    title="Open Kanban pipeline"
                  >
                    <Layers className="w-4 h-4 text-[#6C5CE7]" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeletingJob(job)}
                    className="neu-icon-btn p-1.5 rounded-xl text-rose-500 hover:text-rose-600 cursor-pointer"
                    title="Delete or Archive Job"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Candidate Applications Section */}
      <div className="skeuo-card p-6 border border-[#E4E3EF] shadow-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E3EF]">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#202033] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#6C5CE7]" />
              <span>Recent Candidate Applications</span>
            </h3>
            <p className="text-xs text-[#68677D] mt-0.5">
              Live incoming candidate submissions across your organization's open positions
            </p>
          </div>
          <Link
            href="/applicants"
            className="text-xs font-bold text-[#6C5CE7] hover:text-[#5B4BD8] flex items-center gap-1"
          >
            Talent Pool <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentApplications.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#68677D] border border-dashed border-[#E4E3EF] rounded-2xl bg-[#F8F8FC]">
              No applicant submissions recorded for your organization yet.
            </div>
          ) : (
            recentApplications.map((app: any) => (
              <div
                key={app.id}
                className="p-3.5 bg-[#F8F8FC] border border-[#E4E3EF] rounded-2xl shadow-sm hover:border-[#8B7CF6] transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-[#202033] truncate">
                      {app.candidateName}
                    </span>
                    <Badge
                      variant={
                        app.stage === 'SELECTED'
                          ? 'success'
                          : app.stage === 'REJECTED'
                          ? 'danger'
                          : app.stage === 'INTERVIEW'
                          ? 'warning'
                          : 'default'
                      }
                      className="text-[10px]"
                    >
                      {app.stage}
                    </Badge>
                  </div>
                  <div className="text-xs text-[#68677D] mt-0.5 truncate">
                    {app.candidateEmail} • Applied for <strong className="text-[#202033]">{app.jobTitle}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/applications/kanban/${app.jobId}`}
                    className="neu-btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1"
                    title="Review in Kanban pipeline"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#6C5CE7]" />
                    <span className="hidden sm:inline">Kanban</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete or Archive Job Modal */}
      {deletingJob && (
        <DeleteJobModal
          job={deletingJob}
          isOpen={Boolean(deletingJob)}
          onClose={() => setDeletingJob(null)}
          onSuccess={() => onRefresh?.()}
        />
      )}
    </div>
  );
};
