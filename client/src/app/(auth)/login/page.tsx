'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthContext';
import { Button } from '../../../components/ui/Button';
import {
  Briefcase,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser?.role === 'APPLICANT') {
        router.push('/jobs');
      } else {
        router.push('/dashboard');
      }
    } catch {
      // Error handled in auth context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A1AEC2] hover:text-[#F1F5F9] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 sm:p-8 shadow-dropdown">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-600/30">
            <Briefcase className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-tight">Welcome Back</h1>
          <p className="text-xs text-[#A1AEC2] mt-1">Sign in to your HireFlow ATS workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#64748B]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-[#2B3950] bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#64748B]" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[#2B3950] bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 p-0.5 text-[#64748B] hover:text-[#F1F5F9] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-2.5 text-xs font-bold mt-2 h-10"
          loading={isSubmitting || loading}
        >
          <span>Sign In to Workspace</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-[#A1AEC2]">
        Do not have an account?{' '}
        <Link href="/register" className="font-bold text-indigo-400 hover:text-indigo-300">
          Create an account
        </Link>
      </div>
    </div>
  </div>
);
}

