'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { AuthGuard } from '../../../components/layout/AuthGuard';
import {
  Activity,
  ShieldAlert,
  Clock,
  User,
  Filter,
  Home,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (actionFilter) params.append('action', actionFilter);

      const res = await api.get(`/audit?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data?.logs || []);
        setTotal(res.data.data?.total || 0);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to load security audit records. Please check your connection and retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchLogs();
    }
  }, [user, actionFilter, page]);

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
        return 'info';
      case 'JOB_CREATE':
        return 'primary';
      case 'APPLICATION_STAGE_CHANGE':
        return 'purple';
      case 'INTERVIEW_SCHEDULE':
        return 'warning';
      case 'USER_STATUS_CHANGE':
        return 'danger';
      case 'COMPANY_CREATE':
        return 'success';
      default:
        return 'default';
    }
  };

  // Safely extract actor details, handling object, string, or missing cases
  const getActorDisplay = (log: any) => {
    if (log.actor && typeof log.actor === 'object') {
      return {
        email: log.actor.email || 'System User',
        role: log.actor.role || null,
        id: log.actor.id || null,
      };
    }
    if (log.user && typeof log.user === 'object') {
      return {
        email: log.user.email || 'System User',
        role: log.user.role || null,
        id: log.user.id || null,
      };
    }
    if (typeof log.actor === 'string' && log.actor.trim()) {
      return { email: log.actor, role: null, id: null };
    }
    if (typeof log.actorId === 'string' && log.actorId.trim()) {
      return { email: `User #${log.actorId.slice(0, 8)}`, role: null, id: log.actorId };
    }
    return { email: 'System Service', role: null, id: null };
  };

  // Safely format metadata object/string
  const formatMetadata = (meta: any, details?: any) => {
    if (meta) {
      if (typeof meta === 'string') {
        try {
          const parsed = JSON.parse(meta);
          if (typeof parsed === 'object' && parsed !== null) {
            return Object.entries(parsed)
              .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
              .join(', ');
          }
          return meta;
        } catch {
          return meta;
        }
      }
      if (typeof meta === 'object') {
        try {
          return Object.entries(meta)
            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
            .join(', ');
        } catch {
          return JSON.stringify(meta);
        }
      }
      return String(meta);
    }
    if (details) {
      if (typeof details === 'object') {
        try {
          return JSON.stringify(details);
        } catch {
          return String(details);
        }
      }
      return String(details);
    }
    return '-';
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-dark-dim">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-brand-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span className="text-dark-border">/</span>
          <Link href="/dashboard" className="hover:text-brand-400 transition-colors">
            Dashboard
          </Link>
          <span className="text-dark-border">/</span>
          <span className="text-dark-text font-semibold">Security Audit Trail</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-dark-text tracking-tight">
                Enterprise Security & Audit Trail
              </h1>
            </div>
            <p className="text-xs text-dark-muted mt-1 ml-10">
              Immutable ledger of system authorizations, stage transitions, job mutations, and administrative overrides.
            </p>
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border border-dark-border bg-dark-input text-xs font-semibold text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 self-start sm:self-auto shadow-subtle cursor-pointer"
          >
            <option value="" className="bg-dark-card">All Audit Actions ({total})</option>
            <option value="USER_LOGIN" className="bg-dark-card">User Logins</option>
            <option value="JOB_CREATE" className="bg-dark-card">Job Creation</option>
            <option value="APPLICATION_STAGE_CHANGE" className="bg-dark-card">Stage Transitions</option>
            <option value="INTERVIEW_SCHEDULE" className="bg-dark-card">Interview Schedules</option>
            <option value="USER_STATUS_CHANGE" className="bg-dark-card">User Status Changes</option>
            <option value="COMPANY_CREATE" className="bg-dark-card">Company Creation</option>
          </select>
        </div>

        {/* Error State */}
        {error ? (
          <div className="p-8 text-center bg-[#151F32] border border-[#2B3950] rounded-3xl shadow-card max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#F1F5F9]">Unable to Load Audit Trail</h3>
            <p className="text-xs text-[#A1AEC2] mt-1 max-w-sm mx-auto leading-relaxed">{error}</p>
            <Button onClick={fetchLogs} variant="primary" size="sm" className="mt-5">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        ) : (
          /* Logs Table */
          <div className="bg-dark-card border border-dark-border rounded-3xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-input/80 border-b border-dark-border text-dark-dim font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-5">Timestamp</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Entity</th>
                    <th className="py-3.5 px-5">Context / Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-dark-dim">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4 mx-auto" />
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-dark-dim">
                        No security audit events recorded.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const actor = getActorDisplay(log);
                      const formattedMeta = formatMetadata(log.metadata, log.details);
                      const actionStr = typeof log.action === 'object' ? JSON.stringify(log.action) : (log.action || 'EVENT');
                      const entityStr = typeof log.entity === 'object' ? JSON.stringify(log.entity) : (log.entity || log.targetType || 'SYSTEM');
                      const entityIdStr = typeof log.entityId === 'object' ? JSON.stringify(log.entityId) : log.entityId;

                      return (
                        <tr key={log.id} className="hover:bg-dark-hover/60 transition-colors">
                          <td className="py-3.5 px-5 text-dark-dim text-[11px] font-mono whitespace-nowrap">
                            {new Date(log.timestamp || log.createdAt).toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant={getActionBadgeVariant(actionStr)}>
                              {actionStr}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-semibold text-dark-text">
                              <User className="w-3.5 h-3.5 text-dark-dim shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate max-w-[180px] text-xs font-semibold text-[#F1F5F9]">
                                  {actor.email}
                                </span>
                                {actor.role && (
                                  <span className="text-[10px] text-[#A1AEC2] font-mono">
                                    {String(actor.role).replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-dark-muted font-mono text-[11px]">
                            {entityStr}
                            {entityIdStr && (
                              <span className="text-dark-dim block text-[10px] truncate max-w-[120px]">
                                {entityIdStr}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-dark-muted max-w-xs truncate" title={formattedMeta}>
                            {formattedMeta}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-dark-border bg-dark-input/40">
                <span className="text-xs text-dark-dim">
                  Showing <span className="font-semibold text-dark-text">{logs.length}</span> of{' '}
                  <span className="font-semibold text-dark-text">{total}</span> audit records
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <span className="text-xs font-semibold px-2 text-dark-text">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
