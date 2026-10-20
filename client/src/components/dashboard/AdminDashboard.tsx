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

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#6366f1', '#10b981', '#f43f5e'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  const m = data?.metrics || {};
  const funnel = data?.funnel || [];
  const topJobs = data?.topJobs || [];

  const statCards = [
    { label: 'Total Users', value: m.totalUsers || 0, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Active Recruiters', value: m.totalRecruiters || 0, icon: Users, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
    { label: 'Applicants', value: m.totalApplicants || 0, icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Companies', value: m.totalCompanies || 0, icon: Building, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Active Jobs', value: m.activeJobs || 0, icon: Briefcase, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Total Applications', value: m.totalApplications || 0, icon: FileCheck2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Candidates Hired', value: m.selectedCandidates || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Applications Rejected', value: m.rejectedCandidates || 0, icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl text-white shadow-xl">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-300">
            System Administration Portal
          </span>
          <h2 className="text-2xl font-bold mt-1">HireFlow ATS Ecosystem Overview</h2>
          <p className="text-sm text-blue-100/80 mt-1">
            Real-time telemetry, candidate conversion funnels, and enterprise recruitment health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="px-4 py-2 text-xs font-semibold bg-white text-blue-900 hover:bg-blue-50 rounded-xl transition-colors shadow-sm"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/audit"
            className="px-4 py-2 text-xs font-semibold bg-blue-800/80 hover:bg-blue-800 text-white rounded-xl transition-colors border border-blue-700/50"
          >
            Audit Logs
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Funnel Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Recruitment Funnel</h3>
              <p className="text-xs text-slate-500">Candidate flow across active recruitment stages</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
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

        {/* Top Active Jobs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Top Jobs by Applications</h3>
              <p className="text-xs text-slate-500">Highest applicant volume positions</p>
            </div>
            <Link
              href="/jobs"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topJobs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No applications yet</div>
            ) : (
              topJobs.map((job: any) => (
                <div key={job.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600"
                    >
                      {job.title}
                    </Link>
                    <div className="text-xs text-slate-500">{job.company}</div>
                  </div>
                  <Badge variant="info">{job.applicationsCount} applicants</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
