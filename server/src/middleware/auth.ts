import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { RequestWithUser } from '../types';
import { RoleType, USER_STATUS } from '../config/constants';

export const authenticate = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      sendError(res, 'Authentication token is required', 401);
      return;
    }
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        sendError(res, 'Token has expired. Please refresh your session.', 401);
        return;
      }
      sendError(res, 'Invalid authentication token', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        recruiterProfile: true,
        applicantProfile: true,
        company: true,
      },
    });

    if (!user) {
      sendError(res, 'User account no longer exists', 401);
      return;
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      sendError(res, 'Your account has been suspended. Please contact administrator.', 403);
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as RoleType,
      status: user.status as any,
      companyId: user.companyId || user.recruiterProfile?.companyId || null,
      company: user.company || user.recruiterProfile?.company || null,
      recruiterProfile: user.recruiterProfile
        ? {
            id: user.recruiterProfile.id,
            companyId: user.recruiterProfile.companyId,
            title: user.recruiterProfile.title,
            department: user.recruiterProfile.department,
          }
        : null,
      applicantProfile: user.applicantProfile
        ? {
            id: user.applicantProfile.id,
            fullName: user.applicantProfile.fullName,
          }
        : null,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...allowedRoles: RoleType[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthenticated user', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource`,
        403
      );
      return;
    }

    next();
  };
};

export const requireRecruiterCompany = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'RECRUITER' || !req.user.recruiterProfile?.companyId) {
    sendError(res, 'Recruiter must belong to an active company', 403);
    return;
  }
  next();
};

export const optionalAuth = async (
  req: RequestWithUser,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }
    if (token) {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { recruiterProfile: true, applicantProfile: true, company: true },
      });
      if (user && user.status !== USER_STATUS.SUSPENDED) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role as RoleType,
          status: user.status as any,
          companyId: user.companyId || user.recruiterProfile?.companyId || null,
          company: user.company || user.recruiterProfile?.company || null,
          recruiterProfile: user.recruiterProfile
            ? {
                id: user.recruiterProfile.id,
                companyId: user.recruiterProfile.companyId,
                title: user.recruiterProfile.title,
                department: user.recruiterProfile.department,
              }
            : null,
          applicantProfile: user.applicantProfile
            ? {
                id: user.applicantProfile.id,
                fullName: user.applicantProfile.fullName,
              }
            : null,
        };
      }
    }
  } catch {
    // Ignore invalid optional tokens
  }
  next();
};
