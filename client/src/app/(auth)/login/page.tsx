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
  ShieldCheck,
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
    <div className="max-w-md mx-auto py-8 sm:py-14 space-y-4 px-3 sm:px-0">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68677D] hover:text-[#202033] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="skeuo-card p-6 sm:p-8 border border-[#E4E3EF] shadow-card relative overflow-hidden">
        {/* Soft violet ambient light */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#EAE7FF]/70 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#8B7CF6] text-white flex items-center justify-center mx-auto mb-3 shadow-[0_2px_10px_rgba(108,92,231,0.35)] border border-white/30">
            <Briefcase className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#202033] tracking-tight">Welcome Back</h1>
          <p className="text-xs text-[#68677D] mt-1">Sign in to your HireFlow ATS workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#202033] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#9E9EB3] pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="skeuo-input w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#202033] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#9E9EB3] pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="skeuo-input w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="neu-icon-btn absolute right-2.5 top-2 p-1 text-[#68677D] hover:text-[#202033] cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 text-xs sm:text-sm font-bold mt-2 h-10 cursor-pointer"
            loading={isSubmitting || loading}
          >
            <span>Sign In to Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </form>

        <div className="relative z-10 mt-6 pt-5 border-t border-[#E4E3EF] flex items-center justify-between text-xs text-[#68677D]">
          <span>Do not have an account?</span>
          <Link href="/register" className="font-bold text-[#6C5CE7] hover:text-[#5B4BD8]">
            Create an account
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#68677D] text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-[#6C5CE7]" />
        <span>Enterprise-grade authentication with end-to-end encryption</span>
      </div>
    </div>
  );
}
