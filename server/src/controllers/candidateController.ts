import path from 'path';
import { Response, NextFunction } from 'express';
import { candidateService } from '../services/candidateService';
import { sendSuccess, sendPaginated } from '../utils/response';
import { RequestWithUser } from '../types';
import { AppError } from '../middleware/errorHandler';

export class CandidateController {
  async getCandidateProfile(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await candidateService.getCandidateProfile(
        String(req.params.id),
        req.user!
      );
      sendSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  }

  async uploadResume(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('Resume document file is required', 400);
      }
      const result = await candidateService.uploadResume(req.user!.id, req.file);
      sendSuccess(res, result, 'Resume uploaded successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateSkills(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const skills = await candidateService.updateSkills(req.user!.id, req.body.skills);
      sendSuccess(res, skills, 'Skills updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async queryCandidates(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const { candidates, total, page, limit } = await candidateService.queryCandidates({
        search: req.query.search as string,
        skill: req.query.skill as string,
        stage: req.query.stage as string,
        jobId: req.query.jobId as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        currentUser: req.user!,
      });
      sendPaginated(res, candidates, total, page, limit);
    } catch (err) {
      next(err);
    }
  }

  async downloadResume(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileName = String(req.params.filename);
      const { filePath, signedUrl, originalName } = await candidateService.getResumeFilePath(
        fileName,
        req.user!
      );
      if (signedUrl) {
        res.redirect(signedUrl);
        return;
      }
      if (filePath) {
        const absolutePath = path.resolve(filePath);
        if (req.query.view === 'inline' || req.query.disposition === 'inline') {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
          res.sendFile(absolutePath);
          return;
        }
        res.download(absolutePath, originalName);
        return;
      }
      sendSuccess(res, null, 'Resume record verified', 200);
    } catch (err) {
      next(err);
    }
  }
}

export const candidateController = new CandidateController();
