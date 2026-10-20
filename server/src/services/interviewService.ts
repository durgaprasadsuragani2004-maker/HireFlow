import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  ROLES,
  INTERVIEW_STATUSES,
  NOTIFICATION_TYPES,
  AUDIT_ACTIONS,
  APPLICATION_STAGES,
} from '../config/constants';
import { notificationService } from './notificationService';
import { auditService } from './auditService';
import { AuthUser } from '../types';

export class InterviewService {
  async scheduleInterview(
    data: {
      applicationId: string;
      interviewerName: string;
      interviewerEmail: string;
      date: string;
      startTime: string;
      endTime: string;
      interviewType: string;
      meetingLink?: string;
      location?: string;
      notes?: string;
    },
    currentUser: AuthUser
  ) {
    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: {
        job: { include: { company: true } },
        applicant: { include: { user: true } },
      },
    });

    if (!application) throw new AppError('Application not found', 404);

    if (
      currentUser.role === ROLES.RECRUITER &&
      application.job.companyId !== currentUser.recruiterProfile?.companyId
    ) {
      throw new AppError('Forbidden: Cannot schedule interviews for another company', 403);
    }

    // Check for obvious interviewer scheduling conflicts
    const conflict = await prisma.interview.findFirst({
      where: {
        interviewerEmail: data.interviewerEmail,
        date: data.date,
        status: INTERVIEW_STATUSES.SCHEDULED,
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: data.startTime } },
              { endTime: { lte: data.endTime } },
            ],
          },
        ],
      },
    });

    if (conflict) {
      throw new AppError(
        `Interviewer ${data.interviewerName} already has an interview scheduled on ${data.date} between ${conflict.startTime} and ${conflict.endTime}`,
        409
      );
    }

    const interview = await prisma.$transaction(async (tx) => {
      const created = await tx.interview.create({
        data: {
          applicationId: data.applicationId,
          scheduledById: currentUser.id,
          interviewerName: data.interviewerName,
          interviewerEmail: data.interviewerEmail,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          interviewType: data.interviewType as any,
          meetingLink: data.meetingLink || null,
          location: data.location || null,
          notes: data.notes || null,
          status: INTERVIEW_STATUSES.SCHEDULED,
        },
      });

      // Auto-transition stage to INTERVIEW if currently in earlier stage
      if (
        application.currentStage === APPLICATION_STAGES.APPLIED ||
        application.currentStage === APPLICATION_STAGES.SCREENING ||
        application.currentStage === APPLICATION_STAGES.SHORTLISTED
      ) {
        await tx.application.update({
          where: { id: data.applicationId },
          data: { currentStage: APPLICATION_STAGES.INTERVIEW },
        });

        await tx.applicationStageHistory.create({
          data: {
            applicationId: data.applicationId,
            previousStage: application.currentStage,
            newStage: APPLICATION_STAGES.INTERVIEW,
            changedById: currentUser.id,
            reason: `Interview scheduled (${data.interviewType})`,
          },
        });
      }

      return created;
    });

    // Notify candidate
    await notificationService.notify({
      userId: application.applicant.userId,
      type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
      title: 'Interview Scheduled! 📅',
      message: `Your ${data.interviewType} interview for "${application.job.title}" is scheduled for ${data.date} at ${data.startTime}.`,
      metadata: {
        interviewId: interview.id,
        applicationId: application.id,
        meetingLink: data.meetingLink,
      },
    });

    await auditService.log({
      actorId: currentUser.id,
      action: AUDIT_ACTIONS.INTERVIEW_SCHEDULE,
      entity: 'Interview',
      entityId: interview.id,
      metadata: { date: data.date, time: data.startTime, type: data.interviewType },
    });

    return interview;
  }

  async getInterviews(currentUser: AuthUser, params: { status?: string; date?: string }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.date) where.date = params.date;

    if (currentUser.role === ROLES.APPLICANT) {
      where.application = {
        applicant: { userId: currentUser.id },
      };
    } else if (currentUser.role === ROLES.RECRUITER) {
      where.application = {
        job: { companyId: currentUser.recruiterProfile?.companyId },
      };
    }

    return prisma.interview.findMany({
      where,
      include: {
        application: {
          include: {
            job: {
              select: { id: true, title: true, company: { select: { id: true, name: true } } },
            },
            applicant: {
              select: { id: true, fullName: true, headline: true },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getInterviewById(interviewId: string, currentUser: AuthUser) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: {
              select: { id: true, title: true, companyId: true, company: { select: { id: true, name: true } } },
            },
            applicant: {
              select: { id: true, userId: true, fullName: true, headline: true },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (currentUser.role === ROLES.APPLICANT) {
      if (interview.application.applicant.userId !== currentUser.id) {
        throw new AppError('Forbidden: Cannot access this interview', 403);
      }
    } else if (currentUser.role === ROLES.RECRUITER) {
      if (interview.application.job.companyId !== currentUser.recruiterProfile?.companyId) {
        throw new AppError('Forbidden: Cannot access interview for another company', 403);
      }
    }

    return interview;
  }

  async updateInterview(
    interviewId: string,
    data: any,
    currentUser: AuthUser
  ) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: true,
            applicant: true,
          },
        },
      },
    });

    if (!interview) throw new AppError('Interview not found', 404);

    if (
      currentUser.role === ROLES.RECRUITER &&
      interview.application.job.companyId !== currentUser.recruiterProfile?.companyId
    ) {
      throw new AppError('Forbidden: Cannot update interview for another company', 403);
    }

    const targetDate = data.date ?? interview.date;
    const targetStartTime = data.startTime ?? interview.startTime;
    const targetEndTime = data.endTime ?? interview.endTime;

    if (targetStartTime >= targetEndTime) {
      throw new AppError('Start time must be strictly before end time', 400);
    }

    // If date or time changed, check for conflict with other interviews
    if ((data.date || data.startTime || data.endTime) && (data.status !== INTERVIEW_STATUSES.CANCELLED)) {
      const conflict = await prisma.interview.findFirst({
        where: {
          id: { not: interviewId },
          interviewerEmail: interview.interviewerEmail,
          date: targetDate,
          status: INTERVIEW_STATUSES.SCHEDULED,
          OR: [
            {
              AND: [
                { startTime: { lte: targetStartTime } },
                { endTime: { gt: targetStartTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: targetEndTime } },
                { endTime: { gte: targetEndTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: targetStartTime } },
                { endTime: { lte: targetEndTime } },
              ],
            },
          ],
        },
      });

      if (conflict) {
        throw new AppError(
          `Interviewer ${interview.interviewerName} already has an interview scheduled on ${targetDate} between ${conflict.startTime} and ${conflict.endTime}`,
          409
        );
      }
    }

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: data.status ?? interview.status,
        date: data.date ?? interview.date,
        startTime: data.startTime ?? interview.startTime,
        endTime: data.endTime ?? interview.endTime,
        meetingLink: data.meetingLink !== undefined ? data.meetingLink : interview.meetingLink,
        location: data.location !== undefined ? data.location : interview.location,
        notes: data.notes !== undefined ? data.notes : interview.notes,
        feedback: data.feedback !== undefined ? data.feedback : interview.feedback,
      },
    });

    if (data.status && data.status !== interview.status) {
      await notificationService.notify({
        userId: interview.application.applicant.userId,
        type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
        title: `Interview ${data.status}`,
        message: `Your interview for "${interview.application.job.title}" has been updated to: ${data.status}.`,
        metadata: { interviewId },
      });
    }

    await auditService.log({
      actorId: currentUser.id,
      action: AUDIT_ACTIONS.INTERVIEW_UPDATE,
      entity: 'Interview',
      entityId: interviewId,
      metadata: data,
    });

    return updated;
  }

  async deleteInterview(interviewId: string, currentUser: AuthUser) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: true,
            applicant: true,
          },
        },
      },
    });

    if (!interview) throw new AppError('Interview not found', 404);

    if (
      currentUser.role === ROLES.RECRUITER &&
      interview.application.job.companyId !== currentUser.recruiterProfile?.companyId
    ) {
      throw new AppError('Forbidden: Cannot delete interview for another company', 403);
    }

    await prisma.interview.delete({
      where: { id: interviewId },
    });

    await auditService.log({
      actorId: currentUser.id,
      action: 'INTERVIEW_DELETE',
      entity: 'Interview',
      entityId: interviewId,
      metadata: { deletedById: currentUser.id },
    });

    return { message: 'Interview deleted successfully' };
  }
}

export const interviewService = new InterviewService();
