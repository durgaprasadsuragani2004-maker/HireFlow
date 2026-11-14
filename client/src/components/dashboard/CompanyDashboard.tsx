'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  UserPlus,
  ExternalLink,
  Layers,
  MapPin,
  Globe,
  Video,
  ShieldCheck,
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

interface CompanyDashboardProps {
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

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ data, onRefresh }) => {
  const [deletingJob, setDeletingJob] = useState<any | null>(null);
  const company = data?.company || {};
  const m = data?.metrics || {};
  const funnel = data?.funnel || [];
  const recruiters = data?.recruiters || [];
  const jobs = sortJobsByActiveAndDeadline(data?.companyJobs || data?.jobs || []);
  const upcomingInterviews = data?.upcomingInterviews || [];

  const statCards = [
    {
      label: 'Active Jobs',
      value: m.activeJobs || 0,
      icon: Briefcase,
      trend: 'Published',
    },
    {
      label: 'Total Applicants',
      value: m.totalApplications || 0,
      icon: Users,
      trend: 'In pipeline',
    },
    {
      label: 'In Screening',
      value: m.candidatesInScreening || 0,
      icon: Clock,
      trend: 'Initial review',
    },
    {
      label: 'Shortlisted',
      value: m.shortlistedCandidates || 0,
      icon: CheckCircle2,
      trend: 'Qualified',
    },
    {
      label: 'Interviews',
      value: m.interviewsCount ?? m.activeInterviews ?? 0,
      icon: Calendar,
      trend: 'Scheduled',
    },
    {
      label: 'Hired / Selected',
      value: m.selectedCandidates || 0,
      icon: CheckCircle2,
      trend: 'Successful',
      highlight: true,
    },
    {
      label: 'Recruiters',
      value: m.totalRecruiters ?? recruiters.length,
      icon: ShieldCheck,
      trend: 'Team members',
    },
  ];

  const hasFunnelData = funnel.some((f: any) => f.count > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Organization Header Banner (White & Violet skeuomorphic container) */}
      <div className="skeuo-card p-6 sm:p-7 border border-[#E4E3EF] shadow-card relative overflow-hidden">
        {/* Soft violet ambient light */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#EAE7FF]/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F0F1F8] border border-[#E4E3EF] text-[#6C5CE7] flex items-center justify-center font-bold text-2xl uppercase shrink-0 shadow-sm">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <Building2 className="w-7 h-7 text-[#6C5CE7]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#202033] tracking-tight">
                  {company.name || 'Company Dashboard'}
                </h1>
                <Badge variant="primary">Enterprise Tenant</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-[#68677D] mt-1.5">
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[#9E9EB3]" />
                    <span>{company.industry}</span>
                  </span>
                )}
                {company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#9E9EB3]" />
                    <span>{company.location}</span>
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#6C5CE7] hover:text-[#5B4BD8] transition-colors font-semibold"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{company.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/admin/users"
              className="neu-btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#16A878]" />
              <span>Manage Recruiters</span>
            </Link>

            <Link
              href="/jobs/new"
              className="neu-btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Position</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid (4-Column Layout on Desktop, 2 on Tablet) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="skeuo-card-interactive p-5 flex flex-col justify-between border border-[#E4E3EF] shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#68677D] truncate">
                  {card.label}
                </span>
                <div className="p-2 rounded-xl bg-[#EAE7FF] text-[#6C5CE7] shrink-0 shadow-sm">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-[#202033] tracking-tight">
                  {card.value}
                </div>
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

      {/* Funnel Chart & Upcoming Interviews Grid (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recruitment Funnel Chart */}
        <div className="lg:col-span-7 skeuo-card p-5 sm:p-6 flex flex-col justify-between border border-[#E4E3EF] shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E3EF]">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#202033]">
                Company Recruitment Funnel
              </h2>
              <p className="text-xs text-[#68677D] mt-0.5">
                Candidate distribution across the 6 pipeline stages
              </p>
            </div>
            <Link
              href="/applications/kanban/default"
              className="neu-btn-secondary px-3 py-1.5 text-xs text-[#6C5CE7] font-semibold rounded-xl flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-[#6C5CE7]" />
              <span>Kanban</span>
            </Link>
          </div>

          {hasFunnelData ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="stage"
                    stroke="#68677D"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#68677D"
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(108, 92, 231, 0.04)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-[#E4E3EF] p-2.5 rounded-xl shadow-lg text-xs">
                            <span className="font-bold text-[#202033] block mb-0.5">
                              {payload[0].payload.stage}
                            </span>
                            <span className="text-[#6C5CE7] font-semibold">
                              {payload[0].value} {payload[0].value === 1 ? 'Candidate' : 'Candidates'}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {funnel.map((_entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STAGE_BAR_COLORS[index % STAGE_BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E4E3EF] rounded-2xl bg-[#F8F8FC]">
              <Users className="w-8 h-8 text-[#9E9EB3] mb-2" />
              <p className="text-xs font-semibold text-[#202033]">No Candidates In Pipeline Yet</p>
              <p className="text-[11px] text-[#68677D] mt-0.5 max-w-xs">
                When applicants apply to your active jobs, pipeline analytics will display here.
              </p>
            </div>
          )}
        </div>

        {/* Upcoming Scheduled Interviews */}
        <div className="lg:col-span-5 skeuo-card p-5 sm:p-6 flex flex-col justify-between border border-[#E4E3EF] shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E3EF]">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#202033]">
                Upcoming Interviews
              </h2>
              <p className="text-xs text-[#68677D] mt-0.5">
                Scheduled technical & culture evaluations
              </p>
            </div>
            <Link
              href="/interviews"
              className="text-xs text-[#6C5CE7] hover:text-[#5B4BD8] font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-64">
            {upcomingInterviews.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E4E3EF] rounded-2xl bg-[#F8F8FC]">
                <Calendar className="w-8 h-8 text-[#9E9EB3] mb-2" />
                <p className="text-xs font-semibold text-[#202033]">No Upcoming Interviews</p>
                <p className="text-[11px] text-[#68677D] mt-0.5 max-w-xs">
                  Interviews scheduled with candidates will appear with direct links.
                </p>
              </div>
            ) : (
              upcomingInterviews.map((iv: any) => (
                <div
                  key={iv.id}
                  className="p-3 bg-[#F8F8FC] border border-[#E4E3EF] rounded-xl shadow-sm hover:border-[#8B7CF6] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[#202033] truncate">
                      {iv.application?.applicant?.fullName || 'Candidate'}
                    </div>
                    <div className="text-[11px] text-[#68677D] truncate mt-0.5">
                      {iv.application?.job?.title || 'Job Opening'}
                    </div>
                    <div className="text-[10px] text-[#9E9EB3] mt-1 flex items-center gap-2">
                      <span>{new Date(iv.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{iv.startTime}</span>
                      <span>•</span>
                      <span className="capitalize">{iv.type}</span>
                    </div>
                  </div>

                  {iv.meetingLink ? (
                    <a
                      href={iv.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="neu-btn-primary px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 shrink-0"
                    >
                      <Video className="w-3 h-3" />
                      <span>Join</span>
                    </a>
                  ) : (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      Scheduled
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two Column Section: Company Jobs & Recruiter Team */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Company Jobs */}
        <div className="lg:col-span-7 skeuo-card p-5 sm:p-6 border border-[#E4E3EF] shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E3EF]">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#202033]">
                Company Job Openings
              </h2>
              <p className="text-xs text-[#68677D] mt-0.5">
                Active listings and pipeline applicant volumes
              </p>
            </div>
            <Link
              href="/jobs"
              className="text-xs text-[#6C5CE7] hover:text-[#5B4BD8] font-semibold flex items-center gap-1"
            >
              <span>All Jobs</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {jobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#68677D] border border-dashed border-[#E4E3EF] rounded-2xl bg-[#F8F8FC]">
                No job postings created yet.
              </div>
            ) : (
              jobs.slice(0, 5).map((job: any) => (
                <div
                  key={job.id}
                  className="p-3.5 bg-[#F8F8FC] border border-[#E4E3EF] rounded-2xl shadow-sm hover:border-[#8B7CF6] transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-bold text-xs sm:text-sm text-[#202033] hover:text-[#6C5CE7] transition-colors truncate"
                      >
                        {job.title}
                      </Link>
                      <Badge
                        variant={job.status === 'PUBLISHED' ? 'success' : 'outline'}
                        className="text-[10px]"
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-[#68677D] flex items-center gap-2 mt-1">
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.employmentType?.replace('_', ' ')}</span>
                      {job.recruiterTitle && (
                        <>
                          <span>•</span>
                          <span className="text-[#9E9EB3]">{job.recruiterTitle}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-semibold text-[#6C5CE7] bg-[#EAE7FF] border border-[#8B7CF6]/30 px-2 py-1 rounded-xl shadow-sm">
                      {job.applicationsCount ?? job._count?.applications ?? 0}
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
                      title="Open Kanban Board"
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

        {/* Team Recruiters */}
        <div className="lg:col-span-5 skeuo-card p-5 sm:p-6 border border-[#E4E3EF] shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E3EF]">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#202033]">
                Team Recruiters
              </h2>
              <p className="text-xs text-[#68677D] mt-0.5">
                Authorized talent partners in your organization
              </p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-[#6C5CE7] hover:text-[#5B4BD8] font-semibold flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add</span>
            </Link>
          </div>

          <div className="space-y-2.5">
            {recruiters.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#68677D] border border-dashed border-[#E4E3EF] rounded-2xl bg-[#F8F8FC]">
                No recruiters provisioned yet.
              </div>
            ) : (
              recruiters.map((r: any) => (
                <div
                  key={r.id}
                  className="p-3 bg-[#F8F8FC] border border-[#E4E3EF] rounded-xl shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[#202033] truncate">
                      {r.email}
                    </div>
                    <div className="text-[11px] text-[#68677D] mt-0.5">
                      {r.title || 'Recruitment Specialist'}
                    </div>
                  </div>
                  <Badge variant={r.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {r.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
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
