'use client';

import React from 'react';
import Link from 'next/link';
import { DOCS_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthContext';
import {
  Briefcase,
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
  Shield,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="space-y-12 py-2 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#151F32] text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-[#2B3950]">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 border border-indigo-400/30 text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Enterprise Multi-Tenant ATS & Recruitment Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-[#F1F5F9]">
            Modern Talent Acquisition,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-teal-300 to-indigo-200">
              Streamlined.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#A1AEC2] leading-relaxed max-w-2xl">
            HireFlow unifies multi-stage Kanban recruitment pipelines, interview scheduling, strict organization-level data isolation, and real-time candidate funnel telemetry into one high-performance SaaS platform.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {user ? (
              <Link
                href="/dashboard"
                className="px-6 py-3 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-glow-primary transition-all duration-150 flex items-center gap-2"
              >
                <span>Go to My Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-3 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-glow-primary transition-all duration-150 flex items-center gap-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/jobs"
                  className="px-6 py-3 text-sm font-bold bg-[#1C2940] hover:bg-[#28374E] text-[#F1F5F9] border border-[#2B3950] rounded-xl transition-all duration-150"
                >
                  Browse Job Board
                </Link>
              </>
            )}

            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
            >
              <span>Swagger API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Feature Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 sm:p-7 shadow-card hover:border-indigo-500/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#F1F5F9] mb-2">
              Interactive Kanban Pipeline
            </h3>
            <p className="text-xs text-[#A1AEC2] leading-relaxed">
              Drag-and-drop candidates across 6 recruitment stages (Applied, Screening, Shortlisted, Interview, Selected, Rejected) with real-time audit trail and applicant notifications.
            </p>
          </div>
          <Link
            href="/jobs"
            className="mt-5 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
          >
            Explore Pipeline <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 sm:p-7 shadow-card hover:border-teal-500/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#F1F5F9] mb-2">
              Interview Scheduling & Conflict Checks
            </h3>
            <p className="text-xs text-[#A1AEC2] leading-relaxed">
              Schedule technical, managerial, and HR interview rounds with automated conflict prevention, meeting URL distribution, and candidate schedule view.
            </p>
          </div>
          <Link
            href="/interviews"
            className="mt-5 text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5"
          >
            View Calendar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 sm:p-7 shadow-card hover:border-violet-500/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4 border border-violet-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#F1F5F9] mb-2">
              Enterprise Multi-Tenant Isolation
            </h3>
            <p className="text-xs text-[#A1AEC2] leading-relaxed">
              Strict multi-tenant boundaries ensure Company accounts and Recruiters can only access candidates who applied to their company, while Super Admins provision organizations and monitor audit trails.
            </p>
          </div>
          <Link
            href="/admin/users"
            className="mt-5 text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5"
          >
            Security Architecture <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Technology Architecture Cards */}
      <div className="bg-[#151F32] rounded-3xl p-8 border border-[#2B3950]">
        <div className="text-center max-w-xl mx-auto mb-6">
          <h2 className="text-xl font-bold text-[#F1F5F9]">
            Production-Grade Technology Architecture
          </h2>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Built for reliability, speed, and responsive enterprise workloads.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-[#101726] rounded-2xl border border-[#2B3950] shadow-subtle hover:border-indigo-500/40 transition-colors">
            <Cpu className="w-6 h-6 mx-auto text-indigo-400 mb-2" />
            <div className="font-bold text-sm text-[#F1F5F9]">Next.js 14 & React 18</div>
            <div className="text-[11px] text-[#A1AEC2] mt-1">App Router + Tailwind CSS</div>
          </div>
          <div className="p-4 bg-[#101726] rounded-2xl border border-[#2B3950] shadow-subtle hover:border-indigo-500/40 transition-colors">
            <Database className="w-6 h-6 mx-auto text-sky-400 mb-2" />
            <div className="font-bold text-sm text-[#F1F5F9]">Prisma ORM</div>
            <div className="text-[11px] text-[#A1AEC2] mt-1">PostgreSQL & SQLite Schemas</div>
          </div>
          <div className="p-4 bg-[#101726] rounded-2xl border border-[#2B3950] shadow-subtle hover:border-indigo-500/40 transition-colors">
            <Lock className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
            <div className="font-bold text-sm text-[#F1F5F9]">JWT & Bcrypt RBAC</div>
            <div className="text-[11px] text-[#A1AEC2] mt-1">Bearer Auth + Route Guards</div>
          </div>
          <div className="p-4 bg-[#101726] rounded-2xl border border-[#2B3950] shadow-subtle hover:border-indigo-500/40 transition-colors">
            <BarChart3 className="w-6 h-6 mx-auto text-violet-400 mb-2" />
            <div className="font-bold text-sm text-[#F1F5F9]">dnd-kit & Recharts</div>
            <div className="text-[11px] text-[#A1AEC2] mt-1">Fluid Kanban & Funnel Analytics</div>
          </div>
        </div>
      </div>
    </div>
  );
}
