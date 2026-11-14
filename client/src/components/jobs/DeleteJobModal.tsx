'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';
import { useToast } from '../../providers/ToastContext';
import { Trash2, Archive, AlertTriangle, Building2, CheckCircle2 } from 'lucide-react';

interface DeleteJobModalProps {
  job: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DeleteJobModal: React.FC<DeleteJobModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!job) return null;

  const applicantCount =
    job._count?.applications ?? job.applicationsCount ?? job.totalApplications ?? 0;
  const willArchive = applicantCount > 0;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await api.delete(`/jobs/${job.id}`);
      if (res.data.success) {
        showToast(
          res.data.message || (willArchive ? 'Job safely archived' : 'Job permanently deleted'),
          'success'
        );
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete job posting';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={willArchive ? 'Archive Job Posting' : 'Delete Job Posting'}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 py-1">
        {/* Job Identity Card */}
        <div className="p-4 bg-[#F8F8FC] border border-[#E4E3EF] rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#6C5CE7] uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>{job.company?.name || 'Company Position'}</span>
          </div>
          <h3 className="text-base font-extrabold text-[#202033] line-clamp-1">{job.title}</h3>
          <div className="flex items-center gap-3 text-xs text-[#68677D] mt-1.5">
            <span>{job.location}</span>
            <span>•</span>
            <span>{job.employmentType?.replace('_', ' ')}</span>
            <span>•</span>
            <span className="font-semibold text-[#202033]">
              {applicantCount} {applicantCount === 1 ? 'applicant' : 'applicants'}
            </span>
          </div>
        </div>

        {/* Policy Notice Banner */}
        {willArchive ? (
          <div className="p-4 bg-[#EAE7FF]/60 border border-[#8B7CF6]/40 rounded-2xl flex items-start gap-3 text-xs text-[#202033] leading-relaxed">
            <div className="p-2 rounded-xl bg-[#6C5CE7] text-white shrink-0 shadow-sm mt-0.5">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#202033] mb-1">Safe Archival Protection</p>
              <p className="text-[#68677D]">
                This position has{' '}
                <strong className="text-[#6C5CE7]">{applicantCount} candidate application(s)</strong> in its
                recruitment pipeline. To maintain candidate histories, interview schedules, and audit
                trails, this role will be safely moved to <strong className="text-[#202033]">ARCHIVED</strong>{' '}
                status rather than being permanently deleted.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#E05260]/10 border border-[#E05260]/30 rounded-2xl flex items-start gap-3 text-xs text-[#202033] leading-relaxed">
            <div className="p-2 rounded-xl bg-[#E05260] text-white shrink-0 shadow-sm mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#E05260] mb-1">Permanent Deletion</p>
              <p className="text-[#68677D]">
                This job posting has <strong className="text-[#202033]">0 candidate applications</strong>.
                It will be permanently removed from the system. This action cannot be reversed.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E3EF]">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="neu-btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm ${
              willArchive
                ? 'neu-btn-primary bg-[#6C5CE7] text-white'
                : 'bg-[#E05260] text-white hover:bg-[#D04351] active:translate-y-0.5'
            }`}
          >
            {loading ? (
              <span>Processing...</span>
            ) : willArchive ? (
              <>
                <Archive className="w-3.5 h-3.5" />
                <span>Archive Job Safely</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
