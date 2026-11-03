import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Production Deployment & CORS Verification', () => {
  const testApplicant = {
    email: `test.applicant.${Date.now()}@example.com`,
    password: 'Password@123456',
    role: 'APPLICANT',
    fullName: 'Production Test Applicant',
  };

  const testRecruiter = {
    email: `test.recruiter.${Date.now()}@example.com`,
    password: 'Password@123456',
    role: 'RECRUITER',
    companyName: `Test Corp ${Date.now()}`,
    title: 'Senior Technical Recruiter',
  };

  describe('1. Health Check & Swagger Documentation Endpoints', () => {
    it('GET /api/health should return 200, status ok, and database healthy', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('healthy');
      expect(res.body.service).toBe('HireFlow ATS Backend');
    });

    it('GET /api/docs.json should serve OpenAPI specification with correct metadata', async () => {
      const res = await request(app).get('/api/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.info.title).toBe('HireFlow ATS API');
      expect(res.body.servers).toBeDefined();
      expect(res.body.servers.length).toBeGreaterThan(0);
    });

    it('GET /api/docs should serve Swagger UI HTML or redirect to trailing slash', async () => {
      const res = await request(app).get('/api/docs');
      expect([200, 301, 302]).toContain(res.status);
    });
  });

  describe('2. CORS and Preflight Handling', () => {
    it('should handle OPTIONS preflight request for allowed origin', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow Vercel deployment domains via CORS', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://hireflow-client.vercel.app')
        .set('Access-Control-Request-Method', 'POST');

      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBe('https://hireflow-client.vercel.app');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow Vercel preview branch domains via CORS', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://hireflow-git-main-user.vercel.app')
        .set('Access-Control-Request-Method', 'POST');

      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBe('https://hireflow-git-main-user.vercel.app');
    });

    it('should cleanly reject disallowed origins without 500 error', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-site.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('3. Registration API Integration', () => {
    it('should successfully register a new APPLICANT and create applicant profile', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testApplicant);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testApplicant.email.toLowerCase());
      expect(res.body.data.user.role).toBe('APPLICANT');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      // Database verification
      const dbUser = await prisma.user.findUnique({
        where: { email: testApplicant.email.toLowerCase() },
        include: { applicantProfile: true },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.applicantProfile).not.toBeNull();
      expect(dbUser?.applicantProfile?.fullName).toBe(testApplicant.fullName);
    });

    it('should successfully register a new RECRUITER and create company and recruiter profile', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testRecruiter);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testRecruiter.email.toLowerCase());
      expect(res.body.data.user.role).toBe('RECRUITER');

      // Database verification
      const dbUser = await prisma.user.findUnique({
        where: { email: testRecruiter.email.toLowerCase() },
        include: {
          recruiterProfile: {
            include: { company: true },
          },
        },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.recruiterProfile).not.toBeNull();
      expect(dbUser?.recruiterProfile?.company.name).toBe(testRecruiter.companyName);
      expect(dbUser?.recruiterProfile?.title).toBe(testRecruiter.title);
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testApplicant);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('4. Login API Integration', () => {
    it('should successfully authenticate newly registered applicant', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testApplicant.email,
          password: testApplicant.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testApplicant.email.toLowerCase());
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should successfully authenticate newly registered recruiter', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testRecruiter.email,
          password: testRecruiter.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testRecruiter.email.toLowerCase());
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject login with wrong password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testApplicant.email,
          password: 'IncorrectPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login for non-existent email with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent.user.2026@domain.xyz',
          password: 'SomePassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('5. Database Persistence Verification', () => {
    it('should ensure registered entities remain queryable via independent prisma queries', async () => {
      const applicantUser = await prisma.user.findUnique({
        where: { email: testApplicant.email.toLowerCase() },
        include: { applicantProfile: true },
      });
      expect(applicantUser?.id).toBeDefined();
      expect(applicantUser?.applicantProfile?.id).toBeDefined();

      const recruiterUser = await prisma.user.findUnique({
        where: { email: testRecruiter.email.toLowerCase() },
        include: { recruiterProfile: { include: { company: true } } },
      });
      expect(recruiterUser?.id).toBeDefined();
      expect(recruiterUser?.recruiterProfile?.company.name).toBe(testRecruiter.companyName);
    });
  });
});

