import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Star, Calendar, History, Eye, GripVertical } from 'lucide-react';
import { Badge } from '../ui/Badge';

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
    opacity: isDragging ? 0.35 : 1,
    touchAction: 'none',
  };

  const applicant = application.applicant;
  const rating = application.rating || 0;
  const nextInterview = application.interviews?.[0];

  return (
    <div
      ref={setCardRef}
      style={style}
      className={`group relative bg-white dark:bg-slate-900 border rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow select-none mb-3 ${
        isDragging
          ? 'border-blue-500 shadow-xl ring-2 ring-blue-500/20'
          : 'border-slate-200 dark:border-slate-800'
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
              className="p-1 -ml-1 text-slate-400 group-hover:text-blue-600 transition-colors"
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
              className="font-semibold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate text-left"
            >
              {applicant?.fullName || 'Candidate'}
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 ml-5">
            {applicant?.headline || applicant?.user?.email || 'Applicant'}
          </p>
        </div>


        {rating > 0 && (
          <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md text-[11px] font-semibold border border-amber-200 dark:border-amber-800">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>{rating}</span>
          </div>
        )}
      </div>

      {/* Skills snippet */}
      {applicant?.skills && applicant.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5 ml-5">
          {applicant.skills.slice(0, 3).map((s: any) => (
            <Badge key={s.id || s.name} variant="outline" className="text-[10px] py-0 px-1.5">
              {s.name}
            </Badge>
          ))}
          {applicant.skills.length > 3 && (
            <span className="text-[10px] text-slate-400 self-center">
              +{applicant.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Interview status indicator */}
      {nextInterview && (
        <div className="mt-2.5 ml-5 flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {nextInterview.interviewType}: {nextInterview.date} ({nextInterview.startTime})
          </span>
        </div>
      )}

      {/* Footer controls */}
      <div className="mt-3 ml-5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[10px]">
          Applied {new Date(application.appliedAt).toLocaleDateString()}
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
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-600"
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
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-blue-600"
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
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
