'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { ArrowRight, User, Clock } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface StageHistoryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  application: any;
}

export const StageHistoryModal: React.FC<StageHistoryModalProps> = ({
  isOpen = true,
  onClose,
  application,
}) => {
  if (!application) return null;

  const history = application.stageHistory || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recruitment Stage Timeline"
      description={`Audit trail for ${application.applicant?.fullName || 'Candidate'}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#68677D]">
            No stage transitions recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E4E3EF]">
            {history.map((h: any) => (
              <div key={h.id} className="relative">
                {/* Physical node indicator */}
                <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-gradient-to-tr from-[#6C5CE7] to-[#8B7CF6] shadow-[0_0_8px_rgba(108,92,231,0.4)] flex items-center justify-center" />

                <div className="skeuo-card p-4 space-y-2.5 rounded-2xl border border-[#E4E3EF] shadow-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {h.previousStage || 'APPLIED'}
                    </Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9E9EB3]" />
                    <Badge variant="primary" className="text-[10px]">
                      {h.newStage}
                    </Badge>
                  </div>
                  {h.reason && (
                    <div className="text-xs text-[#202033] font-medium italic bg-[#F8F8FC] p-2.5 rounded-xl border border-[#E4E3EF]">
                      &quot;{h.reason}&quot;
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[#68677D] pt-2 border-t border-[#E4E3EF]">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-[#9E9EB3]" />
                      <span className="truncate max-w-[180px]">{h.changedBy?.email || 'System / Auto'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[#9E9EB3]">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(h.changedAt).toLocaleString()}</span>
                    </span>
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
