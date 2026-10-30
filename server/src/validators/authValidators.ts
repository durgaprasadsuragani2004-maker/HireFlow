import { z } from 'zod';
import { ROLES, USER_STATUS } from '../config/constants';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum([ROLES.APPLICANT, ROLES.RECRUITER], {
    errorMap: () => ({ message: 'Role must be either APPLICANT or RECRUITER' }),
  }),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  companyName: z.string().min(2, 'Company name is required for recruiters').optional(),
  title: z.string().optional(),
}).refine(
  (data) => {
    if (data.role === ROLES.APPLICANT && !data.fullName) {
      return false;
    }
    if (data.role === ROLES.RECRUITER && !data.companyName) {
      return false;
    }
    return true;
  },
  {
    message: 'Required fields missing for specified role (fullName for applicant, companyName for recruiter)',
    path: ['role'],
  }
);

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateMeSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  title: z.string().optional(),
  department: z.string().optional(),
});

export const adminCreateUserSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([ROLES.SUPER_ADMIN, ROLES.COMPANY, ROLES.RECRUITER, ROLES.APPLICANT], {
    errorMap: () => ({ message: 'Role must be SUPER_ADMIN, COMPANY, RECRUITER, or APPLICANT' }),
  }),
  status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED]).optional(),
  fullName: z.string().optional(),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  title: z.string().optional(),
  recruiterProfile: z
    .object({
      title: z.string().optional(),
      department: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

export const adminUpdateUserSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum([ROLES.SUPER_ADMIN, ROLES.COMPANY, ROLES.RECRUITER, ROLES.APPLICANT]).optional(),
  status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED]).optional(),
  fullName: z.string().optional(),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  title: z.string().optional(),
  recruiterProfile: z
    .object({
      title: z.string().optional(),
      department: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const provisionCompanyAccountSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  companyId: z.string().optional(),
});

