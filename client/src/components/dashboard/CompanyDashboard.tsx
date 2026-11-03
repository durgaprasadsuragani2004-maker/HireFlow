'use client';

import React from 'react';
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

interface CompanyDashboardProps {
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

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ data }) => {
  const company = data?.company || {};
  const m = data?.metrics || {};
  const funnel = data?.funnel || [];
  const recruiters = data?.recruiters || [];
  const jobs = data?.companyJobs || data?.jobs || [];
  const upcomingInterviews = data?.upcomingInterviews || [];

  const statCards = [
    {
      label: 'Active Jobs',
      value: m.activeJobs || 0,
      icon: Briefcase,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Total Applicants',
      value: m.totalApplications || 0,
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'In Screening',
      value: m.candidatesInScreening || 0,
      icon: Clock,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Shortlisted',
      value: m.shortlistedCandidates || 0,
      icon: CheckCircle2,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Interviews',
      value: m.interviewsCount ?? m.activeInterviews ?? 0,
      icon: Calendar,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Hired / Selected',
      value: m.selectedCandidates || 0,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Recruiters',
      value: m.totalRecruiters ?? recruiters.length,
      icon: ShieldCheck,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    },
  ];

  const hasFunnelData = funnel.some((f: any) => f.count > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Organization Header Banner */}
      <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-2xl uppercase shrink-0 shadow-inner">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <Building2 className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[#F1F5F9] tracking-tight">
                  {company.name || 'Company Dashboard'}
                </h1>
                <Badge variant="info">Enterprise Tenant</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-[#A1AEC2] mt-1.5">
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>{company.industry}</span>
                  </span>
                )}
                {company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>{company.location}</span>
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
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
              className="px-3.5 py-2 text-xs font-semibold bg-[#1C2940] hover:bg-[#28374E] text-[#F1F5F9] border border-[#2B3950] rounded-xl transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-400" />
              <span>Manage Recruiters</span>
            </Link>

            <Link
              href="/jobs/new"
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm hover:shadow-glow-primary transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Position</span>
            </Link>
          </div>
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
                <span className="text-[11px] font-semibold text-[#A1AEC2] truncate">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.color} shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#F1F5F9] mt-2">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Funnel Chart & Upcoming Interviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recruitment Funnel Chart */}
        <div className="lg:col-span-7 bg-[#151F32] border border-[#2B3950] rounded-3xl p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F1F5F9]">
                Company Recruitment Funnel
              </h2>
              <p className="text-xs text-[#A1AEC2] mt-0.5">
                Candidate distribution across the 6 pipeline stages
              </p>
            </div>
            <Link
              href="/applications/kanban/default"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </Link>
          </div>

          {hasFunnelData ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="stage"
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1C2940] border border-[#2B3950] p-2.5 rounded-xl shadow-dropdown text-xs">
                            <span className="font-bold text-[#F1F5F9] block mb-0.5">
                              {payload[0].payload.stage}
                            </span>
                            <span className="text-indigo-300 font-semibold">
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
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#2B3950] rounded-2xl">
              <Users className="w-8 h-8 text-[#64748B] mb-2" />
              <p className="text-xs font-semibold text-[#F1F5F9]">No Candidates In Pipeline Yet</p>
              <p className="text-[11px] text-[#A1AEC2] mt-0.5 max-w-xs">
                When applicants apply to your active jobs, pipeline analytics will display here.
              </p>
            </div>
          )}
        </div>

        {/* Upcoming Scheduled Interviews */}
        <div className="lg:col-span-5 bg-[#151F32] border border-[#2B3950] rounded-3xl p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F1F5F9]">
                Upcoming Interviews
              </h2>
              <p className="text-xs text-[#A1AEC2] mt-0.5">
                Scheduled technical & culture evaluations
              </p>
            </div>
            <Link
              href="/interviews"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-64">
            {upcomingInterviews.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#2B3950] rounded-2xl">
                <Calendar className="w-8 h-8 text-[#64748B] mb-2" />
                <p className="text-xs font-semibold text-[#F1F5F9]">No Upcoming Interviews</p>
                <p className="text-[11px] text-[#A1AEC2] mt-0.5 max-w-xs">
                  Interviews scheduled with candidates will appear with direct links.
                </p>
              </div>
            ) : (
              upcomingInterviews.map((iv: any) => (
                <div
                  key={iv.id}
                  className="p-3 bg-[#101726] border border-[#2B3950] rounded-xl hover:border-indigo-500/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[#F1F5F9] truncate">
                      {iv.application?.applicant?.fullName || 'Candidate'}
                    </div>
                    <div className="text-[11px] text-[#A1AEC2] truncate mt-0.5">
                      {iv.application?.job?.title || 'Job Opening'}
                    </div>
                    <div className="text-[10px] text-[#64748B] mt-1 flex items-center gap-2">
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
                      className="px-2.5 py-1 text-[11px] font-bold bg-indigo-500/15 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-1 shrink-0"
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
        <div className="lg:col-span-7 bg-[#151F32] border border-[#2B3950] rounded-3xl p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F1F5F9]">
                Company Job Openings
              </h2>
              <p className="text-xs text-[#A1AEC2] mt-0.5">
                Active listings and pipeline applicant volumes
              </p>
            </div>
            <Link
              href="/jobs"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>All Jobs</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {jobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A1AEC2] border border-dashed border-[#2B3950] rounded-2xl">
                No job postings created yet.
              </div>
            ) : (
              jobs.slice(0, 5).map((job: any) => (
                <div
                  key={job.id}
                  className="p-3.5 bg-[#101726] border border-[#2B3950] rounded-2xl hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-bold text-xs sm:text-sm text-[#F1F5F9] hover:text-indigo-400 transition-colors truncate"
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
                    <div className="text-[11px] text-[#A1AEC2] flex items-center gap-2 mt-1">
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.employmentType?.replace('_', ' ')}</span>
                      {job.recruiterTitle && (
                        <>
                          <span>•</span>
                          <span className="text-[#64748B]">{job.recruiterTitle}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20">
                      {job.applicationsCount ?? job._count?.applications ?? 0} applicants
                    </span>
                    <Link
                      href={`/applications/kanban/${job.id}`}
                      className="p-1.5 text-[#A1AEC2] hover:text-white hover:bg-[#1C2940] rounded-xl transition-colors"
                      title="Open Kanban Board"
                    >
                      <Layers className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Recruiters */}
        <div className="lg:col-span-5 bg-[#151F32] border border-[#2B3950] rounded-3xl p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F1F5F9]">
                Team Recruiters
              </h2>
              <p className="text-xs text-[#A1AEC2] mt-0.5">
                Authorized talent partners in your organization
              </p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add</span>
            </Link>
          </div>

          <div className="space-y-2.5">
            {recruiters.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A1AEC2] border border-dashed border-[#2B3950] rounded-2xl">
                No recruiters provisioned yet.
              </div>
            ) : (
              recruiters.map((r: any) => (
                <div
                  key={r.id}
                  className="p-3 bg-[#101726] border border-[#2B3950] rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[#F1F5F9] truncate">
                      {r.email}
                    </div>
                    <div className="text-[11px] text-[#A1AEC2] mt-0.5">
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
    </div>
  );
};

