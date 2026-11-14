'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import { getStageColor } from '../../lib/utils';

interface KanbanColumnProps {
  stage: string;
  applications: any[];
  onViewDetails: (app: any) => void;
  onViewHistory: (app: any) => void;
  onScheduleInterview?: (app: any) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  applications,
  onViewDetails,
  onViewHistory,
  onScheduleInterview,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const colors = getStageColor(stage);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 sm:w-80 shrink-0 bg-[#F8F8FC] rounded-2xl p-3.5 border transition-all duration-200 shadow-sm ${
        isOver
          ? 'border-[#6C5CE7] bg-[#EAE7FF]/40 ring-2 ring-[#6C5CE7]/30 shadow-md'
          : 'border-[#E4E3EF]'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-[#E4E3EF] mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} shrink-0 shadow-sm`} />
          <h4 className="font-extrabold text-xs text-[#202033] tracking-wider">
            {stage}
          </h4>
        </div>
        <span
          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAE7FF] text-[#6C5CE7] border border-[#8B7CF6]/30 shadow-sm"
        >
          {applications.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-270px)] pr-1 space-y-1">
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 border border-dashed border-[#E4E3EF] rounded-2xl text-xs text-[#68677D] p-3 text-center bg-white">
            <span className="font-semibold text-[#202033]">Empty Stage</span>
            <span className="text-[11px] text-[#68677D] mt-0.5">Drag candidates here to advance</span>
          </div>
        ) : (
          applications.map((app) => (
            <KanbanCard
              key={app.id}
              application={app}
              onViewDetails={onViewDetails}
              onViewHistory={onViewHistory}
              onScheduleInterview={onScheduleInterview}
            />
          ))
        )}
      </div>
    </div>
  );
};
