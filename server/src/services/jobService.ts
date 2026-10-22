import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { JOB_STATUS, ROLES, AUDIT_ACTIONS } from '../config/constants';
import { auditService } from './auditService';
import { AuthUser } from '../types';

export class JobService {
  async createJob(
    currentUser: AuthUser,
    data: {
      title: string;
      description: string;
      requirements: string;
      responsibilities: string;
      skills: string;
      location: string;
      employmentType: string;
      experienceLevel: string;
      salaryMin?: number | null;
      salaryMax?: number | null;
      salaryCurrency?: string;
      deadline?: string | null;
      status?: string;
      companyId?: string;
      recruiterId?: string;
    }
  ) {
    let companyId: string;
    let recruiterId: string;

    if (currentUser.role === ROLES.SUPER_ADMIN) {
      if (data.companyId) {
        const company = await prisma.company.findUnique({
          where: { id: data.companyId },
          include: { recruiters: true },
        });
        if (!company) {
          throw new AppError('Selected company not found', 404);
        }
        companyId = company.id;

        if (data.recruiterId) {
          const recruiter = await prisma.recruiterProfile.findUnique({
            where: { id: data.recruiterId },
          });
          if (!recruiter || recruiter.companyId !== company.id) {
            throw new AppError('The assigned recruiter does not belong to the selected company', 400);
          }
          recruiterId = recruiter.id;
        } else if (company.recruiters && company.recruiters.length > 0) {
          recruiterId = company.recruiters[0].id;
        } else {
          throw new AppError('The selected company has no recruiter assigned. Please assign or create a recruiter for this company first.', 400);
        }
      } else {
        // Fallback: Super Admin did not select a company, assign to first available company with a recruiter
        const firstCompanyWithRecruiter = await prisma.company.findFirst({
          where: { recruiters: { some: {} } },
          include: { recruiters: true },
        });
        if (!firstCompanyWithRecruiter || firstCompanyWithRecruiter.recruiters.length === 0) {
          throw new AppError('No company with an active recruiter found. Please specify an authorized company.', 400);
        }
        companyId = firstCompanyWithRecruiter.id;
        recruiterId = firstCompanyWithRecruiter.recruiters[0].id;
      }
    } else if (currentUser.role === ROLES.RECRUITER) {
      let profile = currentUser.recruiterProfile;
      if (!profile) {
        profile = await prisma.recruiterProfile.findUnique({
          where: { userId: currentUser.id },
        });
      }

      if (!profile) {
        throw new AppError('Recruiter profile not found. Please ensure your account has a linked company profile.', 403);
      }

      companyId = profile.companyId;
      recruiterId = profile.id;

      // Ensure a recruiter cannot create a job for another company or recruiter
      if (data.companyId && data.companyId !== companyId) {
        throw new AppError('Forbidden: Cannot create job postings for another company', 403);
      }
      if (data.recruiterId && data.recruiterId !== recruiterId) {
        throw new AppError('Forbidden: Cannot assign job postings to another recruiter', 403);
      }
    } else {
      throw new AppError('Forbidden: Only recruiters and administrators can create jobs', 403);
    }

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
      actorId: currentUser.id,
      action: AUDIT_ACTIONS.JOB_CREATE,
      entity: 'Job',
      entityId: job.id,
      metadata: { title: job.title, companyId, recruiterId },
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

    if (currentUser.role === ROLES.RECRUITER) {
      if (data.companyId && data.companyId !== currentUser.recruiterProfile?.companyId) {
        throw new AppError('Forbidden: Cannot reassign jobs to another company', 403);
      }
      if (data.recruiterId && data.recruiterId !== currentUser.recruiterProfile?.id) {
        throw new AppError('Forbidden: Cannot reassign jobs to another recruiter', 403);
      }
    }

    // Validate salary constraints
    const effectiveSalaryMin = data.salaryMin !== undefined ? data.salaryMin : job.salaryMin;
    const effectiveSalaryMax = data.salaryMax !== undefined ? data.salaryMax : job.salaryMax;
    if (
      effectiveSalaryMin !== null &&
      effectiveSalaryMin !== undefined &&
      effectiveSalaryMax !== null &&
      effectiveSalaryMax !== undefined &&
      Number(effectiveSalaryMin) > Number(effectiveSalaryMax)
    ) {
      throw new AppError('Minimum salary cannot exceed maximum salary', 400);
    }

    // Respect closed/expired job rules: prevent unintended reopening or publication
    const targetStatus = data.status ?? job.status;
    const targetDeadline =
      data.deadline !== undefined
        ? data.deadline
          ? new Date(data.deadline)
          : null
        : job.deadline;

    if (targetStatus === JOB_STATUS.PUBLISHED && targetDeadline && targetDeadline < new Date()) {
      throw new AppError(
        'Cannot publish or open a job with an expired deadline. Please update the deadline to a future date or remove the deadline.',
        400
      );
    }

    // Validate company and recruiter re-assignment for Super Admin
    let newCompanyId = job.companyId;
    let newRecruiterId = job.recruiterId;

    if (currentUser.role === ROLES.SUPER_ADMIN) {
      if (data.companyId && data.companyId !== job.companyId) {
        const comp = await prisma.company.findUnique({
          where: { id: data.companyId },
          include: { recruiters: true },
        });
        if (!comp) throw new AppError('Specified company not found', 404);
        newCompanyId = comp.id;
        if (data.recruiterId) {
          const rec = await prisma.recruiterProfile.findUnique({ where: { id: data.recruiterId } });
          if (!rec || rec.companyId !== comp.id) {
            throw new AppError('Assigned recruiter does not belong to the selected company', 400);
          }
          newRecruiterId = rec.id;
        } else if (comp.recruiters.length > 0) {
          newRecruiterId = comp.recruiters[0].id;
        }
      } else if (data.recruiterId && data.recruiterId !== job.recruiterId) {
        const rec = await prisma.recruiterProfile.findUnique({ where: { id: data.recruiterId } });
        if (!rec || rec.companyId !== job.companyId) {
          throw new AppError('Assigned recruiter does not belong to the job’s company', 400);
        }
        newRecruiterId = rec.id;
      }
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        companyId: newCompanyId,
        recruiterId: newRecruiterId,
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

    const andConditions: any[] = [];

    // Role-based visibility
    if (!params.currentUser || params.currentUser.role === ROLES.APPLICANT) {
      andConditions.push({ status: JOB_STATUS.PUBLISHED });
      // Filter out expired jobs for applicants and public
      const now = new Date();
      andConditions.push({
        OR: [
          { deadline: null },
          { deadline: { gte: now } },
        ],
      });
      if (params.companyId) {
        andConditions.push({ companyId: params.companyId });
      }
    } else if (params.currentUser.role === ROLES.RECRUITER) {
      // Recruiter sees their company's jobs by default, or filtered
      const recruiterCompanyId = params.currentUser.recruiterProfile?.companyId;
      if (recruiterCompanyId) {
        andConditions.push({ companyId: recruiterCompanyId });
      }
      if (params.status) {
        andConditions.push({ status: params.status });
      }
    } else if (params.currentUser.role === ROLES.SUPER_ADMIN) {
      if (params.status) andConditions.push({ status: params.status });
      if (params.companyId) andConditions.push({ companyId: params.companyId });
    }

    if (params.search) {
      andConditions.push({
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { skills: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
          { company: { name: { contains: params.search, mode: 'insensitive' } } },
        ],
      });
    }

    if (params.location) {
      andConditions.push({ location: { contains: params.location, mode: 'insensitive' } });
    }
    if (params.employmentType) {
      andConditions.push({ employmentType: params.employmentType });
    }
    if (params.experienceLevel) {
      andConditions.push({ experienceLevel: params.experienceLevel });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const orderBy: any = {};
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    let applicantProfileId = params.currentUser?.applicantProfile?.id;
    if (!applicantProfileId && params.currentUser?.role === ROLES.APPLICANT) {
      const profile = await prisma.applicantProfile.findUnique({
        where: { userId: params.currentUser.id },
        select: { id: true },
      });
      applicantProfileId = profile?.id;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          company: true,
          _count: {
            select: { applications: true },
          },
          ...(applicantProfileId
            ? {
                applications: {
                  where: { applicantId: applicantProfileId },
                  select: {
                    id: true,
                    currentStage: true,
                    appliedAt: true,
                  },
                },
              }
            : {}),
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    const mappedJobs = jobs.map((job: any) => {
      const applicantApp = job.applications && job.applications.length > 0 ? job.applications[0] : null;
      return {
        ...job,
        hasApplied: Boolean(applicantApp),
        applicationInfo: applicantApp || null,
        applications: undefined,
      };
    });

    return { jobs: mappedJobs, total, page, limit };
  }
}

export const jobService = new JobService();
