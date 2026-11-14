import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { signAccessToken } from '../src/utils/jwt';
import { ROLES, USER_STATUS, JOB_STATUS, APPLICATION_STAGES } from '../src/config/constants';
import { hashPassword } from '../src/utils/password';

describe('HireFlow Functional Repair & RBAC Verification Tests', () => {
  let superAdminUser: any;
  let superAdminToken: string;

  let companyA: any;
  let companyAUser: any;
  let companyAToken: string;
  let recruiterA: any;
  let recruiterAUser: any;
  let recruiterAToken: string;

  let companyB: any;
  let companyBUser: any;
  let companyBToken: string;

  let applicantUser: any;
  let applicantProfile: any;
  let applicantToken: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const passwordHash = await hashPassword('Secret@123456');

    // Super Admin
    superAdminUser = await prisma.user.create({
      data: {
        email: `superadmin-${timestamp}@hireflow.test`,
        passwordHash,
        role: ROLES.SUPER_ADMIN,
        status: USER_STATUS.ACTIVE,
      },
    });
    superAdminToken = signAccessToken({
      userId: superAdminUser.id,
      email: superAdminUser.email,
      role: ROLES.SUPER_ADMIN,
    });

    // Company A
    companyA = await prisma.company.create({
      data: {
        name: `Acme Corp ${timestamp}`,
        industry: 'Cloud Software',
        location: 'San Francisco, CA',
        website: 'https://acme.test',
      },
    });

    companyAUser = await prisma.user.create({
      data: {
        email: `company-a-${timestamp}@acme.test`,
        passwordHash,
        role: ROLES.COMPANY,
        status: USER_STATUS.ACTIVE,
        companyId: companyA.id,
      },
    });
    companyAToken = signAccessToken({
      userId: companyAUser.id,
      email: companyAUser.email,
      role: ROLES.COMPANY,
      companyId: companyA.id,
    });

    // Recruiter A
    recruiterAUser = await prisma.user.create({
      data: {
        email: `recruiter-a-${timestamp}@acme.test`,
        passwordHash,
        role: ROLES.RECRUITER,
        status: USER_STATUS.ACTIVE,
        companyId: companyA.id,
      },
    });
    recruiterA = await prisma.recruiterProfile.create({
      data: {
        userId: recruiterAUser.id,
        companyId: companyA.id,
        title: 'Senior Technical Recruiter',
      },
    });
    recruiterAToken = signAccessToken({
      userId: recruiterAUser.id,
      email: recruiterAUser.email,
      role: ROLES.RECRUITER,
      companyId: companyA.id,
      recruiterId: recruiterA.id,
    });

    // Company B
    companyB = await prisma.company.create({
      data: {
        name: `Beta Industries ${timestamp}`,
        industry: 'Fintech',
        location: 'New York, NY',
        website: 'https://beta.test',
      },
    });
    companyBUser = await prisma.user.create({
      data: {
        email: `company-b-${timestamp}@beta.test`,
        passwordHash,
        role: ROLES.COMPANY,
        status: USER_STATUS.ACTIVE,
        companyId: companyB.id,
      },
    });
    companyBToken = signAccessToken({
      userId: companyBUser.id,
      email: companyBUser.email,
      role: ROLES.COMPANY,
      companyId: companyB.id,
    });

    // Applicant
    applicantUser = await prisma.user.create({
      data: {
        email: `candidate-${timestamp}@hireflow.test`,
        passwordHash,
        role: ROLES.APPLICANT,
        status: USER_STATUS.ACTIVE,
      },
    });
    applicantProfile = await prisma.applicantProfile.create({
      data: {
        userId: applicantUser.id,
        fullName: 'Jane Candidate',
        headline: 'Staff Full-Stack Engineer',
      },
    });
    applicantToken = signAccessToken({
      userId: applicantUser.id,
      email: applicantUser.email,
      role: ROLES.APPLICANT,
      applicantId: applicantProfile.id,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================
  // PART 3: PAST APPLICATION DEADLINE REJECTION
  // ==========================================
  describe('Part 3: Past Application Deadline Validation', () => {
    it('should reject creating a job with a past deadline date', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          title: 'Expired Date Test Position',
          description: 'This is a long description with at least twenty characters.',
          requirements: 'Requirements with sufficient length.',
          responsibilities: 'Responsibilities with sufficient length.',
          skills: 'TypeScript, Node.js',
          location: 'Remote',
          employmentType: 'FULL_TIME',
          experienceLevel: 'SENIOR',
          deadline: '2020-01-01',
          recruiterId: recruiterA.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const msg = res.body.errors?.[0]?.message || res.body.message;
      expect(msg).toContain('Application deadline cannot be in the past');
    });

    it('should allow creating a job with today or future deadline date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureStr = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          title: 'Future Valid Position',
          description: 'This is a long description with at least twenty characters.',
          requirements: 'Requirements with sufficient length.',
          responsibilities: 'Responsibilities with sufficient length.',
          skills: 'TypeScript, Node.js',
          location: 'Remote',
          employmentType: 'FULL_TIME',
          experienceLevel: 'SENIOR',
          deadline: futureStr,
          recruiterId: recruiterA.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deadline).toBeDefined();
    });
  });

  // ==========================================
  // PART 1: JOB DELETION & SAFE ARCHIVAL STRATEGY
  // ==========================================
  describe('Part 1: Job Deletion RBAC and Safe Archival', () => {
    let jobZeroApps: any;
    let jobWithApps: any;

    beforeAll(async () => {
      // 1. Job with 0 applications
      jobZeroApps = await prisma.job.create({
        data: {
          companyId: companyA.id,
          recruiterId: recruiterA.id,
          title: 'Zero Applicants Position',
          description: 'Valid job description with at least twenty characters.',
          requirements: 'Ten chars requirements.',
          responsibilities: 'Ten chars responsibilities.',
          skills: 'React, Node',
          location: 'San Francisco, CA',
          status: JOB_STATUS.PUBLISHED,
        },
      });

      // 2. Job with active applications
      jobWithApps = await prisma.job.create({
        data: {
          companyId: companyA.id,
          recruiterId: recruiterA.id,
          title: 'Active Pipeline Position',
          description: 'Valid job description with at least twenty characters.',
          requirements: 'Ten chars requirements.',
          responsibilities: 'Ten chars responsibilities.',
          skills: 'Python, Django',
          location: 'Remote',
          status: JOB_STATUS.PUBLISHED,
        },
      });

      await prisma.application.create({
        data: {
          jobId: jobWithApps.id,
          applicantId: applicantProfile.id,
          currentStage: APPLICATION_STAGES.APPLIED,
        },
      });
    });

    it('should forbid unauthorized company from deleting another company job', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${jobZeroApps.id}`)
        .set('Authorization', `Bearer ${companyBToken}`);

      expect(res.status).toBe(403);
    });

    it('should hard-delete a job when application count is 0', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${jobZeroApps.id}`)
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.archived).toBe(false);

      const check = await prisma.job.findUnique({ where: { id: jobZeroApps.id } });
      expect(check).toBeNull();
    });

    it('should safely ARCHIVE a job when it has applicant history instead of wiping records', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${jobWithApps.id}`)
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.archived).toBe(true);

      // Verify job still exists in DB with ARCHIVED status
      const updatedJob = await prisma.job.findUnique({ where: { id: jobWithApps.id } });
      expect(updatedJob).not.toBeNull();
      expect(updatedJob?.status).toBe(JOB_STATUS.ARCHIVED);

      // Verify applicant history remains intact
      const appCount = await prisma.application.count({ where: { jobId: jobWithApps.id } });
      expect(appCount).toBe(1);
    });
  });

  // ==========================================
  // PART 2 & 9: EXPIRED & ARCHIVED JOB ORDERING
  // ==========================================
  describe('Part 2 & 9: Job Ordering and Archived Exclusion', () => {
    it('should exclude ARCHIVED jobs from normal job queries by default', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(200);
      const jobs = res.body.data || [];
      const hasArchived = jobs.some((j: any) => j.status === 'ARCHIVED');
      expect(hasArchived).toBe(false);
    });

    it('should allow explicitly querying ARCHIVED jobs when requested with status=ARCHIVED', async () => {
      const res = await request(app)
        .get('/api/jobs?status=ARCHIVED')
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(200);
      const jobs = res.body.data || [];
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs.every((j: any) => j.status === 'ARCHIVED')).toBe(true);
    });
  });

  // ==========================================
  // PART 5 & 6: COMPANY PROFILE & RECRUITER ELIGIBILITY
  // ==========================================
  describe('Part 5 & 6: Company Profile Resolution and Recruiter Eligibility', () => {
    it('should allow COMPANY role user to fetch their own company details via GET /api/companies', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(companyA.id);
      expect(res.body.data.recruiters).toBeInstanceOf(Array);
      expect(res.body.data.recruiters.length).toBeGreaterThan(0);
    });

    it('should allow COMPANY role user to update company profile via PATCH /api/companies', async () => {
      const res = await request(app)
        .patch('/api/companies')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          website: 'https://updated-acme.test',
          industry: 'Enterprise Software & Security',
          location: 'San Francisco, CA & Remote',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.website).toBe('https://updated-acme.test');
      expect(res.body.data.industry).toBe('Enterprise Software & Security');
    });
  });

  // ==========================================
  // PART 7: COMPANY CANDIDATE & KANBAN ACCESS
  // ==========================================
  describe('Part 7: Company Candidate Visibility & Kanban Pipeline Access', () => {
    let testJob: any;
    let testApp: any;

    beforeAll(async () => {
      testJob = await prisma.job.create({
        data: {
          companyId: companyA.id,
          recruiterId: recruiterA.id,
          title: 'Kanban Role Position',
          description: 'Valid job description with at least twenty characters.',
          requirements: 'Ten chars requirements.',
          responsibilities: 'Ten chars responsibilities.',
          skills: 'Kubernetes, Go',
          location: 'Remote',
          status: JOB_STATUS.PUBLISHED,
        },
      });

      testApp = await prisma.application.create({
        data: {
          jobId: testJob.id,
          applicantId: applicantProfile.id,
          currentStage: APPLICATION_STAGES.APPLIED,
        },
      });
    });

    it('should allow COMPANY role to query candidate talent pool for their company', async () => {
      const res = await request(app)
        .get('/api/candidates')
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.some((c: any) => c.id === applicantProfile.id)).toBe(true);
    });

    it('should allow COMPANY role to fetch Kanban pipeline for their job', async () => {
      const res = await request(app)
        .get(`/api/applications/kanban/${testJob.id}`)
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kanbanData).toBeDefined();
      expect(res.body.data.kanbanData[APPLICATION_STAGES.APPLIED].length).toBe(1);
    });

    it('should allow COMPANY role to transition candidate stages in Kanban', async () => {
      const res = await request(app)
        .patch(`/api/applications/${testApp.id}/stage`)
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          stage: APPLICATION_STAGES.SCREENING,
          reason: 'Advancing to screening stage',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStage).toBe(APPLICATION_STAGES.SCREENING);
    });

    it('should forbid COMPANY B from accessing or advancing candidates from Company A', async () => {
      const res = await request(app)
        .patch(`/api/applications/${testApp.id}/stage`)
        .set('Authorization', `Bearer ${companyBToken}`)
        .send({
          stage: APPLICATION_STAGES.SHORTLISTED,
        });

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // PART 4: ORGANIZATION DELETION ACCESS REVOCATION
  // ==========================================
  describe('Part 4: Organization Deletion User Revocation', () => {
    it('should suspend linked accounts when an admin deletes a company and reject their login', async () => {
      const timestamp = Date.now();
      const password = 'RevokePassword@123';
      const pwHash = await hashPassword(password);

      // Create disposable company with admin and recruiter accounts
      const disposableCompany = await prisma.company.create({
        data: {
          name: `Disposable Corp ${timestamp}`,
          industry: 'Temporary',
        },
      });

      const linkedCompanyUser = await prisma.user.create({
        data: {
          email: `owner-${timestamp}@disposable.test`,
          passwordHash: pwHash,
          role: ROLES.COMPANY,
          status: USER_STATUS.ACTIVE,
          companyId: disposableCompany.id,
        },
      });

      const linkedRecruiterUser = await prisma.user.create({
        data: {
          email: `recruiter-${timestamp}@disposable.test`,
          passwordHash: pwHash,
          role: ROLES.RECRUITER,
          status: USER_STATUS.ACTIVE,
          companyId: disposableCompany.id,
        },
      });

      await prisma.recruiterProfile.create({
        data: {
          userId: linkedRecruiterUser.id,
          companyId: disposableCompany.id,
          title: 'Disposable Recruiter',
        },
      });

      // Super Admin deletes the organization
      const delRes = await request(app)
        .delete(`/api/companies/${disposableCompany.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(delRes.status).toBe(200);

      // Check users are now SUSPENDED in DB
      const checkCompanyUser = await prisma.user.findUnique({ where: { id: linkedCompanyUser.id } });
      const checkRecruiterUser = await prisma.user.findUnique({ where: { id: linkedRecruiterUser.id } });

      expect(checkCompanyUser?.status).toBe(USER_STATUS.SUSPENDED);
      expect(checkRecruiterUser?.status).toBe(USER_STATUS.SUSPENDED);

      // Attempting to log in with revoked credentials must be rejected with 403
      const loginAttempt1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: linkedCompanyUser.email,
          password,
        });

      expect(loginAttempt1.status).toBe(403);
      expect(loginAttempt1.body.message).toContain('suspended');

      const loginAttempt2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: linkedRecruiterUser.email,
          password,
        });

      expect(loginAttempt2.status).toBe(403);
      expect(loginAttempt2.body.message).toContain('suspended');
    });
  });
});
