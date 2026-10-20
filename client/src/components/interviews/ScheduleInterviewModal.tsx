'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthContext';
import { useToast } from '../../providers/ToastContext';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
  onSuccess?: () => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [interviewerName, setInterviewerName] = useState(
    user?.applicantProfile?.fullName || 'Sarah Jenkins'
  );
  const [interviewerEmail, setInterviewerEmail] = useState(user?.email || 'sarah.recruiter@technova.com');
  const [date, setDate] = useState('2026-10-28');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [interviewType, setInterviewType] = useState('TECHNICAL');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/hireflow-interview');
  const [notes, setNotes] = useState('Candidate technical architecture interview.');
  const [loading, setLoading] = useState(false);

  if (!application) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/interviews', {
        applicationId: application.id,
        interviewerName,
        interviewerEmail,
        date,
        startTime,
        endTime,
        interviewType,
        meetingLink,
        notes,
      });

      if (res.data.success) {
        showToast('Interview scheduled successfully!', 'success');
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to schedule interview';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule Interview: ${application.applicant?.fullName}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Interviewer Name
            </label>
            <input
              type="text"
              required
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Interviewer Email
            </label>
            <input
              type="email"
              required
              value={interviewerEmail}
              onChange={(e) => setInterviewerEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date (YYYY-MM-DD)
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start Time (24h)
            </label>
            <input
              type="text"
              required
              placeholder="14:00"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Time (24h)
            </label>
            <input
              type="text"
              required
              placeholder="15:00"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Interview Type
            </label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TECHNICAL">Technical Round</option>
              <option value="HR">HR / Recruiter Screen</option>
              <option value="MANAGERIAL">Managerial / Leadership</option>
              <option value="BEHAVIORAL">Behavioral</option>
              <option value="FINAL">Final Executive Round</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Meeting Link (URL)
            </label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Preparation Notes for Candidate / Panel
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Schedule Interview
          </Button>
        </div>
      </form>
    </Modal>
  );
};
