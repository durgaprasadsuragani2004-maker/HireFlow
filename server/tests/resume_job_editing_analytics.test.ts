import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { APPLICATION_STAGES } from '../src/config/constants';

describe('Resume Auth, Application Status, Job Editing, & Company Analytics Tests', () => {
  let adminToken: string;
  let technovaRecruiterToken: string;
  let quantumRecruiterToken: string;
  let applicantToken: string;
  let applicant2Token: string;

  let technovaCompanyId: string;
  let quantumCompanyId: string;
  let technovaJobId: string;
  let quantumJobId: string;

  beforeAll(async () => {
    // 1. Authenticate users
    const [adminRes, techRes, quantRes, appRes, app2Res] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'admin@hireflow.dev', password: 'Admin@123456' }),
      request(app).post('/api/auth/login').send({ email: 'sarah.recruiter@technova.com', password: 'Recruiter@123456' }),
      request(app).post('/api/auth/login').send({ email: 'marcus.recruiter@quantum.ai', password: 'Recruiter@123456' }),
      request(app).post('/api/auth/login').send({ email: 'alex.dev@gmail.com', password: 'Applicant@123456' }),
      request(app).post('/api/auth/login').send({ email: 'elena.frontend@gmail.com', password: 'Applicant@123456' }),
    ]);

    expect(adminRes.status).toBe(200);
    expect(techRes.status).toBe(200);
    expect(quantRes.status).toBe(200);
    expect(appRes.status).toBe(200);
    expect(app2Res.status).toBe(200);

    adminToken = adminRes.body.data.tokens.accessToken;
    technovaRecruiterToken = techRes.body.data.tokens.accessToken;
    quantumRecruiterToken = quantRes.body.data.tokens.accessToken;
    applicantToken = appRes.body.data.tokens.accessToken;
    applicant2Token = app2Res.body.data.tokens.accessToken;

    // 2. Fetch company and job records
    const technova = await prisma.company.findFirst({ where: { name: { contains: 'TechNova' } } });
    const quantum = await prisma.company.findFirst({ where: { name: { contains: 'Quantum' } } });
    expect(technova).toBeDefined();
    expect(quantum).toBeDefined();
    technovaCompanyId = technova!.id;
    quantumCompanyId = quantum!.id;

    const techJob = await prisma.job.findFirst({ where: { companyId: technovaCompanyId } });
    const quantJob = await prisma.job.findFirst({ where: { companyId: quantumCompanyId } });
    expect(techJob).toBeDefined();
    expect(quantJob).toBeDefined();
    technovaJobId = techJob!.id;
    quantumJobId = quantJob!.id;
  });

  // ==========================================
  // 1. RESUME ACCESS & AUTHORIZATION TESTS
  // ==========================================
  describe('Resume Access & Authorization', () => {
    it('should deny unauthenticated resume requests with 401', async () => {
      const res = await request(app).get('/api/resumes/alex_morgan_resume.pdf');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication token is required');
    });

    it('should allow Super Admin to download resumes via Authorization header', async () => {
      const res = await request(app)
        .get('/api/resumes/alex_morgan_resume.pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should allow resume download when token is supplied as query parameter for new tabs', async () => {
      const res = await request(app).get(
        `/api/resumes/alex_morgan_resume.pdf?token=${adminToken}&view=inline`
      );

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });

    it('should allow candidate to download their own resume', async () => {
      const res = await request(app)
        .get('/api/resumes/alex_morgan_resume.pdf')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny candidate from downloading another candidate resume with 403', async () => {
      const res = await request(app)
        .get('/api/resumes/elena_rostova_resume.pdf')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot download another candidate’s resume');
    });

    it('should allow Recruiter to download resume of candidate applied to their company', async () => {
      const res = await request(app)
        .get('/api/resumes/alex_morgan_resume.pdf')
        .set('Authorization', `Bearer ${technovaRecruiterToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny Recruiter from downloading resume of candidate not applied to their company', async () => {
      // Create a temporary candidate who only applied to Quantum
      const uniqueSuffix = Date.now();
      const userTemp = await prisma.user.create({
        data: {
          email: `temp.candidate.${uniqueSuffix}@test.com`,
          passwordHash: 'hashed',
          role: 'APPLICANT',
        },
      });

      const profileTemp = await prisma.applicantProfile.create({
        data: {
          userId: userTemp.id,
          fullName: 'Quantum Sole Candidate',
          resumeFileName: `temp_resume_${uniqueSuffix}.pdf`,
        },
      });

      // Candidate applied to Quantum only
      await prisma.application.create({
        data: {
          jobId: quantumJobId,
          applicantId: profileTemp.id,
          currentStage: APPLICATION_STAGES.APPLIED,
        },
      });

      // TechNova recruiter attempts to download this Quantum-only candidate's resume
      const res = await request(app)
        .get(`/api/resumes/temp_resume_${uniqueSuffix}.pdf`)
        .set('Authorization', `Bearer ${technovaRecruiterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('outside your company applications');

      // Clean up
      await prisma.application.deleteMany({ where: { applicantId: profileTemp.id } });
      await prisma.applicantProfile.delete({ where: { id: profileTemp.id } });
      await prisma.user.delete({ where: { id: userTemp.id } });
    });
  });

  // ==========================================
  // 2. JOB POSTINGS APPLICATION STATUS TESTS
  // ==========================================
  describe('Application Status on Job Postings', () => {
    it('should return hasApplied: true and applicationInfo for jobs the applicant applied to', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const jobs = res.body.data;
      const appliedJob = jobs.find((j: any) => j.id === technovaJobId);
      if (appliedJob) {
        expect(appliedJob.hasApplied).toBe(true);
        expect(appliedJob.applicationInfo).toBeDefined();
        expect(appliedJob.applicationInfo.currentStage).toBeDefined();
      }
    });

    it('should return hasApplied: false for jobs applicant has not applied to', async () => {
      // Create a new job that applicant hasn't applied to
      const newJob = await prisma.job.create({
        data: {
          companyId: technovaCompanyId,
          recruiterId: (await prisma.recruiterProfile.findFirst({ where: { companyId: technovaCompanyId } }))!.id,
          title: `Brand New Position ${Date.now()}`,
          description: 'Full stack development role for testing application status.',
          requirements: 'TypeScript and Node.js testing requirements.',
          responsibilities: 'Build scalable software features.',
          skills: 'TypeScript, React',
          location: 'Remote',
          status: 'PUBLISHED',
        },
      });

      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      const jobs = res.body.data;
      const found = jobs.find((j: any) => j.id === newJob.id);
      expect(found).toBeDefined();
      expect(found.hasApplied).toBe(false);
      expect(found.applicationInfo).toBeNull();

      // Clean up
      await prisma.job.delete({ where: { id: newJob.id } });
    });
  });

  // ==========================================
  // 3. REAPPLICATION & DUPLICATE PROTECTION
  // ==========================================
  describe('Duplicate Applications & Reapplication after Rejection', () => {
    let testJobId: string;

    beforeAll(async () => {
      const recruiter = await prisma.recruiterProfile.findFirst({ where: { companyId: technovaCompanyId } });
      const job = await prisma.job.create({
        data: {
          companyId: technovaCompanyId,
          recruiterId: recruiter!.id,
          title: `Reapplication Test Position ${Date.now()}`,
          description: 'Position to verify application lifecycle and reapplication.',
          requirements: 'Experience with automated application testing.',
          responsibilities: 'Deliver clean robust full stack code.',
          skills: 'Node.js, Express',
          location: 'Remote',
          status: 'PUBLISHED',
        },
      });
      testJobId = job.id;
    });

    afterAll(async () => {
      await prisma.applicationStageHistory.deleteMany({
        where: { application: { jobId: testJobId } },
      });
      await prisma.application.deleteMany({ where: { jobId: testJobId } });
      await prisma.job.delete({ where: { id: testJobId } });
    });

    it('should submit first application successfully', async () => {
      const res = await request(app)
        .post(`/api/applications/jobs/${testJobId}/apply`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ coverLetter: 'Initial application statement.' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStage).toBe(APPLICATION_STAGES.APPLIED);
    });

    it('should prevent duplicate application while current application is active', async () => {
      const res = await request(app)
        .post(`/api/applications/jobs/${testJobId}/apply`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ coverLetter: 'Second attempt should be rejected.' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already submitted');
    });

    it('should permit reapplication after rejection and preserve stage history', async () => {
      const applicantUser = await prisma.user.findUnique({ where: { email: 'alex.dev@gmail.com' }, include: { applicantProfile: true } });
      const appRecord = await prisma.application.findUnique({
        where: {
          jobId_applicantId: {
            jobId: testJobId,
            applicantId: applicantUser!.applicantProfile!.id,
          },
        },
      });
      expect(appRecord).toBeDefined();

      // Recruiter rejects candidate
      const rejectRes = await request(app)
        .patch(`/api/applications/${appRecord!.id}/stage`)
        .set('Authorization', `Bearer ${technovaRecruiterToken}`)
        .send({ stage: APPLICATION_STAGES.REJECTED, reason: 'Skills not aligned for current opening' });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.currentStage).toBe(APPLICATION_STAGES.REJECTED);

      // Now candidate reapplies!
      const reapplyRes = await request(app)
        .post(`/api/applications/jobs/${testJobId}/apply`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ coverLetter: 'Updated cover letter highlighting new certifications!' });

      expect([200, 201]).toContain(reapplyRes.status);
      expect(reapplyRes.body.success).toBe(true);
      expect(reapplyRes.body.data.currentStage).toBe(APPLICATION_STAGES.APPLIED);

      // Verify auditable stage history preserved previous rejection
      const history = await prisma.applicationStageHistory.findMany({
        where: { applicationId: appRecord!.id },
        orderBy: { changedAt: 'asc' },
      });

      expect(history.length).toBeGreaterThanOrEqual(3);
      const reapplicationEntry = history.find((h) => h.reason?.includes('re-applied'));
      expect(reapplicationEntry).toBeDefined();
      expect(reapplicationEntry!.previousStage).toBe(APPLICATION_STAGES.REJECTED);
      expect(reapplicationEntry!.newStage).toBe(APPLICATION_STAGES.APPLIED);
    });

    it('should reject application to closed or expired job', async () => {
      // Create closed job
      const closedJob = await prisma.job.create({
        data: {
          companyId: technovaCompanyId,
          recruiterId: (await prisma.recruiterProfile.findFirst({ where: { companyId: technovaCompanyId } }))!.id,
          title: 'Closed Position',
          description: 'Job description for closed position.',
          requirements: 'Basic requirements.',
          responsibilities: 'Responsibilities.',
          skills: 'Testing',
          location: 'Remote',
          status: 'ARCHIVED',
        },
      });

      const res = await request(app)
        .post(`/api/applications/jobs/${closedJob.id}/apply`)
        .set('Authorization', `Bearer ${applicant2Token}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('no longer accepting applications');

      await prisma.job.delete({ where: { id: closedJob.id } });
    });
  });

  // ==========================================
  // 4. JOB EDITING TESTS
  // ==========================================
  describe('Job Editing Functionality & RBAC', () => {
    let editableJobId: string;

    beforeAll(async () => {
      const recruiter = await prisma.recruiterProfile.findFirst({ where: { companyId: technovaCompanyId } });
      const job = await prisma.job.create({
        data: {
          companyId: technovaCompanyId,
          recruiterId: recruiter!.id,
          title: 'Original Engineer Role',
          description: 'Original job description for testing update capabilities.',
          requirements: 'Original requirements for software engineering.',
          responsibilities: 'Original responsibilities for team member.',
          skills: 'TypeScript, Node.js',
          location: 'New York, NY',
          salaryMin: 120000,
          salaryMax: 150000,
          status: 'PUBLISHED',
        },
      });
      editableJobId = job.id;
    });

    afterAll(async () => {
      await prisma.job.delete({ where: { id: editableJobId } });
    });

    it('should allow authorized Recruiter to edit job within their company', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${editableJobId}`)
        .set('Authorization', `Bearer ${technovaRecruiterToken}`)
        .send({
          title: 'Senior Staff Engineer (Updated)',
          salaryMin: 160000,
          salaryMax: 200000,
          location: 'Remote (US)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Senior Staff Engineer (Updated)');
      expect(res.body.data.salaryMin).toBe(160000);
      expect(res.body.data.location).toBe('Remote (US)');
    });

    it('should deny cross-company job editing by Recruiter with 403', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${editableJobId}`)
        .set('Authorization', `Bearer ${quantumRecruiterToken}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('another company');
    });

    it('should deny applicant from editing jobs with 403', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${editableJobId}`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ title: 'Candidate Attempt' });

      expect(res.status).toBe(403);
    });

    it('should reject invalid salary edits (salaryMin > salaryMax) with 400', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${editableJobId}`)
        .set('Authorization', `Bearer ${technovaRecruiterToken}`)
        .send({
          salaryMin: 250000,
          salaryMax: 100000,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should allow Super Admin to edit any job posting', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${editableJobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Super Admin updated description with verified administrative authority.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toContain('Super Admin updated description');
    });
  });

  // ==========================================
  // 5. COMPANY ANALYTICS & DATA ISOLATION
  // ==========================================
  describe('Company Analytics & Data Isolation', () => {
    it('should return recruitment funnel data strictly scoped to selected company', async () => {
      const res = await request(app)
        .get(`/api/companies/${technovaCompanyId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { funnel, totalJobs, totalApplications } = res.body.data;
      expect(Array.isArray(funnel)).toBe(true);
      expect(funnel.length).toBe(6);

      const stages = funnel.map((f: any) => f.stage);
      expect(stages).toEqual(
        expect.arrayContaining([
          'APPLIED',
          'SCREENING',
          'SHORTLISTED',
          'INTERVIEW',
          'SELECTED',
          'REJECTED',
        ])
      );
      expect(typeof totalJobs).toBe('number');
      expect(typeof totalApplications).toBe('number');
    });

    it('should allow Recruiter to view their own company analytics', async () => {
      const res = await request(app)
        .get(`/api/companies/${technovaCompanyId}/analytics`)
        .set('Authorization', `Bearer ${technovaRecruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.company.id).toBe(technovaCompanyId);
    });

    it('should prevent Recruiter from viewing another company analytics with 403', async () => {
      const res = await request(app)
        .get(`/api/companies/${quantumCompanyId}/analytics`)
        .set('Authorization', `Bearer ${technovaRecruiterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('another company');
    });

    it('should prevent Applicant from accessing company analytics with 403', async () => {
      const res = await request(app)
        .get(`/api/companies/${technovaCompanyId}/analytics`)
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // 6. COMPANY PROFILE MANAGEMENT TESTS
  // ==========================================
  describe('Company Profile Management', () => {
    let createdCompanyId: string;

    it('should allow Super Admin to create a new organization with validation', async () => {
      const companyName = `Test Enterprise Inc ${Date.now()}`;
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: companyName,
          industry: 'Cloud Security',
          location: 'Austin, TX',
          website: 'https://security-test.com',
          companySize: '51-200',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(companyName);
      createdCompanyId = res.body.data.id;
    });

    it('should reject creating duplicate company name with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TechNova Solutions', // already seeded
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('should allow Recruiter to update permitted fields of their company profile', async () => {
      const res = await request(app)
        .patch('/api/companies')
        .set('Authorization', `Bearer ${technovaRecruiterToken}`)
        .send({
          description: 'Updated company description by authorized recruiter.',
          location: 'San Francisco, CA (HQ)',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated company description by authorized recruiter.');
      expect(res.body.data.location).toBe('San Francisco, CA (HQ)');
    });

    it('should deny Recruiter from updating another company profile with 403', async () => {
      const res = await request(app)
        .patch(`/api/companies/${quantumCompanyId}`)
        .set('Authorization', `Bearer ${technovaRecruiterToken}`)
        .send({
          description: 'Unauthorized modification attempt.',
        });

      expect(res.status).toBe(403);
    });

    afterAll(async () => {
      if (createdCompanyId) {
        await prisma.company.delete({ where: { id: createdCompanyId } }).catch(() => {});
      }
    });
  });
});
