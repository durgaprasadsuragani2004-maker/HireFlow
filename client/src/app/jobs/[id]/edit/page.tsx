'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../providers/AuthContext';
import { useToast } from '../../../../providers/ToastContext';
import { Button } from '../../../../components/ui/Button';
import { AuthGuard } from '../../../../components/layout/AuthGuard';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { ArrowLeft, Home, Building, UserCheck, AlertCircle, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const { user } = useAuth();
  const { showToast } = useToast();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Company and Recruiter state (for Super Admin)
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedRecruiterId, setSelectedRecruiterId] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [experienceLevel, setExperienceLevel] = useState('SENIOR');
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('PUBLISHED');

  const [loadingJob, setLoadingJob] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch companies list for Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      api
        .get('/companies/all')
        .then((res) => {
          if (res.data.success && Array.isArray(res.data.data)) {
            setCompanies(res.data.data);
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }, [isSuperAdmin]);

  // Fetch existing Job details
  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      setLoadingJob(true);
      setErrorMessage('');
      try {
        const res = await api.get(`/jobs/${jobId}`);
        if (res.data.success) {
          const j = res.data.data;

          // Check recruiter authorization
          if (
            user?.role === 'RECRUITER' &&
            user.recruiterProfile?.companyId &&
            j.companyId !== user.recruiterProfile.companyId
          ) {
            setErrorMessage('You do not have permission to edit jobs for another company.');
            return;
          }

          setTitle(j.title || '');
          setDescription(j.description || '');
          setRequirements(j.requirements || '');
          setResponsibilities(j.responsibilities || '');
          setSkills(j.skills || '');
          setLocation(j.location || '');
          setEmploymentType(j.employmentType || 'FULL_TIME');
          setExperienceLevel(j.experienceLevel || 'MID_LEVEL');
          setSalaryMin(j.salaryMin !== null && j.salaryMin !== undefined ? j.salaryMin : '');
          setSalaryMax(j.salaryMax !== null && j.salaryMax !== undefined ? j.salaryMax : '');
          setStatus(j.status || 'PUBLISHED');
          setSelectedCompanyId(j.companyId || '');
          setSelectedRecruiterId(j.recruiterId || '');

          if (j.deadline) {
            const d = new Date(j.deadline);
            if (!isNaN(d.getTime())) {
              setDeadline(d.toISOString().split('T')[0]);
            }
          }
        }
      } catch (err: any) {
        setErrorMessage(
          err.response?.data?.message || 'Failed to load job details. Job may not exist.'
        );
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
  }, [jobId, user]);

  const currentCompany = companies.find((c) => c.id === selectedCompanyId);
  const availableRecruiters = currentCompany?.recruiters || [];

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const comp = companies.find((c) => c.id === companyId);
    if (comp?.recruiters && comp.recruiters.length > 0) {
      setSelectedRecruiterId(comp.recruiters[0].id);
    } else {
      setSelectedRecruiterId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'RECRUITER' && user.role !== 'SUPER_ADMIN')) {
      showToast('Unauthorized to edit this job posting', 'error');
      return;
    }

    setFieldErrors({});

    const localErrors: Record<string, string> = {};
    if (!title.trim()) localErrors.title = 'Job title is required';
    if (!description.trim() || description.trim().length < 20) {
      localErrors.description = 'Job description must be at least 20 characters';
    }
    if (!requirements.trim() || requirements.trim().length < 10) {
      localErrors.requirements = 'Requirements must be at least 10 characters';
    }
    if (!responsibilities.trim() || responsibilities.trim().length < 10) {
      localErrors.responsibilities = 'Responsibilities must be at least 10 characters';
    }
    if (!skills.trim()) localErrors.skills = 'At least one skill is required';
    if (!location.trim()) localErrors.location = 'Location is required';

    if (salaryMin !== '' && salaryMax !== '' && Number(salaryMin) > Number(salaryMax)) {
      localErrors.salaryMin = 'Minimum salary cannot exceed maximum salary';
    }

    if (deadline && status === 'PUBLISHED') {
      const selectedDate = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        localErrors.deadline =
          'Cannot publish job with a past deadline. Please set a future date or unpublish.';
      }
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      showToast('Please correct the highlighted fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        requirements: requirements.trim(),
        responsibilities: responsibilities.trim(),
        skills: skills.trim(),
        location: location.trim(),
        employmentType,
        experienceLevel,
        salaryMin: salaryMin === '' ? null : Number(salaryMin),
        salaryMax: salaryMax === '' ? null : Number(salaryMax),
        status,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      };

      if (isSuperAdmin && selectedCompanyId) {
        payload.companyId = selectedCompanyId;
        if (selectedRecruiterId) {
          payload.recruiterId = selectedRecruiterId;
        }
      }

      const res = await api.patch(`/jobs/${jobId}`, payload);

      if (res.data.success) {
        showToast('Job posting updated successfully!', 'success');
        router.push(`/jobs/${jobId}`);
      }
    } catch (err: any) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorsMap: Record<string, string> = {};
        for (const item of err.response.data.errors) {
          errorsMap[item.field] = item.message;
        }
        setFieldErrors(errorsMap);
        showToast('Validation failed. Please review the highlighted fields.', 'error');
      } else {
        const msg = err.response?.data?.message || 'Failed to update job';
        showToast(msg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'RECRUITER']}>
      <div className="max-w-4xl mx-auto space-y-6 py-2">
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
          <Link href="/jobs" className="hover:text-blue-600 transition-colors">
            Job Postings
          </Link>
          <span>/</span>
          <Link href={`/jobs/${jobId}`} className="hover:text-blue-600 transition-colors">
            {title || 'Job Details'}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">Edit Position</span>
        </nav>

        {/* Back Link */}
        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Job Details</span>
        </Link>

        {loadingJob ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : errorMessage ? (
          <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-3xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h2 className="text-base font-bold text-rose-800 dark:text-rose-200">
              {errorMessage}
            </h2>
            <Link
              href="/jobs"
              className="inline-block px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
            >
              Return to Job Postings
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Edit Job Posting
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Modify role requirements, compensation, and publication lifecycle.
              </p>
            </div>

            {/* Super Admin: Company & Recruiter Assignment */}
            {isSuperAdmin && (
              <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                  <Building className="w-4 h-4 text-purple-600" />
                  <span>Administrative Company & Recruiter Scope</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Organization / Company
                    </label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Recruiter
                    </label>
                    <select
                      value={selectedRecruiterId}
                      onChange={(e) => setSelectedRecruiterId(e.target.value)}
                      disabled={availableRecruiters.length === 0}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {availableRecruiters.length === 0 ? (
                        <option value="">No recruiters in this company</option>
                      ) : (
                        availableRecruiters.map((r: any) => (
                          <option key={r.id} value={r.id}>
                            {r.user?.email || 'Recruiter'} {r.title ? `(${r.title})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Core Job Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    fieldErrors.title
                      ? 'border-rose-500'
                      : 'border-slate-200 dark:border-slate-700'
                  } bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {fieldErrors.title && (
                  <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Description *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border ${
                    fieldErrors.description
                      ? 'border-rose-500'
                      : 'border-slate-200 dark:border-slate-700'
                  } bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {fieldErrors.description && (
                  <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Requirements *
                  </label>
                  <textarea
                    rows={4}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className={`w-full p-3 text-xs rounded-xl border ${
                      fieldErrors.requirements
                        ? 'border-rose-500'
                        : 'border-slate-200 dark:border-slate-700'
                    } bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {fieldErrors.requirements && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.requirements}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Responsibilities *
                  </label>
                  <textarea
                    rows={4}
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    className={`w-full p-3 text-xs rounded-xl border ${
                      fieldErrors.responsibilities
                        ? 'border-rose-500'
                        : 'border-slate-200 dark:border-slate-700'
                    } bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {fieldErrors.responsibilities && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.responsibilities}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Required Skills (comma separated) *
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      fieldErrors.skills
                        ? 'border-rose-500'
                        : 'border-slate-200 dark:border-slate-700'
                    } bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {fieldErrors.skills && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.skills}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      fieldErrors.location
                        ? 'border-rose-500'
                        : 'border-slate-200 dark:border-slate-700'
                    } bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {fieldErrors.location && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.location}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ENTRY_LEVEL">Entry Level</option>
                    <option value="MID_LEVEL">Mid Level</option>
                    <option value="SENIOR">Senior</option>
                    <option value="LEAD">Lead</option>
                    <option value="EXECUTIVE">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Salary Min ($)
                  </label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) =>
                      setSalaryMin(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      fieldErrors.salaryMin
                        ? 'border-rose-500'
                        : 'border-slate-200 dark:border-slate-700'
                    } bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {fieldErrors.salaryMin && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.salaryMin}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Salary Max ($)
                  </label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) =>
                      setSalaryMax(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="PUBLISHED">Published (Accepting Applications)</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived (Closed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Application Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full sm:w-64 px-3 py-2 text-xs rounded-xl border ${
                    fieldErrors.deadline
                      ? 'border-rose-500'
                      : 'border-slate-200 dark:border-slate-700'
                  } bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {fieldErrors.deadline && (
                  <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.deadline}</p>
                )}
                <span className="block text-[11px] text-slate-400 mt-1">
                  Leave blank for rolling applications without a hard cutoff.
                </span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <Link
                href={`/jobs/${jobId}`}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Cancel
              </Link>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={saving}
                disabled={saving}
                className="flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </AuthGuard>
  );
}
