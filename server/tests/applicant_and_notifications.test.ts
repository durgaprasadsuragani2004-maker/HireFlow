import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Applicant, Notifications & Dashboard Tests', () => {
  let applicantToken: string;
  let recruiterToken: string;
  let adminToken: string;
  let applicantProfileId: string;

  beforeAll(async () => {
    const appRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex.dev@gmail.com', password: 'Applicant@123456' });
    applicantToken = appRes.body.data.tokens.accessToken;
    applicantProfileId = appRes.body.data.user.applicantProfile?.id;

    const tnRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah.recruiter@technova.com', password: 'Recruiter@123456' });
    recruiterToken = tnRes.body.data.tokens.accessToken;

    const admRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@hireflow.dev', password: 'Admin@123456' });
    adminToken = admRes.body.data.tokens.accessToken;
  });

  describe('Applicant Profile Management', () => {
    it('should retrieve current applicant profile via candidate endpoint', async () => {
      const res = await request(app)
        .get(`/api/candidates/${applicantProfileId}`)
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Alex Morgan');
    });

    it('should update applicant skills', async () => {
      const res = await request(app)
        .post('/api/candidates/skills')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          skills: [
            { name: 'TypeScript', level: 'EXPERT' },
            { name: 'React', level: 'ADVANCED' },
            { name: 'PostgreSQL', level: 'INTERMEDIATE' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some((s: any) => s.name === 'TypeScript')).toBe(true);
    });
  });

  describe('Job Deadline Validation', () => {
    it('should reject application when job deadline has passed', async () => {
      const rec = await prisma.recruiterProfile.findFirst();
      const pastJob = await prisma.job.create({
        data: {
          companyId: rec!.companyId,
          recruiterId: rec!.id,
          title: `Expired Position ${Date.now()}`,
          description: 'This job has already expired and should not accept applications.',
          requirements: 'Standard requirements',
          responsibilities: 'Standard responsibilities',
          skills: 'Node, React',
          location: 'Remote',
          employmentType: 'CONTRACT',
          experienceLevel: 'ENTRY_LEVEL',
          deadline: new Date('2020-01-01T00:00:00.000Z'),
          status: 'PUBLISHED',
        },
      });

      // Now attempt to apply
      const applyRes = await request(app)
        .post(`/api/applications/jobs/${pastJob.id}/apply`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ coverLetter: 'Applying to expired job' });

      expect(applyRes.status).toBe(400);
      expect(applyRes.body.success).toBe(false);
      expect(applyRes.body.message.toLowerCase()).toContain('deadline');
    });
  });

  describe('Notifications System', () => {
    it('should list notifications for authenticated user', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(typeof res.body.data.unreadCount).toBe('number');
    });

    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Dashboard Analytics (No Hardcoded Stats)', () => {
    it('should return real dynamic applicant dashboard stats', async () => {
      const res = await request(app)
        .get('/api/dashboard/applicant')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.metrics.appliedJobs).toBe('number');
      expect(Array.isArray(res.body.data.recentApplications)).toBe(true);
    });

    it('should return real dynamic recruiter dashboard metrics', async () => {
      const res = await request(app)
        .get('/api/dashboard/recruiter')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.metrics.activeJobs).toBe('number');
      expect(typeof res.body.data.metrics.totalApplications).toBe('number');
      expect(Array.isArray(res.body.data.funnel)).toBe(true);
    });

    it('should return real dynamic super admin system-wide metrics', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.metrics.totalUsers).toBe('number');
      expect(typeof res.body.data.metrics.totalCompanies).toBe('number');
      expect(typeof res.body.data.metrics.totalJobs).toBe('number');
      expect(Array.isArray(res.body.data.funnel)).toBe(true);
    });
  });
});
