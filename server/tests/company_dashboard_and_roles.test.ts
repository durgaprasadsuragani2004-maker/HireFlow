import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { signAccessToken } from '../src/utils/jwt';
import { ROLES, USER_STATUS } from '../src/config/constants';

describe('Company Dashboard & Company Role RBAC Tests', () => {
  let companyUser: any;
  let companyToken: string;
  let applicantToken: string;
  let company: any;

  beforeAll(async () => {
    // 1. Create a Company entity
    company = await prisma.company.create({
      data: {
        name: `Modern UI Corp ${Date.now()}`,
        description: 'Testing modern company dashboard integration',
        industry: 'Software',
        location: 'San Francisco, CA',
      },
    });

    // 2. Create a User with role = COMPANY
    companyUser = await prisma.user.create({
      data: {
        email: `company-role-${Date.now()}@hireflow.test`,
        passwordHash: 'dummyhash',
        role: ROLES.COMPANY,
        status: USER_STATUS.ACTIVE,
      },
    });

    // Link company to user if supported, or via recruiterProfile / companyId
    // Note: In schema, RecruiterProfile links User to Company
    await prisma.recruiterProfile.create({
      data: {
        userId: companyUser.id,
        companyId: company.id,
        title: 'Company Administrator',
      },
    });

    companyToken = signAccessToken({
      userId: companyUser.id,
      email: companyUser.email,
      role: ROLES.COMPANY,
      companyId: company.id,
    });

    // Create an Applicant user
    const applicantUser = await prisma.user.create({
      data: {
        email: `applicant-comp-test-${Date.now()}@hireflow.test`,
        passwordHash: 'dummyhash',
        role: ROLES.APPLICANT,
        status: USER_STATUS.ACTIVE,
      },
    });

    applicantToken = signAccessToken({
      userId: applicantUser.id,
      email: applicantUser.email,
      role: ROLES.APPLICANT,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/dashboard/company', () => {
    it('should return company dashboard data for COMPANY role user', async () => {
      const res = await request(app)
        .get('/api/dashboard/company')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.company).toBeDefined();
      expect(res.body.data.company.id).toBe(company.id);
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.funnel).toBeInstanceOf(Array);
      expect(res.body.data.recruiters).toBeInstanceOf(Array);
      expect(res.body.data.jobs).toBeInstanceOf(Array);
    });

    it('should reject APPLICANT role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/dashboard/company')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/dashboard/company');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users for COMPANY role', () => {
    it('should allow COMPANY role to list recruiters in their company', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeInstanceOf(Array);
      // All returned users must belong to this company
      for (const u of res.body.data.users) {
        expect(u.recruiterProfile?.companyId).toBe(company.id);
      }
    });
  });
});
