import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { JOB_STATUS, ROLES, AUDIT_ACTIONS } from '../config/constants';
import { auditService } from './auditService';
import { AuthUser } from '../types';

export class JobService {
  async createJob(
    recruiterUser: AuthUser,
    data: {
      title: string;
      description: string;
      requirements: string;
      responsibilities: string;
      skills: string;
      location: string;
      employmentType: string;
      experienceLevel: string;
      salaryMin?: number;
      salaryMax?: number;
      salaryCurrency?: string;
      deadline?: string;
      status?: string;
    }
  ) {
    if (!recruiterUser.recruiterProfile) {
      throw new AppError('Recruiter profile not found', 403);
    }

    const companyId = recruiterUser.recruiterProfile.companyId;
    const recruiterId = recruiterUser.recruiterProfile.id;

    const job = await prisma.job.create({
      data: {
        companyId,
        recruiterId,
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        skills: data.skills,
        location: data.location,
        employmentType: data.employmentType as any,
        experienceLevel: data.experienceLevel as any,
        salaryMin: data.salaryMin || null,
        salaryMax: data.salaryMax || null,
        salaryCurrency: data.salaryCurrency || 'USD',
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: (data.status || JOB_STATUS.PUBLISHED) as any,
      },
      include: {
        company: true,
      },
    });

    await auditService.log({
      actorId: recruiterUser.id,
      action: AUDIT_ACTIONS.JOB_CREATE,
      entity: 'Job',
      entityId: job.id,
      metadata: { title: job.title, companyId },
    });

    return job;
  }

  async updateJob(jobId: string, currentUser: AuthUser, data: any) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { recruiter: true },
    });

    if (!job) throw new AppError('Job not found', 404);

    // Enforce recruiter company isolation
    if (
      currentUser.role === ROLES.RECRUITER &&
      job.companyId !== currentUser.recruiterProfile?.companyId
    ) {
      throw new AppError('Forbidden: Cannot modify jobs belonging to another company', 403);
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        title: data.title ?? job.title,
        description: data.description ?? job.description,
        requirements: data.requirements ?? job.requirements,
        responsibilities: data.responsibilities ?? job.responsibilities,
        skills: data.skills ?? job.skills,
        location: data.location ?? job.location,
        employmentType: data.employmentType ?? job.employmentType,
        experienceLevel: data.experienceLevel ?? job.experienceLevel,
        salaryMin: data.salaryMin !== undefined ? data.salaryMin : job.salaryMin,
        salaryMax: data.salaryMax !== undefined ? data.salaryMax : job.salaryMax,
        salaryCurrency: data.salaryCurrency ?? job.salaryCurrency,
        deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : job.deadline,
        status: data.status ?? job.status,
      },
      include: { company: true },
    });

    await auditService.log({
      actorId: currentUser.id,
      action: AUDIT_ACTIONS.JOB_UPDATE,
      entity: 'Job',
      entityId: jobId,
      metadata: { title: updated.title },
    });

    return updated;
  }

  async setPublishStatus(jobId: string, status: string, currentUser: AuthUser) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new AppError('Job not found', 404);

    if (
      currentUser.role === ROLES.RECRUITER &&
      job.companyId !== currentUser.recruiterProfile?.companyId
    ) {
      throw new AppError('Forbidden: Cannot modify jobs belonging to another company', 403);
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status: status as any },
      include: { company: true },
    });

    await auditService.log({
      actorId: currentUser.id,
      action: status === JOB_STATUS.PUBLISHED ? AUDIT_ACTIONS.JOB_PUBLISH : AUDIT_ACTIONS.JOB_UNPUBLISH,
      entity: 'Job',
      entityId: jobId,
      metadata: { newStatus: status },
    });

    return updated;
  }

  async deleteJob(jobId: string, currentUser: AuthUser) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new AppError('Job not found', 404);

    if (
      currentUser.role === ROLES.RECRUITER &&
      job.companyId !== currentUser.recruiterProfile?.companyId
    ) {
      throw new AppError('Forbidden: Cannot delete jobs belonging to another company', 403);
    }

    await prisma.job.delete({ where: { id: jobId } });

    await auditService.log({
      actorId: currentUser.id,
      action: AUDIT_ACTIONS.JOB_DELETE,
      entity: 'Job',
      entityId: jobId,
      metadata: { title: job.title },
    });

    return { message: 'Job deleted successfully' };
  }

  async getJobById(jobId: string, currentUser?: AuthUser) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        recruiter: {
          select: {
            id: true,
            title: true,
            department: true,
            user: { select: { email: true } },
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) throw new AppError('Job not found', 404);

    // If job is draft/archived, only company recruiter or super admin can see it
    if (job.status !== JOB_STATUS.PUBLISHED) {
      if (!currentUser) throw new AppError('Job not found', 404);
      if (
        currentUser.role !== ROLES.SUPER_ADMIN &&
        (currentUser.role !== ROLES.RECRUITER ||
          currentUser.recruiterProfile?.companyId !== job.companyId)
      ) {
        throw new AppError('Job not found', 404);
      }
    }

    // Check if current applicant has already applied
    let hasApplied = false;
    let applicationInfo = null;

    if (currentUser?.role === ROLES.APPLICANT && currentUser.applicantProfile) {
      const existingApp = await prisma.application.findUnique({
        where: {
          jobId_applicantId: {
            jobId: job.id,
            applicantId: currentUser.applicantProfile.id,
          },
        },
        select: {
          id: true,
          currentStage: true,
          appliedAt: true,
        },
      });
      if (existingApp) {
        hasApplied = true;
        applicationInfo = existingApp;
      }
    }

    return {
      ...job,
      hasApplied,
      applicationInfo,
    };
  }

  async queryJobs(params: {
    search?: string;
    location?: string;
    employmentType?: string;
    experienceLevel?: string;
    status?: string;
    companyId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    currentUser?: AuthUser;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based visibility
    if (!params.currentUser || params.currentUser.role === ROLES.APPLICANT) {
      where.status = JOB_STATUS.PUBLISHED;
    } else if (params.currentUser.role === ROLES.RECRUITER) {
      // Recruiter sees their company's jobs by default, or filtered
      where.companyId = params.currentUser.recruiterProfile?.companyId;
      if (params.status) {
        where.status = params.status;
      }
    } else if (params.currentUser.role === ROLES.SUPER_ADMIN) {
      if (params.status) where.status = params.status;
      if (params.companyId) where.companyId = params.companyId;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search } },
        { skills: { contains: params.search } },
        { description: { contains: params.search } },
      ];
    }

    if (params.location) {
      where.location = { contains: params.location };
    }
    if (params.employmentType) {
      where.employmentType = params.employmentType;
    }
    if (params.experienceLevel) {
      where.experienceLevel = params.experienceLevel;
    }

    const orderBy: any = {};
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          company: true,
          _count: {
            select: { applications: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total, page, limit };
  }
}

export const jobService = new JobService();
