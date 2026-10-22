import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { signAccessToken } from '../src/utils/jwt';
import { ROLES, USER_STATUS } from '../src/config/constants';

describe('Admin User Management & Interview Usability API', () => {
  let adminToken: string;
  let recruiterToken: string;
  let applicantToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Find or create admin
    let admin = await prisma.user.findFirst({
      where: { role: ROLES.SUPER_ADMIN, status: USER_STATUS.ACTIVE },
    });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: `admin-test-${Date.now()}@hireflow.test`,
          passwordHash: 'dummyhash',
          role: ROLES.SUPER_ADMIN,
          status: USER_STATUS.ACTIVE,
        },
      });
    }
    adminUserId = admin.id;
    adminToken = signAccessToken({
      userId: admin.id,
      email: admin.email,
      role: ROLES.SUPER_ADMIN,
    });

    // Create a recruiter
    const recruiterUser = await prisma.user.create({
      data: {
        email: `recruiter-test-${Date.now()}@hireflow.test`,
        passwordHash: 'dummyhash',
        role: ROLES.RECRUITER,
        status: USER_STATUS.ACTIVE,
      },
    });
    const company = await prisma.company.create({
      data: {
        name: `Test Co ${Date.now()}`,
      },
    });
    const recruiterProfile = await prisma.recruiterProfile.create({
      data: {
        userId: recruiterUser.id,
        companyId: company.id,
        title: 'Talent Lead',
      },
    });
    recruiterToken = signAccessToken({
      userId: recruiterUser.id,
      email: recruiterUser.email,
      role: ROLES.RECRUITER,
      companyId: company.id,
      recruiterId: recruiterProfile.id,
    });

    // Create an applicant
    const applicantUser = await prisma.user.create({
      data: {
        email: `applicant-test-${Date.now()}@hireflow.test`,
        passwordHash: 'dummyhash',
        role: ROLES.APPLICANT,
        status: USER_STATUS.ACTIVE,
      },
    });
    const applicantProfile = await prisma.applicantProfile.create({
      data: {
        userId: applicantUser.id,
        fullName: 'Jane Candidate',
      },
    });
    applicantToken = signAccessToken({
      userId: applicantUser.id,
      email: applicantUser.email,
      role: ROLES.APPLICANT,
      applicantId: applicantProfile.id,
    });
  });

  describe('Admin User Management Authorization & CRUD', () => {
    let createdUserId: string;

    it('denies non-admin users from accessing admin user endpoints', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${recruiterToken}`);
      expect(res.status).toBe(403);
    });

    it('lists users with pagination and search', async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=5&search=test')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(typeof res.body.data.total).toBe('number');
      expect(res.body.data.page).toBe(1);
    });

    it('creates a new user with proper profile and hashed password', async () => {
      const newUserEmail = `newcandidate-${Date.now()}@hireflow.test`;
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: newUserEmail,
          password: 'Password123!',
          role: ROLES.APPLICANT,
          fullName: 'New Candidate Test',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(newUserEmail);
      expect(res.body.data.role).toBe(ROLES.APPLICANT);
      expect(res.body.data.applicantProfile.fullName).toBe('New Candidate Test');
      expect(res.body.data.passwordHash).toBeUndefined(); // Never return password hash!
      createdUserId = res.body.data.id;
    });

    it('updates user details', async () => {
      const res = await request(app)
        .patch(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Updated Candidate Name',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.applicantProfile.fullName).toBe('Updated Candidate Name');
    });

    it('prevents self-suspension of Super Admin account', async () => {
      const res = await request(app)
        .patch(`/api/users/${adminUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: USER_STATUS.SUSPENDED,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot suspend your own');
    });

    it('prevents self-deletion of Super Admin account', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot delete your own');
    });

    it('deletes an unlinked candidate user cleanly', async () => {
      const res = await request(app)
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('Scheduled Interviews Search and Usability', () => {
    it('supports interview search, filter, and pagination query params', async () => {
      const res = await request(app)
        .get('/api/interviews?page=1&limit=10&search=test&sortBy=upcoming')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.interviews)).toBe(true);
      expect(typeof res.body.data.total).toBe('number');
    });

    it('returns raw array when page/limit are omitted for backward compatibility', async () => {
      const res = await request(app)
        .get('/api/interviews')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
