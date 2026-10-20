'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { useToast } from '../../../providers/ToastContext';
import { Button } from '../../../components/ui/Button';
import { Briefcase, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('Remote (US/Canada)');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [experienceLevel, setExperienceLevel] = useState('SENIOR');
  const [salaryMin, setSalaryMin] = useState(130000);
  const [salaryMax, setSalaryMax] = useState(170000);
  const [status, setStatus] = useState('PUBLISHED');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'RECRUITER' && user.role !== 'SUPER_ADMIN')) {
      showToast('Only recruiters can create job postings', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/jobs', {
        title,
        description,
        requirements,
        responsibilities,
        skills,
        location,
        employmentType,
        experienceLevel,
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
        status,
      });

      if (res.data.success) {
        showToast('Job posting created successfully!', 'success');
        router.push(`/applications/kanban/${res.data.data.id}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create job';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/jobs"
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Job Posting</h1>
          <p className="text-xs text-slate-500">
            Define requirements and publish to the candidate job board.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Job Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Full-Stack Engineer"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Remote or San Francisco, CA"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Min Salary (USD)
            </label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Max Salary (USD)
            </label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Required Skills (comma-separated) *
          </label>
          <input
            type="text"
            required
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Job Description *
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Overview of the mission, role objectives, and team context..."
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Requirements *
          </label>
          <textarea
            rows={3}
            required
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="• 5+ years of software development experience..."
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Key Responsibilities *
          </label>
          <textarea
            rows={3}
            required
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            placeholder="• Architect and ship scalable microservices..."
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/jobs"
            className="px-4 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <Button type="submit" variant="primary" size="md" loading={loading}>
            Create Job & Initialize Pipeline
          </Button>
        </div>
      </form>
    </div>
  );
}
