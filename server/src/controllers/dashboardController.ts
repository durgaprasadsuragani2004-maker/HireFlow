import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService';
import { sendSuccess } from '../utils/response';
import { RequestWithUser } from '../types';

export class DashboardController {
  async getAdminDashboard(_req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardService.getAdminDashboard();
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }

  async getRecruiterDashboard(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardService.getRecruiterDashboard(req.user!);
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }

  async getApplicantDashboard(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardService.getApplicantDashboard(req.user!.id);
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
