'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { useToast } from '../../../providers/ToastContext';
import { Button } from '../../../components/ui/Button';
import { AuthGuard } from '../../../components/layout/AuthGuard';
import { ArrowLeft, Home, Building, UserCheck, AlertCircle, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function NewJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isCompany = user?.role === 'COMPANY';

  // Company and Recruiter state (for Super Admin & Company)
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyRecruiters, setCompanyRecruiters] = useState<any[]>([]);
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
    } else if (isCompany) {
      setLoadingCompanies(true);
      api
        .get('/companies')
        .then((res) => {
          if (res.data.success && res.data.data) {
            const c = res.data.data;
            const recs = c.recruiters || [];
            setCompanyRecruiters(recs);
            if (recs.length > 0) {
              setSelectedRecruiterId(recs[0].id);
            }
          }
        })
        .catch(() => {
          showToast('Failed to load company recruiter profile', 'error');
        })
        .finally(() => {
          setLoadingCompanies(false);
        });
    }
  }, [isSuperAdmin, isCompany]);

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
    if (
      !user ||
      (user.role !== 'RECRUITER' && user.role !== 'COMPANY' && user.role !== 'SUPER_ADMIN')
    ) {
      showToast('Only authorized recruiters and administrators can create job postings', 'error');
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

    // Deadline validation: reject dates earlier than today
    if (deadline) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (deadline < todayStr) {
        localErrors.deadline = 'Application deadline cannot be in the past.';
      }
    }

    // HR assignment validations
    if (isSuperAdmin) {
      if (!selectedCompanyId) {
        localErrors.companyId = 'Please select a company for this job post';
      }
      if (status === 'PUBLISHED' && (!selectedRecruiterId || availableRecruiters.length === 0)) {
        localErrors.recruiterId = 'HR/Recruiter required — this company has no eligible HR accounts.';
      }
    } else if (isCompany) {
      if (status === 'PUBLISHED' && (!selectedRecruiterId || companyRecruiters.length === 0)) {
        localErrors.recruiterId = 'HR/Recruiter required — this company has no eligible HR accounts.';
      }
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
        deadline: deadline ? (deadline.includes('T') ? deadline : `${deadline}T23:59:59.999Z`) : null,
      };

      if (isSuperAdmin) {
        payload.companyId = selectedCompanyId;
        if (selectedRecruiterId) {
          payload.recruiterId = selectedRecruiterId;
        }
      } else if (isCompany && selectedRecruiterId) {
        payload.recruiterId = selectedRecruiterId;
      }

      const res = await api.post('/jobs', payload);
      if (res.data.success) {
        showToast('Job posting published successfully!', 'success');
        router.push(`/jobs/${res.data.data.id}`);
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

  const companyDisplayName =
    user?.company?.name || user?.recruiterProfile?.companyName || 'Your Organization';

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'COMPANY', 'RECRUITER']}>
      <div className="max-w-3xl mx-auto py-2 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#A1AEC2]">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span className="text-[#64748B]">/</span>
          <Link href="/jobs" className="hover:text-indigo-400 transition-colors">
            Job Postings
          </Link>
          <span className="text-[#64748B]">/</span>
          <span className="text-[#F1F5F9] font-semibold">New Job</span>
        </nav>

        {/* Page Title & Back */}
        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="p-2 text-[#A1AEC2] hover:text-[#F1F5F9] rounded-xl hover:bg-[#151F32] transition-colors"
            title="Back to Job Listings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-tight">
              Create New Job Posting
            </h1>
            <p className="text-xs text-[#A1AEC2] mt-0.5">
              Configure parameters, compensation range, requirements, and initialize the Kanban pipeline.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#151F32] border border-[#2B3950] rounded-3xl p-6 sm:p-8 shadow-card space-y-5"
        >
          {/* Company & Recruiter Assignment Section */}
          {isSuperAdmin ? (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Building className="w-4 h-4 text-indigo-400" />
                <span>Super Admin Organization Assignment</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#A1AEC2] mb-1">
                    Select Company *
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    disabled={loadingCompanies}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2B3950] bg-[#101726] text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.recruiters?.length || 0} recruiters)
                      </option>
                    ))}
                  </select>
                  {fieldErrors.companyId && (
                    <p className="text-xs text-rose-400 mt-1">{fieldErrors.companyId}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-[#A1AEC2] mb-1">
                    Assign HR / Recruiter Lead *
                  </label>
                  <select
                    value={selectedRecruiterId}
                    onChange={(e) => setSelectedRecruiterId(e.target.value)}
                    disabled={loadingCompanies || availableRecruiters.length === 0}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2B3950] bg-[#101726] text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all disabled:opacity-60"
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
                  {fieldErrors.recruiterId && (
                    <p className="text-xs text-rose-400 mt-1">{fieldErrors.recruiterId}</p>
                  )}
                </div>
              </div>

              {availableRecruiters.length === 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>HR/Recruiter required — this company has no eligible HR accounts.</span>
                  </div>
                  <Link
                    href="/admin/users"
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg font-semibold transition self-start sm:self-auto"
                  >
                    Create HR Account
                  </Link>
                </div>
              )}
            </div>
          ) : isCompany ? (
            <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-teal-300">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  <span>Publishing for Organization: <strong className="text-[#F1F5F9]">{companyDisplayName}</strong></span>
                </div>
                <Link href="/admin/users" className="text-xs text-teal-400 hover:underline">
                  Manage HR Team
                </Link>
              </div>

              {companyRecruiters.length === 0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>HR/Recruiter required — this company has no eligible HR accounts.</span>
                  </div>
                  <Link
                    href="/admin/users"
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg font-semibold transition self-start sm:self-auto"
                  >
                    Create HR Account
                  </Link>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                    Assign HR / Recruiter Lead *
                  </label>
                  <select
                    value={selectedRecruiterId}
                    onChange={(e) => setSelectedRecruiterId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2B3950] bg-[#101726] text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 text-xs"
                  >
                    {companyRecruiters.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.user?.email} ({r.title || 'Recruiter'})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.recruiterId && (
                    <p className="text-xs text-rose-400 mt-1">{fieldErrors.recruiterId}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3.5 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-xs text-teal-300 font-medium">
              <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                Publishing for authorized organization:{' '}
                <strong className="text-[#F1F5F9] font-bold">
                  {companyDisplayName}
                </strong>
              </span>
            </div>
          )}

          {/* Job Title */}
          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
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
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all ${
                fieldErrors.title ? 'border-rose-500' : 'border-[#2B3950]'
              }`}
            />
            {fieldErrors.title && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.title}</span>
              </p>
            )}
          </div>

          {/* Location, Employment Type, Experience Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
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
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all ${
                  fieldErrors.location ? 'border-rose-500' : 'border-[#2B3950]'
                }`}
              />
              {fieldErrors.location && (
                <p className="text-xs text-rose-400 mt-1">{fieldErrors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
                Employment Type *
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#2B3950] bg-[#101726] text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
                Experience Level *
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#2B3950] bg-[#101726] text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
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
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
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
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all ${
                  fieldErrors.salaryMin ? 'border-rose-500' : 'border-[#2B3950]'
                }`}
              />
              {fieldErrors.salaryMin && (
                <p className="text-xs text-rose-400 mt-1">{fieldErrors.salaryMin}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
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
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all ${
                  fieldErrors.salaryMax ? 'border-rose-500' : 'border-[#2B3950]'
                }`}
              />
              {fieldErrors.salaryMax && (
                <p className="text-xs text-rose-400 mt-1">{fieldErrors.salaryMax}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
                Posting Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#2B3950] bg-[#101726] text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              >
                <option value="PUBLISHED">Published (Accepting Candidates)</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Closed / Archived</option>
              </select>
            </div>
          </div>

          {/* Application Deadline */}
          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
              Application Deadline (Optional)
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                if (fieldErrors.deadline) setFieldErrors({ ...fieldErrors, deadline: '' });
              }}
              className={`w-full sm:w-1/2 px-3.5 py-2.5 text-xs rounded-xl border bg-[#101726] text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all ${
                fieldErrors.deadline ? 'border-rose-500' : 'border-[#2B3950]'
              }`}
            />
            {fieldErrors.deadline && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.deadline}</p>
            )}
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
              Key Skills & Tech Stack * (comma-separated)
            </label>
            <input
              type="text"
              required
              value={skills}
              onChange={(e) => {
                setSkills(e.target.value);
                if (fieldErrors.skills) setFieldErrors({ ...fieldErrors, skills: '' });
              }}
              placeholder="e.g. TypeScript, React, Next.js, Node.js, PostgreSQL"
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all ${
                fieldErrors.skills ? 'border-rose-500' : 'border-[#2B3950]'
              }`}
            />
            {fieldErrors.skills && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.skills}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
              Job Overview & Purpose *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: '' });
              }}
              placeholder="Provide a comprehensive summary of the team, mission, and scope of this position..."
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all leading-relaxed ${
                fieldErrors.description ? 'border-rose-500' : 'border-[#2B3950]'
              }`}
            />
            {fieldErrors.description && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.description}</p>
            )}
          </div>

          {/* Responsibilities */}
          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
              Core Responsibilities *
            </label>
            <textarea
              required
              rows={4}
              value={responsibilities}
              onChange={(e) => {
                setResponsibilities(e.target.value);
                if (fieldErrors.responsibilities) setFieldErrors({ ...fieldErrors, responsibilities: '' });
              }}
              placeholder="Detail the daily obligations, architectural ownership, and expected deliverables..."
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all leading-relaxed ${
                fieldErrors.responsibilities ? 'border-rose-500' : 'border-[#2B3950]'
              }`}
            />
            {fieldErrors.responsibilities && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.responsibilities}</p>
            )}
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
              Candidate Requirements & Qualifications *
            </label>
            <textarea
              required
              rows={4}
              value={requirements}
              onChange={(e) => {
                setRequirements(e.target.value);
                if (fieldErrors.requirements) setFieldErrors({ ...fieldErrors, requirements: '' });
              }}
              placeholder="Specify required experience, education, system design background, and must-have credentials..."
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all leading-relaxed ${
                fieldErrors.requirements ? 'border-rose-500' : 'border-[#2B3950]'
              }`}
            />
            {fieldErrors.requirements && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.requirements}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2B3950]">
            <Link
              href="/jobs"
              className="px-4 py-2 text-xs font-semibold text-[#A1AEC2] hover:text-[#F1F5F9] rounded-xl hover:bg-[#1C2940] transition-colors"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              disabled={loading}
            >
              Publish Job Posting
            </Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
