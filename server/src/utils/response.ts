import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): Response => {
  const totalPages = Math.ceil(total / limit) || 1;
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
  return res.status(200).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: any[]
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
};
