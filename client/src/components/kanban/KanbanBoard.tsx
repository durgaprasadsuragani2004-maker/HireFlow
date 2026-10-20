'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { StageHistoryModal } from './StageHistoryModal';
import { api } from '../../lib/api';
import { useToast } from '../../providers/ToastContext';

const STAGES = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];

interface KanbanBoardProps {
  initialKanbanData: Record<string, any[]>;
  jobId: string;
  onViewCandidateDetails: (app: any) => void;
  onScheduleInterview: (app: any) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  initialKanbanData,
  jobId,
  onViewCandidateDetails,
  onScheduleInterview,
}) => {
  const [columns, setColumns] = useState<Record<string, any[]>>(initialKanbanData);
  const [activeCard, setActiveCard] = useState<any | null>(null);
  const [historyModalApp, setHistoryModalApp] = useState<any | null>(null);
  const { showToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeApp = active.data.current?.application;
    if (activeApp) {
      setActiveCard(activeApp);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const applicationId = active.id as string;
    const targetStage = over.id as string;

    // Find current stage of candidate
    let sourceStage = '';
    let candidateApp: any = null;

    for (const [stageName, appList] of Object.entries(columns)) {
      const found = appList.find((a) => a.id === applicationId);
      if (found) {
        sourceStage = stageName;
        candidateApp = found;
        break;
      }
    }

    if (!sourceStage || !candidateApp || sourceStage === targetStage) {
      return;
    }

    // Optimistically update frontend columns
    const updatedSource = columns[sourceStage].filter((a) => a.id !== applicationId);
    const updatedCandidate = { ...candidateApp, currentStage: targetStage };
    const updatedTarget = [updatedCandidate, ...(columns[targetStage] || [])];

    setColumns({
      ...columns,
      [sourceStage]: updatedSource,
      [targetStage]: updatedTarget,
    });

    try {
      const res = await api.patch(`/applications/${applicationId}/stage`, {
        stage: targetStage,
        reason: `Moved from ${sourceStage} to ${targetStage} via Kanban`,
      });

      if (res.data.success) {
        showToast(
          `${candidateApp.applicant?.fullName || 'Candidate'} moved to ${targetStage}`,
          'success'
        );
      }
    } catch (err: any) {
      // Revert optimistic update
      setColumns(columns);
      const msg = err.response?.data?.message || 'Failed to update candidate stage';
      showToast(msg, 'error');
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              applications={columns[stage] || []}
              onViewDetails={onViewCandidateDetails}
              onViewHistory={(app) => setHistoryModalApp(app)}
              onScheduleInterview={onScheduleInterview}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="w-72 shadow-2xl rotate-2">
              <KanbanCard
                application={activeCard}
                onViewDetails={() => {}}
                onViewHistory={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {historyModalApp && (
        <StageHistoryModal
          isOpen={!!historyModalApp}
          onClose={() => setHistoryModalApp(null)}
          application={historyModalApp}
        />
      )}
    </>
  );
};
