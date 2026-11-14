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
      className={`group relative bg-white border rounded-2xl p-3.5 shadow-sm hover:shadow-md hover:border-[#8B7CF6] hover:-translate-y-0.5 transition-all duration-200 select-none mb-3 ${
        isDragging
          ? 'border-[#6C5CE7] shadow-xl ring-2 ring-[#6C5CE7]/30'
          : 'border-[#E4E3EF]'
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
              className="p-1 -ml-1 text-[#9E9EB3] group-hover:text-[#6C5CE7] transition-colors"
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
              className="font-bold text-xs sm:text-sm text-[#202033] hover:text-[#6C5CE7] truncate text-left transition-colors cursor-pointer"
            >
              {applicant?.fullName || 'Candidate'}
            </button>
          </div>
          <p className="text-[11px] text-[#68677D] truncate mt-0.5 ml-5 font-mono">
            {applicant?.headline || applicant?.user?.email || 'Applicant'}
          </p>
        </div>

        {rating > 0 && (
          <div className="flex items-center gap-1 text-[#C47D15] bg-[#E9A23B]/15 px-1.5 py-0.5 rounded-lg text-[10px] font-bold border border-[#E9A23B]/30 shrink-0">
            <Star className="w-3 h-3 fill-[#E9A23B] text-[#E9A23B]" />
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
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F0F1F8] text-[#68677D] border border-[#E4E3EF]"
            >
              {s.name}
            </span>
          ))}
          {applicant.skills.length > 3 && (
            <span className="text-[10px] text-[#9E9EB3] self-center font-medium">
              +{applicant.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Interview status indicator */}
      {nextInterview && (
        <div className="mt-2.5 ml-5 flex items-center gap-1.5 text-[11px] font-semibold text-[#6C5CE7] bg-[#EAE7FF] p-1.5 rounded-xl border border-[#8B7CF6]/30">
          <Calendar className="w-3.5 h-3.5 text-[#6C5CE7] shrink-0" />
          <span className="truncate">
            {nextInterview.interviewType || nextInterview.type}: {nextInterview.date}
          </span>
        </div>
      )}

      {/* Footer controls */}
      <div className="mt-3 ml-5 pt-2 border-t border-[#E4E3EF] flex items-center justify-between text-xs text-[#68677D]">
        <span className="text-[10px] text-[#9E9EB3]">
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
              className="neu-icon-btn p-1 text-[#68677D] hover:text-[#6C5CE7] cursor-pointer"
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
            className="neu-icon-btn p-1 text-[#68677D] hover:text-[#6C5CE7] cursor-pointer"
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
            className="neu-icon-btn p-1 text-[#68677D] hover:text-[#202033] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
