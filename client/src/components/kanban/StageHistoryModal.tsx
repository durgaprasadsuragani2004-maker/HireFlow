'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { formatDate } from '../../lib/utils';
import { ArrowRight, History, User } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface StageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
}

export const StageHistoryModal: React.FC<StageHistoryModalProps> = ({
  isOpen,
  onClose,
  application,
}) => {
  if (!application) return null;

  const history = application.stageHistory || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Recruitment Audit Trail: ${application.applicant?.fullName}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Complete audit history of stage transitions and decisions recorded for this application.
        </p>

        {history.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-400">
            No stage history recorded yet
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {history.map((h: any) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600" />
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">
                      {h.previousStage}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <Badge variant="info" className="text-[10px]">
                      {h.newStage}
                    </Badge>
                  </div>
                  {h.reason && (
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                      "{h.reason}"
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {h.changedBy?.email || 'System / Candidate'}
                    </span>
                    <span>{new Date(h.changedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
