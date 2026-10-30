import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ROLES, AUDIT_ACTIONS, JOB_STATUS } from '../config/constants';
import { auditService } from './auditService';
import { AuthUser } from '../types';
import { validateJobDeadline, normalizeJobDeadline, isJobExpired } from '../utils/dateUtils';

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
    // Validate deadline format and calendar date
    if (data.deadline) {
      const deadlineValidation = validateJobDeadline(data.deadline);
      if (!deadlineValidation.valid) {
        throw new AppError(deadlineValidation.error || 'Application deadline cannot be in the past.', 400);
      }
    }

    let companyId: string;
    let recruiterId: string;
    const targetStatus = data.status || JOB_STATUS.PUBLISHED;

    if (currentUser.role === ROLES.SUPER_ADMIN) {
      if (!data.companyId) {
        throw new AppError('Super Admin must select an organization for this job posting', 400);
      }

      const company = await prisma.company.findUnique({
        where: { id: data.companyId },
        include: { recruiters: { include: { user: true } } },
      });
      if (!company) {
        throw new AppError('Selected company not found', 404);
      }
      companyId = company.id;

      const activeRecruiters = (company.recruiters || []).filter(
        (r) => r.user && r.user.status === 'ACTIVE'
      );

      if (data.recruiterId) {
        const recruiter = activeRecruiters.find((r) => r.id === data.recruiterId);
        if (!recruiter) {
          throw new AppError('The assigned recruiter does not belong to the selected company', 400);
        }
        recruiterId = recruiter.id;
      } else if (activeRecruiters.length > 0) {
        recruiterId = activeRecruiters[0].id;
      } else {
        if (targetStatus === JOB_STATUS.PUBLISHED) {
          throw new AppError('HR/Recruiter required — this company has no eligible HR accounts.', 400);
        }
        throw new AppError('HR/Recruiter required — this company has no eligible HR accounts.', 400);
      }
    } else if (currentUser.role === ROLES.COMPANY) {
      const targetCompanyId = currentUser.companyId;
      if (!targetCompanyId) {
        throw new AppError('No organization associated with this company account', 403);
      }
      companyId = targetCompanyId;

      if (data.companyId && data.companyId !== companyId) {
        throw new AppError('Forbidden: Cannot create job postings for another company', 403);
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { recruiters: { include: { user: true } } },
      });
      const activeRecruiters = (company?.recruiters || []).filter(
        (r) => r.user && r.user.status === 'ACTIVE'
      );

      if (data.recruiterId) {
        const recruiter = activeRecruiters.find((r) => r.id === data.recruiterId);
        if (!recruiter) {
          throw new AppError('The assigned recruiter does not belong to your company', 400);
        }
        recruiterId = recruiter.id;
      } else if (activeRecruiters.length > 0) {
        recruiterId = activeRecruiters[0].id;
      } else {
        if (targetStatus === JOB_STATUS.PUBLISHED) {
          throw new AppError('HR/Recruiter required — this company has no eligible HR accounts.', 400);
        }
        throw new AppError('HR/Recruiter required — this company has no eligible HR accounts.', 400);
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
        salaryMin: data.salaryMin !== undefined ? data.salaryMin : null,
        salaryMax: data.salaryMax !== undefined ? data.salaryMax : null,
        salaryCurrency: data.salaryCurrency || 'USD',
        deadline: data.deadline ? normalizeJobDeadline(data.deadline) : null,
        status: (data.status || JOB_STATUS.PUBLISHED) as any,
      },
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

    // Enforce company isolation
    if (currentUser.role === ROLES.COMPANY) {
      if (job.companyId !== currentUser.companyId) {
        throw new AppError('Forbidden: Cannot modify jobs belonging to another company', 403);
      }
      if (data.companyId && data.companyId !== currentUser.companyId) {
        throw new AppError('Forbidden: Cannot reassign jobs to another company', 403);
      }
    } else if (currentUser.role === ROLES.RECRUITER) {
      if (job.companyId !== currentUser.recruiterProfile?.companyId) {
        throw new AppError('Forbidden: Cannot modify jobs belonging to another company', 403);
      }
      if (data.companyId && data.companyId !== currentUser.recruiterProfile?.companyId) {
        throw new AppError('Forbidden: Cannot reassign jobs to another company', 403);
      }
      if (data.recruiterId && data.recruiterId !== currentUser.recruiterProfile?.id) {
        throw new AppError('Forbidden: Cannot reassign jobs to another recruiter', 403);
      }
    }

    // Validate deadline format and calendar date if provided
    if (data.deadline !== undefined && data.deadline !== null) {
      const deadlineValidation = validateJobDeadline(data.deadline);
      if (!deadlineValidation.valid) {
        throw new AppError(deadlineValidation.error || 'Application deadline cannot be in the past.', 400);
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

    const targetStatus = data.status ?? job.status;
    const targetDeadline =
      data.deadline !== undefined
        ? data.deadline
          ? normalizeJobDeadline(data.deadline)
          : null
        : job.deadline;

    if (targetStatus === JOB_STATUS.PUBLISHED && targetDeadline && targetDeadline.getTime() < Date.now()) {
      throw new AppError(
        'Cannot publish or open a job with an expired deadline. Please update the deadline to a future date or remove the deadline.',
        400
      );
    }

    // Validate company and recruiter re-assignment
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
        } else if (targetStatus === JOB_STATUS.PUBLISHED) {
          throw new AppError('HR/Recruiter required — this company has no eligible HR accounts.', 400);
        }
      } else if (data.recruiterId && data.recruiterId !== job.recruiterId) {
        const rec = await prisma.recruiterProfile.findUnique({ where: { id: data.recruiterId } });
        if (!rec || rec.companyId !== job.companyId) {
          throw new AppError('Assigned recruiter does not belong to the job’s company', 400);
        }
        newRecruiterId = rec.id;
      }
    } else if (currentUser.role === ROLES.COMPANY) {
      if (data.recruiterId) {
        const rec = await prisma.recruiterProfile.findUnique({ where: { id: data.recruiterId } });
        if (!rec || rec.companyId !== job.companyId) {
          throw new AppError('The assigned recruiter does not belong to your company', 400);
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
        deadline: data.deadline !== undefined ? normalizeJobDeadline(data.deadline) : job.deadline,
        status: data.status ?? job.status,
      },
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
      },
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
      (currentUser.role === ROLES.RECRUITER && (job.companyId !== currentUser.recruiterProfile?.companyId || job.recruiterId !== currentUser.recruiterProfile?.id)) ||
      (currentUser.role === ROLES.COMPANY && job.companyId !== currentUser.companyId)
    ) {
      throw new AppError('Forbidden: Cannot modify jobs belonging to another company or recruiter', 403);
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
      (currentUser.role === ROLES.RECRUITER && (job.companyId !== currentUser.recruiterProfile?.companyId || job.recruiterId !== currentUser.recruiterProfile?.id)) ||
      (currentUser.role === ROLES.COMPANY && job.companyId !== currentUser.companyId)
    ) {
      throw new AppError('Forbidden: Cannot delete jobs belonging to another company or recruiter', 403);
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

    // Enforce strict multi-tenant access control:
    // COMPANY can see ONLY their own company's jobs
    if (currentUser?.role === ROLES.COMPANY) {
      if (job.companyId !== currentUser.companyId) {
        throw new AppError('Job not found', 404);
      }
    } else if (currentUser?.role === ROLES.RECRUITER) {
      const recCompanyId = currentUser.recruiterProfile?.companyId || currentUser.companyId;
      if (job.companyId !== recCompanyId) {
        throw new AppError('Job not found', 404);
      }
      if (currentUser.recruiterProfile?.id && job.recruiterId && job.recruiterId !== currentUser.recruiterProfile.id) {
        throw new AppError('Job not found', 404);
      }
    } else if (!currentUser || currentUser.role === ROLES.APPLICANT) {
      if (job.status !== JOB_STATUS.PUBLISHED) {
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
    } else if (params.currentUser.role === ROLES.COMPANY) {
      const targetCompanyId = params.currentUser.companyId;
      if (!targetCompanyId) {
        throw new AppError('No organization associated with this company account', 403);
      }
      andConditions.push({ companyId: targetCompanyId });
      if (params.status) {
        andConditions.push({ status: params.status });
      }
    } else if (params.currentUser.role === ROLES.RECRUITER) {
      const recruiterCompanyId = params.currentUser.recruiterProfile?.companyId || params.currentUser.companyId;
      if (!recruiterCompanyId) {
        throw new AppError('No organization associated with this recruiter account', 403);
      }
      andConditions.push({ companyId: recruiterCompanyId });

      const recruiterId = params.currentUser.recruiterProfile?.id;
      if (recruiterId) {
        andConditions.push({ recruiterId });
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
          { title: { contains: params.search } },
          { skills: { contains: params.search } },
          { description: { contains: params.search } },
          { company: { name: { contains: params.search } } },
        ],
      });
    }

    if (params.location) {
      andConditions.push({ location: { contains: params.location } });
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
      if (profile) applicantProfileId = profile.id;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    // Check application status for applicants
    let appliedJobIds = new Set<string>();
    let applicantAppsByJobId = new Map<string, any>();
    if (applicantProfileId) {
      const userApplications = await prisma.application.findMany({
        where: {
          applicantId: applicantProfileId,
          jobId: { in: jobs.map((j) => j.id) },
        },
        select: {
          id: true,
          jobId: true,
          currentStage: true,
          appliedAt: true,
        },
      });
      userApplications.forEach((a) => {
        appliedJobIds.add(a.jobId);
        applicantAppsByJobId.set(a.jobId, a);
      });
    }

    const enrichedJobs = jobs.map((job) => ({
      ...job,
      hasApplied: appliedJobIds.has(job.id),
      applicationInfo: applicantAppsByJobId.get(job.id) || null,
    }));

    return {
      jobs: enrichedJobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const jobService = new JobService();

