'use client';

import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Star, Calendar, History, Eye, GripVertical } from 'lucide-react';

interface KanbanCardProps {
  application: any;
  onViewDetails: (app: any) => void;
  onViewHistory: (app: any) => void;
  onScheduleInterview?: (app: any) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  application,
  onViewDetails,
  onViewHistory,
  onScheduleInterview,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: application.id,
    data: { application, stage: application.currentStage },
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `card-${application.id}`,
    data: { stage: application.currentStage, applicationId: application.id },
  });

  const setCardRef = (node: HTMLDivElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
  };

  const applicant = application.applicant;
  const rating = application.rating || 0;
  const nextInterview = application.interviews?.[0];

  return (
    <div
      ref={setCardRef}
      style={style}
      className={`group relative bg-[#101726] border rounded-2xl p-3.5 shadow-card hover:shadow-card-hover hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 select-none mb-3 ${
        isDragging
          ? 'border-indigo-500 shadow-2xl ring-2 ring-indigo-500/40'
          : 'border-[#2B3950]'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-start justify-between gap-2 cursor-grab active:cursor-grabbing pb-1"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="p-1 -ml-1 text-[#64748B] group-hover:text-indigo-400 transition-colors"
              title="Drag candidate to change recruitment stage"
            >
              <GripVertical className="w-4 h-4" />
            </span>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(application);
              }}
              className="font-bold text-xs sm:text-sm text-[#F1F5F9] hover:text-indigo-400 truncate text-left transition-colors"
            >
              {applicant?.fullName || 'Candidate'}
            </button>
          </div>
          <p className="text-[11px] text-[#A1AEC2] truncate mt-0.5 ml-5 font-mono">
            {applicant?.headline || applicant?.user?.email || 'Applicant'}
          </p>
        </div>

        {rating > 0 && (
          <div className="flex items-center gap-1 text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-lg text-[10px] font-bold border border-amber-500/30 shrink-0">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
          </div>
        )}
      </div>

      {/* Skills snippet */}
      {applicant?.skills && applicant.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5 ml-5">
          {applicant.skills.slice(0, 3).map((s: any) => (
            <span
              key={s.id || s.name}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#1E293B] text-[#A1AEC2] border border-[#2B3950]"
            >
              {s.name}
            </span>
          ))}
          {applicant.skills.length > 3 && (
            <span className="text-[10px] text-[#64748B] self-center font-medium">
              +{applicant.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Interview status indicator */}
      {nextInterview && (
        <div className="mt-2.5 ml-5 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 p-1.5 rounded-xl border border-indigo-500/20">
          <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">
            {nextInterview.interviewType || nextInterview.type}: {nextInterview.date}
          </span>
        </div>
      )}

      {/* Footer controls */}
      <div className="mt-3 ml-5 pt-2 border-t border-[#2B3950] flex items-center justify-between text-xs text-[#64748B]">
        <span className="text-[10px] text-[#64748B]">
          {new Date(application.appliedAt).toLocaleDateString()}
        </span>

        <div className="flex items-center gap-1">
          {onScheduleInterview && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onScheduleInterview(application);
              }}
              title="Schedule Interview"
              className="p-1 hover:bg-[#1C2940] rounded-lg text-[#A1AEC2] hover:text-indigo-400 focus-ring active:scale-90 transition-all duration-150"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory(application);
            }}
            title="View Stage History Audit Trail"
            className="p-1 hover:bg-[#1C2940] rounded-lg text-[#A1AEC2] hover:text-indigo-400 focus-ring active:scale-90 transition-all duration-150"
          >
            <History className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(application);
            }}
            title="View Application Details"
            className="p-1 hover:bg-[#1C2940] rounded-lg text-[#A1AEC2] hover:text-[#F1F5F9] focus-ring active:scale-90 transition-all duration-150"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
