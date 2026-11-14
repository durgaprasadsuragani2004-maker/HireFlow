'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../providers/AuthContext';
import { useToast } from '../../../../providers/ToastContext';
import { Button } from '../../../../components/ui/Button';
import { AuthGuard } from '../../../../components/layout/AuthGuard';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { ArrowLeft, Home, Building, UserCheck, AlertCircle, Save, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const { user } = useAuth();
  const { showToast } = useToast();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isCompany = user?.role === 'COMPANY';
  const companyDisplayName = (user as any)?.company?.name || (user as any)?.companyProfile?.name || 'Company Account';

  // Company and Recruiter state (for Super Admin & Company)
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyRecruiters, setCompanyRecruiters] = useState<any[]>([]);
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
  const [experienceLevel, setExperienceLevel] = useState('SENIOR_LEVEL');
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('PUBLISHED');

  const [loadingJob, setLoadingJob] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isSuperAdmin) {
      api
        .get('/companies/all')
        .then((res) => {
          if (res.data.success && Array.isArray(res.data.data)) {
            setCompanies(res.data.data);
          }
        })
        .catch(() => {});
    } else if (isCompany) {
      api
        .get('/companies')
        .then((res) => {
          if (res.data.success && res.data.data) {
            const c = res.data.data;
            const recs = c.recruiters || [];
            setCompanyRecruiters(recs);
          }
        })
        .catch(() => {});
    }
  }, [isSuperAdmin, isCompany]);

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      setLoadingJob(true);
      setErrorMessage('');
      try {
        const res = await api.get(`/jobs/${jobId}`);
        if (res.data.success) {
          const j = res.data.data;

          if (
            isCompany &&
            user?.companyId &&
            j.companyId !== user.companyId
          ) {
            setErrorMessage('You do not have permission to edit jobs for another company.');
            return;
          }

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
            setDeadline(d.toISOString().split('T')[0]);
          }
        }
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || 'Failed to load job details');
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
        localErrors.deadline = 'Application deadline cannot be in the past. Please select today or a future date.';
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
        deadline: deadline ? (deadline.includes('T') ? deadline : `${deadline}T23:59:59.999Z`) : null,
      };

      if (isSuperAdmin) {
        payload.companyId = selectedCompanyId;
        payload.recruiterId = selectedRecruiterId || null;
      } else if (isCompany) {
        if (selectedRecruiterId) {
          payload.recruiterId = selectedRecruiterId;
        }
      }

      const res = await api.put(`/jobs/${jobId}`, payload);

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
        const msg = err.response?.data?.message || 'Failed to update job posting';
        showToast(msg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white border border-rose-500/30 rounded-3xl shadow-card">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#202033]">Unable to Edit Job</h2>
        <p className="text-xs text-[#68677D] mt-2">{errorMessage}</p>
        <Link
          href="/jobs"
          className="neu-btn-primary inline-block mt-5 px-4 py-2 text-xs font-bold text-white rounded-xl"
        >
          Back to Job Listings
        </Link>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'COMPANY', 'RECRUITER']}>
      <div className="max-w-3xl mx-auto py-2 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#68677D]">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-[#6C5CE7] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span className="text-[#E4E3EF]">/</span>
          <Link href="/jobs" className="hover:text-[#6C5CE7] transition-colors">
            Job Postings
          </Link>
          <span className="text-[#E4E3EF]">/</span>
          <Link href={`/jobs/${jobId}`} className="hover:text-[#6C5CE7] transition-colors truncate max-w-xs">
            {title || 'Job Details'}
          </Link>
          <span className="text-[#E4E3EF]">/</span>
          <span className="text-[#202033] font-semibold">Edit</span>
        </nav>

        {/* Page Title & Back */}
        <div className="flex items-center gap-3">
          <Link
            href={`/jobs/${jobId}`}
            className="neu-icon-btn p-2 rounded-xl"
            title="Back to Job Details"
          >
            <ArrowLeft className="w-5 h-5 text-[#202033]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#202033] tracking-tight">
              Edit Job Posting
            </h1>
            <p className="text-xs text-[#68677D] mt-0.5">
              Update position requirements, compensation range, status, and recruiter ownership.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="skeuo-card p-6 sm:p-8 border border-[#E4E3EF] space-y-5"
        >
          {/* Company & Recruiter Assignment Section */}
          {isSuperAdmin ? (
            <div className="p-4 bg-[#EAE7FF] border border-[#8B7CF6]/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#6C5CE7]">
                <Building className="w-4 h-4 text-[#6C5CE7]" />
                <span>Super Admin Assignment Controls</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#68677D] mb-1">
                    Assigned Company *
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white text-[#202033]">
                        {c.name} ({c.recruiters?.length || 0} recruiters)
                      </option>
                    ))}
                  </select>
                  {fieldErrors.companyId && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.companyId}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-[#68677D] mb-1">
                    Assigned Recruiter *
                  </label>
                  <select
                    value={selectedRecruiterId}
                    onChange={(e) => setSelectedRecruiterId(e.target.value)}
                    disabled={availableRecruiters.length === 0}
                    className="skeuo-input w-full px-3.5 py-2.5 text-xs disabled:opacity-60"
                  >
                    {availableRecruiters.length === 0 ? (
                      <option value="" className="bg-white text-[#202033]">No recruiters linked to this company</option>
                    ) : (
                      availableRecruiters.map((r: any) => (
                        <option key={r.id} value={r.id} className="bg-white text-[#202033]">
                          {r.user?.email} ({r.title || 'Recruiter'})
                        </option>
                      ))
                    )}
                  </select>
                  {fieldErrors.recruiterId && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.recruiterId}</p>
                  )}
                </div>
              </div>

              {availableRecruiters.length === 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-700">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>HR/Recruiter required — this company has no eligible HR accounts.</span>
                  </div>
                  <Link
                    href="/admin/users"
                    className="neu-btn-secondary px-3 py-1 text-amber-800 rounded-lg font-semibold self-start sm:self-auto"
                  >
                    Create HR Account
                  </Link>
                </div>
              )}
            </div>
          ) : isCompany ? (
            <div className="p-4 bg-[#EAE7FF] border border-[#8B7CF6]/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#6C5CE7]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#6C5CE7]" />
                  <span>Organization: <strong className="text-[#202033]">{companyDisplayName}</strong></span>
                </div>
                <Link href="/admin/users" className="text-xs text-[#6C5CE7] hover:underline">
                  Manage HR Team
                </Link>
              </div>

              {companyRecruiters.length === 0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-700">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>HR/Recruiter required — this company has no eligible HR accounts.</span>
                  </div>
                  <Link
                    href="/admin/users"
                    className="neu-btn-secondary px-3 py-1 text-amber-800 rounded-lg font-semibold self-start sm:self-auto"
                  >
                    Create HR Account
                  </Link>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#68677D] mb-1">
                    Assign HR / Recruiter Lead *
                  </label>
                  <select
                    value={selectedRecruiterId}
                    onChange={(e) => setSelectedRecruiterId(e.target.value)}
                    className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                  >
                    <option value="" className="bg-white text-[#202033]">Select Recruiter</option>
                    {companyRecruiters.map((r: any) => (
                      <option key={r.id} value={r.id} className="bg-white text-[#202033]">
                        {r.user?.email} ({r.title || 'Recruiter'})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.recruiterId && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.recruiterId}</p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Job Title */}
          <div>
            <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
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
              className={`skeuo-input w-full px-3.5 py-2.5 text-xs ${
                fieldErrors.title ? 'border-rose-500' : ''
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
              <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
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
                className={`skeuo-input w-full px-3.5 py-2.5 text-xs ${
                  fieldErrors.location ? 'border-rose-500' : ''
                }`}
              />
              {fieldErrors.location && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                Employment Type *
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="skeuo-input w-full px-3.5 py-2.5 text-xs cursor-pointer"
              >
                <option value="FULL_TIME" className="bg-white text-[#202033]">Full Time</option>
                <option value="PART_TIME" className="bg-white text-[#202033]">Part Time</option>
                <option value="CONTRACT" className="bg-white text-[#202033]">Contract</option>
                <option value="INTERNSHIP" className="bg-white text-[#202033]">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                Experience Level *
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="skeuo-input w-full px-3.5 py-2.5 text-xs cursor-pointer"
              >
                <option value="ENTRY_LEVEL" className="bg-white text-[#202033]">Entry Level</option>
                <option value="MID_LEVEL" className="bg-white text-[#202033]">Mid Level</option>
                <option value="SENIOR" className="bg-white text-[#202033]">Senior</option>
                <option value="LEAD" className="bg-white text-[#202033]">Lead / Architect</option>
                <option value="EXECUTIVE" className="bg-white text-[#202033]">Executive</option>
              </select>
            </div>
          </div>

          {/* Salary Min, Salary Max, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
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
                className={`skeuo-input w-full px-3.5 py-2.5 text-xs ${
                  fieldErrors.salaryMin ? 'border-rose-500' : ''
                }`}
              />
              {fieldErrors.salaryMin && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.salaryMin}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
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
                className={`skeuo-input w-full px-3.5 py-2.5 text-xs ${
                  fieldErrors.salaryMax ? 'border-rose-500' : ''
                }`}
              />
              {fieldErrors.salaryMax && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.salaryMax}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                Posting Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="skeuo-input w-full px-3.5 py-2.5 text-xs cursor-pointer"
              >
                <option value="PUBLISHED" className="bg-white text-[#202033]">Published (Accepting Candidates)</option>
                <option value="DRAFT" className="bg-white text-[#202033]">Draft</option>
                <option value="ARCHIVED" className="bg-white text-[#202033]">Closed / Archived</option>
              </select>
            </div>
          </div>

          {/* Application Deadline */}
          <div>
            <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
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
              className={`skeuo-input w-full sm:w-1/2 px-3.5 py-2.5 text-xs ${
                fieldErrors.deadline ? 'border-rose-500' : ''
              }`}
            />
            {fieldErrors.deadline && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.deadline}</p>
            )}
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
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
              className={`skeuo-input w-full px-3.5 py-2.5 text-xs ${
                fieldErrors.skills ? 'border-rose-500' : ''
              }`}
            />
            {fieldErrors.skills && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.skills}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
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
              className={`skeuo-input w-full px-3.5 py-2.5 text-xs leading-relaxed ${
                fieldErrors.description ? 'border-rose-500' : ''
              }`}
            />
            {fieldErrors.description && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.description}</p>
            )}
          </div>

          {/* Responsibilities */}
          <div>
            <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
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
              className={`skeuo-input w-full px-3.5 py-2.5 text-xs leading-relaxed ${
                fieldErrors.responsibilities ? 'border-rose-500' : ''
              }`}
            />
            {fieldErrors.responsibilities && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.responsibilities}</p>
            )}
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
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
              className={`skeuo-input w-full px-3.5 py-2.5 text-xs leading-relaxed ${
                fieldErrors.requirements ? 'border-rose-500' : ''
              }`}
            />
            {fieldErrors.requirements && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.requirements}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E3EF]">
            <Link
              href={`/jobs/${jobId}`}
              className="neu-btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
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
      </div>
    </AuthGuard>
  );
}
