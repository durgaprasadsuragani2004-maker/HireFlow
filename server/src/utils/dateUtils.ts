/**
 * Date normalization and boundary utilities for HireFlow job deadlines and scheduling.
 */

/**
 * Normalizes a deadline value so that date-only entries (e.g. "2026-10-30" or "2026-10-30T00:00:00.000Z")
 * represent the full day through 23:59:59.999 UTC.
 * This guarantees that a job closing on the 30th does not expire prematurely during the 30th.
 */
export function normalizeJobDeadline(deadlineInput?: string | Date | null): Date | null {
  if (!deadlineInput) return null;

  if (typeof deadlineInput === 'string') {
    const trimmed = deadlineInput.trim();
    if (!trimmed) return null;

    // Date-only input: "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const d = new Date(`${trimmed}T23:59:59.999Z`);
      return isNaN(d.getTime()) ? null : d;
    }

    // ISO string with UTC midnight: "YYYY-MM-DDT00:00:00..."
    const isoMidnightMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.000)?(?:Z|[+-]00:00)?$/);
    if (isoMidnightMatch) {
      const d = new Date(`${isoMidnightMatch[1]}T23:59:59.999Z`);
      return isNaN(d.getTime()) ? null : d;
    }

    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return null;

    // If UTC time components are all zeros, treat as date-only deadline
    if (
      parsed.getUTCHours() === 0 &&
      parsed.getUTCMinutes() === 0 &&
      parsed.getUTCSeconds() === 0 &&
      parsed.getUTCMilliseconds() === 0
    ) {
      parsed.setUTCHours(23, 59, 59, 999);
    }
    return parsed;
  }

  if (deadlineInput instanceof Date) {
    if (isNaN(deadlineInput.getTime())) return null;
    const copy = new Date(deadlineInput.getTime());
    if (
      copy.getUTCHours() === 0 &&
      copy.getUTCMinutes() === 0 &&
      copy.getUTCSeconds() === 0 &&
      copy.getUTCMilliseconds() === 0
    ) {
      copy.setUTCHours(23, 59, 59, 999);
    }
    return copy;
  }

  return null;
}

/**
 * Checks whether a job deadline has genuinely expired against a reference date (defaults to now).
 * Gracefully handles legacy dates stored at midnight UTC by extending to end of that calendar day.
 */
export function isJobExpired(deadline?: string | Date | null, referenceDate = new Date()): boolean {
  if (!deadline) return false;

  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(d.getTime())) return false;

  const refTime = referenceDate.getTime();

  // If time is 00:00:00.000 UTC, treat boundary as end-of-day
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
 * Validates an application deadline for job creation and editing.
 * Rejects past dates, invalid strings, or malformed calendar entries.
 * Permits today's date through end-of-day UTC.
 */
export function validateJobDeadline(deadlineInput?: string | Date | null): {
  valid: boolean;
  error?: string;
  normalized?: Date | null;
} {
  if (deadlineInput === undefined || deadlineInput === null || deadlineInput === '') {
    return { valid: true, normalized: null };
  }

  let d: Date;
  if (typeof deadlineInput === 'string') {
    const trimmed = deadlineInput.trim();
    if (!trimmed) {
      return { valid: true, normalized: null };
    }
    d = new Date(trimmed);
    if (isNaN(d.getTime())) {
      return { valid: false, error: 'Invalid application deadline date format.' };
    }
    // Check if it's a date-only string like YYYY-MM-DD
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOnlyRegex.test(trimmed)) {
      const [yearStr, monthStr, dayStr] = trimmed.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);
      if (m < 1 || m > 12 || day < 1 || day > 31) {
        return { valid: false, error: 'Invalid application deadline date format.' };
      }
      const checkDate = new Date(Date.UTC(y, m - 1, day));
      if (
        checkDate.getUTCFullYear() !== y ||
        checkDate.getUTCMonth() !== m - 1 ||
        checkDate.getUTCDate() !== day
      ) {
        return { valid: false, error: 'Invalid application deadline date format.' };
      }
    }
  } else if (deadlineInput instanceof Date) {
    if (isNaN(deadlineInput.getTime())) {
      return { valid: false, error: 'Invalid application deadline date format.' };
    }
    d = deadlineInput;
  } else {
    return { valid: false, error: 'Invalid application deadline date format.' };
  }

  const normalized = normalizeJobDeadline(deadlineInput);
  if (!normalized) {
    return { valid: false, error: 'Invalid application deadline date format.' };
  }

  // Compare with current moment
  const now = new Date();

  // If normalized deadline is in the past, reject
  if (normalized.getTime() < now.getTime()) {
    return { valid: false, error: 'Application deadline cannot be in the past.' };
  }

  return { valid: true, normalized };
}

