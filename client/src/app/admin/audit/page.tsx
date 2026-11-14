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
  const [limit, setLimit] = useState(25);
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
    if (typeof log.actor === 'string' && log.actor.includes('@')) {
      return { email: log.actor, role: null, id: null };
    }
    return { email: 'System Agent', role: 'AUTOMATION', id: null };
  };

  const formatMetadata = (metadata: any, details: any) => {
    const target = metadata || details;
    if (!target) return '—';
    if (typeof target === 'string') return target;
    try {
      return JSON.stringify(target);
    } catch {
      return '—';
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#9E9EB3]">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-[#6C5CE7] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span className="text-[#E4E3EF]">/</span>
          <Link href="/dashboard" className="hover:text-[#6C5CE7] transition-colors">
            Dashboard
          </Link>
          <span className="text-[#E4E3EF]">/</span>
          <span className="text-[#202033] font-semibold">Audit Trail</span>
        </nav>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EAE7FF] border border-[#8B7CF6]/30 text-[#6C5CE7] flex items-center justify-center shadow-inner">
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-[#202033] tracking-tight">
                Security & Audit Ledger
              </h1>
            </div>
            <p className="text-xs text-[#68677D] mt-1 ml-11.5">
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
            className="skeuo-input px-3.5 py-2 text-xs font-semibold self-start sm:self-auto cursor-pointer"
          >
            <option value="" className="bg-[#151F32]">All Audit Actions ({total})</option>
            <option value="USER_LOGIN" className="bg-[#151F32]">User Logins</option>
            <option value="JOB_CREATE" className="bg-[#151F32]">Job Creation</option>
            <option value="APPLICATION_STAGE_CHANGE" className="bg-[#151F32]">Stage Transitions</option>
            <option value="INTERVIEW_SCHEDULE" className="bg-[#151F32]">Interview Schedules</option>
            <option value="USER_STATUS_CHANGE" className="bg-[#151F32]">User Status Changes</option>
            <option value="COMPANY_CREATE" className="bg-[#151F32]">Company Creation</option>
          </select>
        </div>

        {/* Error State */}
        {error ? (
          <div className="p-8 text-center skeuo-card border border-[#E4E3EF] rounded-3xl max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/20 shadow-inner">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#202033]">Unable to Load Audit Trail</h3>
            <p className="text-xs text-[#68677D] mt-1 max-w-sm mx-auto leading-relaxed">{error}</p>
            <Button onClick={fetchLogs} variant="primary" size="sm" className="mt-5">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        ) : (
          /* Logs Table Container */
          <div className="skeuo-card border border-[#E4E3EF] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="skeuo-table-head text-[#68677D] font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-5">Timestamp</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Entity</th>
                    <th className="py-3.5 px-5">Context / Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24334C] font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#9E9EB3]">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4 mx-auto" />
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#9E9EB3]">
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
                        <tr key={log.id} className="skeuo-table-row">
                          <td className="py-3.5 px-5 text-[#9E9EB3] text-[11px] font-mono whitespace-nowrap">
                            {new Date(log.timestamp || log.createdAt).toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant={getActionBadgeVariant(actionStr)}>
                              {actionStr}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-semibold text-[#202033]">
                              <User className="w-3.5 h-3.5 text-[#9E9EB3] shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate max-w-[180px] text-xs font-semibold text-[#202033]">
                                  {actor.email}
                                </span>
                                {actor.role && (
                                  <span className="text-[10px] text-[#68677D] font-mono">
                                    {String(actor.role).replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-[#68677D] font-mono text-[11px]">
                            {entityStr}
                            {entityIdStr && (
                              <span className="text-[#9E9EB3] block text-[10px] truncate max-w-[120px]">
                                {entityIdStr}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-[#68677D] max-w-xs truncate" title={formattedMeta}>
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
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#E4E3EF] bg-[#F8F8FC]">
                <span className="text-xs text-[#68677D]">
                  Showing <span className="font-semibold text-[#202033]">{logs.length}</span> of{' '}
                  <span className="font-semibold text-[#202033]">{total}</span> audit records
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <span className="text-xs font-semibold px-2 text-[#202033]">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
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
