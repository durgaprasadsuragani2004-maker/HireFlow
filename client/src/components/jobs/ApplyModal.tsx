'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthContext';
import { useToast } from '../../providers/ToastContext';
import { FileText, CheckCircle2, Building2, MapPin } from 'lucide-react';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  onSuccess?: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  isOpen,
  onClose,
  job,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);

  if (!job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in as an applicant to apply', 'info');
      return;
    }
    if (user.role !== 'APPLICANT') {
      showToast('Only candidate accounts can submit job applications', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/applications/jobs/${job.id}/apply`, {
        coverLetter,
      });
      if (res.data.success) {
        showToast(`Application submitted successfully for ${job.title}!`, 'success');
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit application';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Application"
      description={`Applying for ${job.title}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Job Summary Pill */}
        <div className="p-3.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-xs text-[#F1F5F9]">
          <div className="flex items-center gap-1.5 font-bold text-[#F1F5F9]">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>{job.company?.name || 'HireFlow Partner'}</span>
          </div>
          <div className="flex items-center gap-2 text-[#A1AEC2] mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{job.location}</span>
            <span>•</span>
            <span>{job.employmentType?.replace('_', ' ')}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
            Candidate Profile
          </label>
          <div className="text-xs p-3.5 bg-[#101726] rounded-2xl border border-[#2B3950] flex items-center justify-between">
            <div>
              <div className="font-bold text-[#F1F5F9]">
                {user?.applicantProfile?.fullName || user?.email}
              </div>
              <div className="text-[#64748B] text-[11px] mt-0.5 font-mono">{user?.email}</div>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-xl border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#A1AEC2] mb-1.5">
            Cover Letter / Application Note (Optional)
          </label>
          <textarea
            rows={4}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Share why you are an ideal fit for this role, relevant achievements, or availability..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#2B3950] bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2B3950]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={loading}
            disabled={loading}
          >
            Confirm & Apply
          </Button>
        </div>
      </form>
    </Modal>
  );
};
