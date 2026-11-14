'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Building2,
  Check,
  ChevronsUpDown,
} from 'lucide-react';

interface CompanyOption {
  id: string;
  name: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isCompanyUser = currentUser?.role === 'COMPANY';

  const [usersList, setUsersList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Companies list for dropdown
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [viewUserDetails, setViewUserDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New Company inline creation state
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    industry: '',
    location: '',
  });
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: isCompanyUser ? 'RECRUITER' : 'APPLICANT',
    status: 'ACTIVE',
    fullName: '',
    companyId: '',
    companyName: '',
    title: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch Companies
  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      if (isSuperAdmin) {
        const res = await api.get('/companies/all');
        if (res.data.success) {
          setCompanies(res.data.data || []);
        }
      } else if (isCompanyUser && currentUser?.companyId) {
        setCompanies([
          {
            id: currentUser.companyId,
            name: currentUser.company?.name || 'My Organization',
          },
        ]);
      }
    } catch {
      // Non-fatal, fallback to empty list
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [currentUser?.role, currentUser?.companyId]);

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
        setUsersList(res.data.data.users || []);
        setTotal(res.data.data.total || 0);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtered companies based on search
  const filteredCompanies = useMemo(() => {
    if (!companySearchQuery.trim()) return companies;
    return companies.filter((c) =>
      c.name.toLowerCase().includes(companySearchQuery.toLowerCase())
    );
  }, [companies, companySearchQuery]);

  // Handle Open Add User Modal
  const handleOpenAddModal = () => {
    setFormData({
      email: '',
      password: '',
      role: isCompanyUser ? 'RECRUITER' : 'APPLICANT',
      status: 'ACTIVE',
      fullName: '',
      companyId: isCompanyUser ? (currentUser?.companyId || '') : '',
      companyName: isCompanyUser ? (currentUser?.company?.name || '') : '',
      title: '',
    });
    setCompanySearchQuery('');
    setIsCompanyDropdownOpen(false);
    setIsAddModalOpen(true);
  };

  // Handle Open Edit User Modal
  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    const existingCompanyId = user.companyId || user.recruiterProfile?.companyId || '';
    const existingCompanyName =
      user.company?.name || user.recruiterProfile?.company?.name || user.recruiterProfile?.companyName || '';

    setFormData({
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
      fullName: user.applicantProfile?.fullName || '',
      companyId: existingCompanyId,
      companyName: existingCompanyName,
      title: user.recruiterProfile?.title || '',
    });
    setCompanySearchQuery('');
    setIsCompanyDropdownOpen(false);
    setIsEditModalOpen(true);
  };

  // Handle View User Details Modal
  const handleOpenViewModal = async (user: any) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/users/${user.id}`);
      if (res.data.success) {
        setViewUserDetails(res.data.data);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch user telemetry', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle Toggle Active/Suspended Status
  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/users/${user.id}/status`, { status: newStatus });
      showToast(`User status updated to ${newStatus}`, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    }
  };

  // Submit Create User
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((formData.role === 'COMPANY' || formData.role === 'RECRUITER') && !formData.companyId) {
      showToast('Please select an organization from the dropdown', 'error');
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

      if (formData.role === 'APPLICANT' && formData.fullName) {
        payload.fullName = formData.fullName;
      } else if (formData.role === 'RECRUITER') {
        payload.companyId = formData.companyId;
        payload.companyName = formData.companyName;
        if (formData.title) payload.title = formData.title;
      } else if (formData.role === 'COMPANY') {
        payload.companyId = formData.companyId;
      }

      await api.post('/users', payload);
      showToast('User account created successfully', 'success');
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit User
  const handleSubmitEdit = async (e: React.FormEvent) => {
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
        if (formData.companyId) payload.companyId = formData.companyId;
        if (formData.companyName) payload.companyName = formData.companyName;
        if (formData.title) payload.title = formData.title;
      } else if (formData.role === 'COMPANY') {
        if (formData.companyId) payload.companyId = formData.companyId;
      }

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

  // Handle Create Organization inline
  const handleCreateCompanyInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyData.name.trim()) return;
    setCreatingCompany(true);
    try {
      const res = await api.post('/companies', newCompanyData);
      if (res.data.success) {
        const created = res.data.data;
        showToast('Company registered successfully', 'success');
        setCompanies((prev) => [created, ...prev]);
        setFormData((prev) => ({
          ...prev,
          companyId: created.id,
          companyName: created.name,
        }));
        setIsCreateCompanyModalOpen(false);
        setNewCompanyData({ name: '', industry: '', location: '' });
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create company', 'error');
    } finally {
      setCreatingCompany(false);
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
      showToast('User account safely suspended (historical records preserved)', 'success');
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
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'COMPANY']}>
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-[#202033] tracking-tight">
                {isCompanyUser ? 'Team & Recruiter Management' : 'User Management'}
              </h1>
            </div>
            <p className="text-xs text-[#68677D] mt-1 ml-11.5">
              {isCompanyUser
                ? `Manage verified recruiters and talent partners for ${currentUser?.company?.name || 'your company'}.`
                : 'Administer enterprise ecosystem accounts, role hierarchies, and organization access.'}
            </p>
          </div>

          <Button
            onClick={handleOpenAddModal}
            variant="primary"
            size="md"
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isCompanyUser ? 'Add Team Recruiter' : 'Add New User'}</span>
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <div className="skeuo-card rounded-2xl p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#9E9EB3]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, company, or title..."
              className="skeuo-input w-full pl-10 pr-3.5 py-2.5 text-xs placeholder:text-[#9E9EB3]"
            />
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="skeuo-input px-3.5 py-2.5 text-xs font-semibold"
              >
                <option value="" className="bg-white text-[#202033]">All Roles</option>
                <option value="SUPER_ADMIN" className="bg-white text-[#202033]">Super Admin</option>
                <option value="COMPANY" className="bg-white text-[#202033]">Company Account</option>
                <option value="RECRUITER" className="bg-white text-[#202033]">Recruiter</option>
                <option value="APPLICANT" className="bg-white text-[#202033]">Applicant</option>
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="skeuo-input px-3.5 py-2.5 text-xs font-semibold"
            >
              <option value="" className="bg-white text-[#202033]">All Statuses</option>
              <option value="ACTIVE" className="bg-white text-[#202033]">Active</option>
              <option value="SUSPENDED" className="bg-white text-[#202033]">Suspended</option>
            </select>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="skeuo-input px-3.5 py-2.5 text-xs font-semibold"
            >
              <option value={10} className="bg-white text-[#202033]">10 / page</option>
              <option value={15} className="bg-white text-[#202033]">15 / page</option>
              <option value={25} className="bg-white text-[#202033]">25 / page</option>
              <option value={50} className="bg-white text-[#202033]">50 / page</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="skeuo-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="skeuo-table-head">
                <tr>
                  <th className="py-3.5 px-5">User & Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Profile Affiliation</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E3EF]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#68677D]">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4 mx-auto" />
                      </div>
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#68677D]">
                      No accounts found matching your filters.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const displayName =
                      u.applicantProfile?.fullName ||
                      u.company?.name ||
                      u.recruiterProfile?.company?.name ||
                      u.email.split('@')[0];

                    return (
                      <tr key={u.id} className="skeuo-table-row">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-[#202033]">
                            {displayName}
                            {isSelf && (
                              <span className="ml-2 text-[10px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-1.5 py-0.5 rounded-md font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[#68677D] text-[11px] font-mono mt-0.5">
                            {u.email}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              u.role === 'SUPER_ADMIN'
                                ? 'purple'
                                : u.role === 'COMPANY'
                                ? 'info'
                                : u.role === 'RECRUITER'
                                ? 'primary'
                                : 'default'
                            }
                          >
                            {u.role.replace('_', ' ')}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-[#68677D]">
                          {u.role === 'COMPANY' ? (
                            <div>
                              <span className="font-semibold text-[#202033]">
                                {u.company?.name || 'Assigned Organization'}
                              </span>
                              <span className="text-[11px] text-[#9E9EB3] block mt-0.5">
                                Enterprise Account
                              </span>
                            </div>
                          ) : u.role === 'RECRUITER' ? (
                            <div>
                              <span className="font-semibold text-[#202033]">
                                {u.recruiterProfile?.company?.name || u.company?.name || 'Partner Company'}
                              </span>
                              {u.recruiterProfile?.title && (
                                <span className="text-[11px] text-[#9E9EB3] block mt-0.5">
                                  {u.recruiterProfile.title}
                                </span>
                              )}
                            </div>
                          ) : u.role === 'APPLICANT' ? (
                            <div>
                              <span className="font-semibold text-[#202033]">
                                {u.applicantProfile?.fullName || 'Candidate'}
                              </span>
                              {u.applicantProfile?.headline && (
                                <span className="text-[11px] text-[#9E9EB3] block truncate max-w-xs mt-0.5">
                                  {u.applicantProfile.headline}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#9E9EB3] font-medium">System Administrator</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                            {u.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-[#68677D] text-[11px]">
                          {formatDate(u.createdAt)}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenViewModal(u)}
                              className="p-1.5 text-[#68677D] hover:text-indigo-400 hover:bg-[#1C2940] rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 text-[#68677D] hover:text-indigo-400 hover:bg-[#1C2940] rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {!isSelf && (
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  u.status === 'ACTIVE'
                                    ? 'text-amber-400 hover:bg-[#1C2940]'
                                    : 'text-emerald-400 hover:bg-[#1C2940]'
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

                            {!isSelf && isSuperAdmin && (
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1.5 text-[#68677D] hover:text-rose-400 hover:bg-[#1C2940] rounded-lg transition-colors"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#E4E3EF]/80 text-xs text-[#68677D]">
              <div>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} accounts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="px-3 font-semibold text-[#202033]">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Add New User */}
        {isAddModalOpen && (
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title={isCompanyUser ? 'Add Team Recruiter' : 'Create Ecosystem User'}
            description={
              isCompanyUser
                ? `Provision an authorized recruiter login for ${currentUser?.company?.name || 'your company'}.`
                : 'Provision a new credentialed user account with role-based authorization.'
            }
            maxWidth="max-w-lg"
          >
            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@enterprise.com"
                  className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                    Account Role
                  </label>
                  {isCompanyUser ? (
                    <input
                      type="text"
                      disabled
                      value="Recruiter"
                      className="skeuo-input w-full px-3.5 py-2.5 text-xs opacity-60 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setFormData({
                          ...formData,
                          role: newRole,
                          companyId: '',
                          companyName: '',
                        });
                      }}
                      className="skeuo-input w-full px-3.5 py-2.5 text-xs font-semibold"
                    >
                      <option value="APPLICANT" className="bg-white text-[#202033]">Candidate / Applicant</option>
                      <option value="RECRUITER" className="bg-white text-[#202033]">Company Recruiter</option>
                      <option value="COMPANY" className="bg-white text-[#202033]">Company Account (Admin)</option>
                      <option value="SUPER_ADMIN" className="bg-white text-[#202033]">Super Administrator</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="skeuo-input w-full px-3.5 py-2.5 text-xs font-semibold"
                  >
                    <option value="ACTIVE" className="bg-white text-[#202033]">Active</option>
                    <option value="SUSPENDED" className="bg-white text-[#202033]">Suspended</option>
                  </select>
                </div>
              </div>

              {formData.role === 'APPLICANT' && (
                <div>
                  <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Candidate Name"
                    className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                  />
                </div>
              )}

              {/* Company Selection Dropdown for RECRUITER or COMPANY roles */}
              {(formData.role === 'RECRUITER' || formData.role === 'COMPANY') && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-[#68677D]">
                        Associated Organization *
                      </label>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setIsCreateCompanyModalOpen(true)}
                          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          + New Organization
                        </button>
                      )}
                    </div>

                    {isCompanyUser ? (
                      <input
                        type="text"
                        disabled
                        value={currentUser?.company?.name || 'Your Organization'}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E3EF] bg-[#151F32] text-[#68677D] cursor-not-allowed"
                      />
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E3EF] bg-white text-[#202033] text-[#202033] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          <span className={formData.companyId ? 'text-[#202033]' : 'text-[#9E9EB3]'}>
                            {formData.companyName || 'Select an organization...'}
                          </span>
                          <ChevronsUpDown className="w-4 h-4 text-[#9E9EB3]" />
                        </button>

                        {isCompanyDropdownOpen && (
                          <div className="absolute z-20 left-0 right-0 mt-1 bg-[#1C2940] border border-[#E4E3EF] rounded-xl shadow-dropdown overflow-hidden max-h-56 flex flex-col">
                            <div className="p-2 border-b border-[#E4E3EF]">
                              <input
                                type="text"
                                autoFocus
                                value={companySearchQuery}
                                onChange={(e) => setCompanySearchQuery(e.target.value)}
                                placeholder="Search companies..."
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E4E3EF] bg-white text-[#202033] text-[#202033] focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="overflow-y-auto divide-y divide-[#E4E3EF]">
                              {loadingCompanies ? (
                                <div className="p-3 text-center text-xs text-[#68677D]">Loading companies...</div>
                              ) : filteredCompanies.length === 0 ? (
                                <div className="p-3 text-center text-xs text-[#68677D]">
                                  No companies found.{' '}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsCompanyDropdownOpen(false);
                                      setIsCreateCompanyModalOpen(true);
                                    }}
                                    className="text-indigo-400 underline font-medium"
                                  >
                                    Create one now
                                  </button>
                                </div>
                              ) : (
                                filteredCompanies.map((c) => (
                                  <button
                                    type="button"
                                    key={c.id}
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        companyId: c.id,
                                        companyName: c.name,
                                      });
                                      setIsCompanyDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left text-[#202033] hover:bg-[#1E2D47] transition-colors"
                                  >
                                    <span className="font-medium">{c.name}</span>
                                    {formData.companyId === c.id && (
                                      <Check className="w-4 h-4 text-indigo-400" />
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {formData.role === 'RECRUITER' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                        Recruiter Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Lead Technical Recruiter"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E3EF] bg-white text-[#202033] text-[#202033] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E4E3EF]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  disabled={submitting}
                >
                  Create User
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Modal: Edit User */}
        {isEditModalOpen && selectedUser && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Edit User Account"
            description={`Modifying credentials for ${selectedUser.email}`}
            maxWidth="max-w-lg"
          >
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                    Account Role
                  </label>
                  {isCompanyUser ? (
                    <input
                      type="text"
                      disabled
                      value={formData.role}
                      className="skeuo-input w-full px-3.5 py-2.5 text-xs opacity-60 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="skeuo-input w-full px-3.5 py-2.5 text-xs font-semibold"
                    >
                      <option value="APPLICANT" className="bg-white text-[#202033]">Candidate / Applicant</option>
                      <option value="RECRUITER" className="bg-white text-[#202033]">Company Recruiter</option>
                      <option value="COMPANY" className="bg-white text-[#202033]">Company Account (Admin)</option>
                      <option value="SUPER_ADMIN" className="bg-white text-[#202033]">Super Administrator</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="skeuo-input w-full px-3.5 py-2.5 text-xs font-semibold"
                  >
                    <option value="ACTIVE" className="bg-white text-[#202033]">Active</option>
                    <option value="SUSPENDED" className="bg-white text-[#202033]">Suspended</option>
                  </select>
                </div>
              </div>

              {formData.role === 'APPLICANT' && (
                <div>
                  <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                  />
                </div>
              )}

              {(formData.role === 'RECRUITER' || formData.role === 'COMPANY') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                      Associated Organization
                    </label>
                    {isCompanyUser ? (
                      <input
                        type="text"
                        disabled
                        value={formData.companyName || currentUser?.company?.name || 'Your Organization'}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E3EF] bg-[#151F32] text-[#68677D] cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={formData.companyId}
                        onChange={(e) => {
                          const cId = e.target.value;
                          const match = companies.find((c) => c.id === cId);
                          setFormData({
                            ...formData,
                            companyId: cId,
                            companyName: match?.name || '',
                          });
                        }}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E3EF] bg-white text-[#202033] text-[#202033] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                      >
                        <option value="">Choose an organization...</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {formData.role === 'RECRUITER' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E3EF] bg-white text-[#202033] text-[#202033] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E4E3EF]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  disabled={submitting}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Modal: View User Details */}
        {isViewModalOpen && selectedUser && (
          <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title="Account Telemetry & Audit Profile"
            description={`Overview for ${selectedUser.email}`}
            maxWidth="max-w-xl"
          >
            {loadingDetails ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : viewUserDetails ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-white text-[#202033] rounded-2xl border border-[#E4E3EF] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#202033]">
                      {viewUserDetails.email}
                    </span>
                    <Badge variant={viewUserDetails.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {viewUserDetails.status}
                    </Badge>
                  </div>
                  <div className="text-[#9E9EB3] font-mono text-[11px]">
                    User ID: {viewUserDetails.id}
                  </div>
                  <div className="text-[#68677D]">
                    Registered: {new Date(viewUserDetails.createdAt).toLocaleString()}
                  </div>
                </div>

                {viewUserDetails.company && (
                  <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 space-y-1.5">
                    <div className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-indigo-400" />
                      <span>Company Account Ownership</span>
                    </div>
                    <div className="text-[#202033]">
                      Organization: <strong>{viewUserDetails.company.name}</strong>
                    </div>
                  </div>
                )}

                {viewUserDetails.recruiterProfile && (
                  <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 space-y-1.5">
                    <div className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span>Recruiter Enterprise Affiliation</span>
                    </div>
                    <div className="text-[#202033]">
                      Company: <strong>{viewUserDetails.recruiterProfile.company?.name || 'N/A'}</strong>
                    </div>
                    {viewUserDetails.recruiterProfile.title && (
                      <div className="text-[#68677D]">
                        Title: {viewUserDetails.recruiterProfile.title}
                      </div>
                    )}
                  </div>
                )}

                {viewUserDetails.applicantProfile && (
                  <div className="p-4 bg-white text-[#202033] rounded-2xl border border-[#E4E3EF] space-y-2">
                    <div className="font-bold text-xs text-[#202033]">
                      Candidate Profile Information
                    </div>
                    <div className="text-[#68677D]">
                      Full Name: <strong className="text-[#202033]">{viewUserDetails.applicantProfile.fullName}</strong>
                    </div>
                    {viewUserDetails.applicantProfile.headline && (
                      <div className="text-[#9E9EB3]">
                        Headline: {viewUserDetails.applicantProfile.headline}
                      </div>
                    )}
                    {viewUserDetails.applicantProfile.applications && (
                      <div className="text-[#9E9EB3] text-[11px] pt-1 border-t border-[#E4E3EF]">
                        Total Job Submissions: {viewUserDetails.applicantProfile.applications.length}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </Modal>
        )}

        {/* Modal: Delete User */}
        {isDeleteModalOpen && selectedUser && (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Account Governance Action"
            description={`Action for ${selectedUser.email}`}
            maxWidth="max-w-md"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-rose-400 mb-1" />
                <p>
                  Permanent deletion completely removes the user account. For compliance and historical audit integrity, suspending the account is strongly recommended.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleSuspendInsteadOfDelete}
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  disabled={submitting}
                >
                  <Ban className="w-3.5 h-3.5 mr-1" />
                  <span>Safely Suspend Account (Recommended)</span>
                </Button>

                <Button
                  onClick={() => handleDeleteUser(true)}
                  variant="danger"
                  size="sm"
                  loading={submitting}
                  disabled={submitting}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Permanently Delete Account</span>
                </Button>

                <Button
                  onClick={() => setIsDeleteModalOpen(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal: Create Organization Inline */}
        {isCreateCompanyModalOpen && (
          <Modal
            isOpen={isCreateCompanyModalOpen}
            onClose={() => setIsCreateCompanyModalOpen(false)}
            title="Register New Organization"
            description="Create an organization record to associate with recruiters and company accounts."
            maxWidth="max-w-md"
          >
            <form onSubmit={handleCreateCompanyInline} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#68677D] mb-1.5">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCompanyData.name}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                  placeholder="e.g. Apex Cybernetics"
                  className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#68677D] mb-1.5">
                  Industry
                </label>
                <input
                  type="text"
                  value={newCompanyData.industry}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, industry: e.target.value })}
                  placeholder="e.g. Enterprise Cloud Computing"
                  className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#68677D] mb-1.5">
                  HQ Location
                </label>
                <input
                  type="text"
                  value={newCompanyData.location}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, location: e.target.value })}
                  placeholder="e.g. San Francisco, CA"
                  className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E4E3EF]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateCompanyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={creatingCompany}
                  disabled={creatingCompany}
                >
                  Create Organization
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AuthGuard>
  );
}
