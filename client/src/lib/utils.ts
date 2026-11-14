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
        bg: 'bg-[#EAE7FF]',
        text: 'text-[#6C5CE7]',
        border: 'border-[#8B7CF6]/35',
        dot: 'bg-[#6C5CE7]',
      };
    case 'SCREENING':
      return {
        bg: 'bg-[#EAE7FF]',
        text: 'text-[#5B4BD8]',
        border: 'border-[#8B7CF6]/35',
        dot: 'bg-[#8B7CF6]',
      };
    case 'SHORTLISTED':
      return {
        bg: 'bg-[#E9A23B]/12',
        text: 'text-[#C47D15]',
        border: 'border-[#E9A23B]/35',
        dot: 'bg-[#E9A23B]',
      };
    case 'INTERVIEW':
      return {
        bg: 'bg-[#EAE7FF]',
        text: 'text-[#6C5CE7]',
        border: 'border-[#8B7CF6]/35',
        dot: 'bg-[#6C5CE7]',
      };
    case 'SELECTED':
      return {
        bg: 'bg-[#16A878]/12',
        text: 'text-[#16A878]',
        border: 'border-[#16A878]/35',
        dot: 'bg-[#16A878]',
      };
    case 'REJECTED':
      return {
        bg: 'bg-[#E05260]/12',
        text: 'text-[#E05260]',
        border: 'border-[#E05260]/35',
        dot: 'bg-[#E05260]',
      };
    default:
      return {
        bg: 'bg-[#F0F1F8]',
        text: 'text-[#68677D]',
        border: 'border-[#E4E3EF]',
        dot: 'bg-[#9E9EB3]',
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

/**
 * Orders jobs according to the 5-tier requirement:
 * (1) Active published with upcoming deadlines (earliest deadline first)
 * (2) Active published without deadlines (newest createdAt first)
 * (3) Drafts (newest createdAt first)
 * (4) Expired jobs at the bottom (most recently expired first)
 * (5) Archived / closed jobs at the very bottom
 */
export function sortJobsByActiveAndDeadline(jobs: any[]): any[] {
  if (!Array.isArray(jobs)) return [];

  return [...jobs].sort((a, b) => {
    const statusA = normalizeJobStatus(a);
    const statusB = normalizeJobStatus(b);

    const getTier = (job: any, status: NormalizedJobStatus): number => {
      if (status.isClosed || status.rawStatus === 'ARCHIVED') return 5;
      if (status.isExpired) return 4;
      if (status.isDraft) return 3;
      if (status.isOpen && !job.deadline) return 2;
      if (status.isOpen && job.deadline) return 1;
      return 3;
    };

    const tierA = getTier(a, statusA);
    const tierB = getTier(b, statusB);

    if (tierA !== tierB) {
      return tierA - tierB;
    }

    // Within Tier 1 (Upcoming deadlines): earliest deadline first
    if (tierA === 1) {
      const timeA = a.deadline ? new Date(a.deadline).getTime() : 0;
      const timeB = b.deadline ? new Date(b.deadline).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
    }

    // Within Tier 4 (Expired jobs): most recently expired first
    if (tierA === 4) {
      const timeA = a.deadline ? new Date(a.deadline).getTime() : 0;
      const timeB = b.deadline ? new Date(b.deadline).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
    }

    // Default: newest createdAt first
    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return createdB - createdA;
  });
}


