import { Request, Response, NextFunction } from 'express';
import { jobService } from '../services/jobService';
import { sendSuccess, sendPaginated } from '../utils/response';
import { RequestWithUser } from '../types';
import { JOB_STATUS } from '../config/constants';

export class JobController {
  async createJob(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await jobService.createJob(req.user!, req.body);
      sendSuccess(res, job, 'Job created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getJobById(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await jobService.getJobById(String(req.params.id), req.user);
      sendSuccess(res, job);
    } catch (err) {
      next(err);
    }
  }

  async queryJobs(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobs, total, page, limit } = await jobService.queryJobs({
        ...req.query,
        currentUser: req.user,
      });
      sendPaginated(res, jobs, total, page, limit);
    } catch (err) {
      next(err);
    }
  }

  async updateJob(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await jobService.updateJob(String(req.params.id), req.user!, req.body);
      sendSuccess(res, updated, 'Job updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async publishJob(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await jobService.setPublishStatus(String(req.params.id), JOB_STATUS.PUBLISHED, req.user!);
      sendSuccess(res, updated, 'Job published successfully');
    } catch (err) {
      next(err);
    }
  }

  async unpublishJob(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await jobService.setPublishStatus(String(req.params.id), JOB_STATUS.DRAFT, req.user!);
      sendSuccess(res, updated, 'Job unpublished (moved to draft)');
    } catch (err) {
      next(err);
    }
  }

  async deleteJob(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await jobService.deleteJob(String(req.params.id), req.user!);
      sendSuccess(res, result, 'Job deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const jobController = new JobController();
