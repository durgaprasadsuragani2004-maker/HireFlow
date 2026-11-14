'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { Search, MapPin, Mail, ArrowRight, ExternalLink, Users, Sparkles, X } from 'lucide-react';

export default function CandidatesPoolPage() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (search) params.append('search', search);
      if (skill) params.append('skill', skill);

      const res = await api.get(`/candidates?${params.toString()}`);
      if (res.data.success) {
        setCandidates(res.data.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, skill]);

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'COMPANY', 'RECRUITER']}>
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-[#202033] tracking-tight">
              Candidate Talent Pool
            </h1>
          </div>
          <p className="text-xs text-[#68677D] mt-1 ml-11.5">
            Search candidates across technical skillsets, review credentials, and access application records.
          </p>
        </div>

        {/* Filter Row */}
        <div className="skeuo-card p-4.5 border border-[#E4E3EF] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#64748B] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by candidate name, headline, or location..."
              className="skeuo-input w-full pl-10 pr-8 py-2.5 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="neu-icon-btn absolute right-2.5 top-2 p-1 text-[#64748B] hover:text-[#202033] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="Filter by skill (e.g. React, Node, Python)..."
              className="skeuo-input w-full px-3.5 py-2.5 text-xs"
            />
            {skill && (
              <button
                onClick={() => setSkill('')}
                className="neu-icon-btn absolute right-2.5 top-2 p-1 text-[#64748B] hover:text-[#202033] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Candidates List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-3xl" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <EmptyState
            title="No Candidates Found"
            description="Try modifying search keywords or clearing skill filters to view all profiles."
            actionLabel="Reset Search"
            onAction={() => {
              setSearch('');
              setSkill('');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {candidates.map((c) => (
              <div
                key={c.id}
                className="skeuo-card-interactive p-5 sm:p-6 flex flex-col justify-between border border-[#E4E3EF]"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-indigo-500 to-indigo-700 text-white font-extrabold flex items-center justify-center text-sm shadow-neu-primary border border-white/20">
                      {c.fullName[0]}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/applicants/${c.id}`}
                        className="font-bold text-sm text-[#202033] hover:text-indigo-400 block truncate transition-colors"
                      >
                        {c.fullName}
                      </Link>
                      <div className="text-xs text-[#68677D] truncate flex items-center gap-1 mt-0.5 font-mono">
                        <Mail className="w-3 h-3 text-[#64748B] shrink-0" />
                        <span className="truncate">{c.user?.email}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#68677D] line-clamp-2 mt-2 leading-relaxed">
                    {c.headline || 'Software Engineering Professional'}
                  </p>

                  {c.location && (
                    <div className="text-[11px] text-[#64748B] flex items-center gap-1 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{c.location}</span>
                    </div>
                  )}

                  {/* Skills tags */}
                  {c.skills && c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {c.skills.slice(0, 4).map((s: any) => (
                        <span
                          key={s.id || s.name}
                          className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-[#EAE7FF] text-[#6C5CE7] border border-[#8B7CF6]/20"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#E4E3EF] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#64748B]">
                    {c.applications?.length ?? 0} {c.applications?.length === 1 ? 'submission' : 'submissions'}
                  </span>
                  <Link
                    href={`/applicants/${c.id}`}
                    className="neu-btn-secondary px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <span>Inspect Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
