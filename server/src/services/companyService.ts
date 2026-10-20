import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ROLES, AUDIT_ACTIONS } from '../config/constants';
import { auditService } from './auditService';
import { AuthUser } from '../types';

export class CompanyService {
  async getCompany(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        recruiters: {
          include: {
            user: { select: { id: true, email: true, createdAt: true } },
          },
        },
        _count: {
          select: { jobs: true },
        },
      },
    });

    if (!company) throw new AppError('Company not found', 404);
    return company;
  }

  async getAllCompanies() {
    return prisma.company.findMany({
      include: {
        _count: {
          select: { jobs: true, recruiters: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateCompany(companyId: string, data: any, currentUser: AuthUser) {
    if (
      currentUser.role === ROLES.RECRUITER &&
      currentUser.recruiterProfile?.companyId !== companyId
    ) {
      throw new AppError('Forbidden: Cannot modify another company profile', 403);
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data,
    });

    await auditService.log({
      actorId: currentUser.id,
      action: AUDIT_ACTIONS.COMPANY_UPDATE,
      entity: 'Company',
      entityId: companyId,
      metadata: data,
    });

    return updated;
  }
}

export const companyService = new CompanyService();
