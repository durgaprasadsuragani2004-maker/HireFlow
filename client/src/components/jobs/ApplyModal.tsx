'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthContext';
import { useToast } from '../../providers/ToastContext';
import { CheckCircle2, Building2, MapPin } from 'lucide-react';

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
        <div className="p-3.5 bg-[#EAE7FF] rounded-2xl border border-[#8B7CF6]/30 text-xs text-[#202033] shadow-sm">
          <div className="flex items-center gap-1.5 font-bold text-[#202033]">
            <Building2 className="w-4 h-4 text-[#6C5CE7]" />
            <span>{job.company?.name || 'HireFlow Partner'}</span>
          </div>
          <div className="flex items-center gap-2 text-[#68677D] mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#9E9EB3]" />
            <span>{job.location}</span>
            <span>•</span>
            <span>{job.employmentType?.replace('_', ' ')}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#202033] mb-1.5">
            Candidate Profile
          </label>
          <div className="text-xs p-3.5 bg-[#F8F8FC] rounded-2xl border border-[#E4E3EF] shadow-sm flex items-center justify-between">
            <div>
              <div className="font-bold text-[#202033]">
                {user?.applicantProfile?.fullName || user?.email}
              </div>
              <div className="text-[#68677D] text-[11px] mt-0.5 font-mono">{user?.email}</div>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#16A878] bg-[#16A878]/15 px-2.5 py-1 rounded-xl border border-[#16A878]/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#202033] mb-1.5">
            Cover Letter / Motivation Statement
          </label>
          <textarea
            rows={4}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Share why you're a great fit for this position, relevant portfolio projects, or availability..."
            className="skeuo-input w-full p-3.5 text-xs leading-relaxed"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E4E3EF]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={loading}
          >
            Submit Application
          </Button>
        </div>
      </form>
    </Modal>
  );
};
