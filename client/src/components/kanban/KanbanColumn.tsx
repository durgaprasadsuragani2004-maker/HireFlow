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
      className={`flex flex-col w-72 sm:w-80 shrink-0 bg-[#151F32] rounded-3xl p-3.5 border transition-all duration-200 ${
        isOver
          ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30 shadow-card-hover'
          : 'border-[#2B3950]'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-[#2B3950] mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} shrink-0`} />
          <h4 className="font-bold text-xs text-[#F1F5F9] tracking-wider">
            {stage}
          </h4>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
        >
          {applications.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-270px)] pr-1 space-y-1">
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 border border-dashed border-[#2B3950] rounded-2xl text-xs text-[#64748B] p-3 text-center bg-[#101726]/40">
            <span className="font-semibold text-[#A1AEC2]">Empty Stage</span>
            <span className="text-[11px] text-[#64748B] mt-0.5">Drag candidates here to advance</span>
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
