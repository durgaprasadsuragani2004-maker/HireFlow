import { z } from 'zod';
import { APPLICATION_STAGES } from '../config/constants';

export const applyJobSchema = z.object({
  coverLetter: z.string().max(3000, 'Cover letter cannot exceed 3000 characters').optional(),
});

export const changeStageSchema = z.object({
  stage: z.enum([
    APPLICATION_STAGES.APPLIED,
    APPLICATION_STAGES.SCREENING,
    APPLICATION_STAGES.SHORTLISTED,
    APPLICATION_STAGES.INTERVIEW,
    APPLICATION_STAGES.SELECTED,
    APPLICATION_STAGES.REJECTED,
  ]),
  reason: z.string().max(500).optional(),
});

export const updateNotesSchema = z.object({
  notes: z.string().max(5000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const queryApplicationsSchema = z.object({
  jobId: z.string().optional(),
  stage: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['appliedAt', 'updatedAt', 'rating']).default('appliedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
