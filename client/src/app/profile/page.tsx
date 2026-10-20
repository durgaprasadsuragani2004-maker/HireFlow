'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthContext';
import { useToast } from '../../providers/ToastContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  User,
  Building,
  Upload,
  Download,
  CheckCircle2,
  FileText,
  Save,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // Company fields (for recruiter)
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'APPLICANT' && user.applicantProfile) {
        setFullName(user.applicantProfile.fullName || '');
      } else if (user.role === 'RECRUITER' && user.recruiterProfile) {
        setCompanyName(user.recruiterProfile.companyName || '');
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
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
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your credentials, professional profile, and candidate resume document.
        </p>
      </div>

      {/* Role Badge Card */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center">
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">{user.email}</div>
            <div className="text-xs text-slate-500">Account ID: {user.id}</div>
          </div>
        </div>
        <Badge variant="purple">{user.role}</Badge>
      </div>

      {/* Resume Upload Section for Applicants */}
      {user.role === 'APPLICANT' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Resume Document Management</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your latest resume (PDF, DOC, DOCX up to 5MB). Stored via secure cloud storage abstraction.
              </p>
            </div>
          </div>

          {user.applicantProfile?.resumeUrl && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Current Resume is Active & Attached to Applications</span>
              </div>
              <a
                href={user.applicantProfile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-lg flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> View
              </a>
            </div>
          )}

          <form onSubmit={handleResumeUpload} className="flex items-center gap-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950/60 dark:file:text-blue-300"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={uploadingResume}
              disabled={!resumeFile}
            >
              <Upload className="w-3.5 h-3.5 mr-1" /> Upload Document
            </Button>
          </form>
        </div>
      )}

      {/* Profile Details Form */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Profile Information</h2>

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
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Associated Company Name
            </label>
            <input
              type="text"
              disabled
              value={companyName}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="sm" loading={savingProfile}>
            <Save className="w-3.5 h-3.5 mr-1" /> Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
