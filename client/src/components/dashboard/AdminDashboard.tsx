'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Briefcase,
  Building,
  FileCheck2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Building2,
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

interface AdminDashboardProps {
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  const m = data?.metrics || {};
  const funnel = data?.funnel || [];
  const topJobs = data?.topJobs || [];

  const statCards = [
    {
      label: 'Total Users',
      value: m.totalUsers || 0,
      icon: Users,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Active Recruiters',
      value: m.totalRecruiters || 0,
      icon: Users,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      label: 'Applicants',
      value: m.totalApplicants || 0,
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'Companies',
      value: m.totalCompanies || 0,
      icon: Building,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    },
    {
      label: 'Active Jobs',
      value: m.activeJobs || 0,
      icon: Briefcase,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Total Applications',
      value: m.totalApplications || 0,
      icon: FileCheck2,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Candidates Hired',
      value: m.selectedCandidates || 0,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Applications Rejected',
      value: m.rejectedCandidates || 0,
      icon: XCircle,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 bg-[#151F32] rounded-3xl text-white shadow-card border border-[#2B3950] relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-[#F1F5F9]">
            HireFlow Ecosystem Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#A1AEC2] mt-1 max-w-xl leading-relaxed">
            Multi-tenant governance, organization accounts, candidate funnel metrics, and audit trails.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
          <Link
            href="/admin/users"
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-sm hover:shadow-glow-primary"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/companies"
            className="px-4 py-2 text-xs font-bold bg-[#1C2940] hover:bg-[#28374E] text-[#F1F5F9] rounded-xl transition-colors border border-[#2B3950]"
          >
            Organizations
          </Link>
          <Link
            href="/admin/audit"
            className="px-4 py-2 text-xs font-bold bg-[#1C2940] hover:bg-[#28374E] text-[#A1AEC2] hover:text-[#F1F5F9] rounded-xl transition-colors border border-[#2B3950]"
          >
            Audit Trail
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
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

      {/* Analytics & Top Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Conversion Funnel */}
        <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2B3950]">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#F1F5F9] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Platform Recruitment Funnel</span>
                </h3>
                <p className="text-xs text-[#A1AEC2] mt-0.5">Aggregate conversion flow across all companies</p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                {m.totalApplications || 0} Total
              </span>
            </div>

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
          </div>
        </div>

        {/* Top Active Positions */}
        <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2B3950]">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#F1F5F9] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <span>High-Volume Job Postings</span>
                </h3>
                <p className="text-xs text-[#A1AEC2] mt-0.5">Positions attracting the highest candidate volume</p>
              </div>
              <Link
                href="/jobs"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#2B3950]">
              {topJobs.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#64748B]">
                  No active job postings found
                </div>
              ) : (
                topJobs.slice(0, 5).map((job: any) => (
                  <div key={job.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-[#F1F5F9] truncate">
                        {job.title}
                      </div>
                      <div className="text-xs text-[#A1AEC2] truncate mt-0.5">
                        {job.company?.name} • {job.location}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded-xl shrink-0">
                      {job.applicationsCount} applicants
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
