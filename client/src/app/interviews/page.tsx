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
  Building2,
  X,
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

  const isRecruiter =
    user?.role === 'RECRUITER' || user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY';
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AuthGuard>
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1)]">
                <Calendar className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-[#202033] tracking-tight">
                Scheduled Interviews
              </h1>
            </div>
            <p className="text-xs text-[#68677D] mt-1 ml-11.5">
              Technical assessments, behavioral evaluations, and hiring committee meetings.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="skeuo-card p-4 space-y-3 rounded-2xl">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#9E9EB3]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by candidate name, email, job title, or interviewer..."
                className="skeuo-input w-full pl-10 pr-8 py-2.5 text-xs placeholder:text-[#9E9EB3]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 p-0.5 text-[#9E9EB3] hover:text-[#68677D]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="skeuo-input px-3 py-2 text-xs font-semibold"
              >
                <option value="" className="bg-[#101726]">All Statuses</option>
                <option value="SCHEDULED" className="bg-[#101726]">Scheduled</option>
                <option value="COMPLETED" className="bg-[#101726]">Completed</option>
                <option value="CANCELLED" className="bg-[#101726]">Cancelled</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="skeuo-input px-3 py-2 text-xs font-semibold"
              >
                <option value="" className="bg-[#101726]">All Types</option>
                <option value="TECHNICAL" className="bg-[#101726]">Technical</option>
                <option value="HR" className="bg-[#101726]">HR Screen</option>
                <option value="MANAGERIAL" className="bg-[#101726]">Managerial</option>
                <option value="BEHAVIORAL" className="bg-[#101726]">Behavioral</option>
                <option value="FINAL" className="bg-[#101726]">Final Round</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="skeuo-input px-3 py-2 text-xs font-semibold"
              >
                <option value="upcoming" className="bg-[#101726]">Upcoming First</option>
                <option value="latest" className="bg-[#101726]">Latest First</option>
              </select>
            </div>
          </div>

          {/* Optional Date Range Filter */}
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-[#E4E3EF]/70 text-xs text-[#68677D]">
            <span className="font-semibold text-[#202033]">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="skeuo-input px-2.5 py-1 text-xs"
              title="From date"
            />
            <span className="text-[#9E9EB3]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="skeuo-input px-2.5 py-1 text-xs"
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
                className="text-xs text-indigo-400 font-bold hover:underline ml-2"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Interviews List */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
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
                className="skeuo-card-interactive p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        iv.status === 'SCHEDULED'
                          ? 'primary'
                          : iv.status === 'COMPLETED'
                          ? 'success'
                          : 'danger'
                      }
                    >
                      {iv.status}
                    </Badge>
                    <span className="text-xs font-bold text-indigo-400">
                      {iv.interviewType} Assessment
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#202033] truncate">
                    {iv.application?.applicant?.fullName} — {iv.application?.job?.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#68677D]">
                    <span className="flex items-center gap-1 font-semibold text-[#202033]">
                      <Calendar className="w-3.5 h-3.5 text-[#9E9EB3]" />
                      <span>{iv.date}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#9E9EB3]" />
                      <span>{iv.startTime} - {iv.endTime}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#9E9EB3]" />
                      <span>Interviewer: {iv.interviewerName}</span>
                    </span>
                    {iv.application?.job?.company?.name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#68677D]" />
                        <span>{iv.application.job.company.name}</span>
                      </span>
                    )}
                  </div>

                  {iv.notes && (
                    <p className="text-xs text-[#68677D] mt-2 bg-[#F8F8FC] p-3 rounded-xl border border-[#E4E3EF] leading-relaxed">
                      <strong className="text-[#202033]">Briefing Notes:</strong> {iv.notes}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                  {iv.meetingLink && (
                    <a
                      href={iv.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="neu-btn-primary px-4 py-2 text-xs font-bold text-white rounded-xl shadow-neu-raised flex items-center gap-1.5"
                    >
                      <span>Join Meeting</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {isRecruiter && iv.status === 'SCHEDULED' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateStatus(iv.id, 'COMPLETED')}
                        className="p-2 text-emerald-400 hover:text-emerald-300 bg-[#101726] border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.4)] active:translate-y-[1px] transition-all"
                        title="Mark as Completed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(iv.id, 'CANCELLED')}
                        className="p-2 text-rose-400 hover:text-rose-300 bg-[#101726] border border-rose-500/30 hover:border-rose-500/50 rounded-xl shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.4)] active:translate-y-[1px] transition-all"
                        title="Cancel Interview"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-xs text-[#68677D] border-t border-[#E4E3EF]/80">
                <div>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} interviews
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="p-1.5 rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-1 font-semibold text-[#202033]">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="p-1.5 rounded-xl"
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
