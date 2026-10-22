'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { useToast } from '../../../providers/ToastContext';
import { Button } from '../../../components/ui/Button';
import { AuthGuard } from '../../../components/layout/AuthGuard';
import { ArrowLeft, Home, Building, UserCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function NewJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Company and Recruiter state (for Super Admin)
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedRecruiterId, setSelectedRecruiterId] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('Remote (US/Canada)');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [experienceLevel, setExperienceLevel] = useState('SENIOR');
  const [salaryMin, setSalaryMin] = useState<number | ''>(130000);
  const [salaryMax, setSalaryMax] = useState<number | ''>(170000);
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [loading, setLoading] = useState(false);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch companies for Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      setLoadingCompanies(true);
      api
        .get('/companies/all')
        .then((res) => {
          if (res.data.success && Array.isArray(res.data.data)) {
            setCompanies(res.data.data);
            if (res.data.data.length > 0) {
              const firstCompany = res.data.data[0];
              setSelectedCompanyId(firstCompany.id);
              if (firstCompany.recruiters && firstCompany.recruiters.length > 0) {
                setSelectedRecruiterId(firstCompany.recruiters[0].id);
              }
            }
          }
        })
        .catch(() => {
          showToast('Failed to load companies list', 'error');
        })
        .finally(() => {
          setLoadingCompanies(false);
        });
    }
  }, [isSuperAdmin]);

  // Update recruiter options when selected company changes
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
      showToast('Only authorized recruiters and administrators can create job postings', 'error');
      return;
    }

    setFieldErrors({});

    // Client-side quick checks
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

    if (isSuperAdmin && !selectedCompanyId) {
      localErrors.companyId = 'Please select a company for this job post';
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      showToast('Please correct the highlighted fields', 'error');
      return;
    }

    setLoading(true);
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

      if (isSuperAdmin) {
        payload.companyId = selectedCompanyId;
        if (selectedRecruiterId) {
          payload.recruiterId = selectedRecruiterId;
        }
      }

      const res = await api.post('/jobs', payload);

      if (res.data.success) {
        showToast('Job posting created successfully!', 'success');
        router.push(`/applications/kanban/${res.data.data.id}`);
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
        const msg = err.response?.data?.message || 'Failed to create job posting';
        showToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'RECRUITER']}>
      <div className="max-w-3xl mx-auto py-4 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span className="text-slate-400">/</span>
          <Link href="/jobs" className="hover:text-blue-600 transition-colors">
            Job Postings
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">New Job</span>
        </nav>

        {/* Page Title & Back */}
        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Job Listings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Create New Job Posting
            </h1>
            <p className="text-xs text-slate-500">
              Configure job parameters, salary, requirements, and assign recruiter pipeline.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5"
        >
          {/* Company & Recruiter Assignment Section (Super Admin or Recruiter Info) */}
          {isSuperAdmin ? (
            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                <Building className="w-4 h-4 text-purple-600" />
                <span>Super Admin Assignment Controls</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Company *
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    disabled={loadingCompanies}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.recruiters?.length || 0} recruiters)
                      </option>
                    ))}
                  </select>
                  {fieldErrors.companyId && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.companyId}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Recruiter *
                  </label>
                  <select
                    value={selectedRecruiterId}
                    onChange={(e) => setSelectedRecruiterId(e.target.value)}
                    disabled={loadingCompanies || availableRecruiters.length === 0}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                  >
                    {availableRecruiters.length === 0 ? (
                      <option value="">No recruiters linked to this company</option>
                    ) : (
                      availableRecruiters.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.user?.email} ({r.title || 'Recruiter'})
                        </option>
                      ))
                    )}
                  </select>
                  {availableRecruiters.length === 0 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ This company has no recruiter account yet. The job will be linked to the company.
                    </p>
                  )}
                  {fieldErrors.recruiterId && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.recruiterId}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300">
              <UserCheck className="w-4 h-4 text-blue-500" />
              <span>
                Publishing on behalf of your authorized company:{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {user?.recruiterProfile?.companyId ? 'Your Organization' : 'HireFlow Partner'}
                </strong>
              </span>
            </div>
          )}

          {/* Job Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: '' });
              }}
              placeholder="e.g. Senior Full-Stack Engineer"
              className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.title
                  ? 'border-rose-500 ring-1 ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {fieldErrors.title && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.title}</span>
              </p>
            )}
          </div>

          {/* Location, Employment Type, Experience Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (fieldErrors.location) setFieldErrors({ ...fieldErrors, location: '' });
                }}
                placeholder="e.g. Remote or San Francisco, CA"
                className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.location
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {fieldErrors.location && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employment Type *
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Experience Level *
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ENTRY_LEVEL">Entry Level</option>
                <option value="MID_LEVEL">Mid Level</option>
                <option value="SENIOR">Senior</option>
                <option value="LEAD">Lead / Architect</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>
          </div>

          {/* Salary Min, Salary Max, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Salary (USD)
              </label>
              <input
                type="number"
                min={0}
                value={salaryMin}
                onChange={(e) => {
                  setSalaryMin(e.target.value === '' ? '' : Number(e.target.value));
                  if (fieldErrors.salaryMin) setFieldErrors({ ...fieldErrors, salaryMin: '' });
                }}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.salaryMin
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {fieldErrors.salaryMin && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.salaryMin}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Salary (USD)
              </label>
              <input
                type="number"
                min={0}
                value={salaryMax}
                onChange={(e) => {
                  setSalaryMax(e.target.value === '' ? '' : Number(e.target.value));
                  if (fieldErrors.salaryMax) setFieldErrors({ ...fieldErrors, salaryMax: '' });
                }}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.salaryMax
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {fieldErrors.salaryMax && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.salaryMax}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLISHED">Published (Live to Applicants)</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {/* Application Deadline */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Application Deadline (Optional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full sm:w-1/2 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Leave blank for ongoing positions with no expiration date.
            </span>
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Required Skills (comma-separated) *
            </label>
            <input
              type="text"
              required
              value={skills}
              onChange={(e) => {
                setSkills(e.target.value);
                if (fieldErrors.skills) setFieldErrors({ ...fieldErrors, skills: '' });
              }}
              placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
              className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.skills
                  ? 'border-rose-500 ring-1 ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {fieldErrors.skills && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.skills}</p>
            )}
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Description *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: '' });
              }}
              placeholder="Overview of the mission, role objectives, and team context (minimum 20 characters)..."
              className={`w-full p-3 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.description
                  ? 'border-rose-500 ring-1 ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {fieldErrors.description && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.description}</p>
            )}
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Requirements *
            </label>
            <textarea
              rows={3}
              required
              value={requirements}
              onChange={(e) => {
                setRequirements(e.target.value);
                if (fieldErrors.requirements) setFieldErrors({ ...fieldErrors, requirements: '' });
              }}
              placeholder="• 5+ years of software development experience..."
              className={`w-full p-3 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.requirements
                  ? 'border-rose-500 ring-1 ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {fieldErrors.requirements && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.requirements}</p>
            )}
          </div>

          {/* Key Responsibilities */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Key Responsibilities *
            </label>
            <textarea
              rows={3}
              required
              value={responsibilities}
              onChange={(e) => {
                setResponsibilities(e.target.value);
                if (fieldErrors.responsibilities)
                  setFieldErrors({ ...fieldErrors, responsibilities: '' });
              }}
              placeholder="• Architect and ship scalable microservices..."
              className={`w-full p-3 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.responsibilities
                  ? 'border-rose-500 ring-1 ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {fieldErrors.responsibilities && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.responsibilities}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/jobs"
              className="px-4 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <Button type="submit" variant="primary" size="md" loading={loading} disabled={loading}>
              Create Job & Initialize Pipeline
            </Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
