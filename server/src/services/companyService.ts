import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ROLES, AUDIT_ACTIONS, APPLICATION_STAGES, JOB_STATUS } from '../config/constants';
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

    const totalApplications = await prisma.application.count({
      where: { job: { companyId } },
    });

    return {
      ...company,
      totalApplications,
    };
  }

  async getAllCompanies() {
    const companies = await prisma.company.findMany({
      include: {
        recruiters: {
          include: {
            user: { select: { id: true, email: true, createdAt: true } },
          },
        },
        _count: {
          select: { jobs: true, recruiters: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const counts = await prisma.application.groupBy({
      by: ['jobId'],
      _count: { id: true },
    });

    // Fetch jobs company mapping to aggregate total applications per company
    const jobs = await prisma.job.findMany({
      select: { id: true, companyId: true },
    });
    const jobToCompanyMap = new Map<string, string>();
    for (const j of jobs) {
      jobToCompanyMap.set(j.id, j.companyId);
    }

    const companyAppCounts: Record<string, number> = {};
    for (const c of counts) {
      const compId = jobToCompanyMap.get(c.jobId);
      if (compId) {
        companyAppCounts[compId] = (companyAppCounts[compId] || 0) + c._count.id;
      }
    }

    return companies.map((c) => ({
      ...c,
      totalApplications: companyAppCounts[c.id] || 0,
    }));
  }

  async createCompany(
    data: {
      name: string;
      logo?: string | null;
      description?: string | null;
      website?: string | null;
      industry?: string | null;
      location?: string | null;
      companySize?: string | null;
      contactEmail?: string | null;
      contactPhone?: string | null;
    },
    currentUser: AuthUser
  ) {
    if (currentUser.role !== ROLES.SUPER_ADMIN) {
      throw new AppError('Forbidden: Only Super Admin can create organizations', 403);
    }

    const trimmedName = data.name.trim();

    // Prevent duplicate companies by unique name
    const existing = await prisma.company.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new AppError('A company with this name already exists', 409);
    }

    const company = await prisma.company.create({
      data: {
        name: trimmedName,
        logo: data.logo || null,
        description: data.description || null,
        website: data.website || null,
        industry: data.industry || null,
        location: data.location || null,
        companySize: data.companySize || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
      },
      include: {
        recruiters: true,
        _count: { select: { jobs: true } },
      },
    });

    await auditService.log({
      actorId: currentUser.id,
      action: AUDIT_ACTIONS.COMPANY_CREATE,
      entity: 'Company',
      entityId: company.id,
      metadata: { name: company.name },
    });

    return company;
  }

  async updateCompany(companyId: string, data: any, currentUser: AuthUser) {
    if (currentUser.role === ROLES.APPLICANT) {
      throw new AppError('Forbidden: Applicants cannot modify company profiles', 403);
    }

    if (
      currentUser.role === ROLES.RECRUITER &&
      currentUser.recruiterProfile?.companyId !== companyId
    ) {
      throw new AppError('Forbidden: Cannot modify another company profile', 403);
    }

    const currentCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!currentCompany) {
      throw new AppError('Company not found', 404);
    }

    // Check duplicate name if name is updated
    if (data.name && data.name.trim() !== currentCompany.name) {
      const duplicate = await prisma.company.findFirst({
        where: {
          name: { equals: data.name.trim(), mode: 'insensitive' },
          NOT: { id: companyId },
        },
      });
      if (duplicate) {
        throw new AppError('A company with this name already exists', 409);
      }
    }

    const updatePayload: any = {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.logo !== undefined ? { logo: data.logo || null } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.website !== undefined ? { website: data.website || null } : {}),
      ...(data.industry !== undefined ? { industry: data.industry || null } : {}),
      ...(data.location !== undefined ? { location: data.location || null } : {}),
      ...(data.companySize !== undefined ? { companySize: data.companySize || null } : {}),
      ...(data.contactEmail !== undefined ? { contactEmail: data.contactEmail || null } : {}),
      ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone || null } : {}),
    };

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: updatePayload,
      include: {
        recruiters: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
        _count: { select: { jobs: true } },
      },
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

  async deleteCompany(companyId: string, currentUser: AuthUser) {
    if (currentUser.role !== ROLES.SUPER_ADMIN) {
      throw new AppError('Forbidden: Only administrators can delete companies', 403);
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Preserve historical applications and audit records
    const applicationCount = await prisma.application.count({
      where: { job: { companyId } },
    });

    if (applicationCount > 0) {
      throw new AppError(
        'Cannot delete company with active recruitment history. Historical candidate applications must be preserved.',
        400
      );
    }

    await prisma.company.delete({
      where: { id: companyId },
    });

    await auditService.log({
      actorId: currentUser.id,
      action: AUDIT_ACTIONS.COMPANY_DELETE,
      entity: 'Company',
      entityId: companyId,
      metadata: { name: company.name },
    });

    return { message: `Company "${company.name}" deleted successfully` };
  }

  async getCompanyAnalytics(companyId: string, currentUser: AuthUser) {
    if (currentUser.role === ROLES.APPLICANT) {
      throw new AppError('Forbidden: Applicants cannot access company analytics', 403);
    }

    if (
      currentUser.role === ROLES.RECRUITER &&
      currentUser.recruiterProfile?.companyId !== companyId
    ) {
      throw new AppError('Forbidden: Cannot view analytics for another company', 403);
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        recruiters: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const [totalJobs, activeJobs, totalApplications] = await Promise.all([
      prisma.job.count({ where: { companyId } }),
      prisma.job.count({ where: { companyId, status: JOB_STATUS.PUBLISHED } }),
      prisma.application.count({ where: { job: { companyId } } }),
    ]);

    // Recruitment funnel data strictly scoped to this company's jobs
    const stageCounts = await prisma.application.groupBy({
      by: ['currentStage'],
      where: { job: { companyId } },
      _count: { id: true },
    });

    const funnelStages = [
      APPLICATION_STAGES.APPLIED,
      APPLICATION_STAGES.SCREENING,
      APPLICATION_STAGES.SHORTLISTED,
      APPLICATION_STAGES.INTERVIEW,
      APPLICATION_STAGES.SELECTED,
      APPLICATION_STAGES.REJECTED,
    ];

    const funnel = funnelStages.map((stage) => {
      const match = stageCounts.find((s) => s.currentStage === stage);
      return {
        stage,
        count: match?._count.id || 0,
      };
    });

    return {
      company: {
        id: company.id,
        name: company.name,
        logo: company.logo,
        description: company.description,
        website: company.website,
        industry: company.industry,
        location: company.location,
        companySize: company.companySize,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        createdAt: company.createdAt,
        recruiters: company.recruiters,
      },
      totalJobs,
      activeJobs,
      totalApplications,
      funnel,
    };
  }
}

export const companyService = new CompanyService();
