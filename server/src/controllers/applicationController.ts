import { Response, NextFunction } from 'express';
import { applicationService } from '../services/applicationService';
import { sendSuccess, sendPaginated } from '../utils/response';
import { RequestWithUser } from '../types';

export class ApplicationController {
  async applyJob(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const application = await applicationService.applyJob(
        String(req.params.jobId),
        req.user!,
        req.body
      );
      sendSuccess(res, application, 'Application submitted successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async changeStage(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await applicationService.changeStage(
        String(req.params.id),
        req.body.stage,
        req.user!,
        req.body.reason
      );
      sendSuccess(res, updated, `Candidate moved to ${req.body.stage}`);
    } catch (err) {
      next(err);
    }
  }

  async getKanban(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const kanban = await applicationService.getKanbanApplications(
        String(req.params.jobId),
        req.user!
      );
      sendSuccess(res, kanban);
    } catch (err) {
      next(err);
    }
  }

  async getApplicationById(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const application = await applicationService.getApplicationById(
        String(req.params.id),
        req.user!
      );
      sendSuccess(res, application);
    } catch (err) {
      next(err);
    }
  }

  async getStageHistory(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await applicationService.getStageHistory(
        String(req.params.id),
        req.user!
      );
      sendSuccess(res, history);
    } catch (err) {
      next(err);
    }
  }

  async updateNotes(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await applicationService.updateNotes(
        String(req.params.id),
        req.body,
        req.user!
      );
      sendSuccess(res, updated, 'Candidate notes updated');
    } catch (err) {
      next(err);
    }
  }

  async getMyApplications(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await applicationService.getMyApplications(req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async queryApplications(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const { applications, total, page, limit } = await applicationService.queryApplications({
        jobId: req.query.jobId as string,
        stage: req.query.stage as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        currentUser: req.user!,
      });
      sendPaginated(res, applications, total, page, limit);
    } catch (err) {
      next(err);
    }
  }
}

export const applicationController = new ApplicationController();
