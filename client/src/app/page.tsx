'use client';

import React from 'react';
import Link from 'next/link';
import { DOCS_URL } from '@/lib/api';
import { useAuth } from '../providers/AuthContext';
import {
  Layers,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  Cpu,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-12 py-2 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl skeuo-card p-8 sm:p-12 lg:p-16 border border-[#E4E3EF] shadow-card">
        {/* Soft violet physical ambient light */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#EAE7FF]/70 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#EAE7FF]/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EAE7FF] border border-[#8B7CF6]/30 text-[#6C5CE7] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Enterprise Multi-Tenant ATS & Recruitment Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-[#202033]">
            Modern Talent Acquisition,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6]">
              Streamlined.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#68677D] leading-relaxed max-w-2xl">
            HireFlow unifies multi-stage Kanban recruitment pipelines, interview scheduling, strict organization-level data isolation, and real-time candidate funnel telemetry into one high-performance SaaS platform.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            {user ? (
              <Link
                href="/dashboard"
                className="neu-btn-primary px-6 py-3 text-sm font-bold text-white rounded-xl shadow-neu-primary flex items-center gap-2 cursor-pointer"
              >
                <span>Go to My Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="neu-btn-primary px-6 py-3 text-sm font-bold text-white rounded-xl shadow-neu-primary flex items-center gap-2 cursor-pointer"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/jobs"
                  className="neu-btn-secondary px-6 py-3 text-sm font-bold text-[#202033] rounded-xl cursor-pointer"
                >
                  Browse Job Board
                </Link>
              </>
            )}

            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="neu-btn-secondary px-5 py-3 text-sm font-semibold text-[#6C5CE7] hover:text-[#5B4BD8] flex items-center gap-1.5 rounded-xl cursor-pointer"
            >
              <span>Swagger API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Feature Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="skeuo-card-interactive rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-[#E4E3EF] shadow-card">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#EAE7FF] text-[#6C5CE7] flex items-center justify-center mb-4 border border-[#8B7CF6]/25 shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#202033] mb-2">
              Interactive Kanban Pipeline
            </h3>
            <p className="text-xs text-[#68677D] leading-relaxed">
              Drag-and-drop candidates across 6 recruitment stages (Applied, Screening, Shortlisted, Interview, Selected, Rejected) with real-time audit trail and applicant notifications.
            </p>
          </div>
          <Link
            href="/jobs"
            className="mt-5 text-xs font-bold text-[#6C5CE7] hover:text-[#5B4BD8] flex items-center gap-1.5 transition-colors"
          >
            Explore Pipeline <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="skeuo-card-interactive rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-[#E4E3EF] shadow-card">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#16A878]/12 text-[#16A878] flex items-center justify-center mb-4 border border-[#16A878]/25 shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#202033] mb-2">
              Interview Scheduling & Conflict Checks
            </h3>
            <p className="text-xs text-[#68677D] leading-relaxed">
              Schedule technical, managerial, and HR interview rounds with automated conflict prevention, meeting URL distribution, and candidate schedule view.
            </p>
          </div>
          <Link
            href="/interviews"
            className="mt-5 text-xs font-bold text-[#16A878] hover:text-[#0F875F] flex items-center gap-1.5 transition-colors"
          >
            View Calendar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="skeuo-card-interactive rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-[#E4E3EF] shadow-card">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#EAE7FF] text-[#6C5CE7] flex items-center justify-center mb-4 border border-[#8B7CF6]/25 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#202033] mb-2">
              Enterprise Multi-Tenant Isolation
            </h3>
            <p className="text-xs text-[#68677D] leading-relaxed">
              Strict multi-tenant boundaries ensure Company accounts and Recruiters can only access candidates who applied to their company, while Super Admins provision organizations and monitor audit trails.
            </p>
          </div>
          <Link
            href="/admin/users"
            className="mt-5 text-xs font-bold text-[#6C5CE7] hover:text-[#5B4BD8] flex items-center gap-1.5 transition-colors"
          >
            Security Architecture <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Technology Architecture Cards */}
      <div className="skeuo-card rounded-3xl p-8 border border-[#E4E3EF] shadow-card">
        <div className="text-center max-w-xl mx-auto mb-6">
          <h2 className="text-xl font-extrabold text-[#202033]">
            Production-Grade Technology Architecture
          </h2>
          <p className="text-xs text-[#68677D] mt-1">
            Built for reliability, speed, and responsive enterprise workloads.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-[#F8F8FC] rounded-2xl border border-[#E4E3EF] shadow-sm hover:border-[#8B7CF6] transition-colors">
            <Cpu className="w-6 h-6 mx-auto text-[#6C5CE7] mb-2" />
            <div className="font-bold text-sm text-[#202033]">Next.js 14 & React 18</div>
            <div className="text-[11px] text-[#68677D] mt-1">App Router + Tailwind CSS</div>
          </div>
          <div className="p-4 bg-[#F8F8FC] rounded-2xl border border-[#E4E3EF] shadow-sm hover:border-[#8B7CF6] transition-colors">
            <Database className="w-6 h-6 mx-auto text-[#6C5CE7] mb-2" />
            <div className="font-bold text-sm text-[#202033]">Prisma ORM</div>
            <div className="text-[11px] text-[#68677D] mt-1">PostgreSQL 16 Relational Schema</div>
          </div>
          <div className="p-4 bg-[#F8F8FC] rounded-2xl border border-[#E4E3EF] shadow-sm hover:border-[#8B7CF6] transition-colors">
            <Lock className="w-6 h-6 mx-auto text-[#16A878] mb-2" />
            <div className="font-bold text-sm text-[#202033]">JWT & Bcrypt RBAC</div>
            <div className="text-[11px] text-[#68677D] mt-1">Bearer Auth + Route Guards</div>
          </div>
          <div className="p-4 bg-[#F8F8FC] rounded-2xl border border-[#E4E3EF] shadow-sm hover:border-[#8B7CF6] transition-colors">
            <BarChart3 className="w-6 h-6 mx-auto text-[#6C5CE7] mb-2" />
            <div className="font-bold text-sm text-[#202033]">dnd-kit & Recharts</div>
            <div className="text-[11px] text-[#68677D] mt-1">Fluid Kanban & Funnel Analytics</div>
          </div>
        </div>
      </div>
    </div>
  );
}
