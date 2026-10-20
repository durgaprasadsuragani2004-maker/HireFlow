'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Briefcase, User, Building, Lock, Mail, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading } = useAuth();

  const [role, setRole] = useState<'APPLICANT' | 'RECRUITER'>('APPLICANT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register({
        email,
        password,
        role,
        fullName: role === 'APPLICANT' ? fullName : undefined,
        companyName: role === 'RECRUITER' ? companyName : undefined,
        title: role === 'RECRUITER' ? title : undefined,
      });
      router.push('/dashboard');
    } catch {
      // Error handled in auth context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
            <Briefcase className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create an Account</h1>
          <p className="text-xs text-slate-500 mt-1">Join the HireFlow recruitment ecosystem</p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setRole('APPLICANT')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              role === 'APPLICANT'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Job Applicant</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('RECRUITER')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              role === 'RECRUITER'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Recruiter / Employer</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {role === 'APPLICANT' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Technologies Inc."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Professional Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Head of Talent Acquisition"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Work / Personal Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Create Password (min 6 chars)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
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
            <span>Complete Registration</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
