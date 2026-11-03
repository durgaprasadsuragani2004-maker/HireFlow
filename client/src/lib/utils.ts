import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount?: number | null, currency = 'USD'): string {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getStageColor(stage: string): { bg: string; text: string; border: string; dot: string } {
  switch (stage) {
    case 'APPLIED':
      return {
        bg: 'bg-sky-500/15',
        text: 'text-sky-300',
        border: 'border-sky-500/30',
        dot: 'bg-sky-400',
      };
    case 'SCREENING':
      return {
        bg: 'bg-violet-500/15',
        text: 'text-violet-300',
        border: 'border-violet-500/30',
        dot: 'bg-violet-400',
      };
    case 'SHORTLISTED':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-300',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'INTERVIEW':
      return {
        bg: 'bg-indigo-500/15',
        text: 'text-indigo-300',
        border: 'border-indigo-500/30',
        dot: 'bg-indigo-400',
      };
    case 'SELECTED':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'REJECTED':
      return {
        bg: 'bg-rose-500/15',
        text: 'text-rose-300',
        border: 'border-rose-500/30',
        dot: 'bg-rose-400',
      };
    default:
      return {
        bg: 'bg-slate-800/80',
        text: 'text-slate-300',
        border: 'border-slate-700',
        dot: 'bg-slate-400',
      };
  }
}

export interface NormalizedJobStatus {
  isOpen: boolean;
  isExpired: boolean;
  isClosed: boolean;
  isDraft: boolean;
  isInvalid: boolean;
  rawStatus: string;
  label: string;
  badgeVariant: 'default' | 'success' | 'danger' | 'warning' | 'outline' | 'info' | 'primary' | 'purple';
  description: string;
}

/**
 * Checks whether a job deadline has passed.
 * Date-only strings or midnight UTC timestamps are treated as lasting until the end of that day (23:59:59.999 UTC)
 * to avoid prematurely marking jobs expired before their deadline has ended.
 */
export function isJobExpired(deadline?: string | Date | null, referenceDate = new Date()): boolean {
  if (!deadline) return false;

  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(d.getTime())) return false;

  const refTime = referenceDate.getTime();

  // If time components are all zero (e.g. UTC midnight "YYYY-MM-DDT00:00:00.000Z"),
  // treat expiration boundary as 23:59:59.999 UTC on that day.
  if (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  ) {
    const endOfDay = new Date(d);
    endOfDay.setUTCHours(23, 59, 59, 999);
    return refTime > endOfDay.getTime();
  }

  return refTime > d.getTime();
}

/**
 * Normalizes job status across all views (job cards, details, dropdowns, and Kanban pipelines).
 * Differentiates cleanly between:
 * - Active (PUBLISHED and not expired)
 * - Expired (deadline has passed)
 * - Closed / Archived (explicitly closed)
 * - Draft (unpublished)
 * - Unknown / Missing (logs warning, does NOT falsely show closed/expired)
 */
export function normalizeJobStatus(job?: {
  status?: string | null;
  deadline?: string | Date | null;
} | null): NormalizedJobStatus {
  if (!job || typeof job !== 'object') {
    return {
      isOpen: false,
      isExpired: false,
      isClosed: false,
      isDraft: false,
      isInvalid: true,
      rawStatus: '',
      label: 'Unknown',
      badgeVariant: 'outline',
      description: 'Job record not loaded',
    };
  }

  const rawStatus = (job.status ?? '').toString().toUpperCase().trim();
  const expired = isJobExpired(job.deadline);

  // Missing or undefined status
  if (!rawStatus || rawStatus === 'UNDEFINED') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[HireFlow] Job status is missing or undefined:', job);
    }
    return {
      isOpen: false,
      isExpired: false,
      isClosed: false,
      isDraft: false,
      isInvalid: true,
      rawStatus: '',
      label: 'Status Pending',
      badgeVariant: 'warning',
      description: 'Position status is pending verification',
    };
  }

  if (rawStatus === 'ARCHIVED' || rawStatus === 'CLOSED') {
    return {
      isOpen: false,
      isExpired: false,
      isClosed: true,
      isDraft: false,
      isInvalid: false,
      rawStatus,
      label: 'Closed',
      badgeVariant: 'danger',
      description: 'This position has been explicitly closed and archived',
    };
  }

  if (rawStatus === 'DRAFT') {
    return {
      isOpen: false,
      isExpired: false,
      isClosed: false,
      isDraft: true,
      isInvalid: false,
      rawStatus,
      label: 'Draft',
      badgeVariant: 'outline',
      description: 'This position is an unpublished draft',
    };
  }

  if (rawStatus === 'PUBLISHED') {
    if (expired) {
      return {
        isOpen: false,
        isExpired: true,
        isClosed: false,
        isDraft: false,
        isInvalid: false,
        rawStatus,
        label: 'Expired',
        badgeVariant: 'danger',
        description: 'The application deadline for this position has passed',
      };
    }
    return {
      isOpen: true,
      isExpired: false,
      isClosed: false,
      isDraft: false,
      isInvalid: false,
      rawStatus,
      label: 'Active',
      badgeVariant: 'success',
      description: 'This position is published and actively receiving applications',
    };
  }

  // Unrecognized status fallback
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[HireFlow] Unrecognized job status encountered:', rawStatus, job);
  }
  return {
    isOpen: false,
    isExpired: false,
    isClosed: false,
    isDraft: false,
    isInvalid: true,
    rawStatus,
    label: rawStatus,
    badgeVariant: 'outline',
    description: `Position status: ${rawStatus}`,
  };
}

