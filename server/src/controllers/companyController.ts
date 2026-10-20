import { Response, NextFunction } from 'express';
import { companyService } from '../services/companyService';
import { sendSuccess } from '../utils/response';
import { RequestWithUser } from '../types';
import { ROLES } from '../config/constants';

export class CompanyController {
  async getCompany(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.params.id ? String(req.params.id) : req.user?.recruiterProfile?.companyId;
      if (!companyId) {
        if (req.user?.role === ROLES.SUPER_ADMIN) {
          const companies = await companyService.getAllCompanies();
          sendSuccess(res, companies);
          return;
        }
        sendSuccess(res, null, 'No company associated with this account');
        return;
      }
      const company = await companyService.getCompany(companyId);
      sendSuccess(res, company);
    } catch (err) {
      next(err);
    }
  }

  async getAllCompanies(_req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const companies = await companyService.getAllCompanies();
      sendSuccess(res, companies);
    } catch (err) {
      next(err);
    }
  }

  async updateCompany(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.params.id ? String(req.params.id) : req.user?.recruiterProfile?.companyId;
      if (!companyId) {
        sendSuccess(res, null, 'Company ID is required to update details', 400);
        return;
      }
      const updated = await companyService.updateCompany(companyId, req.body, req.user!);
      sendSuccess(res, updated, 'Company details updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const companyController = new CompanyController();
