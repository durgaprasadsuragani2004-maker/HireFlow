'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthContext';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../providers/ToastContext';
import {
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  User,
  Building,
} from 'lucide-react';

export default function InterviewsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [interviews, setInterviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('upcoming');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('interviewType', typeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/interviews?${params.toString()}`);
      if (res.data.success) {
        if (Array.isArray(res.data.data)) {
          setInterviews(res.data.data);
          setTotal(res.data.data.length);
        } else if (res.data.data?.interviews) {
          setInterviews(res.data.data.interviews);
          setTotal(res.data.data.total ?? res.data.data.interviews.length);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch interviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [page, limit, statusFilter, typeFilter, sortBy, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchInterviews();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

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
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AuthGuard>
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Scheduled Interviews
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Technical assessments, behavioral evaluations, and hiring committee meetings.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by candidate name, email, job title, or interviewer..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">All Types</option>
                <option value="TECHNICAL">Technical</option>
                <option value="HR">HR Screen</option>
                <option value="MANAGERIAL">Managerial</option>
                <option value="BEHAVIORAL">Behavioral</option>
                <option value="FINAL">Final Round</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="upcoming">Upcoming First</option>
                <option value="latest">Latest First</option>
              </select>
            </div>
          </div>

          {/* Optional Date Range Filter */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              title="From date"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              title="To date"
            />
            {(startDate || endDate || search || statusFilter || typeFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setTypeFilter('');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="text-xs text-blue-600 hover:underline ml-2"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Interviews List */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : interviews.length === 0 ? (
          <EmptyState
            title="No Interviews Found"
            description={
              search || statusFilter || typeFilter || startDate || endDate
                ? 'No interviews match your active search and filter criteria.'
                : 'Interviews scheduled through the recruitment pipeline will appear here.'
            }
          />
        ) : (
          <div className="space-y-4">
            {interviews.map((iv) => (
              <div
                key={iv.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
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
                      {iv.interviewType} Assessment
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {iv.application?.applicant?.fullName} — {iv.application?.job?.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {iv.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {iv.startTime} - {iv.endTime}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Interviewer: {iv.interviewerName}
                    </span>
                    {iv.application?.job?.company?.name && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Building className="w-3.5 h-3.5" />
                        {iv.application.job.company.name}
                      </span>
                    )}
                  </div>

                  {iv.notes && (
                    <p className="text-xs text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <strong>Notes:</strong> {iv.notes}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {iv.meetingLink && (
                    <a
                      href={iv.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <span>Join Meeting</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {isRecruiter && iv.status === 'SCHEDULED' && (
                    <div className="flex items-center gap-1">
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
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-slate-500">
                <div>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} interviews
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="p-1.5 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="p-1.5 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
