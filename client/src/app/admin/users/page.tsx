'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../providers/ToastContext';
import { formatDate } from '../../../lib/utils';
import { Users, Search, ShieldAlert, CheckCircle, Ban } from 'lucide-react';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/auth/admin/users?${params.toString()}`);
      if (res.data.success) {
        setUsersList(res.data.data.users);
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
      fetchUsers();
    }
  }, [user, search, roleFilter, statusFilter]);

  const toggleUserStatus = async (targetUser: any) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/auth/admin/users/${targetUser.id}/status`, {
        status: newStatus,
      });
      showToast(`User status updated to ${newStatus}`, 'success');
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u))
      );
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update user', 'error');
    }
  };

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ecosystem accounts, role authorization, and account suspension controls.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="RECRUITER">Recruiter</option>
          <option value="APPLICANT">Applicant</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Company / Profile</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Registered</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    Loading directory...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No accounts found
                  </td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          u.role === 'SUPER_ADMIN'
                            ? 'purple'
                            : u.role === 'RECRUITER'
                            ? 'info'
                            : 'default'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {u.recruiterProfile?.company?.name ||
                        u.applicantProfile?.fullName ||
                        '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => toggleUserStatus(u)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
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
