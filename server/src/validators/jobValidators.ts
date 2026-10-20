import { z } from 'zod';
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, JOB_STATUS } from '../config/constants';

const jobBaseSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters').trim(),
  description: z.string().min(20, 'Job description must be at least 20 characters').trim(),
  requirements: z.string().min(10, 'Requirements must be provided').trim(),
  responsibilities: z.string().min(10, 'Responsibilities must be provided').trim(),
  skills: z.string().min(2, 'At least one skill is required').trim(),
  location: z.string().min(2, 'Location is required (e.g. Remote, New York, NY)').trim(),
  employmentType: z.enum([
    EMPLOYMENT_TYPES.FULL_TIME,
    EMPLOYMENT_TYPES.PART_TIME,
    EMPLOYMENT_TYPES.CONTRACT,
    EMPLOYMENT_TYPES.INTERNSHIP,
  ]),
  experienceLevel: z.enum([
    EXPERIENCE_LEVELS.ENTRY_LEVEL,
    EXPERIENCE_LEVELS.MID_LEVEL,
    EXPERIENCE_LEVELS.SENIOR,
    EXPERIENCE_LEVELS.LEAD,
    EXPERIENCE_LEVELS.EXECUTIVE,
  ]),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  salaryCurrency: z.string().default('USD'),
  deadline: z.string().optional(),
  status: z.enum([JOB_STATUS.DRAFT, JOB_STATUS.PUBLISHED, JOB_STATUS.ARCHIVED]).optional(),
});

export const createJobSchema = jobBaseSchema.refine(
  (data) => {
    if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
      return false;
    }
    return true;
  },
  {
    message: 'Minimum salary cannot exceed maximum salary',
    path: ['salaryMin'],
  }
);

export const updateJobSchema = jobBaseSchema.partial();

export const queryJobsSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  experienceLevel: z.string().optional(),
  status: z.string().optional(),
  companyId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['createdAt', 'title', 'salaryMax', 'deadline']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
