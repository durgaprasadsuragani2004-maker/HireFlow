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
      className={`flex flex-col w-72 sm:w-80 shrink-0 bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-3 border transition-colors ${
        isOver
          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              stage === 'APPLIED'
                ? 'bg-blue-500'
                : stage === 'SCREENING'
                ? 'bg-purple-500'
                : stage === 'SHORTLISTED'
                ? 'bg-amber-500'
                : stage === 'INTERVIEW'
                ? 'bg-indigo-500'
                : stage === 'SELECTED'
                ? 'bg-emerald-500'
                : 'bg-rose-500'
            }`}
          />
          <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 tracking-wider">
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
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 p-3 text-center">
            <span className="font-medium text-slate-500 dark:text-slate-400">No applications in this stage</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Drag candidates here to advance</span>
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
