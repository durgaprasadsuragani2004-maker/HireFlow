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

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) errors.title = 'Job title is required';
    if (!description.trim()) errors.description = 'Job description is required';
    if (!requirements.trim()) errors.requirements = 'Requirements are required';
    if (!responsibilities.trim()) errors.responsibilities = 'Responsibilities are required';
    if (!skills.trim()) errors.skills = 'Key skills are required';
    if (!location.trim()) errors.location = 'Location is required';

    if (isSuperAdmin && !selectedCompanyId) {
      errors.companyId = 'Please select a company for this job posting';
    }

    if (isSuperAdmin && !selectedRecruiterId) {
      errors.recruiterId = 'Please select an assigned HR / recruiter for this job posting';
    }

    if (salaryMin !== '' && salaryMax !== '') {
      if (Number(salaryMin) > Number(salaryMax)) {
        errors.salary = 'Minimum compensation cannot exceed maximum compensation';
      }
    }

    if (deadline) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (deadline < todayStr) {
        errors.deadline = 'Application deadline cannot be in the past. Please select today or a future date.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the validation errors before submitting', 'error');
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
        status,
        salaryMin: salaryMin !== '' ? Number(salaryMin) : undefined,
        salaryMax: salaryMax !== '' ? Number(salaryMax) : undefined,
        deadline: deadline || undefined,
      };

      if (isSuperAdmin) {
        payload.companyId = selectedCompanyId;
        payload.recruiterId = selectedRecruiterId;
      } else if (isCompany && selectedRecruiterId) {
        payload.recruiterId = selectedRecruiterId;
      }

      const res = await api.post('/jobs', payload);
      if (res.data.success) {
        showToast('Job posting created and published successfully!', 'success');
        router.push(`/jobs/${res.data.data.id}`);
      }
    } catch (err: any) {
      const serverErrors = err.response?.data?.errors;
      if (Array.isArray(serverErrors)) {
        const newFieldErrors: Record<string, string> = {};
        for (const e of serverErrors) {
          if (e.field) newFieldErrors[e.field] = e.message;
        }
        setFieldErrors((prev) => ({ ...prev, ...newFieldErrors }));
      }
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Failed to create job posting';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const companyDisplayName =
    user?.company?.name || user?.recruiterProfile?.companyName || (user?.recruiterProfile as any)?.company?.name || 'Company Account';

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN', 'COMPANY', 'RECRUITER']}>
      <div className="max-w-4xl mx-auto space-y-6 py-2">
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
            Job Board
          </Link>
          <span className="text-[#E4E3EF]">/</span>
          <span className="text-[#202033] font-semibold">New Job</span>
        </nav>

        {/* Page Title & Back */}
        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="neu-icon-btn p-2 rounded-xl"
            title="Back to Job Listings"
          >
            <ArrowLeft className="w-5 h-5 text-[#202033]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#202033] tracking-tight">
              Create New Job Posting
            </h1>
            <p className="text-xs text-[#68677D] mt-0.5">
              Configure parameters, compensation range, requirements, and initialize the Kanban pipeline.
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
                <span>Super Admin Organization Assignment</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#68677D] mb-1">
                    Select Company *
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    disabled={loadingCompanies}
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
                    Assign HR / Recruiter Lead *
                  </label>
                  <select
                    value={selectedRecruiterId}
                    onChange={(e) => setSelectedRecruiterId(e.target.value)}
                    disabled={loadingCompanies || availableRecruiters.length === 0}
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
                  <span>Publishing for Organization: <strong className="text-[#202033]">{companyDisplayName}</strong></span>
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
          ) : (
            <div className="flex items-center gap-2 p-3.5 bg-[#EAE7FF] border border-[#8B7CF6]/30 rounded-2xl text-xs text-[#6C5CE7] font-medium">
              <Building2 className="w-4 h-4 text-[#6C5CE7] shrink-0" />
              <span>
                Publishing for authorized organization:{' '}
                <strong className="text-[#202033] font-bold">
                  {companyDisplayName}
                </strong>
              </span>
            </div>
          )}

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
              placeholder="e.g. Senior Full-Stack Engineer"
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
                placeholder="e.g. Remote or San Francisco, CA"
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
                <option value="ENTRY" className="bg-white text-[#202033]">Entry Level</option>
                <option value="MID" className="bg-white text-[#202033]">Mid Level</option>
                <option value="SENIOR" className="bg-white text-[#202033]">Senior Level</option>
                <option value="DIRECTOR" className="bg-white text-[#202033]">Director / Exec</option>
              </select>
            </div>
          </div>

          {/* Salary Range */}
          <div>
            <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
              Annual Compensation Range (USD)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={salaryMin}
                  onChange={(e) => {
                    setSalaryMin(e.target.value ? Number(e.target.value) : '');
                    if (fieldErrors.salary) setFieldErrors({ ...fieldErrors, salary: '' });
                  }}
                  placeholder="Minimum (e.g. 120000)"
                  className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={salaryMax}
                  onChange={(e) => {
                    setSalaryMax(e.target.value ? Number(e.target.value) : '');
                    if (fieldErrors.salary) setFieldErrors({ ...fieldErrors, salary: '' });
                  }}
                  placeholder="Maximum (e.g. 160000)"
                  className="skeuo-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>
            </div>
            {fieldErrors.salary && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.salary}</p>
            )}
          </div>

          {/* Deadline & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className={`skeuo-input w-full px-3.5 py-2.5 text-xs ${
                  fieldErrors.deadline ? 'border-rose-500 ring-1 ring-rose-500' : ''
                }`}
              />
              {fieldErrors.deadline && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.deadline}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68677D] mb-1.5">
                Initial Posting Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="skeuo-input w-full px-3.5 py-2.5 text-xs cursor-pointer"
              >
                <option value="PUBLISHED" className="bg-white text-[#202033]">Published (Active on Board)</option>
                <option value="DRAFT" className="bg-white text-[#202033]">Draft (Hidden from Board)</option>
                <option value="CLOSED" className="bg-white text-[#202033]">Closed</option>
              </select>
            </div>
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
              placeholder="e.g. TypeScript, React, Next.js, Node.js, PostgreSQL"
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
              placeholder="Provide a comprehensive summary of the team, mission, and scope of this position..."
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
              placeholder="Detail the daily obligations, architectural ownership, and expected deliverables..."
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
              placeholder="Specify required experience, education, system design background, and must-have credentials..."
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
              href="/jobs"
              className="neu-btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
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
