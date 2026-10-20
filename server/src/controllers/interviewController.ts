import { Response, NextFunction } from 'express';
import { interviewService } from '../services/interviewService';
import { sendSuccess } from '../utils/response';
import { RequestWithUser } from '../types';

export class InterviewController {
  async scheduleInterview(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const interview = await interviewService.scheduleInterview(req.body, req.user!);
      sendSuccess(res, interview, 'Interview scheduled successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getInterviews(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const interviews = await interviewService.getInterviews(req.user!, {
        status: req.query.status as string,
        date: req.query.date as string,
      });
      sendSuccess(res, interviews);
    } catch (err) {
      next(err);
    }
  }

  async getInterviewById(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const interview = await interviewService.getInterviewById(
        String(req.params.id),
        req.user!
      );
      sendSuccess(res, interview);
    } catch (err) {
      next(err);
    }
  }

  async updateInterview(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await interviewService.updateInterview(
        String(req.params.id),
        req.body,
        req.user!
      );
      sendSuccess(res, updated, 'Interview updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteInterview(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await interviewService.deleteInterview(
        String(req.params.id),
        req.user!
      );
      sendSuccess(res, result, 'Interview deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const interviewController = new InterviewController();
