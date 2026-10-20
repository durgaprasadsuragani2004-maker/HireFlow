import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';
import {
  ROLES,
  USER_STATUS,
  APPLICATION_STAGES,
  JOB_STATUS,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  INTERVIEW_TYPES,
  INTERVIEW_STATUSES,
  NOTIFICATION_TYPES,
  AUDIT_ACTIONS,
} from '../config/constants';
import { logger } from '../utils/logger';

async function main() {
  logger.info('🌱 Starting HireFlow ATS database seeding...');

  // Clear existing data in correct relational dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.applicationStageHistory.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.applicantSkill.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.education.deleteMany();
  await prisma.applicantProfile.deleteMany();
  await prisma.recruiterProfile.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await hashPassword('Admin@123456');
  const recruiterPassword = await hashPassword('Recruiter@123456');
  const applicantPassword = await hashPassword('Applicant@123456');

  // 1. Create Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hireflow.dev',
      passwordHash: defaultPassword,
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
    },
  });
  logger.info(`✅ Super Admin created: ${adminUser.email}`);

  // 2. Create Companies
  const techNova = await prisma.company.create({
    data: {
      name: 'TechNova Solutions',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
      description: 'Building next-generation cloud intelligence platforms and autonomous developer workflows.',
      website: 'https://technova.io',
      industry: 'Enterprise Software & AI',
      location: 'San Francisco, CA',
      companySize: '201-500',
      contactEmail: 'contact@technova.io',
      contactPhone: '+1 (415) 555-0192',
    },
  });

  const quantumLabs = await prisma.company.create({
    data: {
      name: 'QuantumLabs AI',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
      description: 'Pioneering high-frequency quantitative modeling and real-time deep learning analytics.',
      website: 'https://quantumlabs.ai',
      industry: 'FinTech & Machine Learning',
      location: 'New York, NY',
      companySize: '51-200',
      contactEmail: 'talent@quantumlabs.ai',
      contactPhone: '+1 (212) 555-0188',
    },
  });
  logger.info('✅ Companies created: TechNova Solutions, QuantumLabs AI');

  // 3. Create Recruiters
  const recruiter1User = await prisma.user.create({
    data: {
      email: 'sarah.recruiter@technova.com',
      passwordHash: recruiterPassword,
      role: ROLES.RECRUITER,
      status: USER_STATUS.ACTIVE,
    },
  });

  const recruiter1Profile = await prisma.recruiterProfile.create({
    data: {
      userId: recruiter1User.id,
      companyId: techNova.id,
      title: 'Lead Technical Recruiter',
      department: 'Engineering Talent',
      phone: '+1 (415) 555-0122',
    },
  });

  const recruiter2User = await prisma.user.create({
    data: {
      email: 'marcus.recruiter@quantum.ai',
      passwordHash: recruiterPassword,
      role: ROLES.RECRUITER,
      status: USER_STATUS.ACTIVE,
    },
  });

  const recruiter2Profile = await prisma.recruiterProfile.create({
    data: {
      userId: recruiter2User.id,
      companyId: quantumLabs.id,
      title: 'Director of Talent Acquisition',
      department: 'Global Talent',
      phone: '+1 (212) 555-0199',
    },
  });
  logger.info('✅ Recruiters created: Sarah Jenkins, Marcus Cole');

  // 4. Create Applicants
  // Applicant 1: Alex Morgan
  const userAlex = await prisma.user.create({
    data: {
      email: 'alex.dev@gmail.com',
      passwordHash: applicantPassword,
      role: ROLES.APPLICANT,
      status: USER_STATUS.ACTIVE,
    },
  });
  const profileAlex = await prisma.applicantProfile.create({
    data: {
      userId: userAlex.id,
      fullName: 'Alex Morgan',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA (Remote)',
      headline: 'Senior Full-Stack Engineer | React, Node.js, TypeScript & PostgreSQL',
      summary:
        'Passionate full-stack software engineer with 6+ years of experience crafting high-throughput web applications, microservices, and distributed cloud backends.',
      linkedinUrl: 'https://linkedin.com/in/alexmorgan-dev',
      githubUrl: 'https://github.com/alexmorgan-dev',
      portfolioUrl: 'https://alexmorgan.dev',
      resumeUrl: 'http://localhost:5001/api/resumes/alex_morgan_resume.pdf',
      resumeFileName: 'alex_morgan_resume.pdf',
    },
  });
  await prisma.applicantSkill.createMany({
    data: [
      { applicantProfileId: profileAlex.id, name: 'React', level: 'EXPERT', yearsOfExperience: 5 },
      { applicantProfileId: profileAlex.id, name: 'TypeScript', level: 'EXPERT', yearsOfExperience: 5 },
      { applicantProfileId: profileAlex.id, name: 'Node.js', level: 'ADVANCED', yearsOfExperience: 5 },
      { applicantProfileId: profileAlex.id, name: 'PostgreSQL', level: 'ADVANCED', yearsOfExperience: 4 },
      { applicantProfileId: profileAlex.id, name: 'Docker', level: 'INTERMEDIATE', yearsOfExperience: 3 },
    ],
  });
  await prisma.experience.create({
    data: {
      applicantProfileId: profileAlex.id,
      company: 'Apex Cloud Systems',
      title: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2022-03',
      current: true,
      description: 'Led development of real-time monitoring dashboard handling 50k events/sec with React & Node.',
    },
  });
  await prisma.education.create({
    data: {
      applicantProfileId: profileAlex.id,
      institution: 'University of California, Berkeley',
      degree: 'B.S.',
      fieldOfStudy: 'Computer Science',
      startDate: '2015-09',
      endDate: '2019-05',
    },
  });

  // Applicant 2: Elena Rostova
  const userElena = await prisma.user.create({
    data: {
      email: 'elena.frontend@gmail.com',
      passwordHash: applicantPassword,
      role: ROLES.APPLICANT,
      status: USER_STATUS.ACTIVE,
    },
  });
  const profileElena = await prisma.applicantProfile.create({
    data: {
      userId: userElena.id,
      fullName: 'Elena Rostova',
      phone: '+1 (555) 345-6789',
      location: 'New York, NY',
      headline: 'Staff Frontend Engineer & Design Systems Specialist',
      summary:
        'Frontend architect specialized in React, Next.js, WebGL visualization, and building accessible component design systems for enterprise scale.',
      linkedinUrl: 'https://linkedin.com/in/elenarostova',
      githubUrl: 'https://github.com/elenarostova',
      portfolioUrl: 'https://elena.design',
      resumeUrl: 'http://localhost:5001/api/resumes/elena_rostova_resume.pdf',
      resumeFileName: 'elena_rostova_resume.pdf',
    },
  });
  await prisma.applicantSkill.createMany({
    data: [
      { applicantProfileId: profileElena.id, name: 'React', level: 'EXPERT', yearsOfExperience: 7 },
      { applicantProfileId: profileElena.id, name: 'Next.js', level: 'EXPERT', yearsOfExperience: 4 },
      { applicantProfileId: profileElena.id, name: 'Tailwind CSS', level: 'EXPERT', yearsOfExperience: 4 },
      { applicantProfileId: profileElena.id, name: 'UI/UX Design', level: 'ADVANCED', yearsOfExperience: 6 },
    ],
  });

  // Applicant 3: David Chen
  const userDavid = await prisma.user.create({
    data: {
      email: 'david.fullstack@gmail.com',
      passwordHash: applicantPassword,
      role: ROLES.APPLICANT,
      status: USER_STATUS.ACTIVE,
    },
  });
  const profileDavid = await prisma.applicantProfile.create({
    data: {
      userId: userDavid.id,
      fullName: 'David Chen',
      phone: '+1 (555) 456-7890',
      location: 'Austin, TX (Remote)',
      headline: 'Full-Stack Software Engineer | Distributed Systems & APIs',
      summary:
        'Backend and systems engineer focusing on high-concurrency Node.js, Go services, Kafka event pipelines, and scalable relational databases.',
      linkedinUrl: 'https://linkedin.com/in/davidchen-code',
      githubUrl: 'https://github.com/davidchen-code',
      resumeUrl: 'http://localhost:5001/api/resumes/david_chen_resume.pdf',
      resumeFileName: 'david_chen_resume.pdf',
    },
  });
  await prisma.applicantSkill.createMany({
    data: [
      { applicantProfileId: profileDavid.id, name: 'Node.js', level: 'EXPERT', yearsOfExperience: 5 },
      { applicantProfileId: profileDavid.id, name: 'PostgreSQL', level: 'EXPERT', yearsOfExperience: 4 },
      { applicantProfileId: profileDavid.id, name: 'TypeScript', level: 'ADVANCED', yearsOfExperience: 4 },
      { applicantProfileId: profileDavid.id, name: 'Go', level: 'INTERMEDIATE', yearsOfExperience: 2 },
    ],
  });

  // Applicant 4: Priya Patel
  const userPriya = await prisma.user.create({
    data: {
      email: 'priya.patel@gmail.com',
      passwordHash: applicantPassword,
      role: ROLES.APPLICANT,
      status: USER_STATUS.ACTIVE,
    },
  });
  const profilePriya = await prisma.applicantProfile.create({
    data: {
      userId: userPriya.id,
      fullName: 'Priya Patel',
      phone: '+1 (555) 567-8901',
      location: 'Seattle, WA',
      headline: 'Product-Minded Full Stack Engineer | React & GraphQL',
      summary: 'Passionate about seamless user experiences, developer tooling, and modern web application development.',
      resumeUrl: 'http://localhost:5001/api/resumes/priya_patel_resume.pdf',
      resumeFileName: 'priya_patel_resume.pdf',
    },
  });
  await prisma.applicantSkill.createMany({
    data: [
      { applicantProfileId: profilePriya.id, name: 'React', level: 'ADVANCED', yearsOfExperience: 3 },
      { applicantProfileId: profilePriya.id, name: 'GraphQL', level: 'ADVANCED', yearsOfExperience: 3 },
      { applicantProfileId: profilePriya.id, name: 'Node.js', level: 'ADVANCED', yearsOfExperience: 3 },
    ],
  });

  // Applicant 5: Lucas Silva
  const userLucas = await prisma.user.create({
    data: {
      email: 'lucas.silva@gmail.com',
      passwordHash: applicantPassword,
      role: ROLES.APPLICANT,
      status: USER_STATUS.ACTIVE,
    },
  });
  const profileLucas = await prisma.applicantProfile.create({
    data: {
      userId: userLucas.id,
      fullName: 'Lucas Silva',
      phone: '+1 (555) 678-9012',
      location: 'Boston, MA (Remote)',
      headline: 'Cloud Systems & DevOps Engineer',
      summary: 'Experienced in AWS architecture, Kubernetes cluster orchestration, and automated CI/CD deployment pipelines.',
      resumeUrl: 'http://localhost:5001/api/resumes/lucas_silva_resume.pdf',
      resumeFileName: 'lucas_silva_resume.pdf',
    },
  });
  logger.info('✅ Applicants created: Alex Morgan, Elena Rostova, David Chen, Priya Patel, Lucas Silva');

  // 5. Create Jobs
  const jobFullStack = await prisma.job.create({
    data: {
      companyId: techNova.id,
      recruiterId: recruiter1Profile.id,
      title: 'Senior Full-Stack Engineer',
      description:
        'TechNova Solutions is looking for a Senior Full-Stack Engineer to architect and build our next-generation enterprise analytics platform. You will work across modern React frontends, robust Node.js/TypeScript APIs, and high-performance databases.',
      requirements:
        '• 5+ years of full-stack software engineering experience\n• Deep expertise in React, TypeScript, and modern state management\n• Strong background in Node.js, Express, and REST/GraphQL API design\n• Solid experience with relational databases (PostgreSQL preferred) and query optimization\n• Familiarity with Docker, automated testing, and CI/CD',
      responsibilities:
        '• Architect, develop, and maintain critical user-facing web applications\n• Collaborate with product managers and designers to deliver intuitive recruitment workflows\n• Write clean, testable, and well-documented TypeScript code\n• Mentor junior team members and participate in architectural reviews',
      skills: 'React, Node.js, TypeScript, PostgreSQL, Docker, REST APIs',
      location: 'Remote (US/Canada)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.SENIOR,
      salaryMin: 145000,
      salaryMax: 185000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const jobFrontendLead = await prisma.job.create({
    data: {
      companyId: techNova.id,
      recruiterId: recruiter1Profile.id,
      title: 'Lead Frontend Architect',
      description:
        'Join TechNova as our Lead Frontend Architect. You will shape the frontend architecture, performance standards, and component libraries across our flagship SaaS products.',
      requirements:
        '• 7+ years of frontend development experience with modern JavaScript/TypeScript\n• Mastery of React, Next.js, and design token integration\n• Proven track record creating and maintaining production design systems\n• Expertise in client-side performance, accessibility (a11y), and web vitals',
      responsibilities:
        '• Drive UI architecture and standards across engineering teams\n• Own the core component library and design system\n• Drive web performance and bundle optimization efforts',
      skills: 'React, Next.js, TypeScript, Tailwind CSS, Web Vitals, Design Systems',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.LEAD,
      salaryMin: 175000,
      salaryMax: 215000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
    },
  });

  const jobQuantSystems = await prisma.job.create({
    data: {
      companyId: quantumLabs.id,
      recruiterId: recruiter2Profile.id,
      title: 'Senior Quantitative Systems Engineer',
      description:
        'QuantumLabs AI is seeking an exceptional Senior Systems Engineer to build low-latency data pipelines and analytics systems supporting algorithmic trading and predictive financial modeling.',
      requirements:
        '• 5+ years building high-performance backend systems in Go, C++, or Node.js\n• Experience with relational databases and high-volume time-series data\n• Strong fundamentals in concurrency, algorithms, and distributed systems',
      responsibilities:
        '• Develop and scale real-time market data streaming ingestion pipelines\n• Optimize latency and memory overhead across core services\n• Collaborate with quant researchers to productionize mathematical models',
      skills: 'Go, Node.js, PostgreSQL, Distributed Systems, Redis, Docker',
      location: 'New York, NY (On-site)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.SENIOR,
      salaryMin: 190000,
      salaryMax: 250000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
    },
  });

  const jobDevOps = await prisma.job.create({
    data: {
      companyId: quantumLabs.id,
      recruiterId: recruiter2Profile.id,
      title: 'DevOps & SRE Specialist',
      description:
        'Help QuantumLabs scale and harden its cloud infrastructure, Kubernetes clusters, and automated continuous delivery pipelines across multi-region environments.',
      requirements:
        '• 4+ years in DevOps, SRE, or Cloud Infrastructure roles\n• Strong proficiency in AWS, Terraform, and Kubernetes orchestration\n• Experience maintaining production observability (Prometheus, Grafana, Datadog)',
      responsibilities:
        '• Automate cloud resource provisioning and infrastructure as code\n• Maintain 99.99% availability of trading platforms\n• Optimize deployment velocity and security configurations',
      skills: 'AWS, Kubernetes, Terraform, Docker, CI/CD, Prometheus',
      location: 'Remote (US)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.MID_LEVEL,
      salaryMin: 140000,
      salaryMax: 180000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
    },
  });

  const jobDraftCloud = await prisma.job.create({
    data: {
      companyId: techNova.id,
      recruiterId: recruiter1Profile.id,
      title: 'Staff Cloud Platform Engineer (Draft)',
      description: 'Upcoming role for leading TechNova multi-tenant cloud orchestration infrastructure.',
      requirements: 'Kubernetes, Go, AWS, Microservices.',
      responsibilities: 'Lead cloud architecture evolution.',
      skills: 'AWS, Kubernetes, Go, Terraform',
      location: 'Remote',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.LEAD,
      salaryMin: 180000,
      salaryMax: 220000,
      status: JOB_STATUS.DRAFT,
    },
  });
  logger.info('✅ Jobs created across TechNova and QuantumLabs');

  // 6. Create Applications across all 6 Kanban Stages for Job 1 (Senior Full-Stack Engineer)
  // Stage 1: APPLIED
  const appLucas = await prisma.application.create({
    data: {
      jobId: jobFullStack.id,
      applicantId: profileLucas.id,
      currentStage: APPLICATION_STAGES.APPLIED,
      coverLetter:
        'Dear Hiring Team, I am excited to apply for the Senior Full-Stack role. My background in cloud systems and API development aligns well with your platform goals.',
      rating: 3,
      appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.applicationStageHistory.create({
    data: {
      applicationId: appLucas.id,
      previousStage: null,
      newStage: APPLICATION_STAGES.APPLIED,
      changedById: userLucas.id,
      reason: 'Application submitted by candidate',
    },
  });

  // Stage 2: SCREENING
  const appPriya = await prisma.application.create({
    data: {
      jobId: jobFullStack.id,
      applicantId: profilePriya.id,
      currentStage: APPLICATION_STAGES.SCREENING,
      coverLetter:
        'Hello TechNova team! I have built several high-throughput React & GraphQL platforms and would love to contribute to your analytics product.',
      notes: 'Strong React background. Need to verify database depth during initial screening call.',
      rating: 4,
      appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.applicationStageHistory.createMany({
    data: [
      {
        applicationId: appPriya.id,
        previousStage: null,
        newStage: APPLICATION_STAGES.APPLIED,
        changedById: userPriya.id,
        reason: 'Application submitted',
        changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        applicationId: appPriya.id,
        previousStage: APPLICATION_STAGES.APPLIED,
        newStage: APPLICATION_STAGES.SCREENING,
        changedById: recruiter1User.id,
        reason: 'Resume matches core criteria; moved to screening',
        changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Stage 3: SHORTLISTED
  const appDavid = await prisma.application.create({
    data: {
      jobId: jobFullStack.id,
      applicantId: profileDavid.id,
      currentStage: APPLICATION_STAGES.SHORTLISTED,
      coverLetter:
        'TechNova engineering culture and distributed tech stack is exactly what I have excelled in for the past 5 years. Attached is my resume and portfolio.',
      notes: 'Initial recruiter screen completed. Solid communication, impressive systems knowledge.',
      rating: 4,
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.applicationStageHistory.createMany({
    data: [
      {
        applicationId: appDavid.id,
        previousStage: null,
        newStage: APPLICATION_STAGES.APPLIED,
        changedById: userDavid.id,
        changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        applicationId: appDavid.id,
        previousStage: APPLICATION_STAGES.APPLIED,
        newStage: APPLICATION_STAGES.SCREENING,
        changedById: recruiter1User.id,
        changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        applicationId: appDavid.id,
        previousStage: APPLICATION_STAGES.SCREENING,
        newStage: APPLICATION_STAGES.SHORTLISTED,
        changedById: recruiter1User.id,
        reason: 'Recruiter screen passed with high remarks',
        changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Stage 4: INTERVIEW
  const appAlex = await prisma.application.create({
    data: {
      jobId: jobFullStack.id,
      applicantId: profileAlex.id,
      currentStage: APPLICATION_STAGES.INTERVIEW,
      coverLetter:
        'Hi Sarah, I have been following TechNova Solutions for some time and would love to bring my React, TypeScript, and Node architecture experience to your team.',
      notes: 'Top tier candidate. Coding challenge score: 98/100. Technical architecture interview scheduled.',
      rating: 5,
      appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.applicationStageHistory.createMany({
    data: [
      {
        applicationId: appAlex.id,
        previousStage: null,
        newStage: APPLICATION_STAGES.APPLIED,
        changedById: userAlex.id,
        changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        applicationId: appAlex.id,
        previousStage: APPLICATION_STAGES.APPLIED,
        newStage: APPLICATION_STAGES.SCREENING,
        changedById: recruiter1User.id,
        changedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        applicationId: appAlex.id,
        previousStage: APPLICATION_STAGES.SCREENING,
        newStage: APPLICATION_STAGES.SHORTLISTED,
        changedById: recruiter1User.id,
        changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        applicationId: appAlex.id,
        previousStage: APPLICATION_STAGES.SHORTLISTED,
        newStage: APPLICATION_STAGES.INTERVIEW,
        changedById: recruiter1User.id,
        reason: 'Scheduled Technical Interview round with Engineering Lead',
        changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Stage 5: SELECTED
  const appElena = await prisma.application.create({
    data: {
      jobId: jobFullStack.id,
      applicantId: profileElena.id,
      currentStage: APPLICATION_STAGES.SELECTED,
      coverLetter: 'I am excited to bring frontend systems design and UI craft to TechNova flagship products.',
      notes: 'Final interview was exceptional. Hiring manager approved offer package.',
      rating: 5,
      appliedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.applicationStageHistory.createMany({
    data: [
      {
        applicationId: appElena.id,
        previousStage: APPLICATION_STAGES.INTERVIEW,
        newStage: APPLICATION_STAGES.SELECTED,
        changedById: recruiter1User.id,
        reason: 'Offer extended and accepted',
        changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Stage 6: REJECTED (sample)
  const appRejected = await prisma.application.create({
    data: {
      jobId: jobFrontendLead.id,
      applicantId: profileLucas.id,
      currentStage: APPLICATION_STAGES.REJECTED,
      notes: 'Candidate profile is specialized in DevOps/Infra rather than Frontend Architecture.',
      rating: 2,
      appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.applicationStageHistory.create({
    data: {
      applicationId: appRejected.id,
      previousStage: APPLICATION_STAGES.APPLIED,
      newStage: APPLICATION_STAGES.REJECTED,
      changedById: recruiter1User.id,
      reason: 'Role requires specialized UI/UX architecture background',
    },
  });

  // Applications for QuantumLabs
  const appDavidQuant = await prisma.application.create({
    data: {
      jobId: jobQuantSystems.id,
      applicantId: profileDavid.id,
      currentStage: APPLICATION_STAGES.INTERVIEW,
      coverLetter: 'Excited about high-concurrency systems engineering at QuantumLabs.',
      rating: 5,
      appliedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  logger.info('✅ Applications created across all 6 Kanban stages');

  // 7. Create Scheduled Interviews
  await prisma.interview.create({
    data: {
      applicationId: appAlex.id,
      scheduledById: recruiter1User.id,
      interviewerName: 'Sarah Jenkins',
      interviewerEmail: 'sarah.recruiter@technova.com',
      date: '2026-10-25',
      startTime: '14:00',
      endTime: '15:00',
      interviewType: INTERVIEW_TYPES.TECHNICAL,
      status: INTERVIEW_STATUSES.SCHEDULED,
      meetingLink: 'https://meet.google.com/hireflow-alex-tech',
      notes: 'System architecture deep-dive: discuss state management, caching, and DB scaling.',
    },
  });

  await prisma.interview.create({
    data: {
      applicationId: appDavidQuant.id,
      scheduledById: recruiter2User.id,
      interviewerName: 'Marcus Cole',
      interviewerEmail: 'marcus.recruiter@quantum.ai',
      date: '2026-10-27',
      startTime: '11:00',
      endTime: '12:00',
      interviewType: INTERVIEW_TYPES.MANAGERIAL,
      status: INTERVIEW_STATUSES.SCHEDULED,
      meetingLink: 'https://zoom.us/j/hireflow-quantum-david',
      notes: 'Discuss past distributed systems experience and quantitative workflows.',
    },
  });
  logger.info('✅ Scheduled interviews created');

  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: userAlex.id,
        type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
        title: 'Interview Scheduled! 📅',
        message: 'Your Technical interview for "Senior Full-Stack Engineer" is scheduled for 2026-10-25 at 14:00.',
        metadata: JSON.stringify({ applicationId: appAlex.id }),
      },
      {
        userId: userElena.id,
        type: NOTIFICATION_TYPES.APPLICATION_STATUS,
        title: 'Offer / Selection Notice 🎉',
        message: 'Congratulations! You have been selected for "Senior Full-Stack Engineer" at TechNova Solutions.',
        metadata: JSON.stringify({ applicationId: appElena.id }),
      },
      {
        userId: recruiter1User.id,
        type: NOTIFICATION_TYPES.NEW_APPLICATION,
        title: 'New Candidate Applied',
        message: 'Lucas Silva applied for Senior Full-Stack Engineer.',
        metadata: JSON.stringify({ applicationId: appLucas.id }),
      },
    ],
  });

  // 9. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        action: AUDIT_ACTIONS.USER_LOGIN,
        entity: 'User',
        entityId: adminUser.id,
        metadata: JSON.stringify({ role: ROLES.SUPER_ADMIN }),
      },
      {
        actorId: recruiter1User.id,
        action: AUDIT_ACTIONS.JOB_CREATE,
        entity: 'Job',
        entityId: jobFullStack.id,
        metadata: JSON.stringify({ title: 'Senior Full-Stack Engineer' }),
      },
      {
        actorId: recruiter1User.id,
        action: AUDIT_ACTIONS.APPLICATION_STAGE_CHANGE,
        entity: 'Application',
        entityId: appAlex.id,
        metadata: JSON.stringify({ previousStage: 'SHORTLISTED', newStage: 'INTERVIEW' }),
      },
    ],
  });

  logger.info('🎉 Seed completed successfully!');
  logger.info('--------------------------------------------------');
  logger.info('Demo Credentials:');
  logger.info('1. Super Admin: admin@hireflow.dev / Admin@123456');
  logger.info('2. Recruiter (TechNova): sarah.recruiter@technova.com / Recruiter@123456');
  logger.info('3. Recruiter (QuantumLabs): marcus.recruiter@quantum.ai / Recruiter@123456');
  logger.info('4. Applicant: alex.dev@gmail.com / Applicant@123456');
  logger.info('5. Applicant: elena.frontend@gmail.com / Applicant@123456');
  logger.info('--------------------------------------------------');
}

main()
  .catch((e) => {
    logger.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
