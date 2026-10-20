'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Activity, ShieldAlert, Clock, User, Filter } from 'lucide-react';

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (actionFilter) params.append('action', actionFilter);

      const res = await api.get(`/audit?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data.logs);
        setTotal(res.data.data.total);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchLogs();
    }
  }, [user, actionFilter]);

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <ShieldAlert className="w-8 h-8 mx-auto mb-2" />
        <h2 className="text-base font-bold">Access Restricted</h2>
        <p className="text-xs mt-1">Super Administrator privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security & Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of system logins, stage transitions, job mutations, and administrative overrides.
          </p>
        </div>

        {/* Action Filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 self-start sm:self-auto"
        >
          <option value="">All Audit Actions</option>
          <option value="USER_LOGIN">User Logins</option>
          <option value="JOB_CREATE">Job Creation</option>
          <option value="APPLICATION_STAGE_CHANGE">Stage Changes</option>
          <option value="INTERVIEW_SCHEDULE">Interview Schedules</option>
          <option value="USER_STATUS_CHANGE">User Status Changes</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Actor</th>
                <th className="py-3 px-4 font-semibold">Entity</th>
                <th className="py-3 px-4 font-semibold">Context / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    No audit records logged yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="purple" className="text-[10px]">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {log.actor?.email || 'Anonymous / System'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
