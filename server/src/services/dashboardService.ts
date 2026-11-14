import { prisma } from '../config/database';
import { APPLICATION_STAGES, JOB_STATUS, ROLES } from '../config/constants';
import { AuthUser } from '../types';
import { AppError } from '../middleware/errorHandler';

export class DashboardService {
  async getAdminDashboard() {
    const [
      totalUsers,
      totalRecruiters,
      totalApplicants,
      totalCompanies,
      totalJobs,
      activeJobs,
      totalApplications,
      selectedCandidates,
      rejectedCandidates,
      recentUsers,
      recentJobs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: ROLES.RECRUITER } }),
      prisma.user.count({ where: { role: ROLES.APPLICANT } }),
      prisma.company.count(),
      prisma.job.count(),
      prisma.job.count({ where: { status: JOB_STATUS.PUBLISHED } }),
      prisma.application.count(),
      prisma.application.count({ where: { currentStage: APPLICATION_STAGES.SELECTED } }),
      prisma.application.count({ where: { currentStage: APPLICATION_STAGES.REJECTED } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, role: true, status: true, createdAt: true },
      }),
      prisma.job.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { company: true },
      }),
    ]);

    // Recruitment funnel data
    const stageCounts = await prisma.application.groupBy({
      by: ['currentStage'],
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

    // Applications by Job
    const topJobs = await prisma.job.findMany({
      take: 6,
      orderBy: { applications: { _count: 'desc' } },
      select: {
        id: true,
        title: true,
        company: { select: { name: true } },
        _count: { select: { applications: true } },
      },
    });

    return {
      metrics: {
        totalUsers,
        totalRecruiters,
        totalApplicants,
        totalCompanies,
        totalJobs,
        activeJobs,
        totalApplications,
        selectedCandidates,
        rejectedCandidates,
      },
      funnel,
      topJobs: topJobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company.name,
        applicationsCount: j._count.applications,
      })),
      recentUsers,
      recentJobs,
    };
  }

  async getCompanyDashboard(companyUser: AuthUser) {
    let companyId = companyUser.companyId || companyUser.company?.id;
    if (!companyId) {
      const matched = await prisma.company.findFirst({
        where: { contactEmail: companyUser.email },
      });
      if (matched) {
        companyId = matched.id;
        await prisma.user.update({
          where: { id: companyUser.id },
          data: { companyId: matched.id },
        }).catch(() => {});
      }
    }

    if (!companyId) {
      throw new AppError('No organization associated with this company account', 403);
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        recruiters: {
          include: {
            user: { select: { id: true, email: true, status: true, createdAt: true } },
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Organization not found', 404);
    }

    const [
      activeJobs,
      totalJobs,
      closedJobs,
      totalApplications,
      candidatesInScreening,
      shortlistedCandidates,
      interviewsCount,
      selectedCandidates,
      rejectedCandidates,
      totalRecruiters,
    ] = await Promise.all([
      prisma.job.count({ where: { companyId, status: JOB_STATUS.PUBLISHED } }),
      prisma.job.count({ where: { companyId } }),
      prisma.job.count({
        where: {
          companyId,
          OR: [{ status: JOB_STATUS.ARCHIVED }, { status: JOB_STATUS.DRAFT }],
        },
      }),
      prisma.application.count({ where: { job: { companyId } } }),
      prisma.application.count({
        where: { job: { companyId }, currentStage: APPLICATION_STAGES.SCREENING },
      }),
      prisma.application.count({
        where: { job: { companyId }, currentStage: APPLICATION_STAGES.SHORTLISTED },
      }),
      prisma.interview.count({
        where: { application: { job: { companyId } }, status: 'SCHEDULED' },
      }),
      prisma.application.count({
        where: { job: { companyId }, currentStage: APPLICATION_STAGES.SELECTED },
      }),
      prisma.application.count({
        where: { job: { companyId }, currentStage: APPLICATION_STAGES.REJECTED },
      }),
      prisma.recruiterProfile.count({ where: { companyId } }),
    ]);

    // Recruitment Funnel
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

    // Company jobs
    const jobs = await prisma.job.findMany({
      where: { companyId },
      select: {
        id: true,
        title: true,
        status: true,
        location: true,
        employmentType: true,
        experienceLevel: true,
        createdAt: true,
        recruiter: {
          select: {
            title: true,
            user: { select: { email: true } },
          },
        },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Upcoming interviews
    const upcomingInterviews = await prisma.interview.findMany({
      where: {
        application: { job: { companyId } },
        status: 'SCHEDULED',
      },
      include: {
        application: {
          include: {
            applicant: { select: { fullName: true } },
            job: { select: { title: true } },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 6,
    });

    // Recent activity
    const recentActivity = await prisma.applicationStageHistory.findMany({
      where: { application: { job: { companyId } } },
      include: {
        application: {
          include: {
            applicant: { select: { fullName: true } },
            job: { select: { title: true } },
          },
        },
        changedBy: { select: { email: true, role: true } },
      },
      orderBy: { changedAt: 'desc' },
      take: 8,
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
      },
      metrics: {
        activeJobs,
        totalJobs,
        closedJobs,
        totalApplications,
        candidatesInScreening,
        shortlistedCandidates,
        interviewsCount,
        activeInterviews: interviewsCount,
        selectedCandidates,
        rejectedCandidates,
        totalRecruiters,
      },
      funnel,
      recruiters: company.recruiters.map((r) => ({
        id: r.id,
        userId: r.user.id,
        email: r.user.email,
        title: r.title,
        status: r.user.status,
        joinedAt: r.user.createdAt,
      })),
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        status: j.status,
        location: j.location,
        employmentType: j.employmentType,
        experienceLevel: j.experienceLevel,
        recruiterEmail: j.recruiter?.user?.email,
        recruiterTitle: j.recruiter?.title,
        applicationsCount: j._count.applications,
      })),
      companyJobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        status: j.status,
        location: j.location,
        employmentType: j.employmentType,
        experienceLevel: j.experienceLevel,
        recruiterEmail: j.recruiter?.user?.email,
        recruiterTitle: j.recruiter?.title,
        applicationsCount: j._count.applications,
      })),
      upcomingInterviews,
      recentActivity,
    };
  }

  async getRecruiterDashboard(recruiterUser: AuthUser) {
    let companyId = recruiterUser.recruiterProfile?.companyId || recruiterUser.companyId;
    if (!companyId) {
      const matched = await prisma.company.findFirst({
        where: { contactEmail: recruiterUser.email },
      });
      if (matched) {
        companyId = matched.id;
      }
    }

    if (!companyId) {
      throw new AppError('No organization associated with this recruiter account', 403);
    }

    const [
      activeJobs,
      totalJobs,
      totalApplications,
      candidatesInScreening,
      shortlistedCandidates,
      interviewsCount,
      selectedCandidates,
      rejectedCandidates,
    ] = await Promise.all([
      prisma.job.count({ where: { companyId, status: JOB_STATUS.PUBLISHED } }),
      prisma.job.count({ where: { companyId } }),
      prisma.application.count({ where: { job: { companyId } } }),
      prisma.application.count({
        where: { job: { companyId }, currentStage: APPLICATION_STAGES.SCREENING },
      }),
      prisma.application.count({
        where: { job: { companyId }, currentStage: APPLICATION_STAGES.SHORTLISTED },
      }),
      prisma.interview.count({
        where: { application: { job: { companyId } }, status: 'SCHEDULED' },
      }),
      prisma.application.count({
        where: { job: { companyId }, currentStage: APPLICATION_STAGES.SELECTED },
      }),
      prisma.application.count({
        where: { job: { companyId }, currentStage: APPLICATION_STAGES.REJECTED },
      }),
    ]);

    // Recruiter Funnel
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

    // Applications per job
    const jobs = await prisma.job.findMany({
      where: { companyId },
      select: {
        id: true,
        title: true,
        status: true,
        location: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    // Upcoming scheduled interviews
    const upcomingInterviews = await prisma.interview.findMany({
      where: {
        application: { job: { companyId } },
        status: 'SCHEDULED',
      },
      include: {
        application: {
          include: {
            applicant: { select: { fullName: true } },
            job: { select: { title: true } },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 5,
    });

    // Recent candidate applications for this recruiter's company
    const recentApplications = await prisma.application.findMany({
      where: { job: { companyId } },
      include: {
        applicant: {
          select: {
            id: true,
            fullName: true,
            user: { select: { email: true } },
          },
        },
        job: { select: { id: true, title: true } },
      },
      orderBy: { appliedAt: 'desc' },
      take: 8,
    });

    return {
      metrics: {
        activeJobs,
        totalJobs,
        totalApplications,
        candidatesInScreening,
        shortlistedCandidates,
        interviewsCount,
        selectedCandidates,
        rejectedCandidates,
      },
      funnel,
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        status: j.status,
        location: j.location,
        applicationsCount: j._count.applications,
      })),
      upcomingInterviews,
      recentApplications: recentApplications.map((app) => ({
        id: app.id,
        candidateName: app.applicant.fullName,
        candidateEmail: app.applicant.user.email,
        jobId: app.job.id,
        jobTitle: app.job.title,
        stage: app.currentStage,
        appliedAt: app.appliedAt,
      })),
    };
  }

  async getApplicantDashboard(applicantUserId: string) {
    const applicant = await prisma.applicantProfile.findUnique({
      where: { userId: applicantUserId },
    });

    if (!applicant) {
      return {
        metrics: {
          appliedJobs: 0,
          inProgress: 0,
          interviewsScheduled: 0,
          shortlisted: 0,
          selected: 0,
          rejected: 0,
        },
        recentApplications: [],
        upcomingInterviews: [],
      };
    }

    const [
      appliedJobs,
      inProgress,
      shortlisted,
      selected,
      rejected,
      interviewsScheduled,
    ] = await Promise.all([
      prisma.application.count({ where: { applicantId: applicant.id } }),
      prisma.application.count({
        where: {
          applicantId: applicant.id,
          currentStage: {
            in: [
              APPLICATION_STAGES.APPLIED,
              APPLICATION_STAGES.SCREENING,
              APPLICATION_STAGES.SHORTLISTED,
              APPLICATION_STAGES.INTERVIEW,
            ],
          },
        },
      }),
      prisma.application.count({
        where: { applicantId: applicant.id, currentStage: APPLICATION_STAGES.SHORTLISTED },
      }),
      prisma.application.count({
        where: { applicantId: applicant.id, currentStage: APPLICATION_STAGES.SELECTED },
      }),
      prisma.application.count({
        where: { applicantId: applicant.id, currentStage: APPLICATION_STAGES.REJECTED },
      }),
      prisma.interview.count({
        where: { application: { applicantId: applicant.id }, status: 'SCHEDULED' },
      }),
    ]);

    const recentApplications = await prisma.application.findMany({
      where: { applicantId: applicant.id },
      include: {
        job: {
          include: { company: true },
        },
        interviews: {
          where: { status: 'SCHEDULED' },
          orderBy: { date: 'asc' },
          take: 1,
        },
      },
      orderBy: { appliedAt: 'desc' },
      take: 6,
    });

    const upcomingInterviews = await prisma.interview.findMany({
      where: {
        application: { applicantId: applicant.id },
        status: 'SCHEDULED',
      },
      include: {
        application: {
          include: {
            job: {
              select: { title: true, company: { select: { name: true, logo: true } } },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 5,
    });

    return {
      metrics: {
        appliedJobs,
        inProgress,
        interviewsScheduled,
        shortlisted,
        selected,
        rejected,
      },
      recentApplications,
      upcomingInterviews,
    };
  }
}

export const dashboardService = new DashboardService();
