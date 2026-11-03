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
  X,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
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

  // Initial Company Account Provisioning in Create Modal
  const [provisionAccountNow, setProvisionAccountNow] = useState(true);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [showAccountPassword, setShowAccountPassword] = useState(false);

  // Provisioning Account for Existing Company in Details View
  const [isProvisionExistingOpen, setIsProvisionExistingOpen] = useState(false);
  const [existingAccountEmail, setExistingAccountEmail] = useState('');
  const [existingAccountPassword, setExistingAccountPassword] = useState('');
  const [showExistingPassword, setShowExistingPassword] = useState(false);
  const [provisioningExisting, setProvisioningExisting] = useState(false);

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

    if (provisionAccountNow) {
      if (!accountEmail.trim()) {
        showToast('Company account email is required to provision login credentials', 'error');
        return;
      }
      if (!accountPassword.trim() || accountPassword.trim().length < 6) {
        showToast('Company account initial password must be at least 6 characters', 'error');
        return;
      }
    }

    setCreating(true);
    try {
      const payload: any = {
        name: createName.trim(),
        industry: createIndustry.trim() || null,
        website: createWebsite.trim() || null,
        location: createLocation.trim() || null,
        companySize: createCompanySize || null,
        contactEmail: createContactEmail.trim() || null,
        contactPhone: createContactPhone.trim() || null,
        description: createDescription.trim() || null,
      };

      if (provisionAccountNow && accountEmail.trim() && accountPassword.trim()) {
        payload.adminEmail = accountEmail.trim();
        payload.adminPassword = accountPassword.trim();
      }

      const res = await api.post('/companies', payload);

      if (res.data.success) {
        if (payload.adminEmail) {
          showToast(
            `Organization "${createName.trim()}" created and Company Account "${payload.adminEmail}" provisioned!`,
            'success'
          );
        } else {
          showToast(`Organization "${createName.trim()}" created successfully!`, 'success');
        }
        setIsCreateOpen(false);
        setCreateName('');
        setCreateIndustry('');
        setCreateWebsite('');
        setCreateLocation('');
        setCreateContactEmail('');
        setCreateContactPhone('');
        setCreateDescription('');
        setAccountEmail('');
        setAccountPassword('');
        fetchCompanies();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create organization', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleProvisionExistingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    if (!existingAccountEmail.trim()) {
      showToast('Company account email is required', 'error');
      return;
    }
    if (!existingAccountPassword.trim() || existingAccountPassword.trim().length < 6) {
      showToast('Initial password must be at least 6 characters', 'error');
      return;
    }

    setProvisioningExisting(true);
    try {
      const res = await api.post(`/companies/${selectedCompany.id}/provision-account`, {
        email: existingAccountEmail.trim(),
        password: existingAccountPassword.trim(),
      });
      if (res.data.success) {
        showToast(`Company login account provisioned for ${existingAccountEmail.trim()}!`, 'success');
        setExistingAccountEmail('');
        setExistingAccountPassword('');
        setIsProvisionExistingOpen(false);
        // Refresh selected company data to reflect the new user
        const updatedRes = await api.get(`/companies/${selectedCompany.id}`);
        if (updatedRes.data.success) {
          setSelectedCompany(updatedRes.data.data);
        }
        fetchCompanies();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to provision company account', 'error');
    } finally {
      setProvisioningExisting(false);
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
          <span className="text-dark-text font-semibold">Organizations</span>
        </nav>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-dark-text tracking-tight">
                Organizations & Company Management
              </h1>
            </div>
            <p className="text-xs text-dark-muted mt-1 ml-10">
              Oversee multi-tenant enterprise companies, assigned recruiters, job distributions, and recruitment funnel telemetry.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Organization</span>
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 shadow-card flex items-center gap-3">
          <Search className="w-4 h-4 text-dark-dim shrink-0 ml-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations by name, industry, or location..."
            className="w-full text-xs bg-transparent text-dark-text focus:outline-none placeholder:text-dark-dim"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-dark-dim hover:text-dark-muted px-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-3xl" />
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="p-12 text-center bg-dark-card border border-dark-border rounded-3xl shadow-card space-y-3">
            <Building2 className="w-12 h-12 text-dark-dim mx-auto" />
            <h3 className="font-bold text-dark-text text-base">
              No Organizations Found
            </h3>
            <p className="text-xs text-dark-muted max-w-sm mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompanies.map((c) => (
              <div
                key={c.id}
                className="bg-dark-card border border-dark-border rounded-3xl p-5 sm:p-6 shadow-card hover:border-brand-500/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-dark-text truncate">
                        {c.name}
                      </h3>
                      {c.industry && (
                        <span className="text-[11px] font-bold text-brand-400 block mt-0.5">
                          {c.industry}
                        </span>
                      )}
                    </div>
                    {c.companySize && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-dark-input text-dark-muted font-bold shrink-0 border border-dark-border">
                        {c.companySize} emp
                      </span>
                    )}
                  </div>

                  {c.location && (
                    <div className="flex items-center gap-1.5 text-xs text-dark-dim mt-1">
                      <MapPin className="w-3.5 h-3.5 text-dark-dim" />
                      <span>{c.location}</span>
                    </div>
                  )}

                  {c.description && (
                    <p className="text-xs text-dark-muted mt-2.5 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}

                  {/* Summary Counters */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-dark-border text-center text-xs">
                    <div className="p-2 rounded-2xl bg-dark-input/60 border border-dark-border">
                      <div className="font-bold text-dark-text text-sm">
                        {c._count?.jobs ?? 0}
                      </div>
                      <div className="text-[10px] text-dark-dim font-medium">Jobs</div>
                    </div>
                    <div className="p-2 rounded-2xl bg-dark-input/60 border border-dark-border">
                      <div className="font-bold text-dark-text text-sm">
                        {c._count?.recruiters ?? (c.recruiters?.length || 0)}
                      </div>
                      <div className="text-[10px] text-dark-dim font-medium">Recruiters</div>
                    </div>
                    <div className="p-2 rounded-2xl bg-dark-input/60 border border-dark-border">
                      <div className="font-bold text-dark-text text-sm">
                        {c.totalApplications ?? 0}
                      </div>
                      <div className="text-[10px] text-dark-dim font-medium">Applicants</div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3.5 border-t border-dark-border flex items-center justify-between">
                  <button
                    onClick={() => openCompanyDetails(c)}
                    className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <span>View Funnel & Telemetry</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openCompanyDetails(c)}
                      className="p-1.5 text-dark-dim hover:text-brand-400 hover:bg-dark-hover rounded-lg transition"
                      title="Edit organization"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(c.id)}
                      disabled={deletingId === c.id}
                      className="p-1.5 text-dark-dim hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition disabled:opacity-40"
                      title="Delete organization"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Organization */}
        {isCreateOpen && (
          <Modal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            title="Create Enterprise Organization"
            description="Provision a new partner company with dedicated candidate and recruiter isolation."
            maxWidth="max-w-xl"
          >
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-text mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="TechNova Solutions Inc."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-dark-dim"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-text mb-1.5">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={createIndustry}
                    onChange={(e) => setCreateIndustry(e.target.value)}
                    placeholder="e.g. Cloud Infrastructure & AI"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-dark-dim"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-text mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={createWebsite}
                    onChange={(e) => setCreateWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-dark-dim"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-text mb-1.5">
                    Headquarters Location
                  </label>
                  <input
                    type="text"
                    value={createLocation}
                    onChange={(e) => setCreateLocation(e.target.value)}
                    placeholder="San Francisco, CA"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-dark-dim"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-text mb-1.5">
                    Company Size
                  </label>
                  <select
                    value={createCompanySize}
                    onChange={(e) => setCreateCompanySize(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="1-10" className="bg-dark-card">1-10</option>
                    <option value="11-50" className="bg-dark-card">11-50</option>
                    <option value="51-200" className="bg-dark-card">51-200</option>
                    <option value="201-500" className="bg-dark-card">201-500</option>
                    <option value="500+" className="bg-dark-card">500+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-text mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={createContactEmail}
                    onChange={(e) => setCreateContactEmail(e.target.value)}
                    placeholder="recruiting@company.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-dark-dim"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-text mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={createContactPhone}
                    onChange={(e) => setCreateContactPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-dark-dim"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-text mb-1.5">
                  Company Overview & Notes
                </label>
                <textarea
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Enterprise background, hiring domain, and recruiter assignments..."
                  className="w-full p-3 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed placeholder:text-dark-dim"
                />
              </div>

              {/* Provision Initial Company Login Account */}
              <div className="p-4 rounded-2xl bg-[#101726] border border-[#2B3950] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-[#F1F5F9]">
                      Provision Company Account Login Credentials
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[#A1AEC2] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={provisionAccountNow}
                      onChange={(e) => setProvisionAccountNow(e.target.checked)}
                      className="rounded border-[#2B3950] bg-[#151F32] text-teal-600 focus:ring-teal-500/40"
                    />
                    <span>Provision Now</span>
                  </label>
                </div>
                <p className="text-[11px] text-[#A1AEC2]">
                  Create an authenticated login account with role <strong className="text-teal-300">COMPANY</strong> linked directly to this organization so the company can sign in immediately through the standard email/password login page.
                </p>

                {provisionAccountNow && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A1AEC2] mb-1">
                        Company Login Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
                        <input
                          type="email"
                          required={provisionAccountNow}
                          value={accountEmail}
                          onChange={(e) => setAccountEmail(e.target.value)}
                          placeholder="company@domain.com"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#2B3950] bg-[#151F32] text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 placeholder:text-[#64748B]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#A1AEC2] mb-1">
                        Initial Password (min 6 chars) *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
                        <input
                          type={showAccountPassword ? 'text' : 'password'}
                          required={provisionAccountNow}
                          minLength={6}
                          value={accountPassword}
                          onChange={(e) => setAccountPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-[#2B3950] bg-[#151F32] text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 placeholder:text-[#64748B]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAccountPassword(!showAccountPassword)}
                          className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#F1F5F9]"
                          aria-label={showAccountPassword ? 'Hide password' : 'Show password'}
                        >
                          {showAccountPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-dark-border">
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

        {/* Modal: View Details & Embedded Funnel */}
        {selectedCompany && (
          <Modal
            isOpen={Boolean(selectedCompany)}
            onClose={() => setSelectedCompany(null)}
            title={selectedCompany.name}
            description="Company Profile & Pipeline Conversion Analytics"
            maxWidth="max-w-3xl"
          >
            <div className="space-y-6">
              {!isEditing ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-dark-border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-base">
                        {selectedCompany.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-dark-text">
                          {selectedCompany.name}
                        </h3>
                        <p className="text-dark-muted text-xs">
                          {selectedCompany.industry || 'Technology'} • {selectedCompany.location || 'Remote'}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Info</span>
                    </Button>
                  </div>

                  {selectedCompany.description && (
                    <p className="text-dark-muted leading-relaxed">
                      {selectedCompany.description}
                    </p>
                  )}

                  {/* Company Login Accounts Management */}
                  <div className="p-4 rounded-2xl bg-[#101726] border border-[#2B3950] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-teal-400" />
                        <span className="text-xs font-bold text-[#F1F5F9]">
                          Company Login Accounts
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsProvisionExistingOpen(true)}
                        className="text-[11px] py-1 px-2.5 h-7"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Provision Login Account
                      </Button>
                    </div>

                    {(!selectedCompany.users || selectedCompany.users.filter((u: any) => u.role === 'COMPANY').length === 0) ? (
                      <div className="p-3 text-center text-xs text-[#A1AEC2] bg-[#151F32] rounded-xl border border-[#2B3950]/60">
                        No company login accounts provisioned yet for this organization.{' '}
                        <button
                          type="button"
                          onClick={() => setIsProvisionExistingOpen(true)}
                          className="text-teal-400 font-bold hover:underline"
                        >
                          Provision one now
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#2B3950]/60 rounded-xl border border-[#2B3950] overflow-hidden bg-[#151F32]">
                        {selectedCompany.users
                          .filter((u: any) => u.role === 'COMPANY')
                          .map((u: any) => (
                            <div key={u.id} className="p-2.5 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                <span className="font-semibold text-[#F1F5F9] truncate">{u.email}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold">
                                  {u.status || 'ACTIVE'}
                                </span>
                                <span className="text-[10px] text-[#A1AEC2]">
                                  {new Date(u.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Funnel Chart */}
                  <CompanyFunnelChart
                    funnel={companyAnalytics?.funnel || []}
                    totalApplications={companyAnalytics?.totalApplications || 0}
                    totalJobs={companyAnalytics?.activeJobs || 0}
                    loading={loadingAnalytics}
                    error={analyticsError}
                    companyName={selectedCompany.name}
                  />
                </div>
              ) : (
                /* Edit Company Form */
                <form onSubmit={handleSaveCompanyEdit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-dark-dim"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={editIndustry}
                        onChange={(e) => setEditIndustry(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-dark-dim"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Website
                      </label>
                      <input
                        type="url"
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-dark-dim"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-dark-dim"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dark-text mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full p-3.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed placeholder:text-dark-dim"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-dark-border">
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
              )}
            </div>
          </Modal>
        )}

        {/* Modal: Provision Existing Company Account */}
        {isProvisionExistingOpen && selectedCompany && (
          <Modal
            isOpen={isProvisionExistingOpen}
            onClose={() => {
              setIsProvisionExistingOpen(false);
              setExistingAccountEmail('');
              setExistingAccountPassword('');
            }}
            title="Provision Company Account"
            description={`Create an authenticated COMPANY role login account for "${selectedCompany.name}".`}
            maxWidth="max-w-md"
          >
            <form onSubmit={handleProvisionExistingAccount} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#101726] border border-[#2B3950] text-xs text-[#A1AEC2] space-y-1">
                <p>
                  This account will have the role <strong className="text-teal-300">COMPANY</strong> and will be strictly bound to <strong className="text-[#F1F5F9]">{selectedCompany.name}</strong>.
                </p>
                <p>
                  The user will be able to log in using standard credentials and manage only this company&apos;s jobs, recruiters, and applicants.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-text mb-1.5">
                  Company Login Email *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
                  <input
                    type="email"
                    required
                    value={existingAccountEmail}
                    onChange={(e) => setExistingAccountEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 placeholder:text-dark-dim"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-text mb-1.5">
                  Initial Password (min 6 characters) *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
                  <input
                    type={showExistingPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={existingAccountPassword}
                    onChange={(e) => setExistingAccountPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 placeholder:text-dark-dim"
                  />
                  <button
                    type="button"
                    onClick={() => setShowExistingPassword(!showExistingPassword)}
                    className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#F1F5F9]"
                    aria-label={showExistingPassword ? 'Hide password' : 'Show password'}
                  >
                    {showExistingPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-dark-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsProvisionExistingOpen(false);
                    setExistingAccountEmail('');
                    setExistingAccountPassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={provisioningExisting}
                  disabled={provisioningExisting}
                  className="bg-teal-600 hover:bg-teal-500 text-white"
                >
                  Provision Account
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AuthGuard>
  );
}
