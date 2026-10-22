'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { AuthGuard } from '../../../components/layout/AuthGuard';
import { useToast } from '../../../providers/ToastContext';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { CompanyFunnelChart } from '../../../components/company/CompanyFunnelChart';
import {
  Building2,
  Plus,
  Search,
  Users,
  Briefcase,
  FileCheck2,
  ExternalLink,
  Edit,
  Trash2,
  Globe,
  MapPin,
  Mail,
  Phone,
  Home,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export default function AdminCompaniesPage() {
  const { showToast } = useToast();

  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Company Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createIndustry, setCreateIndustry] = useState('');
  const [createWebsite, setCreateWebsite] = useState('');
  const [createLocation, setCreateLocation] = useState('');
  const [createCompanySize, setCreateCompanySize] = useState('11-50');
  const [createContactEmail, setCreateContactEmail] = useState('');
  const [createContactPhone, setCreateContactPhone] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // View / Edit / Analytics Modal State
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [companyAnalytics, setCompanyAnalytics] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Edit Company State inside details view
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCompanySize, setEditCompanySize] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/companies/all');
      if (res.data.success) {
        setCompanies(res.data.data);
      }
    } catch {
      showToast('Failed to load companies list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openCompanyDetails = async (company: any) => {
    setSelectedCompany(company);
    setIsEditing(false);
    setEditName(company.name || '');
    setEditIndustry(company.industry || '');
    setEditWebsite(company.website || '');
    setEditLocation(company.location || '');
    setEditCompanySize(company.companySize || '');
    setEditContactEmail(company.contactEmail || '');
    setEditContactPhone(company.contactPhone || '');
    setEditDescription(company.description || '');

    // Fetch analytics and funnel for this company
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const res = await api.get(`/companies/${company.id}/analytics`);
      if (res.data.success) {
        setCompanyAnalytics(res.data.data);
      }
    } catch (err: any) {
      setAnalyticsError(
        err.response?.data?.message || 'Failed to load recruitment funnel analytics'
      );
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      showToast('Company name is required', 'error');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/companies', {
        name: createName.trim(),
        industry: createIndustry.trim() || null,
        website: createWebsite.trim() || null,
        location: createLocation.trim() || null,
        companySize: createCompanySize || null,
        contactEmail: createContactEmail.trim() || null,
        contactPhone: createContactPhone.trim() || null,
        description: createDescription.trim() || null,
      });

      if (res.data.success) {
        showToast(`Organization "${createName.trim()}" created successfully!`, 'success');
        setIsCreateOpen(false);
        setCreateName('');
        setCreateIndustry('');
        setCreateWebsite('');
        setCreateLocation('');
        setCreateContactEmail('');
        setCreateContactPhone('');
        setCreateDescription('');
        fetchCompanies();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create organization', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveCompanyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    if (!editName.trim()) {
      showToast('Company name is required', 'error');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await api.patch(`/companies/${selectedCompany.id}`, {
        name: editName.trim(),
        industry: editIndustry.trim() || null,
        website: editWebsite.trim() || null,
        location: editLocation.trim() || null,
        companySize: editCompanySize || null,
        contactEmail: editContactEmail.trim() || null,
        contactPhone: editContactPhone.trim() || null,
        description: editDescription.trim() || null,
      });

      if (res.data.success) {
        showToast('Company profile updated successfully', 'success');
        setSelectedCompany(res.data.data);
        setIsEditing(false);
        fetchCompanies();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update company', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this organization? This cannot be undone.')) {
      return;
    }
    setDeletingId(companyId);
    try {
      const res = await api.delete(`/companies/${companyId}`);
      if (res.data.success) {
        showToast('Organization deleted successfully', 'success');
        if (selectedCompany?.id === companyId) {
          setSelectedCompany(null);
        }
        fetchCompanies();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete company', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(query) ||
      c.industry?.toLowerCase().includes(query) ||
      c.location?.toLowerCase().includes(query)
    );
  });

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/dashboard"
            className="hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">Organization Management</span>
        </nav>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span>Organizations & Company Management</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Oversee multi-tenant partner companies, assigned recruiters, job distributions, and recruitment funnel telemetry.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Organization</span>
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations by name, industry, or location..."
            className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No Organizations Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? `No company matches "${search}". Try clearing your search query.`
                : 'No companies are currently registered in the ATS ecosystem.'}
            </p>
            {!search && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="mt-2"
              >
                Create First Organization
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {c.name}
                      </h3>
                      {c.industry && (
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          {c.industry}
                        </span>
                      )}
                    </div>
                    {c.companySize && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                        {c.companySize} emp
                      </span>
                    )}
                  </div>

                  {c.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{c.location}</span>
                    </div>
                  )}

                  {c.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}

                  {/* Summary Counters */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {c._count?.jobs ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Jobs</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {c._count?.recruiters ?? (c.recruiters?.length || 0)}
                      </div>
                      <div className="text-[10px] text-slate-400">Recruiters</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {c.totalApplications ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Applicants</div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => openCompanyDetails(c)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View Funnel & Details</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openCompanyDetails(c)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition"
                      title="Edit organization"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(c.id)}
                      disabled={deletingId === c.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition disabled:opacity-40"
                      title="Delete organization"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Company Modal */}
        {isCreateOpen && (
          <Modal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            title="Create New Organization"
            maxWidth="max-w-xl"
          >
            <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Acme Cloud Corp"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={createIndustry}
                    onChange={(e) => setCreateIndustry(e.target.value)}
                    placeholder="e.g. Enterprise SaaS, FinTech"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Size
                  </label>
                  <select
                    value={createCompanySize}
                    onChange={(e) => setCreateCompanySize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Headquarters Location
                  </label>
                  <input
                    type="text"
                    value={createLocation}
                    onChange={(e) => setCreateLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={createWebsite}
                    onChange={(e) => setCreateWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={createContactEmail}
                    onChange={(e) => setCreateContactEmail(e.target.value)}
                    placeholder="careers@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={createContactPhone}
                    onChange={(e) => setCreateContactPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Description
                </label>
                <textarea
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Overview of the company, mission, and products..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={creating}
                  disabled={creating}
                >
                  Create Organization
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Company Details, Edit & Recruitment Funnel Modal */}
        {selectedCompany && (
          <Modal
            isOpen={!!selectedCompany}
            onClose={() => setSelectedCompany(null)}
            title={`Organization: ${selectedCompany.name}`}
            maxWidth="max-w-4xl"
          >
            <div className="space-y-6 text-xs">
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedCompany.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-slate-500 mt-1">
                    {selectedCompany.industry && <span>{selectedCompany.industry}</span>}
                    {selectedCompany.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedCompany.location}
                      </span>
                    )}
                    {selectedCompany.website && (
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Website
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isEditing ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteCompany(selectedCompany.id)}
                    loading={deletingId === selectedCompany.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Edit Company Form if isEditing */}
              {isEditing ? (
                <form
                  onSubmit={handleSaveCompanyEdit}
                  className="p-5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-2xl space-y-4"
                >
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Edit className="w-4 h-4 text-blue-600" />
                    <span>Edit Company Information</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Industry</label>
                      <input
                        type="text"
                        value={editIndustry}
                        onChange={(e) => setEditIndustry(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Location</label>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Website</label>
                      <input
                        type="url"
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={editContactEmail}
                        onChange={(e) => setEditContactEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={editContactPhone}
                        onChange={(e) => setEditContactPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={savingEdit}
                      disabled={savingEdit}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : null}

              {/* Company Recruitment Funnel Graph */}
              <CompanyFunnelChart
                funnel={companyAnalytics?.funnel || []}
                totalApplications={companyAnalytics?.totalApplications || 0}
                totalJobs={companyAnalytics?.totalJobs || 0}
                loading={loadingAnalytics}
                error={analyticsError}
                companyName={selectedCompany.name}
              />

              {/* Assigned Recruiters List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Assigned Recruiters</span>
                </h4>

                {(!selectedCompany.recruiters || selectedCompany.recruiters.length === 0) ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center text-slate-400">
                    No recruiters currently assigned to this company.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {selectedCompany.recruiters.map((r: any) => (
                      <div
                        key={r.id}
                        className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {r.user?.email || 'Recruiter'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {r.title || 'Talent Acquisition'} {r.department ? `• ${r.department}` : ''}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                          Active Recruiter
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AuthGuard>
  );
}
