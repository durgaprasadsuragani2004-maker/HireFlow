import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  APPLICATION_STAGES,
  ApplicationStageType,
  ROLES,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
} from '../config/constants';
import { auditService } from './auditService';
import { notificationService } from './notificationService';
import { AuthUser } from '../types';

export class ApplicationService {
  async applyJob(
    jobId: string,
    applicantUser: AuthUser,
    data: { coverLetter?: string }
  ) {
    if (applicantUser.role !== ROLES.APPLICANT) {
      throw new AppError('Only registered applicants can apply for jobs', 403);
    }

    let applicantProfile = await prisma.applicantProfile.findUnique({
      where: { userId: applicantUser.id },
    });

    if (!applicantProfile) {
      applicantProfile = await prisma.applicantProfile.create({
        data: {
          userId: applicantUser.id,
          fullName: 'Applicant',
        },
      });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        recruiter: {
          include: { user: true },
        },
      },
    });

    if (!job || job.status !== 'PUBLISHED') {
      throw new AppError('This job is no longer accepting applications', 404);
    }

    // Check application deadline
    if (job.deadline && new Date() > new Date(job.deadline)) {
      throw new AppError('The application deadline for this position has passed', 400);
    }

    // Check for duplicate application
    const existing = await prisma.application.findUnique({
      where: {
        jobId_applicantId: {
          jobId,
          applicantId: applicantProfile.id,
        },
      },
    });

    if (existing) {
      throw new AppError('You have already submitted an application for this position', 409);
    }

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          jobId,
          applicantId: applicantProfile!.id,
          currentStage: APPLICATION_STAGES.APPLIED,
          coverLetter: data.coverLetter || null,
        },
        include: {
          job: {
            include: { company: true },
          },
          applicant: true,
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId: app.id,
          previousStage: null,
          newStage: APPLICATION_STAGES.APPLIED,
          changedById: applicantUser.id,
          reason: 'Application submitted by candidate',
        },
      });

      return app;
    });

    // Notify applicant
    await notificationService.notify({
      userId: applicantUser.id,
      type: NOTIFICATION_TYPES.APPLICATION_STATUS,
      title: 'Application Received!',
      message: `Your application for "${job.title}" at ${job.company.name} has been received.`,
      metadata: { applicationId: application.id, jobId: job.id },
    });

    // Notify recruiter
    if (job.recruiter?.user) {
      await notificationService.notify({
        userId: job.recruiter.user.id,
        type: NOTIFICATION_TYPES.NEW_APPLICATION,
        title: 'New Candidate Applied',
        message: `${applicantProfile.fullName} applied for ${job.title}.`,
        metadata: { applicationId: application.id, jobId: job.id },
      });
    }

    await auditService.log({
      actorId: applicantUser.id,
      action: AUDIT_ACTIONS.APPLICATION_CREATE,
      entity: 'Application',
      entityId: application.id,
      metadata: { jobId, jobTitle: job.title },
    });

    return application;
  }

  async changeStage(
    applicationId: string,
    newStage: ApplicationStageType,
    changedByUser: AuthUser,
    reason?: string
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: { company: true },
        },
        applicant: {
          include: { user: true },
        },
      },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Role access check
    if (
      changedByUser.role === ROLES.RECRUITER &&
      application.job.companyId !== changedByUser.recruiterProfile?.companyId
    ) {
      throw new AppError('Forbidden: Cannot modify candidates for another company', 403);
    }

    if (changedByUser.role === ROLES.APPLICANT) {
      throw new AppError('Applicants cannot change recruitment stages', 403);
    }

    const previousStage = application.currentStage;
    if (previousStage === newStage) {
      return application;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: applicationId },
        data: {
          currentStage: newStage,
        },
        include: {
          job: { include: { company: true } },
          applicant: {
            include: { skills: true },
          },
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId,
          previousStage,
          newStage,
          changedById: changedByUser.id,
          reason: reason || `Moved to ${newStage}`,
        },
      });

      return app;
    });

    // Notify applicant of stage transition
    let stageTitle = `Application Status Update: ${newStage}`;
    let stageMessage = `Your application for "${application.job.title}" has been moved to ${newStage}.`;

    if (newStage === APPLICATION_STAGES.SHORTLISTED) {
      stageTitle = 'Congratulations! You have been Shortlisted';
      stageMessage = `Great news! Your profile was shortlisted for "${application.job.title}" at ${application.job.company.name}.`;
    } else if (newStage === APPLICATION_STAGES.INTERVIEW) {
      stageTitle = 'Interview Stage Reached';
      stageMessage = `You've advanced to the interview stage for "${application.job.title}". Watch for scheduling details.`;
    } else if (newStage === APPLICATION_STAGES.SELECTED) {
      stageTitle = 'Offer / Selection Notice 🎉';
      stageMessage = `Congratulations! You have been selected for the "${application.job.title}" role at ${application.job.company.name}.`;
    } else if (newStage === APPLICATION_STAGES.REJECTED) {
      stageTitle = 'Application Status Update';
      stageMessage = `Thank you for your interest in "${application.job.title}". The company has chosen to pursue other candidates at this time.`;
    }

    await notificationService.notify({
      userId: application.applicant.userId,
      type: NOTIFICATION_TYPES.APPLICATION_STATUS,
      title: stageTitle,
      message: stageMessage,
      metadata: { applicationId, newStage, jobId: application.jobId },
    });

    await auditService.log({
      actorId: changedByUser.id,
      action: AUDIT_ACTIONS.APPLICATION_STAGE_CHANGE,
      entity: 'Application',
      entityId: applicationId,
      metadata: { previousStage, newStage, reason },
    });

    return updated;
  }

  async getKanbanApplications(jobId: string, currentUser: AuthUser) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) throw new AppError('Job not found', 404);

    if (
      currentUser.role === ROLES.RECRUITER &&
      job.companyId !== currentUser.recruiterProfile?.companyId
    ) {
      throw new AppError('Forbidden: Cannot view applicants for another company', 403);
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        applicant: {
          include: {
            user: { select: { email: true } },
            skills: true,
          },
        },
        interviews: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        stageHistory: {
          orderBy: { changedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by stages for Kanban
    const stages = [
      APPLICATION_STAGES.APPLIED,
      APPLICATION_STAGES.SCREENING,
      APPLICATION_STAGES.SHORTLISTED,
      APPLICATION_STAGES.INTERVIEW,
      APPLICATION_STAGES.SELECTED,
      APPLICATION_STAGES.REJECTED,
    ];

    const kanbanData: Record<string, any[]> = {};
    for (const stage of stages) {
      kanbanData[stage] = [];
    }

    for (const app of applications) {
      if (kanbanData[app.currentStage]) {
        kanbanData[app.currentStage].push(app);
      } else {
        kanbanData[APPLICATION_STAGES.APPLIED].push(app);
      }
    }

    return {
      job: {
        id: job.id,
        title: job.title,
        location: job.location,
        company: job.company.name,
      },
      kanbanData,
      totalApplications: applications.length,
    };
  }

  async getApplicationById(applicationId: string, currentUser: AuthUser) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: { company: true },
        },
        applicant: {
          include: {
            user: { select: { id: true, email: true } },
            skills: true,
            experience: true,
            education: true,
          },
        },
        stageHistory: {
          include: {
            changedBy: { select: { email: true, role: true } },
          },
          orderBy: { changedAt: 'desc' },
        },
        interviews: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Role verification
    if (currentUser.role === ROLES.APPLICANT) {
      if (application.applicant.userId !== currentUser.id) {
        throw new AppError('Forbidden: Cannot view another applicant’s application', 403);
      }
    } else if (currentUser.role === ROLES.RECRUITER) {
      if (application.job.companyId !== currentUser.recruiterProfile?.companyId) {
        throw new AppError('Forbidden: Cannot view candidate for another company', 403);
      }
    }

    return application;
  }

  async getStageHistory(applicationId: string, currentUser: AuthUser) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        applicant: true,
      },
    });

    if (!application) throw new AppError('Application not found', 404);

    if (currentUser.role === ROLES.APPLICANT && application.applicant.userId !== currentUser.id) {
      throw new AppError('Forbidden: Cannot view another candidate’s application stage history', 403);
    }

    if (
      currentUser.role === ROLES.RECRUITER &&
      application.job.companyId !== currentUser.recruiterProfile?.companyId
    ) {
      throw new AppError('Forbidden: Cannot view application history for another company', 403);
    }

    return prisma.applicationStageHistory.findMany({
      where: { applicationId },
      include: {
        changedBy: { select: { id: true, email: true, role: true } },
      },
      orderBy: { changedAt: 'asc' },
    });
  }

  async updateNotes(
    applicationId: string,
    data: { notes?: string; rating?: number },
    currentUser: AuthUser
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) throw new AppError('Application not found', 404);

    if (
      currentUser.role === ROLES.RECRUITER &&
      application.job.companyId !== currentUser.recruiterProfile?.companyId
    ) {
      throw new AppError('Forbidden: Cannot modify candidates for another company', 403);
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        notes: data.notes !== undefined ? data.notes : application.notes,
        rating: data.rating !== undefined ? data.rating : application.rating,
      },
    });

    await auditService.log({
      actorId: currentUser.id,
      action: AUDIT_ACTIONS.APPLICATION_NOTE_UPDATE,
      entity: 'Application',
      entityId: applicationId,
      metadata: data,
    });

    return updated;
  }

  async getMyApplications(applicantUserId: string) {
    const applicant = await prisma.applicantProfile.findUnique({
      where: { userId: applicantUserId },
    });

    if (!applicant) return { applications: [] };

    const applications = await prisma.application.findMany({
      where: { applicantId: applicant.id },
      include: {
        job: {
          include: { company: true },
        },
        interviews: {
          orderBy: { date: 'asc' },
        },
        stageHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return { applications };
  }

  async queryApplications(params: {
    jobId?: string;
    stage?: string;
    search?: string;
    page?: number;
    limit?: number;
    currentUser: AuthUser;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.currentUser.role === ROLES.RECRUITER) {
      where.job = {
        companyId: params.currentUser.recruiterProfile?.companyId,
      };
    }

    if (params.jobId) {
      where.jobId = params.jobId;
    }
    if (params.stage) {
      where.currentStage = params.stage;
    }
    if (params.search) {
      where.applicant = {
        fullName: { contains: params.search },
      };
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: {
            select: { id: true, title: true, location: true, company: true },
          },
          applicant: {
            include: { skills: true },
          },
          interviews: {
            take: 1,
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return { applications, total, page, limit };
  }
}

export const applicationService = new ApplicationService();
