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
        companyId: result.companyId || (result.user as any).companyId || null,
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
        company: true,
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
      companyId: user.companyId || user.recruiterProfile?.companyId || null,
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
        companyId: user.companyId || user.recruiterProfile?.companyId || null,
        company: user.company || user.recruiterProfile?.company || null,
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
        company: true,
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
      companyId: user.companyId || user.recruiterProfile?.companyId || null,
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
        companyId: true,
        company: true,
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
      where.OR = [
        { email: { contains: params.search } },
        { applicantProfile: { fullName: { contains: params.search } } },
        { recruiterProfile: { title: { contains: params.search } } },
        { recruiterProfile: { company: { name: { contains: params.search } } } },
      ];
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
            include: {
              company: true,
              _count: { select: { jobs: true } },
            },
          },
          applicantProfile: {
            select: {
              id: true,
              fullName: true,
              headline: true,
              resumeUrl: true,
              _count: { select: { applications: true } },
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

  async adminGetUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        recruiterProfile: {
          include: {
            company: true,
            _count: { select: { jobs: true } },
          },
        },
        applicantProfile: {
          include: {
            skills: true,
            _count: { select: { applications: true } },
          },
        },
        _count: {
          select: {
            notifications: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async adminCreateUser(
    data: {
      email: string;
      password: string;
      role: string;
      status?: string;
      fullName?: string;
      companyName?: string;
      title?: string;
    },
    actorId: string
  ) {
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
          status: (data.status as any) || USER_STATUS.ACTIVE,
        },
      });

      if (data.role === ROLES.RECRUITER) {
        const companyName = data.companyName || 'HireFlow Partner';
        let company = await tx.company.findUnique({
          where: { name: companyName },
        });

        if (!company) {
          company = await tx.company.create({
            data: {
              name: companyName,
              description: `${companyName} on HireFlow ATS`,
              contactEmail: data.email,
            },
          });
        }

        await tx.recruiterProfile.create({
          data: {
            userId: user.id,
            companyId: company.id,
            title: data.title || 'Recruiter',
          },
        });
      } else if (data.role === ROLES.APPLICANT) {
        await tx.applicantProfile.create({
          data: {
            userId: user.id,
            fullName: data.fullName || 'Candidate',
          },
        });
      }

      return user;
    });

    await auditService.log({
      actorId,
      action: AUDIT_ACTIONS.USER_CREATE,
      entity: 'User',
      entityId: result.id,
      metadata: { email: result.email, role: result.role, status: result.status },
    });

    return this.adminGetUserById(result.id);
  }

  async adminUpdateUser(
    userId: string,
    data: {
      email?: string;
      password?: string;
      role?: string;
      status?: string;
      fullName?: string;
      companyName?: string;
      title?: string;
    },
    actorId: string
  ) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        applicantProfile: true,
        recruiterProfile: { include: { company: true } },
      },
    });

    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    // Protection: Prevent demoting or suspending own Super Admin account
    if (
      targetUser.role === ROLES.SUPER_ADMIN &&
      ((data.role && data.role !== ROLES.SUPER_ADMIN) || data.status === USER_STATUS.SUSPENDED)
    ) {
      if (actorId === userId) {
        throw new AppError('You cannot demote or suspend your own Super Admin account', 400);
      }
      const adminCount = await prisma.user.count({
        where: { role: ROLES.SUPER_ADMIN, status: USER_STATUS.ACTIVE },
      });
      if (adminCount <= 1) {
        throw new AppError('Cannot demote or suspend the last active Super Admin', 400);
      }
    }

    // Check email uniqueness if changing email
    if (data.email && data.email !== targetUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        throw new AppError('Email address is already in use by another user', 409);
      }
    }

    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role as any;
    if (data.status) updateData.status = data.status as any;
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      // Update or create profiles if needed
      const effectiveRole = data.role || targetUser.role;

      if (effectiveRole === ROLES.APPLICANT) {
        if (targetUser.applicantProfile) {
          if (data.fullName) {
            await tx.applicantProfile.update({
              where: { id: targetUser.applicantProfile.id },
              data: { fullName: data.fullName },
            });
          }
        } else {
          await tx.applicantProfile.create({
            data: {
              userId,
              fullName: data.fullName || 'Candidate',
            },
          });
        }
      } else if (effectiveRole === ROLES.RECRUITER) {
        if (targetUser.recruiterProfile) {
          const profileUpdate: any = {};
          if (data.title) profileUpdate.title = data.title;
          if (data.companyName) {
            let company = await tx.company.findUnique({
              where: { name: data.companyName },
            });
            if (!company) {
              company = await tx.company.create({
                data: {
                  name: data.companyName,
                  description: `${data.companyName} on HireFlow ATS`,
                  contactEmail: data.email || targetUser.email,
                },
              });
            }
            profileUpdate.companyId = company.id;
          }
          if (Object.keys(profileUpdate).length > 0) {
            await tx.recruiterProfile.update({
              where: { id: targetUser.recruiterProfile.id },
              data: profileUpdate,
            });
          }
        } else {
          const companyName = data.companyName || 'HireFlow Partner';
          let company = await tx.company.findUnique({
            where: { name: companyName },
          });
          if (!company) {
            company = await tx.company.create({
              data: {
                name: companyName,
                description: `${companyName} on HireFlow ATS`,
                contactEmail: data.email || targetUser.email,
              },
            });
          }
          await tx.recruiterProfile.create({
            data: {
              userId,
              companyId: company.id,
              title: data.title || 'Recruiter',
            },
          });
        }
      }
    });

    await auditService.log({
      actorId,
      action: AUDIT_ACTIONS.USER_UPDATE,
      entity: 'User',
      entityId: userId,
      metadata: { updatedFields: Object.keys(data) },
    });

    return this.adminGetUserById(userId);
  }

  async adminDeleteUser(userId: string, actorId: string, force = false) {
    if (actorId === userId) {
      throw new AppError('You cannot delete your own Super Admin account', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        applicantProfile: true,
        recruiterProfile: true,
      },
    });

    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    if (targetUser.role === ROLES.SUPER_ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: ROLES.SUPER_ADMIN },
      });
      if (adminCount <= 1) {
        throw new AppError('Cannot delete the last Super Admin in the system', 400);
      }
    }

    // Check for dependent records: applications, posted jobs, scheduled interviews
    const appCount = targetUser.applicantProfile
      ? await prisma.application.count({ where: { applicantId: targetUser.applicantProfile.id } })
      : 0;
    const jobCount = targetUser.recruiterProfile
      ? await prisma.job.count({ where: { recruiterId: targetUser.recruiterProfile.id } })
      : 0;
    const interviewCount = await prisma.interview.count({
      where: {
        OR: [{ interviewerEmail: targetUser.email }, { scheduledById: targetUser.id }],
      },
    });

    const hasDependencies = appCount > 0 || jobCount > 0 || interviewCount > 0;

    if (hasDependencies && !force) {
      throw new AppError(
        `This user has active dependencies (${appCount} applications, ${jobCount} jobs, ${interviewCount} interviews). To preserve audit trails, you can suspend the account instead, or confirm permanent deletion.`,
        409
      );
    }

    // Perform real deletion
    await prisma.user.delete({
      where: { id: userId },
    });

    await auditService.log({
      actorId,
      action: AUDIT_ACTIONS.USER_DELETE,
      entity: 'User',
      entityId: userId,
      metadata: { email: targetUser.email, role: targetUser.role, force },
    });

    return {
      deleted: true,
      deactivated: false,
      message: 'User account permanently deleted.',
    };
  }

  async adminUpdateUserStatus(userId: string, status: string, actorId: string) {
    if (![USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED].includes(status as any)) {
      throw new AppError('Invalid user status', 400);
    }

    if (status === USER_STATUS.SUSPENDED) {
      if (actorId === userId) {
        throw new AppError('You cannot suspend your own Super Admin account', 400);
      }
      const target = await prisma.user.findUnique({ where: { id: userId } });
      if (target?.role === ROLES.SUPER_ADMIN) {
        const activeAdmins = await prisma.user.count({
          where: { role: ROLES.SUPER_ADMIN, status: USER_STATUS.ACTIVE },
        });
        if (activeAdmins <= 1) {
          throw new AppError('Cannot suspend the last active Super Admin', 400);
        }
      }
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
