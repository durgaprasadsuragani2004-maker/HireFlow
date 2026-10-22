'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { Search, MapPin, Mail, ArrowRight, ExternalLink } from 'lucide-react';

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
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'RECRUITER']}>
      <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Candidate Talent Pool</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Search candidate directory, inspect technical skills, and review application records.
        </p>
      </div>

      {/* Filter Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate name, headline, or location..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Filter by skill (e.g. React, Node)..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          title="No Candidates Found"
          description="Try modifying search keywords or clearing skill filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {c.fullName[0]}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/applicants/${c.id}`}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 block truncate"
                    >
                      {c.fullName}
                    </Link>
                    <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {c.user?.email}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {c.headline || 'Software Engineering Professional'}
                </p>

                {c.location && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-2">
                    <MapPin className="w-3 h-3" />
                    {c.location}
                  </div>
                )}

                {/* Skills tags */}
                {c.skills && c.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.skills.slice(0, 4).map((s: any) => (
                      <Badge key={s.id || s.name} variant="outline" className="text-[10px]">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {c.applications?.length ?? 0} active submissions
                </span>
                <Link
                  href={`/applicants/${c.id}`}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Profile</span>
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
