import request from 'supertest';
import app from '../src/app';
import { prisma, getCanonicalDatabaseUrl } from '../src/config/database';
import { PrismaClient } from '@prisma/client';
import { ROLES } from '../src/config/constants';

describe('HireFlow — Persistence, Deadline Validation, Company Isolation, and HR Assignment', () => {
  let superAdminToken: string;
  let companyAToken: string;
  let companyBToken: string;
  let recruiterA1Token: string;
  let applicantToken: string;

  let companyAId: string;
  let companyBId: string;
  let recruiterA1Id: string;
  let recruiterB1Id: string;
  let jobAId: string;
  let jobBId: string;

  beforeAll(async () => {
    // Authenticate Super Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@hireflow.dev', password: 'Admin@123456' });
    expect(adminRes.status).toBe(200);
    superAdminToken = adminRes.body.data.tokens.accessToken;

    // Authenticate Company A (TechNova)
    const compARes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'company@technova.com', password: 'Company@123456' });
    expect(compARes.status).toBe(200);
    companyAToken = compARes.body.data.tokens.accessToken;
    companyAId = compARes.body.data.user.companyId;

    // Authenticate Company B (QuantumLabs)
    const compBRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'company@quantumlabs.ai', password: 'Company@123456' });
    expect(compBRes.status).toBe(200);
    companyBToken = compBRes.body.data.tokens.accessToken;
    companyBId = compBRes.body.data.user.companyId;

    // Authenticate Recruiter A1 (Sarah at TechNova)
    const recARes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah.recruiter@technova.com', password: 'Recruiter@123456' });
    expect(recARes.status).toBe(200);
    recruiterA1Token = recARes.body.data.tokens.accessToken;

    // Authenticate Applicant (Alex)
    const appRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex.dev@gmail.com', password: 'Applicant@123456' });
    expect(appRes.status).toBe(200);
    applicantToken = appRes.body.data.tokens.accessToken;

    // Fetch recruiter IDs from database
    const recA1 = await prisma.recruiterProfile.findFirst({
      where: { companyId: companyAId },
    });
    expect(recA1).toBeDefined();
    recruiterA1Id = recA1!.id;

    const recB1 = await prisma.recruiterProfile.findFirst({
      where: { companyId: companyBId },
    });
    expect(recB1).toBeDefined();
    recruiterB1Id = recB1!.id;

    // Find or create test jobs for Company A and Company B
    const jA = await prisma.job.findFirst({ where: { companyId: companyAId } });
    const jB = await prisma.job.findFirst({ where: { companyId: companyBId } });
    jobAId = jA!.id;
    jobBId = jB!.id;

    // Refresh createdAt so both test jobs appear at the top of paginated listings
    await prisma.job.update({ where: { id: jobAId }, data: { createdAt: new Date() } });
    await prisma.job.update({ where: { id: jobBId }, data: { createdAt: new Date() } });
  });

  // =========================================================================
  // REQUIREMENT 1: Database Persistence After Server / Client Reinitialization
  // =========================================================================
  describe('1. Database Persistence Across Client/Server Reinitialization', () => {
    const timestamp = Date.now();
    const newAdminName = `Lead Administrator ${timestamp}`;
    const newCompanyName = `Persistent Corp ${timestamp}`;
    const newCompanyAdminEmail = `admin-${timestamp}@persistentcorp.com`;
    let createdCompanyId: string;
    let createdRecruiterEmail: string;

    it('should edit admin details and persist profile', async () => {
      const updateRes = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ fullName: newAdminName });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.applicantProfile?.fullName || updateRes.body.data.fullName).toBe(newAdminName);

      // Verify profile is readable
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.applicantProfile?.fullName || meRes.body.data.fullName).toBe(newAdminName);
    });

    it('should create a company with its company admin account', async () => {
      const compRes = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: newCompanyName,
          description: 'A test corporation for verifying persistent storage.',
          location: 'Austin, TX',
          website: 'https://persistentcorp.com',
          adminEmail: newCompanyAdminEmail,
          adminPassword: 'Password@123456',
        });

      expect(compRes.status).toBe(201);
      expect(compRes.body.data.name).toBe(newCompanyName);
      expect(compRes.body.data.adminAccount.email).toBe(newCompanyAdminEmail);
      createdCompanyId = compRes.body.data.id;
    });

    it('should add an HR/Recruiter employee to the newly created company', async () => {
      createdRecruiterEmail = `recruiter-${timestamp}@persistentcorp.com`;
      const recUserRes = await request(app)
        .post('/api/auth/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: createdRecruiterEmail,
          password: 'Recruiter@123456',
          role: ROLES.RECRUITER,
          companyId: createdCompanyId,
          recruiterProfile: {
            title: 'Senior Technical Talent Partner',
            department: 'Talent Acquisition',
          },
        });

      expect(recUserRes.status).toBe(201);
      expect(recUserRes.body.data.email).toBe(createdRecruiterEmail);
    });

    it('MANDATORY PERSISTENCE TEST: Records must survive DB client reinitialization and simulate server restart', async () => {
      // Disconnect current Prisma client to close all active connections
      await prisma.$disconnect();

      // Create a brand new, isolated Prisma client instance pointing to canonical SQLite URL
      const canonicalUrl = getCanonicalDatabaseUrl();
      const freshPrisma = new PrismaClient({
        datasources: { db: { url: canonicalUrl } },
      });

      try {
        // 1. Verify Super Admin updated details persisted in database
        const adminUser = await freshPrisma.user.findUnique({
          where: { email: 'admin@hireflow.dev' },
          include: { applicantProfile: true },
        });
        expect(adminUser).not.toBeNull();
        expect(adminUser?.applicantProfile?.fullName).toBe(newAdminName);

        // 2. Verify Company persisted in database
        const companyRecord = await freshPrisma.company.findUnique({
          where: { id: createdCompanyId },
        });
        expect(companyRecord).not.toBeNull();
        expect(companyRecord?.name).toBe(newCompanyName);

        // 3. Verify Company admin user persisted
        const companyAdminUser = await freshPrisma.user.findUnique({
          where: { email: newCompanyAdminEmail },
        });
        expect(companyAdminUser).not.toBeNull();
        expect(companyAdminUser?.companyId).toBe(createdCompanyId);
        expect(companyAdminUser?.role).toBe(ROLES.COMPANY);

        // 4. Verify added HR/Recruiter user persisted
        const recruiterUser = await freshPrisma.user.findUnique({
          where: { email: createdRecruiterEmail },
          include: { recruiterProfile: true },
        });
        expect(recruiterUser).not.toBeNull();
        expect(recruiterUser?.role).toBe(ROLES.RECRUITER);
        expect(recruiterUser?.recruiterProfile?.companyId).toBe(createdCompanyId);
        expect(recruiterUser?.recruiterProfile?.title).toBe('Senior Technical Talent Partner');
      } finally {
        await freshPrisma.$disconnect();
        // Reconnect default prisma client
        await prisma.$connect();
      }
    });
  });

  // =========================================================================
  // REQUIREMENT 2: Job Deadline Validation — Reject Past Dates
  // =========================================================================
  describe('2. Job Deadline Validation — Reject Past Dates', () => {
    it('should reject job creation with yesterday date with HTTP 400', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          title: `Past Deadline Job ${Date.now()}`,
          description: 'This job posting should be rejected because deadline is in the past.',
          requirements: 'TypeScript and Node.js experience',
          responsibilities: 'Core platform engineering',
          skills: 'TypeScript, Express',
          location: 'San Francisco, CA',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID_LEVEL',
          recruiterId: recruiterA1Id,
          status: 'PUBLISHED',
          deadline: yesterdayStr,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errorMsg = JSON.stringify(res.body);
      expect(errorMsg).toMatch(/Application deadline cannot be in the past/i);
    });

    it('should reject job creation with malformed date with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          title: `Malformed Deadline Job ${Date.now()}`,
          description: 'This job posting should be rejected because deadline is invalid.',
          requirements: 'TypeScript and Node.js experience',
          responsibilities: 'Core platform engineering',
          skills: 'TypeScript, Express',
          location: 'San Francisco, CA',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID_LEVEL',
          recruiterId: recruiterA1Id,
          status: 'PUBLISHED',
          deadline: 'invalid-deadline-string-2026',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should accept job creation with today date with HTTP 201', async () => {
      const todayStr = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          title: `Today Deadline Job ${Date.now()}`,
          description: 'This job posting is valid because today is allowed through end-of-day.',
          requirements: 'TypeScript and Node.js experience',
          responsibilities: 'Core platform engineering',
          skills: 'TypeScript, Express',
          location: 'San Francisco, CA',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID_LEVEL',
          recruiterId: recruiterA1Id,
          status: 'PUBLISHED',
          deadline: todayStr,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deadline).toContain('T23:59:59.999Z');
    });

    it('should accept job creation with future date with HTTP 201', async () => {
      const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const futureStr = future.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          title: `Future Deadline Job ${Date.now()}`,
          description: 'This job posting is valid with two weeks remaining until closing.',
          requirements: 'TypeScript and Node.js experience',
          responsibilities: 'Core platform engineering',
          skills: 'TypeScript, Express',
          location: 'San Francisco, CA',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID_LEVEL',
          recruiterId: recruiterA1Id,
          status: 'PUBLISHED',
          deadline: futureStr,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject updating an existing job with a past deadline with HTTP 400', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const res = await request(app)
        .put(`/api/jobs/${jobAId}`)
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          deadline: yesterdayStr,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errorMsg = JSON.stringify(res.body);
      expect(errorMsg).toMatch(/Application deadline cannot be in the past/i);
    });
  });

  // =========================================================================
  // REQUIREMENT 3: Strict Company-Level Job Visibility
  // =========================================================================
  describe('3. Strict Company-Level Job Visibility & Multi-Tenant Scoping', () => {
    it('COMPANY role: listing jobs returns ONLY jobs belonging to own company', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify every single returned job belongs exclusively to Company A
      for (const j of res.body.data) {
        expect(j.companyId).toBe(companyAId);
        expect(j.companyId).not.toBe(companyBId);
      }
    });

    it('COMPANY role: accessing another company job ID via GET /jobs/:id returns 404', async () => {
      const res = await request(app)
        .get(`/api/jobs/${jobBId}`)
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('COMPANY role: editing another company job ID via PUT /jobs/:id returns 403 or 404', async () => {
      const res = await request(app)
        .put(`/api/jobs/${jobBId}`)
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({ title: 'Malicious Cross-Tenant Job Edit' });

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('COMPANY role: deleting another company job ID via DELETE /jobs/:id returns 403 or 404', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${jobBId}`)
        .set('Authorization', `Bearer ${companyAToken}`);

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('RECRUITER role: listing jobs returns only own company jobs assigned to recruiter', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${recruiterA1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      for (const j of res.body.data) {
        expect(j.companyId).toBe(companyAId);
        expect(j.recruiterId).toBe(recruiterA1Id);
      }
    });

    it('APPLICANT role: listing jobs returns published jobs across companies', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Applicant can browse jobs across companies
      const companyIds = new Set(res.body.data.map((j: any) => j.companyId));
      expect(companyIds.size).toBeGreaterThanOrEqual(1);

      // Every job visible to applicant must be PUBLISHED
      for (const j of res.body.data) {
        expect(j.status).toBe('PUBLISHED');
      }
    });

    it('SUPER_ADMIN role: listing jobs returns global view across all companies', async () => {
      const res = await request(app)
        .get('/api/jobs?limit=100')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const companyIds = new Set(res.body.data.map((j: any) => j.companyId));
      expect(companyIds.has(companyAId)).toBe(true);
      expect(companyIds.has(companyBId)).toBe(true);
    });
  });

  // =========================================================================
  // REQUIREMENT 4: HR Assignment Required When Creating / Publishing Jobs
  // =========================================================================
  describe('4. HR / Recruiter Assignment Enforcement', () => {
    let emptyCompanyId: string;
    let emptyCompanyToken: string;

    beforeAll(async () => {
      // Create a company with 0 recruiters
      const compRes = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: `HR-Less Company ${Date.now()}`,
          location: 'Seattle, WA',
          website: 'https://hrless.com',
          adminEmail: `admin-${Date.now()}@hrless.com`,
          adminPassword: 'Password@123456',
        });
      emptyCompanyId = compRes.body.data.id;

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: compRes.body.data.adminAccount.email,
          password: 'Password@123456',
        });
      emptyCompanyToken = loginRes.body.data.tokens.accessToken;
    });

    it('should reject publishing job if company has no eligible HR accounts', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${emptyCompanyToken}`)
        .send({
          title: 'Position with No HR',
          description: 'This job should be blocked because the company has no recruiters.',
          requirements: 'Engineering skills',
          responsibilities: 'Core engineering',
          skills: 'Node.js',
          location: 'Remote',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID_LEVEL',
          status: 'PUBLISHED',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/HR\/Recruiter required — this company has no eligible HR accounts/i);
    });

    it('should reject Super Admin assigning a recruiter from Company B to Company A job', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Cross-Company Recruiter Job',
          description: 'This job assignment should be rejected because recruiter is from company B.',
          requirements: 'Engineering skills',
          responsibilities: 'Core engineering',
          skills: 'Node.js',
          location: 'Remote',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID_LEVEL',
          companyId: companyAId,
          recruiterId: recruiterB1Id,
          status: 'PUBLISHED',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/recruiter does not belong to the selected company/i);
    });

    it('should allow publishing job when a valid HR recruiter from the company is assigned', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          title: `Compliant Published Job ${Date.now()}`,
          description: 'This job is completely valid with company HR recruiter assigned.',
          requirements: 'TypeScript and Node.js expertise',
          responsibilities: 'Full stack architecture',
          skills: 'TypeScript, React, PostgreSQL',
          location: 'San Francisco, CA',
          employmentType: 'FULL_TIME',
          experienceLevel: 'SENIOR',
          recruiterId: recruiterA1Id,
          status: 'PUBLISHED',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recruiterId).toBe(recruiterA1Id);
      expect(res.body.data.companyId).toBe(companyAId);
      expect(res.body.data.status).toBe('PUBLISHED');
    });
  });
});
