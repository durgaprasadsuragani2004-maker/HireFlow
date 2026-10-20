'use client';

import React from 'react';
import Link from 'next/link';
import { DOCS_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_ACCOUNTS } from '../providers/AuthContext';
import {
  Briefcase,
  Layers,
  ShieldCheck,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  Cpu,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, switchDemoUser } = useAuth();

  const handleQuickLogin = async (key: any) => {
    await switchDemoUser(key);
    router.push('/dashboard');
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 sm:p-12 shadow-2xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-400/30 text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Full-Stack Recruitment & Pipeline Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Next-Generation Talent Acquisition Platform
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            HireFlow unifies multi-stage Kanban recruitment pipelines, interview scheduling, role-based access control, secure cloud document management, and telemetry dashboards into a single enterprise solution.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {user ? (
              <Link
                href="/dashboard"
                className="px-6 py-3 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                <span>Go to My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-3 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/jobs"
                  className="px-6 py-3 text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all"
                >
                  Browse Job Board
                </Link>
              </>
            )}

            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 text-sm font-semibold text-blue-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>Swagger API Docs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Decorative Grid Graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none hidden lg:block" />
      </div>

      {/* 1-Click Interactive Demo Impersonation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Instant Demonstration Accounts</span>
            </h2>
            <p className="text-xs text-slate-500">
              Click any profile below to immediately authenticate and test with realistic seeded data:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {Object.entries(DEMO_ACCOUNTS).map(([key, demo]) => (
            <button
              key={key}
              onClick={() => handleQuickLogin(key)}
              className="p-3 text-left border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl bg-slate-50/50 hover:bg-blue-50/50 dark:bg-slate-800/40 dark:hover:bg-blue-950/20 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-blue-600">
                  {demo.label}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {demo.email}
                </div>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                <span>Login as {demo.label.split(' ')[0]}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Interactive Kanban Pipeline
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Drag-and-drop candidates smoothly across 6 recruitment stages (Applied, Screening, Shortlisted, Interview, Selected, Rejected) with real-time audit trail and applicant notifications.
            </p>
          </div>
          <Link
            href="/jobs"
            className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Explore Pipeline <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Interview Scheduling & Conflict Checks
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Schedule technical, managerial, and HR interview rounds with automated conflict prevention, meeting URL distribution, and candidate schedule view.
            </p>
          </div>
          <Link
            href="/interviews"
            className="mt-4 text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            View Calendar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Enterprise RBAC & Isolation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Strict multi-tenant company boundaries ensure Recruiters can only access their own candidates, Applicants are restricted to their submissions, and Super Admins oversee the ecosystem.
            </p>
          </div>
          <Link
            href="/admin/users"
            className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Security Architecture <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Technology Architecture Cards */}
      <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
          Production-Grade Technology Architecture
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
            <Cpu className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <div className="font-bold text-sm">Next.js & React 18</div>
            <div className="text-[11px] text-slate-500 mt-1">App Router + Tailwind CSS</div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
            <Database className="w-6 h-6 mx-auto text-indigo-600 mb-2" />
            <div className="font-bold text-sm">Prisma ORM</div>
            <div className="text-[11px] text-slate-500 mt-1">PostgreSQL & SQLite Relational DB</div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
            <Lock className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
            <div className="font-bold text-sm">JWT & RBAC</div>
            <div className="text-[11px] text-slate-500 mt-1">Bcrypt + Authorization Middleware</div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
            <Layers className="w-6 h-6 mx-auto text-purple-600 mb-2" />
            <div className="font-bold text-sm">dnd-kit & Recharts</div>
            <div className="text-[11px] text-slate-500 mt-1">Fluid Kanban & Funnel Analytics</div>
          </div>
        </div>
      </div>
    </div>
  );
}
