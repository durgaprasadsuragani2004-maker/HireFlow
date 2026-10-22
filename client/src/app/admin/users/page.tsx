'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { AuthGuard } from '../../../components/layout/AuthGuard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../providers/ToastContext';
import { formatDate } from '../../../lib/utils';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Building,
  Briefcase,
  Calendar,
  Lock,
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [viewUserDetails, setViewUserDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'APPLICANT',
    status: 'ACTIVE',
    fullName: '',
    companyName: '',
    title: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/users?${params.toString()}`);
      if (res.data.success) {
        setUsersList(res.data.data.users);
        setTotal(res.data.data.total);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load user list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, roleFilter, statusFilter]);

  // Handle Search submit / debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Toggle user active / suspended
  const handleToggleStatus = async (targetUser: any) => {
    if (targetUser.id === currentUser?.id) {
      showToast('You cannot suspend your own Super Admin account', 'warning');
      return;
    }
    const newStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/users/${targetUser.id}/status`, { status: newStatus });
      showToast(`User status updated to ${newStatus}`, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    }
  };

  // Open View Details Modal
  const handleOpenViewModal = async (u: any) => {
    setSelectedUser(u);
    setIsViewModalOpen(true);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/users/${u.id}`);
      if (res.data.success) {
        setViewUserDetails(res.data.data);
      }
    } catch {
      setViewUserDetails(u);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (u: any) => {
    setSelectedUser(u);
    setFormData({
      email: u.email || '',
      password: '',
      role: u.role || 'APPLICANT',
      status: u.status || 'ACTIVE',
      fullName: u.applicantProfile?.fullName || '',
      companyName: u.recruiterProfile?.company?.name || '',
      title: u.recruiterProfile?.title || '',
    });
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      email: '',
      password: '',
      role: 'APPLICANT',
      status: 'ACTIVE',
      fullName: '',
      companyName: '',
      title: '',
    });
    setIsAddModalOpen(true);
  };

  // Handle Create User Submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      showToast('Email and password are required', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        status: formData.status,
      };
      if (formData.fullName) payload.fullName = formData.fullName;
      if (formData.companyName) payload.companyName = formData.companyName;
      if (formData.title) payload.title = formData.title;

      await api.post('/users', payload);
      showToast('User created successfully', 'success');
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit User Submit
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const payload: any = {
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };
      if (formData.password && formData.password.trim().length >= 6) {
        payload.password = formData.password.trim();
      }
      if (formData.role === 'APPLICANT' && formData.fullName) {
        payload.fullName = formData.fullName;
      } else if (formData.role === 'RECRUITER') {
        if (formData.companyName) payload.companyName = formData.companyName;
        if (formData.title) payload.title = formData.title;
      }
      // For SUPER_ADMIN: explicitly avoid attaching company or applicant fields

      await api.patch(`/users/${selectedUser.id}`, payload);
      showToast('User account updated successfully', 'success');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete User (Permanent Deletion)
  const handleDeleteUser = async (force = true) => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const url = force ? `/users/${selectedUser.id}?force=true` : `/users/${selectedUser.id}`;
      const res = await api.delete(url);
      if (res.data.success) {
        showToast(res.data.message || 'User account permanently deleted', 'success');
        setIsDeleteModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Suspend as an explicit alternative to Delete
  const handleSuspendInsteadOfDelete = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.patch(`/users/${selectedUser.id}/status`, { status: 'SUSPENDED' });
      showToast('User account safely suspended (all historical data preserved)', 'success');
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to suspend user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="space-y-6 max-w-6xl mx-auto py-2">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                User Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Administer ecosystem accounts, roles, profiles, and access authorization.
            </p>
          </div>

          <Button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 self-start sm:self-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm text-xs font-bold py-2 px-4"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, company, or title..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="RECRUITER">Recruiter</option>
              <option value="APPLICANT">Applicant</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">User & Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Profile / Affiliation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4 mx-auto" />
                      </div>
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No accounts found matching your filters.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const displayName =
                      u.applicantProfile?.fullName ||
                      u.recruiterProfile?.company?.name ||
                      u.email.split('@')[0];

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {displayName}
                            {isSelf && (
                              <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                            {u.email}
                          </div>
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

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {u.role === 'RECRUITER' ? (
                            <div>
                              <span className="font-semibold">{u.recruiterProfile?.company?.name || 'Partner Company'}</span>
                              {u.recruiterProfile?.title && (
                                <span className="text-[11px] text-slate-400 block">
                                  {u.recruiterProfile.title}
                                </span>
                              )}
                            </div>
                          ) : u.role === 'APPLICANT' ? (
                            <div>
                              <span>{u.applicantProfile?.fullName || 'Candidate'}</span>
                              {u.applicantProfile?.headline && (
                                <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                                  {u.applicantProfile.headline}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">System Administrator</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                            {u.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {formatDate(u.createdAt)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Details */}
                            <button
                              onClick={() => handleOpenViewModal(u)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Suspend / Activate */}
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  u.status === 'ACTIVE'
                                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                }`}
                                title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                              >
                                {u.status === 'ACTIVE' ? (
                                  <Ban className="w-4 h-4" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            {/* Delete */}
                            {!isSelf && (
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                title="Delete or Deactivate User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-900 dark:text-white">{usersList.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{total}</span> accounts
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Modal: Add User */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create New User Account"
        >
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@company.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Initial Password * (minimum 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  System Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="APPLICANT">Applicant</option>
                  <option value="RECRUITER">Recruiter</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Account Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            {formData.role === 'APPLICANT' && (
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {formData.role === 'RECRUITER' && (
              <>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. TechNova Solutions"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Talent Lead"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Edit User */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Account: ${selectedUser?.email}`}
        >
          <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Reset Password (leave blank to keep current)
              </label>
              <input
                type="password"
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Optional new password"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={selectedUser?.id === currentUser?.id}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  <option value="APPLICANT">Applicant</option>
                  <option value="RECRUITER">Recruiter</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
                {selectedUser?.id === currentUser?.id && (
                  <span className="text-[10px] text-amber-500 mt-0.5 block">
                    Self-demotion disabled for safety
                  </span>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={selectedUser?.id === currentUser?.id}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            {formData.role === 'SUPER_ADMIN' && (
              <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-purple-900 dark:text-purple-300 flex items-start gap-2">
                <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Super Administrator Account:</strong> Possesses platform-wide administrative privileges. No company assignment or recruiter profile required.
                </span>
              </div>
            )}

            {formData.role === 'APPLICANT' && (
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {formData.role === 'RECRUITER' && (
              <>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. TechNova Solutions"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Recruiter Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Talent Lead"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: View Details */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="User Account Details"
        >
          {loadingDetails ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : viewUserDetails ? (
            <div className="space-y-5 text-xs">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {viewUserDetails.applicantProfile?.fullName ||
                      viewUserDetails.recruiterProfile?.company?.name ||
                      viewUserDetails.email.split('@')[0]}
                  </div>
                  <div className="text-slate-500 font-mono mt-0.5">{viewUserDetails.email}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    ID: <span className="font-mono">{viewUserDetails.id}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <Badge
                    variant={
                      viewUserDetails.role === 'SUPER_ADMIN'
                        ? 'purple'
                        : viewUserDetails.role === 'RECRUITER'
                        ? 'info'
                        : 'default'
                    }
                  >
                    {viewUserDetails.role}
                  </Badge>
                  <Badge variant={viewUserDetails.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {viewUserDetails.status}
                  </Badge>
                </div>
              </div>

              {/* Profile Sections */}
              {viewUserDetails.recruiterProfile && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-500" />
                    <span>Recruiter Profile</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                    <div>
                      Company: <span className="font-semibold">{viewUserDetails.recruiterProfile.company?.name || 'N/A'}</span>
                    </div>
                    <div>
                      Title: <span className="font-semibold">{viewUserDetails.recruiterProfile.title || 'Recruiter'}</span>
                    </div>
                    <div>
                      Jobs Created: <span className="font-semibold">{viewUserDetails.recruiterProfile._count?.jobs ?? 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {viewUserDetails.applicantProfile && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-500" />
                    <span>Applicant Profile</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                    <div>
                      Full Name: <span className="font-semibold">{viewUserDetails.applicantProfile.fullName}</span>
                    </div>
                    <div>
                      Applications Filed: <span className="font-semibold">{viewUserDetails.applicantProfile._count?.applications ?? 0}</span>
                    </div>
                    {viewUserDetails.applicantProfile.headline && (
                      <div className="col-span-2">
                        Headline: <span className="font-semibold">{viewUserDetails.applicantProfile.headline}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps & Audit */}
              <div className="flex items-center justify-between text-slate-400 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Created: {formatDate(viewUserDetails.createdAt)}</span>
                {viewUserDetails.updatedAt && (
                  <span>Last Updated: {formatDate(viewUserDetails.updatedAt)}</span>
                )}
              </div>
            </div>
          ) : null}
        </Modal>

        {/* Modal: Delete User Confirmation */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm User Account Deletion"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <div className="font-bold text-sm">Permanent Account Deletion</div>
                <div className="mt-1 text-xs leading-relaxed">
                  You are preparing to delete user <span className="font-bold underline">{selectedUser?.email}</span> (Role: <strong>{selectedUser?.role}</strong>).
                </div>
                <div className="mt-2 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-900/40 p-2.5 rounded-lg">
                  ⚠️ <strong>Integrity & Audit Notice:</strong> If this user has submitted applications, created job postings, or scheduled interviews, permanently deleting them will purge their record and relations. Alternatively, you can <strong>Suspend the account</strong> to disable login while preserving historical data.
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSuspendInsteadOfDelete}
                disabled={submitting}
                className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                Suspend Account Instead
              </Button>
              <Button
                type="button"
                onClick={() => handleDeleteUser(true)}
                disabled={submitting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {submitting ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthGuard>
  );
}
