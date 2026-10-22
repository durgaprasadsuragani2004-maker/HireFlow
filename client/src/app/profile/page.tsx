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
      if (user.role === 'APPLICANT' && user.applicantProfile) {
        setFullName(user.applicantProfile.fullName || '');
      } else if (user.role === 'RECRUITER') {
        // Fetch full company profile for recruiter
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

              // Fetch analytics for this company
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
      if (user?.role === 'APPLICANT') {
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
      } else if (user?.role === 'RECRUITER') {
        // Recruiter updating permitted company profile fields
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
        <div className="max-w-4xl mx-auto py-4 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {user.role === 'RECRUITER' ? 'Organization & Company Profile' : 'Account Settings'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.role === 'RECRUITER'
                ? 'Manage verified organization credentials, contact endpoints, and view company recruitment funnel.'
                : 'Manage your credentials, professional profile, and candidate resume document.'}
            </p>
          </div>

          {/* Resume Upload Section for Applicants */}
          {user.role === 'APPLICANT' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Resume Document Management
                  </h2>
                  <p className="text-xs text-slate-500">
                    Upload your latest resume (PDF, DOC, DOCX up to 5MB). Stored via secure cloud storage abstraction.
                  </p>
                </div>
              </div>

              {user.applicantProfile?.resumeUrl && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Current Resume is Active & Attached to Applications</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadApplicantResume}
                      disabled={downloadingResume}
                      className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-lg flex items-center gap-1 shadow-xs hover:bg-emerald-50 disabled:opacity-60"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadingResume ? 'Downloading...' : 'Download Resume'}</span>
                    </button>
                    <a
                      href={getAuthenticatedResumeUrl(user.applicantProfile.resumeUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition"
                    >
                      Open Tab
                    </a>
                  </div>
                </div>
              )}

              <form onSubmit={handleResumeUpload} className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-300"
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

          {/* Profile Details Form */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {user.role === 'RECRUITER' ? 'Company Profile Information' : 'Personal Details'}
            </h2>

            {user.role === 'APPLICANT' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Senior Full Stack Engineer | React & Node.js"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Professional Summary
                  </label>
                  <textarea
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Location (City, State)
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Recruiter Company Profile Form */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Associated Organization Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={companyName}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-semibold"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Assigned by Super Admin. Cannot be transferred across tenants.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      placeholder="e.g. Enterprise Cloud & AI"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Headquarters Location
                    </label>
                    <input
                      type="text"
                      value={companyLocation}
                      onChange={(e) => setCompanyLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Company Size
                    </label>
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-1000">201-1000 employees</option>
                      <option value="1000+">1000+ Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={companyContactEmail}
                      onChange={(e) => setCompanyContactEmail(e.target.value)}
                      placeholder="talent@company.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={companyContactPhone}
                      onChange={(e) => setCompanyContactPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Description & Mission
                  </label>
                  <textarea
                    rows={3}
                    value={companyDesc}
                    onChange={(e) => setCompanyDesc(e.target.value)}
                    placeholder="Describe your organization, work culture, and value proposition for prospective candidates..."
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" loading={savingProfile}>
                <Save className="w-3.5 h-3.5 mr-1" /> Save Changes
              </Button>
            </div>
          </form>

          {/* Recruiter Company Recruitment Funnel Chart */}
          {user.role === 'RECRUITER' && (
            <CompanyFunnelChart
              funnel={companyAnalytics?.funnel || []}
              totalApplications={companyAnalytics?.totalApplications || 0}
              totalJobs={companyAnalytics?.totalJobs || 0}
              loading={loadingAnalytics}
              companyName={companyName}
            />
          )}
        </div>
      )}
    </AuthGuard>
  );
}
