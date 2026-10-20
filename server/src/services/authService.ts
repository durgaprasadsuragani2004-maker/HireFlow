import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { ROLES, USER_STATUS, AUDIT_ACTIONS } from '../config/constants';
import { auditService } from './auditService';
import { notificationService } from './notificationService';
import { NOTIFICATION_TYPES } from '../config/constants';

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    role: string;
    fullName?: string;
    companyName?: string;
    title?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError('An account with this email address already exists', 409);
    }

    const passwordHash = await hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: data.role as any,
          status: USER_STATUS.ACTIVE,
        },
      });

      let companyId: string | undefined;
      let recruiterId: string | undefined;
      let applicantId: string | undefined;

      if (data.role === ROLES.RECRUITER) {
        // Find or create company
        let company = await tx.company.findUnique({
          where: { name: data.companyName! },
        });

        if (!company) {
          company = await tx.company.create({
            data: {
              name: data.companyName!,
              description: `${data.companyName} on HireFlow ATS`,
              contactEmail: data.email,
            },
          });
        }
        companyId = company.id;

        const recruiter = await tx.recruiterProfile.create({
          data: {
            userId: user.id,
            companyId: company.id,
            title: data.title || 'Recruiter',
          },
        });
        recruiterId = recruiter.id;
      } else if (data.role === ROLES.APPLICANT) {
        const applicant = await tx.applicantProfile.create({
          data: {
            userId: user.id,
            fullName: data.fullName || 'Candidate',
          },
        });
        applicantId = applicant.id;
      }

      return { user, companyId, recruiterId, applicantId };
    });

    const tokenPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      companyId: result.companyId,
      recruiterId: result.recruiterId,
      applicantId: result.applicantId,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await auditService.log({
      actorId: result.user.id,
      action: AUDIT_ACTIONS.USER_REGISTER,
      entity: 'User',
      entityId: result.user.id,
      metadata: { role: data.role, email: data.email },
    });

    await notificationService.notify({
      userId: result.user.id,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Welcome to HireFlow ATS!',
      message: 'Your account has been registered successfully. Explore the platform and get started.',
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        status: result.user.status,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        recruiterProfile: {
          include: { company: true },
        },
        applicantProfile: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw new AppError('Your account has been suspended. Please contact administrator.', 403);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.recruiterProfile?.companyId,
      recruiterId: user.recruiterProfile?.id,
      applicantId: user.applicantProfile?.id,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await auditService.log({
      actorId: user.id,
      action: AUDIT_ACTIONS.USER_LOGIN,
      entity: 'User',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        recruiterProfile: user.recruiterProfile
          ? {
              id: user.recruiterProfile.id,
              companyId: user.recruiterProfile.companyId,
              companyName: user.recruiterProfile.company.name,
              title: user.recruiterProfile.title,
            }
          : null,
        applicantProfile: user.applicantProfile
          ? {
              id: user.applicantProfile.id,
              fullName: user.applicantProfile.fullName,
              resumeUrl: user.applicantProfile.resumeUrl,
            }
          : null,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        recruiterProfile: true,
        applicantProfile: true,
      },
    });

    if (!user || user.status === USER_STATUS.SUSPENDED) {
      throw new AppError('User account is invalid or inactive', 401);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.recruiterProfile?.companyId,
      recruiterId: user.recruiterProfile?.id,
      applicantId: user.applicantProfile?.id,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        recruiterProfile: {
          include: {
            company: true,
          },
        },
        applicantProfile: {
          include: {
            skills: true,
            experience: true,
            education: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateMe(userId: string, data: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        recruiterProfile: true,
        applicantProfile: true,
      },
    });

    if (!user) throw new AppError('User not found', 404);

    if (user.role === ROLES.APPLICANT && user.applicantProfile) {
      await prisma.applicantProfile.update({
        where: { id: user.applicantProfile.id },
        data: {
          fullName: data.fullName ?? user.applicantProfile.fullName,
          phone: data.phone ?? user.applicantProfile.phone,
          location: data.location ?? user.applicantProfile.location,
          headline: data.headline ?? user.applicantProfile.headline,
          summary: data.summary ?? user.applicantProfile.summary,
          linkedinUrl: data.linkedinUrl ?? user.applicantProfile.linkedinUrl,
          githubUrl: data.githubUrl ?? user.applicantProfile.githubUrl,
          portfolioUrl: data.portfolioUrl ?? user.applicantProfile.portfolioUrl,
        },
      });
    } else if (user.role === ROLES.RECRUITER && user.recruiterProfile) {
      await prisma.recruiterProfile.update({
        where: { id: user.recruiterProfile.id },
        data: {
          title: data.title ?? user.recruiterProfile.title,
          department: data.department ?? user.recruiterProfile.department,
          phone: data.phone ?? user.recruiterProfile.phone,
        },
      });
    }

    await auditService.log({
      actorId: userId,
      action: AUDIT_ACTIONS.USER_UPDATE,
      entity: 'User',
      entityId: userId,
      metadata: data,
    });

    return this.getMe(userId);
  }

  async adminGetUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.email = { contains: params.search };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          recruiterProfile: {
            include: { company: true },
          },
          applicantProfile: {
            select: {
              id: true,
              fullName: true,
              headline: true,
              resumeUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async adminUpdateUserStatus(userId: string, status: string, actorId: string) {
    if (![USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED].includes(status as any)) {
      throw new AppError('Invalid user status', 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
      select: { id: true, email: true, role: true, status: true },
    });

    await auditService.log({
      actorId,
      action: AUDIT_ACTIONS.USER_STATUS_CHANGE,
      entity: 'User',
      entityId: userId,
      metadata: { newStatus: status },
    });

    return updated;
  }
}

export const authService = new AuthService();
