import request from 'supertest';
import app from '../src/app';

describe('Recruitment Pipeline & Kanban Integration Tests', () => {
  let applicantToken: string;
  let techNovaRecruiterToken: string;
  let quantumRecruiterToken: string;
  let testJobId: string;
  let createdAppId: string;
  let createdInterviewId: string;

  beforeAll(async () => {
    // Authenticate users
    const appRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'priya.patel@gmail.com', password: 'Applicant@123456' });
    applicantToken = appRes.body.data.tokens.accessToken;

    const tnRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah.recruiter@technova.com', password: 'Recruiter@123456' });
    techNovaRecruiterToken = tnRes.body.data.tokens.accessToken;

    const qlRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'marcus.recruiter@quantum.ai', password: 'Recruiter@123456' });
    quantumRecruiterToken = qlRes.body.data.tokens.accessToken;

    // Create an isolated job under TechNova
    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${techNovaRecruiterToken}`)
      .send({
        title: `Cloud Infrastructure Architect ${Date.now()}`,
        description: 'Lead multi-region cloud deployment and microservices architecture.',
        requirements: '5+ years AWS/GCP, Kubernetes, Terraform.',
        responsibilities: 'Manage IaC, maintain SLAs, drive reliability.',
        skills: 'Kubernetes, AWS, Terraform, Docker',
        location: 'Remote',
        employmentType: 'FULL_TIME',
        experienceLevel: 'LEAD',
        salaryMin: 160000,
        salaryMax: 210000,
      });

    expect(jobRes.status).toBe(201);
    testJobId = jobRes.body.data.id;
  });

  describe('Job Query & Application Submission', () => {
    it('should return published jobs with pagination', async () => {
      const res = await request(app).get('/api/jobs?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta.limit).toBe(5);
    });

    it('should submit an application for a candidate', async () => {
      const res = await request(app)
        .post(`/api/applications/jobs/${testJobId}/apply`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          coverLetter: 'I am excited about this Cloud Infrastructure position and look forward to hearing from you.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStage).toBe('APPLIED');
      createdAppId = res.body.data.id;
    });

    it('should prevent duplicate application for the same job', async () => {
      const res = await request(app)
        .post(`/api/applications/jobs/${testJobId}/apply`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ coverLetter: 'Duplicate application attempt' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already submitted');
    });
  });

  describe('Kanban Stage Transitions & Audit Trail', () => {
    it('should allow company recruiter to transition candidate to SCREENING', async () => {
      const res = await request(app)
        .patch(`/api/applications/${createdAppId}/stage`)
        .set('Authorization', `Bearer ${techNovaRecruiterToken}`)
        .send({
          stage: 'SCREENING',
          reason: 'Initial criteria met',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStage).toBe('SCREENING');
    });

    it('should allow recruiter to transition candidate to SHORTLISTED', async () => {
      const res = await request(app)
        .patch(`/api/applications/${createdAppId}/stage`)
        .set('Authorization', `Bearer ${techNovaRecruiterToken}`)
        .send({
          stage: 'SHORTLISTED',
          reason: 'Phone screen went well',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.currentStage).toBe('SHORTLISTED');
    });

    it('should retrieve chronological stage transition history', async () => {
      const res = await request(app)
        .get(`/api/applications/${createdAppId}/history`)
        .set('Authorization', `Bearer ${techNovaRecruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      expect(res.body.data[0].newStage).toBe('APPLIED');
      expect(res.body.data[1].newStage).toBe('SCREENING');
      expect(res.body.data[2].newStage).toBe('SHORTLISTED');
    });

    it('should forbid recruiter from Company B from modifying Company A application', async () => {
      const res = await request(app)
        .patch(`/api/applications/${createdAppId}/stage`)
        .set('Authorization', `Bearer ${quantumRecruiterToken}`)
        .send({
          stage: 'REJECTED',
          reason: 'Unauthorized intervention',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });
  });

  describe('Interview Scheduling & Conflict Checking', () => {
    it('should schedule an interview and update stage to INTERVIEW', async () => {
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${techNovaRecruiterToken}`)
        .send({
          applicationId: createdAppId,
          interviewerName: 'Sarah Jenkins',
          interviewerEmail: 'sarah.recruiter@technova.com',
          date: '2026-11-15',
          startTime: '10:00',
          endTime: '11:00',
          interviewType: 'TECHNICAL',
          meetingLink: 'https://meet.google.com/test-pipeline-interview',
          notes: 'Prepare coding question on cloud architecture',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SCHEDULED');
      createdInterviewId = res.body.data.id;
    });

    it('should detect and prevent scheduling conflict for same interviewer at same time', async () => {
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${techNovaRecruiterToken}`)
        .send({
          applicationId: createdAppId,
          interviewerName: 'Sarah Jenkins',
          interviewerEmail: 'sarah.recruiter@technova.com',
          date: '2026-11-15',
          startTime: '10:30', // Overlaps with 10:00 - 11:00
          endTime: '11:30',
          interviewType: 'HR',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already has an interview scheduled');
    });

    it('should fetch interview details by ID', async () => {
      const res = await request(app)
        .get(`/api/interviews/${createdInterviewId}`)
        .set('Authorization', `Bearer ${techNovaRecruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdInterviewId);
    });

    it('should delete/cancel interview by ID', async () => {
      const res = await request(app)
        .delete(`/api/interviews/${createdInterviewId}`)
        .set('Authorization', `Bearer ${techNovaRecruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Kanban Data Structure Endpoint', () => {
    it('should fetch kanban columns for a recruiter job', async () => {
      const res = await request(app)
        .get(`/api/applications/kanban/${testJobId}`)
        .set('Authorization', `Bearer ${techNovaRecruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kanbanData).toHaveProperty('APPLIED');
      expect(res.body.data.kanbanData).toHaveProperty('SCREENING');
      expect(res.body.data.kanbanData).toHaveProperty('SHORTLISTED');
      expect(res.body.data.kanbanData).toHaveProperty('INTERVIEW');
      expect(res.body.data.kanbanData).toHaveProperty('SELECTED');
      expect(res.body.data.kanbanData).toHaveProperty('REJECTED');
    });
  });
});
