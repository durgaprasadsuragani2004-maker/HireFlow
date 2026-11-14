import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validateBody = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        const summaryMessage = error.errors.map((e) => e.message).join('; ');
        sendError(res, summaryMessage || 'Validation failed', 400, errorMessages);
        return;
      }
      sendError(res, 'Invalid request payload', 400);
    }
  };
};

export const validateQuery = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = (await schema.parseAsync(req.query)) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        const summaryMessage = error.errors.map((e) => e.message).join('; ');
        sendError(res, summaryMessage || 'Query parameter validation failed', 400, errorMessages);
        return;
      }
      sendError(res, 'Invalid query parameters', 400);
    }
  };
};

export const validateParams = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = (await schema.parseAsync(req.params)) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        const summaryMessage = error.errors.map((e) => e.message).join('; ');
        sendError(res, summaryMessage || 'Path parameter validation failed', 400, errorMessages);
        return;
      }
      sendError(res, 'Invalid path parameters', 400);
    }
  };
};
