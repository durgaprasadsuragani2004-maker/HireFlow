'use client';

import React, { useState, useEffect } from 'react';
import { api, downloadResumeFile, getAuthenticatedResumeUrl } from '../../lib/api';
import { useAuth } from '../../providers/AuthContext';
import { useToast } from '../../providers/ToastContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { CompanyFunnelChart } from '../../components/company/CompanyFunnelChart';
import {
  User,
  Building,
  Upload,
  Download,
  CheckCircle2,
  FileText,
  Save,
  Globe,
  MapPin,
  Mail,
  Phone,
  Building2,
  ExternalLink,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  // Applicant fields
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // Recruiter Company fields
  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyContactEmail, setCompanyContactEmail] = useState('');
  const [companyContactPhone, setCompanyContactPhone] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');

  // Analytics for recruiter's company
  const [companyAnalytics, setCompanyAnalytics] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      if ((user.role === 'APPLICANT' || user.role === 'SUPER_ADMIN') && user.applicantProfile) {
        setFullName(user.applicantProfile.fullName || '');
        setPhone(user.applicantProfile.phone || '');
        setLocation(user.applicantProfile.location || '');
        setHeadline(user.applicantProfile.headline || '');
        setSummary(user.applicantProfile.summary || '');
        setLinkedinUrl(user.applicantProfile.linkedinUrl || '');
        setGithubUrl(user.applicantProfile.githubUrl || '');
      } else if (user.role === 'SUPER_ADMIN') {
        setFullName('Super Administrator');
      } else if (user.role === 'RECRUITER' || user.role === 'COMPANY') {
        api
          .get('/companies')
          .then((res) => {
            if (res.data.success && res.data.data) {
              const c = res.data.data;
              setCompanyId(c.id);
              setCompanyName(c.name || '');
              setCompanyWebsite(c.website || '');
              setCompanyIndustry(c.industry || '');
              setCompanyLocation(c.location || '');
              setCompanySize(c.companySize || '11-50');
              setCompanyContactEmail(c.contactEmail || '');
              setCompanyContactPhone(c.contactPhone || '');
              setCompanyDesc(c.description || '');

              setLoadingAnalytics(true);
              api
                .get(`/companies/${c.id}/analytics`)
                .then((aRes) => {
                  if (aRes.data.success) {
                    setCompanyAnalytics(aRes.data.data);
                  }
                })
                .catch(() => {})
                .finally(() => setLoadingAnalytics(false));
            }
          })
          .catch(() => {
            showToast('Failed to load company profile information', 'error');
          });
      }
    }
  }, [user]);

  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      showToast('Please select a file to upload', 'error');
      return;
    }
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const res = await api.post('/candidates/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast('Resume uploaded securely!', 'success');
        await refreshUser();
        setResumeFile(null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to upload resume', 'error');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDownloadApplicantResume = async () => {
    if (!user?.applicantProfile?.resumeUrl) return;
    setDownloadingResume(true);
    try {
      await downloadResumeFile(
        user.applicantProfile.resumeUrl,
        user.applicantProfile.fullName || 'My_Resume'
      );
      showToast('Resume downloaded successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to download resume', 'error');
    } finally {
      setDownloadingResume(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      if (user?.role === 'APPLICANT' || user?.role === 'SUPER_ADMIN') {
        await api.patch('/auth/me', {
          fullName,
          headline,
          summary,
          phone,
          location,
          linkedinUrl,
          githubUrl,
        });
        showToast('Profile updated successfully', 'success');
        await refreshUser();
      } else if (user?.role === 'RECRUITER' || user?.role === 'COMPANY') {
        await api.patch('/companies', {
          website: companyWebsite.trim() || null,
          industry: companyIndustry.trim() || null,
          location: companyLocation.trim() || null,
          companySize: companySize || null,
          contactEmail: companyContactEmail.trim() || null,
          contactPhone: companyContactPhone.trim() || null,
          description: companyDesc.trim() || null,
        });
        showToast('Company profile updated successfully', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <AuthGuard>
      {!user ? null : (
        <div className="max-w-4xl mx-auto py-2 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
                {user.role === 'RECRUITER' || user.role === 'COMPANY' ? (
                  <Building2 className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-dark-text tracking-tight">
                {user.role === 'RECRUITER' || user.role === 'COMPANY'
                  ? 'Organization & Company Profile'
                  : 'Account & Profile Settings'}
              </h1>
            </div>
            <p className="text-xs text-dark-muted mt-1 ml-10">
              {user.role === 'RECRUITER' || user.role === 'COMPANY'
                ? 'Manage verified organization parameters, contact endpoints, and view company recruitment funnel.'
                : 'Manage your credentials, professional profile, and candidate resume document.'}
            </p>
          </div>

          {/* Resume Upload Section for Applicants */}
          {user.role === 'APPLICANT' && (
            <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 shadow-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-dark-text">
                    Resume Document Management
                  </h2>
                  <p className="text-xs text-dark-muted">
                    Upload your latest resume (PDF, DOC, DOCX up to 5MB). Stored securely via cloud storage abstraction.
                  </p>
                </div>
              </div>

              {user.applicantProfile?.resumeUrl && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Current Resume is Active & Attached to Applications</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadApplicantResume}
                      disabled={downloadingResume}
                      className="px-3.5 py-1.5 text-xs font-bold bg-dark-card border border-emerald-700/50 text-emerald-300 rounded-xl flex items-center gap-1 shadow-subtle hover:bg-emerald-950/40 disabled:opacity-60"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadingResume ? 'Downloading...' : 'Download Resume'}</span>
                    </button>
                    <a
                      href={getAuthenticatedResumeUrl(user.applicantProfile.resumeUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold bg-dark-input hover:bg-dark-hover text-dark-muted border border-dark-border rounded-xl transition flex items-center gap-1"
                    >
                      <span>Open Tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              <form onSubmit={handleResumeUpload} className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="text-xs text-dark-muted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-500/15 file:text-brand-300 hover:file:bg-brand-500/25 file:transition"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={uploadingResume}
                  disabled={!resumeFile}
                  className="self-start sm:self-auto"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" /> Upload Document
                </Button>
              </form>
            </div>
          )}

          {/* Profile Form (Applicant Profile OR Recruiter Company) */}
          <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 shadow-card">
            <h2 className="text-sm font-bold text-dark-text mb-4 pb-2 border-b border-dark-border">
              {user.role === 'RECRUITER' || user.role === 'COMPANY' ? 'Company Details' : 'Professional Profile'}
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {user.role === 'APPLICANT' || user.role === 'SUPER_ADMIN' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Professional Headline
                      </label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="e.g. Senior Full-Stack Engineer"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="San Francisco, CA or Remote"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        GitHub Profile
                      </label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dark-text mb-1.5">
                      Professional Summary
                    </label>
                    <textarea
                      rows={4}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Brief background summary highlighting key accomplishments..."
                      className="w-full p-3.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all leading-relaxed placeholder:text-dark-dim"
                    />
                  </div>
                </>
              ) : user.role === 'RECRUITER' || user.role === 'COMPANY' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Company Name (Managed by Organization Admin)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={companyName}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input/40 text-dark-dim cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                        placeholder="e.g. Enterprise Cloud & AI"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
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
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://company.com"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Headquarters Location
                      </label>
                      <input
                        type="text"
                        value={companyLocation}
                        onChange={(e) => setCompanyLocation(e.target.value)}
                        placeholder="San Francisco, CA"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Company Size
                      </label>
                      <select
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      >
                        <option value="1-10" className="bg-dark-card">1-10 employees</option>
                        <option value="11-50" className="bg-dark-card">11-50 employees</option>
                        <option value="51-200" className="bg-dark-card">51-200 employees</option>
                        <option value="201-500" className="bg-dark-card">201-500 employees</option>
                        <option value="500+" className="bg-dark-card">500+ employees</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={companyContactEmail}
                        onChange={(e) => setCompanyContactEmail(e.target.value)}
                        placeholder="recruiting@company.com"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark-text mb-1.5">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={companyContactPhone}
                        onChange={(e) => setCompanyContactPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dark-text mb-1.5">
                      Company Overview & Culture
                    </label>
                    <textarea
                      rows={4}
                      value={companyDesc}
                      onChange={(e) => setCompanyDesc(e.target.value)}
                      placeholder="About our mission, culture, benefits, and hiring standards..."
                      className="w-full p-3.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all leading-relaxed placeholder:text-dark-dim"
                    />
                  </div>
                </>
              ) : null}

              <div className="flex justify-end pt-3 border-t border-dark-border">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={savingProfile}
                  disabled={savingProfile}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Embedded Company Funnel for Recruiters and Company Accounts */}
          {(user.role === 'RECRUITER' || user.role === 'COMPANY') && companyId && (
            <CompanyFunnelChart
              funnel={companyAnalytics?.funnel || []}
              totalApplications={companyAnalytics?.totalApplications || 0}
              totalJobs={companyAnalytics?.activeJobs || 0}
              loading={loadingAnalytics}
              companyName={companyName}
            />
          )}
        </div>
      )}
    </AuthGuard>
  );
}
