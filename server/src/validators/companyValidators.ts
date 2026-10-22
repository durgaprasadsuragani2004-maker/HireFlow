import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').trim(),
  logo: z.string().url().optional().or(z.literal('')).nullable(),
  description: z.string().max(2000).optional().nullable(),
  website: z.string().url().optional().or(z.literal('')).nullable(),
  industry: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  companySize: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal('')).nullable(),
  contactPhone: z.string().optional().nullable(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').trim().optional(),
  logo: z.string().url().optional().or(z.literal('')).nullable(),
  description: z.string().max(2000).optional().nullable(),
  website: z.string().url().optional().or(z.literal('')).nullable(),
  industry: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  companySize: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal('')).nullable(),
  contactPhone: z.string().optional().nullable(),
});
