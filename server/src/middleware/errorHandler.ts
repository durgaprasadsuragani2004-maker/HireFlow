import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode = 400, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // AppError instance (known domain/operational error)
  if (err instanceof AppError) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`Operational Error (${err.statusCode}): ${err.message}`);
    }
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Multer error
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'File size exceeds maximum allowed limit of 5MB', 400);
      return;
    }
    sendError(res, `File upload error: ${err.message}`, 400);
    return;
  }

  // Prisma Unique Constraint error
  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    sendError(res, `A record with this ${target} already exists`, 409);
    return;
  }

  // Prisma Record Not Found
  if (err.code === 'P2025') {
    sendError(res, 'Requested resource was not found', 404);
    return;
  }

  // Only log genuinely unhandled / internal server errors
  logger.error('Unhandled Application Error:', err);

  // Default server error
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal server error';

  sendError(res, message, 500);
};
