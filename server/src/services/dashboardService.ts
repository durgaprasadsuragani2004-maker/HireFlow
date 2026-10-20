import { prisma } from '../config/database';
import { APPLICATION_STAGES, JOB_STATUS, ROLES } from '../config/constants';
import { AuthUser } from '../types';

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

  async getRecruiterDashboard(recruiterUser: AuthUser) {
    const companyId = recruiterUser.recruiterProfile?.companyId;

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
