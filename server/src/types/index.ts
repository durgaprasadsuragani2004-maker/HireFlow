import { Request } from 'express';
import { RoleType, UserStatusType } from '../config/constants';

export interface AuthUser {
  id: string;
  email: string;
  role: RoleType;
  status: UserStatusType;
  companyId?: string | null;
  company?: any;
  recruiterProfile?: {
    id: string;
    companyId: string;
    title?: string | null;
    department?: string | null;
  } | null;
  applicantProfile?: {
    id: string;
    fullName: string;
  } | null;
}

export interface RequestWithUser extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
