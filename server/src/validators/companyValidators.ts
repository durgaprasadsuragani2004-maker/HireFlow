import { z } from 'zod';

export const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  logo: z.string().url().optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  location: z.string().optional(),
  companySize: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});
