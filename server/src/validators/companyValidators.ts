import { z } from 'zod';

export const createCompanySchema = z
  .object({
    name: z.string().min(2, 'Company name must be at least 2 characters').trim(),
    logo: z.string().url().optional().or(z.literal('')).nullable(),
    description: z.string().max(2000).optional().nullable(),
    website: z.string().url().optional().or(z.literal('')).nullable(),
    industry: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    companySize: z.string().optional().nullable(),
    contactEmail: z.string().email().optional().or(z.literal('')).nullable(),
    contactPhone: z.string().optional().nullable(),
    adminEmail: z.string().email('Please provide a valid company account email').optional().or(z.literal('')).nullable(),
    adminPassword: z.string().min(6, 'Company account password must be at least 6 characters').optional().or(z.literal('')).nullable(),
  })
  .refine(
    (data) => {
      const hasEmail = Boolean(data.adminEmail && data.adminEmail.trim());
      const hasPassword = Boolean(data.adminPassword && data.adminPassword.trim());
      if (hasEmail && !hasPassword) return false;
      if (hasPassword && !hasEmail) return false;
      return true;
    },
    {
      message: 'Both company account login email and initial password are required to provision an account',
      path: ['adminPassword'],
    }
  );

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

