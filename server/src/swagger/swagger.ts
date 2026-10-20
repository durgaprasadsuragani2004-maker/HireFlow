import { env } from "../config/env";
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'HireFlow ATS API',
    version: '1.0.0',
    description: `
      Enterprise Applicant Tracking System (ATS) REST API documentation.
      Includes multi-role authentication (Applicant, Recruiter, Super Admin),
      Kanban pipeline management, resume uploads, interview scheduling with conflict detection,
      and real-time notifications.
    `,
    contact: {
      name: 'HireFlow Engineering Team',
      email: 'engineering@hireflow.dev',
    },
  },
  servers: [
    {
      url: `${env.SERVER_URL}/api`,
      description: "Production API Server",
    },
    {
      url: "/api",
      description: "Relative API Base Path",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT bearer token in the Authorization header.',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found' },
          errors: { type: 'array', items: { type: 'string' } },
        },
      },
      Job: {
        type: 'object',
        required: ['title', 'description', 'location', 'employmentType', 'experienceLevel', 'skillsRequired'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Senior Full Stack Engineer' },
          description: { type: 'string', example: 'Join our core platform engineering team...' },
          location: { type: 'string', example: 'Remote - US' },
          employmentType: { type: 'string', enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] },
          experienceLevel: { type: 'string', enum: ['ENTRY', 'MID', 'SENIOR', 'LEAD'] },
          skillsRequired: { type: 'array', items: { type: 'string' }, example: ['TypeScript', 'React', 'Node.js'] },
          salaryMin: { type: 'integer', example: 140000 },
          salaryMax: { type: 'integer', example: 175000 },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          jobId: { type: 'string', format: 'uuid' },
          applicantId: { type: 'string', format: 'uuid' },
          currentStage: {
            type: 'string',
            enum: ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'],
          },
          coverLetter: { type: 'string' },
          notes: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          appliedAt: { type: 'string', format: 'date-time' },
        },
      },
      Interview: {
        type: 'object',
        required: ['applicationId', 'interviewerName', 'interviewerEmail', 'date', 'startTime', 'endTime', 'interviewType'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          applicationId: { type: 'string', format: 'uuid' },
          interviewerName: { type: 'string', example: 'Sarah Jenkins' },
          interviewerEmail: { type: 'string', example: 'sarah@technova.com' },
          date: { type: 'string', example: '2026-10-25' },
          startTime: { type: 'string', example: '14:00' },
          endTime: { type: 'string', example: '15:00' },
          interviewType: { type: 'string', enum: ['TECHNICAL', 'HR', 'MANAGERIAL', 'BEHAVIORAL', 'FINAL'] },
          status: { type: 'string', enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'] },
          meetingLink: { type: 'string', example: 'https://meet.google.com/abc-defg-hij' },
          location: { type: 'string', example: 'HQ Conference Room A' },
          notes: { type: 'string' },
          feedback: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user (Recruiter or Applicant)',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'role'],
                properties: {
                  email: { type: 'string', example: 'alex.dev@gmail.com' },
                  password: { type: 'string', example: 'Applicant@123456' },
                  role: { type: 'string', enum: ['APPLICANT', 'RECRUITER'] },
                  fullName: { type: 'string', example: 'Alex Morgan' },
                  companyName: { type: 'string', example: 'TechNova Solutions' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful' },
          400: { description: 'Validation failed' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user and obtain JWT tokens',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'sarah.recruiter@technova.com' },
                  password: { type: 'string', example: 'Recruiter@123456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token using valid refresh token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Token refreshed' },
          401: { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Revoke active refresh token and logout',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user profile and session data',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile details' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/jobs': {
      get: {
        summary: 'Search and filter jobs with pagination',
        tags: ['Jobs'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'employmentType', in: 'query', schema: { type: 'string' } },
          { name: 'experienceLevel', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Paginated job list' },
        },
      },
      post: {
        summary: 'Create a new job posting (Recruiters & Admins)',
        tags: ['Jobs'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Job' },
            },
          },
        },
        responses: {
          201: { description: 'Job created' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/jobs/{id}': {
      get: {
        summary: 'Get job details by ID',
        tags: ['Jobs'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Job details' },
          404: { description: 'Job not found' },
        },
      },
      patch: {
        summary: 'Update job details (Recruiters & Admins)',
        tags: ['Jobs'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Job updated' },
          403: { description: 'Forbidden' },
        },
      },
      delete: {
        summary: 'Delete or archive job (Recruiters & Admins)',
        tags: ['Jobs'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Job deleted' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/jobs/{id}/publish': {
      patch: {
        summary: 'Publish a draft job posting',
        tags: ['Jobs'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Job published' },
        },
      },
    },
    '/jobs/{id}/unpublish': {
      patch: {
        summary: 'Unpublish/archive a job posting',
        tags: ['Jobs'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Job unpublished' },
        },
      },
    },
    '/applications': {
      post: {
        summary: 'Apply for a job (Applicants only)',
        tags: ['Applications & Pipeline'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jobId'],
                properties: {
                  jobId: { type: 'string', format: 'uuid' },
                  coverLetter: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Application submitted' },
          400: { description: 'Job deadline passed or invalid job status' },
          409: { description: 'Duplicate application' },
        },
      },
    },
    '/applications/my': {
      get: {
        summary: 'List current applicant applications with statuses',
        tags: ['Applications & Pipeline'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Applicant applications' },
        },
      },
    },
    '/applications/{id}/history': {
      get: {
        summary: 'Get chronological stage transition history for an application',
        tags: ['Applications & Pipeline'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Application stage history entries' },
          403: { description: 'Forbidden' },
          404: { description: 'Application not found' },
        },
      },
    },
    '/applications/kanban/{jobId}': {
      get: {
        summary: 'Get candidate applications grouped by Kanban stages for a job',
        tags: ['Applications & Pipeline'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Kanban columns populated with candidates' },
          403: { description: 'Forbidden (company isolation)' },
        },
      },
    },
    '/applications/{id}/stage': {
      patch: {
        summary: 'Transition candidate to a new recruitment stage (Kanban Drag & Drop)',
        tags: ['Applications & Pipeline'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['stage'],
                properties: {
                  stage: {
                    type: 'string',
                    enum: ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'],
                  },
                  reason: { type: 'string', example: 'Passed technical assessment' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Stage changed successfully' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/interviews': {
      get: {
        summary: 'List interviews (Applicant sees own; Recruiter sees company)',
        tags: ['Interviews'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'date', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of scheduled interviews' },
        },
      },
      post: {
        summary: 'Schedule an interview for an application (Recruiters & Admins)',
        tags: ['Interviews'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Interview' },
            },
          },
        },
        responses: {
          201: { description: 'Interview scheduled' },
          409: { description: 'Interviewer schedule conflict' },
        },
      },
    },
    '/interviews/{id}': {
      get: {
        summary: 'Get interview details by ID',
        tags: ['Interviews'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Interview details' },
          403: { description: 'Forbidden' },
          404: { description: 'Interview not found' },
        },
      },
      patch: {
        summary: 'Update or reschedule an interview (Recruiters & Admins)',
        tags: ['Interviews'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'] },
                  date: { type: 'string', example: '2026-10-26' },
                  startTime: { type: 'string', example: '15:00' },
                  endTime: { type: 'string', example: '16:00' },
                  meetingLink: { type: 'string' },
                  feedback: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Interview updated' },
          409: { description: 'Conflict with another interview' },
        },
      },
      delete: {
        summary: 'Delete or cancel interview (Recruiters & Admins)',
        tags: ['Interviews'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Interview deleted' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/resumes/upload': {
      post: {
        summary: 'Upload resume PDF or DOCX (Applicants only)',
        tags: ['Resumes & Storage'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  resume: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Resume uploaded successfully' },
          400: { description: 'Invalid file format or size exceeds 5MB' },
        },
      },
    },
    '/resumes/{filename}': {
      get: {
        summary: 'Download resume with authorized RBAC verification',
        tags: ['Resumes & Storage'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'filename', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Resume file stream' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden (Not authorized to view candidate resume)' },
          404: { description: 'File not found' },
        },
      },
    },
    '/notifications': {
      get: {
        summary: 'Get current user notifications with unread counts',
        tags: ['Notifications'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of notifications' },
        },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        summary: 'Mark notification as read',
        tags: ['Notifications'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Notification marked as read' },
        },
      },
    },
    '/notifications/read-all': {
      patch: {
        summary: 'Mark all notifications as read',
        tags: ['Notifications'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'All notifications marked as read' },
        },
      },
    },
    '/dashboard/applicant': {
      get: {
        summary: 'Get applicant dashboard metrics (applications, stages, interviews)',
        tags: ['Dashboards'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Applicant metrics data' },
        },
      },
    },
    '/dashboard/recruiter': {
      get: {
        summary: 'Get recruiter dashboard analytics and pipeline funnel metrics',
        tags: ['Dashboards'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Recruiter analytics data' },
        },
      },
    },
    '/dashboard/admin': {
      get: {
        summary: 'Get system-wide metrics and audit stats for Super Admin',
        tags: ['Dashboards'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Admin analytics data' },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'HireFlow ATS API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  }));
};
