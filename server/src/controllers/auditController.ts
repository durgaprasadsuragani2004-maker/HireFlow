import { Response, NextFunction } from 'express';
import { auditService } from '../services/auditService';
import { sendSuccess } from '../utils/response';
import { RequestWithUser } from '../types';

export class AuditController {
  async getLogs(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await auditService.getLogs({
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        entity: req.query.entity as string,
        action: req.query.action as string,
        actorId: req.query.actorId as string,
      });
      sendSuccess(res, logs);
    } catch (err) {
      next(err);
    }
  }
}

export const auditController = new AuditController();
