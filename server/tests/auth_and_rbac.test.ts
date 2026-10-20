import request from 'supertest';
import app from '../src/app';

describe('Authentication & RBAC Tests', () => {
  let applicantToken: string;
  let applicant2Token: string;
  let recruiterToken: string;
  let quantumRecruiterToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Login as seeded users
    const applicantRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex.dev@gmail.com', password: 'Applicant@123456' });
    expect(applicantRes.status).toBe(200);
    applicantToken = applicantRes.body.data.tokens.accessToken;

    const applicant2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'elena.frontend@gmail.com', password: 'Applicant@123456' });
    expect(applicant2Res.status).toBe(200);
    applicant2Token = applicant2Res.body.data.tokens.accessToken;

    const recruiterRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah.recruiter@technova.com', password: 'Recruiter@123456' });
    expect(recruiterRes.status).toBe(200);
    recruiterToken = recruiterRes.body.data.tokens.accessToken;

    const quantumRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'marcus.recruiter@quantum.ai', password: 'Recruiter@123456' });
    expect(quantumRes.status).toBe(200);
    quantumRecruiterToken = quantumRes.body.data.tokens.accessToken;

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@hireflow.dev', password: 'Admin@123456' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.tokens.accessToken;
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@hireflow.dev', password: 'WrongPassword999' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'AnyPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'Password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should not return password hash in login response', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alex.dev@gmail.com', password: 'Applicant@123456' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.password).toBeUndefined();
    });
  });

  describe('POST /api/auth/register', () => {
    it('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'alex.dev@gmail.com',
          password: 'Password@1234',
          role: 'APPLICANT',
          fullName: 'Duplicate Alex',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Token Verification & Auth Middleware', () => {
    it('should reject unauthenticated request with missing token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('token');
    });

    it('should reject malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer totally-invalid-jwt-token-string');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid');
    });

    it('should return profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('alex.dev@gmail.com');
      expect(res.body.data.role).toBe('APPLICANT');
      expect(res.body.data.passwordHash).toBeUndefined();
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should forbid APPLICANT from creating a job', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          title: 'Unauthorized Job',
          description: 'This job should be blocked by RBAC middleware',
          requirements: 'Some requirements here',
          responsibilities: 'Some responsibilities here',
          skills: 'React, Node',
          location: 'Remote',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID_LEVEL',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should forbid APPLICANT from accessing recruiter dashboard', async () => {
      const res = await request(app)
        .get('/api/dashboard/recruiter')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(403);
    });

    it('should forbid APPLICANT from accessing admin dashboard', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow RECRUITER to create a job', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          title: 'Automated Test Engineer',
          description: 'Looking for a skilled QA and automation specialist to join the team.',
          requirements: '3+ years with Jest, Playwright, or Cypress.',
          responsibilities: 'Write regression tests and maintain CI pipelines.',
          skills: 'TypeScript, Jest, Playwright, CI/CD',
          location: 'Remote',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID_LEVEL',
          salaryMin: 110000,
          salaryMax: 140000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Automated Test Engineer');
    });

    it('should allow SUPER_ADMIN to access admin endpoints', async () => {
      const res = await request(app)
        .get('/api/auth/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThan(0);
    });

    it('should forbid RECRUITER from accessing admin endpoints', async () => {
      const res = await request(app)
        .get('/api/auth/admin/users')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(403);
    });

    it('should forbid RECRUITER from accessing candidate who never applied to their company', async () => {
      const allCandidates = await request(app)
        .get('/api/candidates')
        .set('Authorization', `Bearer ${adminToken}`);

      // Elena Rostova applied to TechNova, not QuantumLabs
      const candidate = allCandidates.body.data.find(
        (c: any) => c.fullName === 'Elena Rostova'
      );

      if (candidate) {
        const res = await request(app)
          .get(`/api/candidates/${candidate.id}`)
          .set('Authorization', `Bearer ${quantumRecruiterToken}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toContain('Forbidden');
      }
    });

    it('should enforce RBAC on resume download (unauthenticated rejected)', async () => {
      const res = await request(app).get('/api/resumes/alex_morgan_resume.pdf');
      expect(res.status).toBe(401);
    });

    it('should enforce RBAC on resume download (unrelated applicant rejected)', async () => {
      const res = await request(app)
        .get('/api/resumes/alex_morgan_resume.pdf')
        .set('Authorization', `Bearer ${applicant2Token}`);

      expect(res.status).toBe(403);
    });

    it('should allow applicant to download their own resume', async () => {
      const res = await request(app)
        .get('/api/resumes/alex_morgan_resume.pdf')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('pdf');
    });
  });
});
