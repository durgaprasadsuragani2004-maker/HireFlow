'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, Users, AlertCircle } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

interface CompanyFunnelChartProps {
  funnel: Array<{ stage: string; count: number }>;
  totalApplications?: number;
  totalJobs?: number;
  loading?: boolean;
  error?: string | null;
  companyName?: string;
}

const STAGE_COLORS: Record<string, string> = {
  APPLIED: '#3b82f6', // blue
  SCREENING: '#8b5cf6', // purple
  SHORTLISTED: '#6366f1', // indigo
  INTERVIEW: '#f59e0b', // amber
  SELECTED: '#10b981', // emerald
  REJECTED: '#f43f5e', // rose
};

export const CompanyFunnelChart: React.FC<CompanyFunnelChartProps> = ({
  funnel = [],
  totalApplications = 0,
  totalJobs = 0,
  loading = false,
  error = null,
  companyName,
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-center space-y-2 text-xs text-rose-700 dark:text-rose-300">
        <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  const hasData = funnel.some((f) => f.count > 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Recruitment Funnel & Pipeline Health</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {companyName ? `Candidate conversion flow for ${companyName}` : 'Company candidate conversion flow'}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-900 font-semibold">
            {totalApplications} Applications
          </div>
          <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold">
            {totalJobs} Jobs
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="py-12 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            No Candidate Applications Recorded Yet
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            When candidates submit applications and advance through pipeline stages, this chart will update in real time.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${val} Candidate${val === 1 ? '' : 's'}`, 'Count']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {funnel.map((entry) => (
                  <Cell
                    key={entry.stage}
                    fill={STAGE_COLORS[entry.stage] || '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stage Legend and Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {funnel.map((item) => (
          <div
            key={item.stage}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-center"
          >
            <div
              className="w-2.5 h-2.5 rounded-full mx-auto mb-1"
              style={{ backgroundColor: STAGE_COLORS[item.stage] || '#3b82f6' }}
            />
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">
              {item.stage}
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {item.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
