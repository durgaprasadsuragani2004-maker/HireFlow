'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_ACCOUNTS } from '../../../providers/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Briefcase, Lock, Mail, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      // Error handled in auth context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoPreset = (cred: { email: string; password: string }) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
            <Briefcase className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to your HireFlow ATS workspace</p>
        </div>

        {/* Demo Credentials Quick-Select */}
        <div className="mb-6 p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Click to fill demo account:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleDemoPreset(DEMO_ACCOUNTS.admin)}
              className="p-1.5 bg-white dark:bg-slate-800 hover:bg-blue-100 rounded-lg text-slate-700 dark:text-slate-300 font-medium text-left truncate transition-colors shadow-xs"
            >
              👑 Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoPreset(DEMO_ACCOUNTS.recruiter_technova)}
              className="p-1.5 bg-white dark:bg-slate-800 hover:bg-blue-100 rounded-lg text-slate-700 dark:text-slate-300 font-medium text-left truncate transition-colors shadow-xs"
            >
              💼 Recruiter (TechNova)
            </button>
            <button
              type="button"
              onClick={() => handleDemoPreset(DEMO_ACCOUNTS.recruiter_quantum)}
              className="p-1.5 bg-white dark:bg-slate-800 hover:bg-blue-100 rounded-lg text-slate-700 dark:text-slate-300 font-medium text-left truncate transition-colors shadow-xs"
            >
              💼 Recruiter (Quantum)
            </button>
            <button
              type="button"
              onClick={() => handleDemoPreset(DEMO_ACCOUNTS.applicant_alex)}
              className="p-1.5 bg-white dark:bg-slate-800 hover:bg-blue-100 rounded-lg text-slate-700 dark:text-slate-300 font-medium text-left truncate transition-colors shadow-xs"
            >
              👤 Candidate (Alex)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 text-xs font-bold mt-2"
            loading={isSubmitting || loading}
          >
            <span>Sign In to HireFlow</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Do not have an account?{' '}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
