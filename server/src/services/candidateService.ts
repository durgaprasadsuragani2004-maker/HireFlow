import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ROLES } from '../config/constants';
import { AuthUser } from '../types';
import { storageService } from './storageService';

export class CandidateService {
  async getCandidateProfile(applicantId: string, currentUser: AuthUser) {
    const profile = await prisma.applicantProfile.findUnique({
      where: { id: applicantId },
      include: {
        user: { select: { id: true, email: true, createdAt: true } },
        skills: true,
        experience: true,
        education: true,
        applications: {
          include: {
            job: {
              select: { id: true, title: true, companyId: true, company: true },
            },
            interviews: true,
            stageHistory: {
              orderBy: { changedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!profile) throw new AppError('Candidate profile not found', 404);

    // RBAC: Applicant can only view own profile
    if (currentUser.role === ROLES.APPLICANT && profile.userId !== currentUser.id) {
      throw new AppError('Forbidden: Cannot view other candidates’ profiles', 403);
    }

    // RBAC: Recruiter can only view candidate if they applied to their company
    if (currentUser.role === ROLES.RECRUITER) {
      const myCompanyId = currentUser.recruiterProfile?.companyId;
      const hasAppliedToMyCompany = profile.applications.some(
        (app) => app.job.companyId === myCompanyId
      );
      if (!hasAppliedToMyCompany) {
        throw new AppError('Forbidden: Cannot access candidates who have not applied to your company', 403);
      }
      profile.applications = profile.applications.filter(
        (app) => app.job.companyId === myCompanyId
      );
    }

    let secureResumeUrl = profile.resumeUrl;
    if (profile.resumeFileName) {
      secureResumeUrl = await storageService.getSecureUrl(profile.resumeFileName);
    }

    return {
      ...profile,
      resumeUrl: secureResumeUrl,
    };
  }

  async getResumeFilePath(fileName: string, currentUser: AuthUser) {
    const applicant = await prisma.applicantProfile.findFirst({
      where: { resumeFileName: fileName },
      include: {
        applications: {
          include: { job: true },
        },
      },
    });

    if (!applicant) {
      throw new AppError('Resume record not found', 404);
    }

    if (currentUser.role === ROLES.APPLICANT && applicant.userId !== currentUser.id) {
      throw new AppError('Forbidden: Cannot download another candidate’s resume', 403);
    }

    if (currentUser.role === ROLES.RECRUITER) {
      const myCompanyId = currentUser.recruiterProfile?.companyId;
      const hasAppliedToCompany = applicant.applications.some(
        (app) => app.job.companyId === myCompanyId
      );
      if (!hasAppliedToCompany) {
        throw new AppError('Forbidden: Cannot download resume for a candidate outside your company applications', 403);
      }
    }

    const originalName = applicant.fullName
      ? `${applicant.fullName.replace(/\s+/g, '_')}_Resume.pdf`
      : fileName;

    if (storageService.isS3()) {
      const signedUrl = await storageService.getSignedDownloadUrl(fileName);
      return { signedUrl, originalName };
    }

    const filePath = storageService.getLocalFilePath(fileName);
    if (!filePath) {
      throw new AppError('Resume file not found on storage', 404);
    }

    return { filePath, originalName };
  }

  async uploadResume(
    userId: string,
    file: Express.Multer.File
  ) {
    const uploadResult = await storageService.processUpload(file);

    let profile = await prisma.applicantProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.applicantProfile.create({
        data: {
          userId,
          fullName: 'Applicant',
          resumeUrl: uploadResult.fileUrl,
          resumeFileName: file.filename,
        },
      });
    } else {
      if (profile.resumeFileName) {
        await storageService.deleteFile(profile.resumeFileName);
      }

      profile = await prisma.applicantProfile.update({
        where: { id: profile.id },
        data: {
          resumeUrl: uploadResult.fileUrl,
          resumeFileName: file.filename,
        },
      });
    }

    return {
      message: 'Resume uploaded successfully',
      resumeUrl: uploadResult.fileUrl,
      fileName: file.originalname,
    };
  }

  async updateSkills(
    userId: string,
    skills: Array<{ name: string; level?: string; yearsOfExperience?: number }>
  ) {
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId },
    });

    if (!profile) throw new AppError('Profile not found', 404);

    await prisma.applicantSkill.deleteMany({
      where: { applicantProfileId: profile.id },
    });

    const normalized = Array.isArray(skills)
      ? skills.map((s: any) =>
          typeof s === 'string'
            ? { name: s.trim(), level: 'INTERMEDIATE', yearsOfExperience: null }
            : { name: (s.name || '').trim(), level: s.level || 'INTERMEDIATE', yearsOfExperience: s.yearsOfExperience || null }
        ).filter((s: any) => s.name.length > 0)
      : typeof skills === 'string'
      ? (skills as string)
          .split(',')
          .map((s) => ({ name: s.trim(), level: 'INTERMEDIATE', yearsOfExperience: null }))
          .filter((s) => s.name.length > 0)
      : [];

    if (normalized.length > 0) {
      await prisma.applicantSkill.createMany({
        data: normalized.map((s: any) => ({
          applicantProfileId: profile.id,
          name: s.name,
          level: s.level,
          yearsOfExperience: s.yearsOfExperience,
        })),
      });
    }

    return prisma.applicantSkill.findMany({
      where: { applicantProfileId: profile.id },
    });
  }

  async queryCandidates(params: {
    search?: string;
    skill?: string;
    stage?: string;
    jobId?: string;
    page?: number;
    limit?: number;
    currentUser: AuthUser;
  }) {
    if (params.currentUser.role === ROLES.APPLICANT) {
      throw new AppError('Forbidden: Applicants cannot query candidate lists', 403);
    }

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.currentUser.role === ROLES.RECRUITER) {
      where.applications = {
        some: {
          job: {
            companyId: params.currentUser.recruiterProfile?.companyId,
          },
          ...(params.jobId ? { jobId: params.jobId } : {}),
          ...(params.stage ? { currentStage: params.stage } : {}),
        },
      };
    } else if (params.stage || params.jobId) {
      where.applications = {
        some: {
          ...(params.jobId ? { jobId: params.jobId } : {}),
          ...(params.stage ? { currentStage: params.stage } : {}),
        },
      };
    }

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search } },
        { headline: { contains: params.search } },
        { location: { contains: params.search } },
        { user: { email: { contains: params.search } } },
      ];
    }

    if (params.skill) {
      where.skills = {
        some: {
          name: { contains: params.skill },
        },
      };
    }

    const [candidates, total] = await Promise.all([
      prisma.applicantProfile.findMany({
        where,
        include: {
          user: { select: { email: true } },
          skills: true,
          applications: {
            select: {
              id: true,
              currentStage: true,
              rating: true,
              job: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.applicantProfile.count({ where }),
    ]);

    return { candidates, total, page, limit };
  }
}

export const candidateService = new CandidateService();
