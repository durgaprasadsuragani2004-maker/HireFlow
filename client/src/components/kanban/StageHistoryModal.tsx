'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { ArrowRight, User, Clock } from 'lucide-react';
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
      title="Recruitment Stage Timeline"
      description={`Audit trail for ${application.applicant?.fullName}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#64748B]">
            No stage transitions recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2B3950]">
            {history.map((h: any) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#1C2940] bg-indigo-500 shadow-sm" />
                <div className="bg-[#101726] p-3.5 rounded-2xl border border-[#2B3950] space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {h.previousStage || 'APPLIED'}
                    </Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                    <Badge variant="primary" className="text-[10px]">
                      {h.newStage}
                    </Badge>
                  </div>
                  {h.reason && (
                    <div className="text-xs text-[#F1F5F9] font-medium italic">
                      "{h.reason}"
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[#A1AEC2] pt-1 border-t border-[#2B3950]">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-[#64748B]" />
                      <span className="truncate">{h.changedBy?.email || 'System / Auto'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[#64748B]">
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
