'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../providers/ToastContext';
import { Calendar, Clock, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

export default function InterviewsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/interviews?${params.toString()}`);
      if (res.data.success) {
        setInterviews(res.data.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/interviews/${id}`, { status });
      showToast(`Interview status updated to ${status}`, 'success');
      fetchInterviews();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update interview', 'error');
    }
  };

  const isRecruiter = user?.role === 'RECRUITER' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Scheduled Interviews</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Technical assessments, behavioral evaluations, and interview meetings.
          </p>
        </div>

        {/* Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 self-start sm:self-auto"
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          title="No Interviews Found"
          description="Interviews scheduled through the candidate pipeline will appear here."
        />
      ) : (
        <div className="space-y-4">
          {interviews.map((iv) => (
            <div
              key={iv.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={
                      iv.status === 'SCHEDULED'
                        ? 'info'
                        : iv.status === 'COMPLETED'
                        ? 'success'
                        : 'danger'
                    }
                  >
                    {iv.status}
                  </Badge>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {iv.interviewType} Round
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {iv.application?.applicant?.fullName} — {iv.application?.job?.title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {iv.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {iv.startTime} - {iv.endTime}
                  </span>
                  <span>Interviewer: {iv.interviewerName}</span>
                </div>

                {iv.notes && (
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                    Notes: {iv.notes}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {iv.meetingLink && (
                  <a
                    href={iv.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <span>Join Call</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {isRecruiter && iv.status === 'SCHEDULED' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(iv.id, 'COMPLETED')}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors"
                      title="Mark as Completed"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(iv.id, 'CANCELLED')}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Cancel Interview"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
