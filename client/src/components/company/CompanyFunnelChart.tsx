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
  SHORTLISTED: '#f59e0b', // amber
  INTERVIEW: '#6366f1', // indigo
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
      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 shadow-card space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-950/20 border border-rose-800/40 rounded-2xl text-center space-y-2 text-xs text-rose-300">
        <AlertCircle className="w-5 h-5 text-rose-400 mx-auto" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  const hasData = funnel.some((f) => f.count > 0);

  return (
    <div className="bg-dark-card border border-dark-border rounded-3xl p-6 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-border pb-4">
        <div>
          <h3 className="font-bold text-dark-text flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            <span>Recruitment Funnel & Pipeline Health</span>
          </h3>
          <p className="text-xs text-dark-muted mt-0.5">
            {companyName ? `Candidate conversion flow for ${companyName}` : 'Company candidate conversion flow'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <div className="px-3 py-1 bg-brand-500/10 text-brand-300 rounded-xl border border-brand-500/20 font-bold">
            {totalApplications} Applications
          </div>
          <div className="px-3 py-1 bg-dark-input text-dark-muted rounded-xl font-bold border border-dark-border">
            {totalJobs} Active Jobs
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="py-12 text-center space-y-2">
          <Users className="w-8 h-8 text-dark-dim mx-auto" />
          <p className="text-xs font-bold text-dark-text">
            No Candidate Applications Recorded Yet
          </p>
          <p className="text-[11px] text-dark-muted max-w-sm mx-auto">
            When candidates submit applications and advance through pipeline stages, this chart will update in real time.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 10, fill: '#A1AEC2' }}
                axisLine={{ stroke: '#2B3950' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#A1AEC2' }}
                axisLine={{ stroke: '#2B3950' }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                contentStyle={{
                  backgroundColor: '#1C2940',
                  borderColor: '#2B3950',
                  borderRadius: '0.75rem',
                  color: '#F1F5F9',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {funnel.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STAGE_COLORS[entry.stage] || '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
