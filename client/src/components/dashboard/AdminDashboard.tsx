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
  ShieldCheck,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  const m = data?.metrics || {};
  const funnel = data?.funnel || [];
  const topJobs = data?.topJobs || [];

  const statCards = [
    {
      label: 'Total Users',
      value: m.totalUsers || 0,
      icon: Users,
      trend: 'Registered',
    },
    {
      label: 'Active Recruiters',
      value: m.totalRecruiters || 0,
      icon: UserCheck,
      trend: 'Verified',
    },
    {
      label: 'Applicants',
      value: m.totalApplicants || 0,
      icon: Users,
      trend: 'Candidate pool',
    },
    {
      label: 'Organizations',
      value: m.totalCompanies || 0,
      icon: Building,
      trend: 'Companies',
    },
    {
      label: 'Active Jobs',
      value: m.activeJobs || 0,
      icon: Briefcase,
      trend: 'Published',
    },
    {
      label: 'Total Applications',
      value: m.totalApplications || 0,
      icon: FileCheck2,
      trend: 'Processed',
    },
    {
      label: 'Candidates Hired',
      value: m.selectedCandidates || 0,
      icon: CheckCircle2,
      trend: 'Success rate',
      highlight: true,
    },
    {
      label: 'Applications Rejected',
      value: m.rejectedCandidates || 0,
      icon: XCircle,
      trend: 'Closed files',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner (White & Violet skeuomorphic container) */}
      <div className="skeuo-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative overflow-hidden border border-[#E4E3EF] shadow-card">
        {/* Soft violet ambient light */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#EAE7FF]/70 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#EAE7FF] border border-[#8B7CF6]/30 text-[#6C5CE7] shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Super Admin Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-[#202033]">
            HireFlow Ecosystem Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#68677D] mt-1 max-w-xl leading-relaxed">
            Multi-tenant governance, organization accounts, candidate funnel metrics, and audit trails.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
          <Link
            href="/admin/users"
            className="neu-btn-primary px-4 py-2 text-xs font-bold rounded-xl"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/companies"
            className="neu-btn-secondary px-4 py-2 text-xs font-bold rounded-xl"
          >
            Organizations
          </Link>
          <Link
            href="/admin/audit"
            className="neu-btn-secondary px-4 py-2 text-xs font-bold rounded-xl text-[#68677D] hover:text-[#202033]"
          >
            Audit Trail
          </Link>
        </div>
      </div>

      {/* 4-Column Balanced Metrics Grid */}
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

      {/* Analytics & Top Jobs (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Conversion Funnel */}
        <div className="skeuo-card p-6 flex flex-col justify-between border border-[#E4E3EF] shadow-card">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E3EF]">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#202033] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#6C5CE7]" />
                  <span>Platform Recruitment Funnel</span>
                </h3>
                <p className="text-xs text-[#68677D] mt-0.5">Aggregate conversion flow across all companies</p>
              </div>
              <span className="text-[11px] font-bold text-[#6C5CE7] bg-[#EAE7FF] border border-[#8B7CF6]/30 px-2.5 py-0.5 rounded-full shadow-sm">
                {m.totalApplications || 0} Total
              </span>
            </div>

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
          </div>
        </div>

        {/* Top Active Positions */}
        <div className="skeuo-card p-6 flex flex-col justify-between border border-[#E4E3EF] shadow-card">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E3EF]">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#202033] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#6C5CE7]" />
                  <span>High-Volume Job Postings</span>
                </h3>
                <p className="text-xs text-[#68677D] mt-0.5">Positions attracting the highest candidate volume</p>
              </div>
              <Link
                href="/jobs"
                className="text-xs font-bold text-[#6C5CE7] hover:text-[#5B4BD8] flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#E4E3EF]">
              {topJobs.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#68677D]">
                  No active job postings found
                </div>
              ) : (
                topJobs.slice(0, 5).map((job: any) => (
                  <div key={job.id} className="py-3 flex items-center justify-between gap-3 hover:bg-[#F8F8FC] px-2 rounded-xl transition-colors">
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-[#202033] truncate">
                        {job.title}
                      </div>
                      <div className="text-xs text-[#68677D] truncate mt-0.5">
                        {job.company?.name} • {job.location}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold text-[#6C5CE7] bg-[#EAE7FF] border border-[#8B7CF6]/30 rounded-xl shrink-0 shadow-sm">
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
