'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthContext';
import { useToast } from '../../providers/ToastContext';
import { Calendar, Clock, Video, User, Mail, FileText } from 'lucide-react';

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
    user?.applicantProfile?.fullName || user?.email?.split('@')[0] || ''
  );
  const [interviewerEmail, setInterviewerEmail] = useState(user?.email || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [interviewType, setInterviewType] = useState('TECHNICAL');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/hireflow-interview');
  const [notes, setNotes] = useState('');
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
        showToast('Interview scheduled successfully and added to pipeline calendar!', 'success');
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
      title="Schedule Interview Round"
      description={`Candidate: ${application.applicant?.fullName}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-dark-text mb-1.5">
              Interviewer Name *
            </label>
            <input
              type="text"
              required
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-text mb-1.5">
              Interviewer Email *
            </label>
            <input
              type="email"
              required
              value={interviewerEmail}
              onChange={(e) => setInterviewerEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-dark-text mb-1.5">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-text mb-1.5">
              Start Time *
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-text mb-1.5">
              End Time *
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-dark-text mb-1.5">
              Round Type
            </label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <option value="TECHNICAL">Technical Architecture</option>
              <option value="HR">Initial HR Screening</option>
              <option value="MANAGERIAL">Engineering Management</option>
              <option value="BEHAVIORAL">Behavioral / Team Fit</option>
              <option value="FINAL">Executive Final Round</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-text mb-1.5">
              Meeting URL
            </label>
            <input
              type="url"
              required
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-dark-dim"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-dark-text mb-1.5">
            Interviewer Briefing Notes (Internal)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Focus areas, coding prompts, questions to address..."
            className="w-full p-3 text-xs rounded-xl border border-dark-border bg-dark-input text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all leading-relaxed placeholder:text-dark-dim"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-dark-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={loading}
          >
            Schedule Interview
          </Button>
        </div>
      </form>
    </Modal>
  );
};
