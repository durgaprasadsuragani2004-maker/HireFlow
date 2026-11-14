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

export const DEMO_PASSWORD = 'Demo@123456';

async function main() {
  logger.info('🌱 Starting idempotent HireFlow ATS database seeding...');

  // Common demo password hash
  const demoPasswordHash = await hashPassword(DEMO_PASSWORD);

  // Counters for report
  const createdCounts = {
    users: 0,
    companies: 0,
    recruiterProfiles: 0,
    applicantProfiles: 0,
    applicantSkills: 0,
    experiences: 0,
    educations: 0,
    jobs: 0,
    applications: 0,
    stageHistories: 0,
    interviews: 0,
    notifications: 0,
    auditLogs: 0,
  };

  // ==========================================
  // 1. ADMIN USER
  // ==========================================
  const adminEmail = 'demo.admin@hireflow.test';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: demoPasswordHash,
        role: ROLES.SUPER_ADMIN,
        status: USER_STATUS.ACTIVE,
      },
    });
    createdCounts.users++;
    logger.info(`✅ Admin created: ${adminEmail}`);
  } else {
    logger.info(`ℹ️ Admin already exists: ${adminEmail}`);
  }

  // ==========================================
  // 2. COMPANIES
  // ==========================================
  const company1Data = {
    name: 'TechNova Solutions',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
    description: 'Enterprise AI cloud intelligence platforms, developer orchestration tooling, and high-performance workflow automation.',
    website: 'https://technova.io',
    industry: 'Enterprise Software & AI',
    location: 'San Francisco, CA',
    companySize: '201-500',
    contactEmail: 'demo.company1@hireflow.test',
    contactPhone: '+1 (415) 555-0192',
  };

  let techNova = await prisma.company.findUnique({ where: { name: company1Data.name } });
  if (!techNova) {
    techNova = await prisma.company.create({ data: company1Data });
    createdCounts.companies++;
    logger.info(`✅ Company created: ${techNova.name}`);
  } else {
    logger.info(`ℹ️ Company already exists: ${techNova.name}`);
  }

  const company2Data = {
    name: 'CloudScale Systems',
    logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&q=80',
    description: 'High-throughput cloud distributed infrastructure, multi-region Kubernetes clusters, and quantitative financial data streaming.',
    website: 'https://cloudscale.tech',
    industry: 'Cloud Infrastructure & FinTech',
    location: 'New York, NY',
    companySize: '51-200',
    contactEmail: 'demo.company2@hireflow.test',
    contactPhone: '+1 (212) 555-0188',
  };

  let cloudScale = await prisma.company.findUnique({ where: { name: company2Data.name } });
  if (!cloudScale) {
    cloudScale = await prisma.company.create({ data: company2Data });
    createdCounts.companies++;
    logger.info(`✅ Company created: ${cloudScale.name}`);
  } else {
    logger.info(`ℹ️ Company already exists: ${cloudScale.name}`);
  }

  // Company User Accounts (Role: COMPANY for Organization Dashboard Login)
  const companyUsers = [
    { email: 'demo.company1@hireflow.test', companyId: techNova.id },
    { email: 'demo.company2@hireflow.test', companyId: cloudScale.id },
  ];

  for (const cu of companyUsers) {
    let user = await prisma.user.findUnique({ where: { email: cu.email } });
    if (!user) {
      await prisma.user.create({
        data: {
          email: cu.email,
          passwordHash: demoPasswordHash,
          role: ROLES.COMPANY,
          status: USER_STATUS.ACTIVE,
          companyId: cu.companyId,
        },
      });
      createdCounts.users++;
      logger.info(`✅ Company account created: ${cu.email}`);
    } else {
      if (!user.companyId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { companyId: cu.companyId },
        });
      }
      logger.info(`ℹ️ Company account already exists: ${cu.email}`);
    }
  }

  // ==========================================
  // 3. RECRUITERS
  // ==========================================
  const recruitersData = [
    {
      email: 'demo.recruiter1@hireflow.test',
      companyId: techNova.id,
      title: 'Lead Technical Recruiter',
      department: 'Engineering Talent Acquisition',
      phone: '+1 (415) 555-0122',
    },
    {
      email: 'demo.recruiter2@hireflow.test',
      companyId: techNova.id,
      title: 'Senior Technical Recruiter',
      department: 'Product & AI Talent',
      phone: '+1 (415) 555-0133',
    },
    {
      email: 'demo.recruiter3@hireflow.test',
      companyId: cloudScale.id,
      title: 'Director of Global Talent',
      department: 'Infrastructure & Data Talent',
      phone: '+1 (212) 555-0199',
    },
  ];

  const recruiterProfiles: any[] = [];
  const recruiterUsers: any[] = [];

  for (const r of recruitersData) {
    let rUser = await prisma.user.findUnique({ where: { email: r.email } });
    if (!rUser) {
      rUser = await prisma.user.create({
        data: {
          email: r.email,
          passwordHash: demoPasswordHash,
          role: ROLES.RECRUITER,
          status: USER_STATUS.ACTIVE,
          companyId: r.companyId,
        },
      });
      createdCounts.users++;
      logger.info(`✅ Recruiter user created: ${r.email}`);
    }
    recruiterUsers.push(rUser);

    let rProfile = await prisma.recruiterProfile.findUnique({ where: { userId: rUser.id } });
    if (!rProfile) {
      rProfile = await prisma.recruiterProfile.create({
        data: {
          userId: rUser.id,
          companyId: r.companyId,
          title: r.title,
          department: r.department,
          phone: r.phone,
        },
      });
      createdCounts.recruiterProfiles++;
      logger.info(`✅ Recruiter profile created for: ${r.email}`);
    }
    recruiterProfiles.push(rProfile);
  }

  // ==========================================
  // 4. APPLICANTS (10 Detailed Profiles)
  // ==========================================
  const applicantsData = [
    {
      email: 'demo.applicant1@hireflow.test',
      fullName: 'Alex Rivera',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA (Remote)',
      headline: 'Senior Full-Stack Engineer | React, Node.js, TypeScript & PostgreSQL',
      summary: 'Passionate full-stack software engineer with 6+ years of experience crafting high-throughput web applications, microservices, and distributed cloud backends.',
      linkedinUrl: 'https://linkedin.com/in/alexrivera-dev',
      githubUrl: 'https://github.com/alexrivera-dev',
      portfolioUrl: 'https://alexrivera.dev',
      resumeUrl: 'https://hireflow.test/resumes/alex_rivera_resume.pdf',
      resumeFileName: 'alex_rivera_resume.pdf',
      skills: [
        { name: 'React', level: 'EXPERT', yearsOfExperience: 6 },
        { name: 'TypeScript', level: 'EXPERT', yearsOfExperience: 5 },
        { name: 'Node.js', level: 'ADVANCED', yearsOfExperience: 5 },
        { name: 'PostgreSQL', level: 'ADVANCED', yearsOfExperience: 4 },
        { name: 'Docker', level: 'INTERMEDIATE', yearsOfExperience: 3 },
      ],
      experience: [
        {
          company: 'Apex Cloud Systems',
          title: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          startDate: '2022-03',
          current: true,
          description: 'Led development of real-time monitoring dashboard handling 50k events/sec with React, Node.js, and Redis.',
        },
        {
          company: 'HyperScale Web',
          title: 'Full Stack Developer',
          location: 'San Jose, CA',
          startDate: '2019-06',
          endDate: '2022-02',
          current: false,
          description: 'Built customer-facing portals and RESTful APIs serving 2M+ active monthly users.',
        },
      ],
      education: [
        {
          institution: 'University of California, Berkeley',
          degree: 'B.S.',
          fieldOfStudy: 'Computer Science',
          startDate: '2015-09',
          endDate: '2019-05',
        },
      ],
    },
    {
      email: 'demo.applicant2@hireflow.test',
      fullName: 'Elena Rostova',
      phone: '+1 (555) 345-6789',
      location: 'New York, NY (Hybrid)',
      headline: 'Staff Frontend Architect & Design Systems Specialist',
      summary: 'Frontend architect specialized in React, Next.js, WebGL visualization, and building accessible component design systems for enterprise scale.',
      linkedinUrl: 'https://linkedin.com/in/elenarostova',
      githubUrl: 'https://github.com/elenarostova',
      portfolioUrl: 'https://elena.design',
      resumeUrl: 'https://hireflow.test/resumes/elena_rostova_resume.pdf',
      resumeFileName: 'elena_rostova_resume.pdf',
      skills: [
        { name: 'React', level: 'EXPERT', yearsOfExperience: 7 },
        { name: 'Next.js', level: 'EXPERT', yearsOfExperience: 5 },
        { name: 'Tailwind CSS', level: 'EXPERT', yearsOfExperience: 4 },
        { name: 'UI/UX Design', level: 'ADVANCED', yearsOfExperience: 6 },
      ],
      experience: [
        {
          company: 'PixelCraft Design Systems',
          title: 'Lead Frontend Engineer',
          location: 'New York, NY',
          startDate: '2021-01',
          current: true,
          description: 'Architected company-wide component library used across 14 SaaS applications with 99.8% accessibility compliance.',
        },
      ],
      education: [
        {
          institution: 'New York University',
          degree: 'B.A.',
          fieldOfStudy: 'Digital Arts & Computer Science',
          startDate: '2016-09',
          endDate: '2020-05',
        },
      ],
    },
    {
      email: 'demo.applicant3@hireflow.test',
      fullName: 'David Chen',
      phone: '+1 (555) 456-7890',
      location: 'Austin, TX (Remote)',
      headline: 'Senior Backend Engineer | Node.js, Go, Distributed Systems & Kafka',
      summary: 'Systems and backend engineer focusing on low-latency microservices, Kafka event pipelines, and scalable relational databases.',
      linkedinUrl: 'https://linkedin.com/in/davidchen-code',
      githubUrl: 'https://github.com/davidchen-code',
      resumeUrl: 'https://hireflow.test/resumes/david_chen_resume.pdf',
      resumeFileName: 'david_chen_resume.pdf',
      skills: [
        { name: 'Node.js', level: 'EXPERT', yearsOfExperience: 6 },
        { name: 'PostgreSQL', level: 'EXPERT', yearsOfExperience: 5 },
        { name: 'Go', level: 'ADVANCED', yearsOfExperience: 3 },
        { name: 'Kafka', level: 'ADVANCED', yearsOfExperience: 3 },
        { name: 'Redis', level: 'ADVANCED', yearsOfExperience: 4 },
      ],
      experience: [
        {
          company: 'FinStream Networks',
          title: 'Senior Backend Engineer',
          location: 'Austin, TX',
          startDate: '2020-08',
          current: true,
          description: 'Engineered high-frequency payment reconciliation system processing $15M daily transaction volume.',
        },
      ],
      education: [
        {
          institution: 'University of Texas at Austin',
          degree: 'M.S.',
          fieldOfStudy: 'Software Engineering',
          startDate: '2018-08',
          endDate: '2020-05',
        },
      ],
    },
    {
      email: 'demo.applicant4@hireflow.test',
      fullName: 'Priya Patel',
      phone: '+1 (555) 567-8901',
      location: 'Seattle, WA (Remote)',
      headline: 'Product-Minded Full Stack Developer | React, GraphQL & Express',
      summary: 'Full-stack engineer passionate about intuitive user experiences, developer tooling, and modern component architecture.',
      linkedinUrl: 'https://linkedin.com/in/priyapatel-tech',
      githubUrl: 'https://github.com/priyapatel-tech',
      resumeUrl: 'https://hireflow.test/resumes/priya_patel_resume.pdf',
      resumeFileName: 'priya_patel_resume.pdf',
      skills: [
        { name: 'React', level: 'ADVANCED', yearsOfExperience: 4 },
        { name: 'GraphQL', level: 'ADVANCED', yearsOfExperience: 3 },
        { name: 'Node.js', level: 'ADVANCED', yearsOfExperience: 4 },
        { name: 'TypeScript', level: 'ADVANCED', yearsOfExperience: 3 },
      ],
      experience: [
        {
          company: 'SaaSFlow Technologies',
          title: 'Full Stack Engineer',
          location: 'Seattle, WA',
          startDate: '2021-06',
          current: true,
          description: 'Built interactive visual analytics widgets and unified GraphQL gateway.',
        },
      ],
      education: [
        {
          institution: 'University of Washington',
          degree: 'B.S.',
          fieldOfStudy: 'Informatics',
          startDate: '2017-09',
          endDate: '2021-06',
        },
      ],
    },
    {
      email: 'demo.applicant5@hireflow.test',
      fullName: 'Marcus Aurelius',
      phone: '+1 (555) 678-9012',
      location: 'Boston, MA (Remote)',
      headline: 'Principal DevOps & Site Reliability Engineer | AWS, Terraform & K8s',
      summary: 'DevOps architect with deep expertise in infrastructure-as-code, multi-region Kubernetes clusters, and zero-downtime CI/CD.',
      linkedinUrl: 'https://linkedin.com/in/marcusaurelius-sre',
      githubUrl: 'https://github.com/marcusaurelius-sre',
      resumeUrl: 'https://hireflow.test/resumes/marcus_aurelius_resume.pdf',
      resumeFileName: 'marcus_aurelius_resume.pdf',
      skills: [
        { name: 'AWS', level: 'EXPERT', yearsOfExperience: 6 },
        { name: 'Kubernetes', level: 'EXPERT', yearsOfExperience: 5 },
        { name: 'Terraform', level: 'EXPERT', yearsOfExperience: 4 },
        { name: 'Docker', level: 'EXPERT', yearsOfExperience: 6 },
        { name: 'CI/CD', level: 'ADVANCED', yearsOfExperience: 5 },
      ],
      experience: [
        {
          company: 'CloudNexus Infrastructure',
          title: 'Principal SRE',
          location: 'Boston, MA',
          startDate: '2019-10',
          current: true,
          description: 'Maintained 99.995% SLA across 40+ microservices on multi-region EKS clusters.',
        },
      ],
      education: [
        {
          institution: 'Massachusetts Institute of Technology',
          degree: 'B.S.',
          fieldOfStudy: 'Computer Systems',
          startDate: '2014-09',
          endDate: '2018-05',
        },
      ],
    },
    {
      email: 'demo.applicant6@hireflow.test',
      fullName: 'Sarah Kim',
      phone: '+1 (555) 789-0123',
      location: 'San Jose, CA (On-site)',
      headline: 'AI/ML Platform Engineer | PyTorch, LLM Fine-Tuning & Vector Databases',
      summary: 'Machine learning practitioner specialized in deep learning models, retrieval-augmented generation (RAG), and production model serving.',
      linkedinUrl: 'https://linkedin.com/in/sarahkim-ai',
      githubUrl: 'https://github.com/sarahkim-ai',
      resumeUrl: 'https://hireflow.test/resumes/sarah_kim_resume.pdf',
      resumeFileName: 'sarah_kim_resume.pdf',
      skills: [
        { name: 'Python', level: 'EXPERT', yearsOfExperience: 6 },
        { name: 'PyTorch', level: 'EXPERT', yearsOfExperience: 4 },
        { name: 'Machine Learning', level: 'ADVANCED', yearsOfExperience: 5 },
        { name: 'LangChain', level: 'ADVANCED', yearsOfExperience: 2 },
        { name: 'FastAPI', level: 'ADVANCED', yearsOfExperience: 3 },
      ],
      experience: [
        {
          company: 'NeuralDynamics Lab',
          title: 'Machine Learning Engineer',
          location: 'Palo Alto, CA',
          startDate: '2021-04',
          current: true,
          description: 'Developed scalable RAG inference pipeline reducing hallucination rates by 42%.',
        },
      ],
      education: [
        {
          institution: 'Stanford University',
          degree: 'M.S.',
          fieldOfStudy: 'Artificial Intelligence',
          startDate: '2019-09',
          endDate: '2021-03',
        },
      ],
    },
    {
      email: 'demo.applicant7@hireflow.test',
      fullName: 'James Wilson',
      phone: '+1 (555) 890-1234',
      location: 'Chicago, IL (Hybrid)',
      headline: 'Enterprise Java & Spring Boot Architect | Microservices & Cloud',
      summary: 'Senior backend architect with 8+ years designing mission-critical enterprise financial systems with Spring Boot and PostgreSQL.',
      linkedinUrl: 'https://linkedin.com/in/jameswilson-java',
      githubUrl: 'https://github.com/jameswilson-java',
      resumeUrl: 'https://hireflow.test/resumes/james_wilson_resume.pdf',
      resumeFileName: 'james_wilson_resume.pdf',
      skills: [
        { name: 'Java', level: 'EXPERT', yearsOfExperience: 8 },
        { name: 'Spring Boot', level: 'EXPERT', yearsOfExperience: 7 },
        { name: 'PostgreSQL', level: 'EXPERT', yearsOfExperience: 6 },
        { name: 'Microservices', level: 'EXPERT', yearsOfExperience: 6 },
      ],
      experience: [
        {
          company: 'Citadel Capital Systems',
          title: 'Staff Software Engineer',
          location: 'Chicago, IL',
          startDate: '2018-02',
          current: true,
          description: 'Migrated monolithic legacy settlement platform to cloud-native Spring Boot microservices.',
        },
      ],
      education: [
        {
          institution: 'University of Illinois Urbana-Champaign',
          degree: 'B.S.',
          fieldOfStudy: 'Computer Science',
          startDate: '2012-08',
          endDate: '2016-05',
        },
      ],
    },
    {
      email: 'demo.applicant8@hireflow.test',
      fullName: 'Aisha Mohammed',
      phone: '+1 (555) 901-2345',
      location: 'Los Angeles, CA (Remote)',
      headline: 'Lead UI/UX Product Designer | Figma, User Research & Design Systems',
      summary: 'User experience designer bridging user empathy and technical feasibility, with 6+ years creating end-to-end B2B SaaS workflows.',
      linkedinUrl: 'https://linkedin.com/in/aishamohammed-design',
      portfolioUrl: 'https://aisha.design',
      resumeUrl: 'https://hireflow.test/resumes/aisha_mohammed_resume.pdf',
      resumeFileName: 'aisha_mohammed_resume.pdf',
      skills: [
        { name: 'UI/UX Design', level: 'EXPERT', yearsOfExperience: 6 },
        { name: 'Figma', level: 'EXPERT', yearsOfExperience: 6 },
        { name: 'Design Systems', level: 'EXPERT', yearsOfExperience: 5 },
        { name: 'User Research', level: 'ADVANCED', yearsOfExperience: 4 },
      ],
      experience: [
        {
          company: 'Prism Studio',
          title: 'Lead Product Designer',
          location: 'Los Angeles, CA',
          startDate: '2020-03',
          current: true,
          description: 'Led UX redesign of core hiring dashboard, boosting recruiter task completion speed by 35%.',
        },
      ],
      education: [
        {
          institution: 'ArtCenter College of Design',
          degree: 'B.Des.',
          fieldOfStudy: 'Interaction Design',
          startDate: '2015-09',
          endDate: '2019-05',
        },
      ],
    },
    {
      email: 'demo.applicant9@hireflow.test',
      fullName: 'Lucas Silva',
      phone: '+1 (555) 012-3456',
      location: 'Denver, CO (Remote)',
      headline: 'Senior Data Analyst & Analytics Engineer | SQL, dbt & Tableau',
      summary: 'Data specialist transforming complex data warehouses into actionable business insights, dashboards, and automated forecasting models.',
      linkedinUrl: 'https://linkedin.com/in/lucassilva-data',
      githubUrl: 'https://github.com/lucassilva-data',
      resumeUrl: 'https://hireflow.test/resumes/lucas_silva_resume.pdf',
      resumeFileName: 'lucas_silva_resume.pdf',
      skills: [
        { name: 'SQL', level: 'EXPERT', yearsOfExperience: 6 },
        { name: 'Tableau', level: 'EXPERT', yearsOfExperience: 5 },
        { name: 'Python', level: 'ADVANCED', yearsOfExperience: 4 },
        { name: 'dbt', level: 'ADVANCED', yearsOfExperience: 3 },
      ],
      experience: [
        {
          company: 'MetricWave Analytics',
          title: 'Senior Analytics Engineer',
          location: 'Denver, CO',
          startDate: '2020-11',
          current: true,
          description: 'Designed unified BI marts with dbt and Snowflake, powering C-suite KPI reporting.',
        },
      ],
      education: [
        {
          institution: 'University of Colorado Boulder',
          degree: 'B.S.',
          fieldOfStudy: 'Statistics & Economics',
          startDate: '2016-08',
          endDate: '2020-05',
        },
      ],
    },
    {
      email: 'demo.applicant10@hireflow.test',
      fullName: 'Daniel Becker',
      phone: '+1 (555) 123-4567',
      location: 'Atlanta, GA (Remote)',
      headline: 'Senior Python Developer | FastAPI, Django & Distributed Data Pipelines',
      summary: 'Python developer with 5+ years building async REST/gRPC microservices, background job queues with Celery, and data pipelines.',
      linkedinUrl: 'https://linkedin.com/in/danielbecker-py',
      githubUrl: 'https://github.com/danielbecker-py',
      resumeUrl: 'https://hireflow.test/resumes/daniel_becker_resume.pdf',
      resumeFileName: 'daniel_becker_resume.pdf',
      skills: [
        { name: 'Python', level: 'EXPERT', yearsOfExperience: 6 },
        { name: 'FastAPI', level: 'EXPERT', yearsOfExperience: 4 },
        { name: 'Django', level: 'ADVANCED', yearsOfExperience: 5 },
        { name: 'PostgreSQL', level: 'ADVANCED', yearsOfExperience: 4 },
      ],
      experience: [
        {
          company: 'DataVibe Technologies',
          title: 'Senior Backend Developer',
          location: 'Atlanta, GA',
          startDate: '2021-02',
          current: true,
          description: 'Architected async ingestion services processing 10M records daily using FastAPI and Celery.',
        },
      ],
      education: [
        {
          institution: 'Georgia Institute of Technology',
          degree: 'B.S.',
          fieldOfStudy: 'Computer Science',
          startDate: '2016-08',
          endDate: '2020-05',
        },
      ],
    },
  ];

  const applicantProfiles: any[] = [];
  const applicantUsers: any[] = [];

  for (const appData of applicantsData) {
    let u = await prisma.user.findUnique({ where: { email: appData.email } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          email: appData.email,
          passwordHash: demoPasswordHash,
          role: ROLES.APPLICANT,
          status: USER_STATUS.ACTIVE,
        },
      });
      createdCounts.users++;
    }
    applicantUsers.push(u);

    let profile = await prisma.applicantProfile.findUnique({ where: { userId: u.id } });
    if (!profile) {
      profile = await prisma.applicantProfile.create({
        data: {
          userId: u.id,
          fullName: appData.fullName,
          phone: appData.phone,
          location: appData.location,
          headline: appData.headline,
          summary: appData.summary,
          linkedinUrl: appData.linkedinUrl,
          githubUrl: appData.githubUrl,
          portfolioUrl: (appData as any).portfolioUrl,
          resumeUrl: appData.resumeUrl,
          resumeFileName: appData.resumeFileName,
        },
      });
      createdCounts.applicantProfiles++;

      // Create skills
      for (const skill of appData.skills) {
        await prisma.applicantSkill.create({
          data: {
            applicantProfileId: profile.id,
            name: skill.name,
            level: skill.level,
            yearsOfExperience: skill.yearsOfExperience,
          },
        });
        createdCounts.applicantSkills++;
      }

      // Create experience
      for (const exp of appData.experience) {
        await prisma.experience.create({
          data: {
            applicantProfileId: profile.id,
            company: exp.company,
            title: exp.title,
            location: exp.location,
            startDate: exp.startDate,
            endDate: (exp as any).endDate || null,
            current: exp.current,
            description: exp.description,
          },
        });
        createdCounts.experiences++;
      }

      // Create education
      for (const edu of appData.education) {
        await prisma.education.create({
          data: {
            applicantProfileId: profile.id,
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: edu.startDate,
            endDate: (edu as any).endDate || null,
          },
        });
        createdCounts.educations++;
      }
      logger.info(`✅ Applicant profile & details created for: ${appData.fullName}`);
    } else {
      logger.info(`ℹ️ Applicant profile already exists for: ${appData.fullName}`);
    }
    applicantProfiles.push(profile);
  }

  // ==========================================
  // 5. JOB LISTINGS (15 Comprehensive Jobs)
  // ==========================================
  const jobsData = [
    {
      companyId: techNova.id,
      recruiterId: recruiterProfiles[0].id,
      title: 'Senior Frontend Engineer (React/Next.js)',
      description: 'TechNova Solutions is looking for a Senior Frontend Engineer to build high-performance web interfaces and enterprise design systems using Next.js 14, React, and Tailwind CSS.',
      requirements: '• 5+ years of modern React & TypeScript development\n• Deep understanding of SSR, React Server Components, and client state management\n• Strong focus on web performance, accessibility (WCAG), and responsive UX',
      responsibilities: '• Architect and implement client web modules\n• Collaborate with UX designers on reusable UI component libraries\n• Mentor mid-level engineers and conduct pull request reviews',
      skills: 'React, Next.js, TypeScript, Tailwind CSS, REST APIs',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.SENIOR,
      salaryMin: 150000,
      salaryMax: 190000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: techNova.id,
      recruiterId: recruiterProfiles[0].id,
      title: 'Senior Backend Engineer (Node.js/PostgreSQL)',
      description: 'Join TechNova backend engineering to power our core recruitment workflow orchestration engines and distributed microservices with Node.js and PostgreSQL.',
      requirements: '• 5+ years in backend engineering with Node.js, Express, or Fastify\n• Advanced SQL query tuning and relational modeling (PostgreSQL / Prisma)\n• Experience designing authenticated RESTful APIs and event-driven queues',
      responsibilities: '• Build reliable, high-throughput backend services\n• Design clean database schemas and migration strategies\n• Maintain 99.9% uptime for core transactional endpoints',
      skills: 'Node.js, TypeScript, PostgreSQL, Prisma, Redis, Docker',
      location: 'Remote (US/Canada)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.SENIOR,
      salaryMin: 155000,
      salaryMax: 195000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: techNova.id,
      recruiterId: recruiterProfiles[0].id,
      title: 'Lead Full-Stack Architect',
      description: 'Lead technical design and cross-functional engineering for TechNova flagship platform. You will bridge frontend user experiences with resilient cloud backend architectures.',
      requirements: '• 7+ years building enterprise full-stack web applications\n• Mastery of React, Node.js, TypeScript, and cloud-native databases\n• Proven technical leadership and architectural decision-making',
      responsibilities: '• Drive architectural roadmap across frontend and backend services\n• Enforce coding standards, CI/CD safety, and security best practices\n• Work directly with product leadership to execute quarterly strategic goals',
      skills: 'React, TypeScript, Node.js, PostgreSQL, AWS, Microservices',
      location: 'San Francisco, CA (Remote)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.LEAD,
      salaryMin: 180000,
      salaryMax: 230000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: techNova.id,
      recruiterId: recruiterProfiles[1].id,
      title: 'Senior Python Engineer (FastAPI & Async)',
      description: 'Scale our async background data ingestion and microservices using Python 3.12, FastAPI, Celery, and Redis.',
      requirements: '• 5+ years building production Python services\n• Expertise in asyncio, FastAPI, SQLAlchemy, and background workers\n• Solid testing and containerization background',
      responsibilities: '• Develop low-latency data connectors and asynchronous workers\n• Optimize memory footprint and CPU utilization for data workloads',
      skills: 'Python, FastAPI, Celery, PostgreSQL, Redis, Docker',
      location: 'Remote (US)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.SENIOR,
      salaryMin: 145000,
      salaryMax: 185000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: cloudScale.id,
      recruiterId: recruiterProfiles[2].id,
      title: 'Enterprise Java / Spring Boot Engineer',
      description: 'CloudScale Systems is looking for a seasoned Java Engineer to architect low-latency financial transaction settlement pipelines with Spring Boot and PostgreSQL.',
      requirements: '• 6+ years enterprise Java (Java 17/21) & Spring Boot\n• Strong background in JPA/Hibernate, distributed caching, and ACID transactions\n• Experience with Kafka messaging and containerized deployment',
      responsibilities: '• Design and develop transaction validation microservices\n• Optimize database batch throughput and connection pooling\n• Implement strict security compliance and auditing workflows',
      skills: 'Java, Spring Boot, PostgreSQL, Kafka, Docker, Kubernetes',
      location: 'New York, NY (Hybrid)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.SENIOR,
      salaryMin: 165000,
      salaryMax: 210000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: techNova.id,
      recruiterId: recruiterProfiles[1].id,
      title: 'AI/ML Platform Engineer (LLM & PyTorch)',
      description: 'Build scalable machine learning serving systems, fine-tune open-weights models, and integrate retrieval-augmented generation (RAG) for applicant matching.',
      requirements: '• 4+ years in machine learning engineering\n• Hands-on proficiency with PyTorch, HuggingFace, and vector databases (pgvector/Pinecone)\n• Experience serving inference with vLLM or Triton',
      responsibilities: '• Deploy and evaluate candidate-job relevance recommendation models\n• Build automated evaluation pipelines for hallucination prevention\n• Scale vector similarity search infrastructure',
      skills: 'Python, PyTorch, LLMs, Vector DBs, pgvector, Docker',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.MID_LEVEL,
      salaryMin: 160000,
      salaryMax: 205000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: techNova.id,
      recruiterId: recruiterProfiles[1].id,
      title: 'Senior Product Data Analyst (SQL & BI)',
      description: 'Drive data-driven recruitment insights by building robust SQL models, KPI dashboards in Tableau, and funnel conversion tracking.',
      requirements: '• 4+ years experience in product analytics or BI engineering\n• Mastery of complex SQL queries, window functions, and dbt models\n• Experience visualizing recruitment funnels and cohort retention',
      responsibilities: '• Build and maintain executive recruitment metrics dashboards\n• Analyze conversion drop-offs across application stages\n• Partner with product managers to define tracking specs',
      skills: 'SQL, Tableau, dbt, PostgreSQL, Python, Analytics',
      location: 'Remote (US)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.SENIOR,
      salaryMin: 125000,
      salaryMax: 160000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: cloudScale.id,
      recruiterId: recruiterProfiles[2].id,
      title: 'Senior DevOps & Cloud SRE (AWS & K8s)',
      description: 'Own multi-region AWS cloud infrastructure, automate deployment pipelines with Terraform, and guarantee 99.99% availability for CloudScale services.',
      requirements: '• 5+ years managing production AWS infrastructure with Terraform\n• Deep expertise in Kubernetes cluster management, Helm, and GitOps (ArgoCD)\n• Strong observability background with Prometheus, Grafana, and OpenTelemetry',
      responsibilities: '• Maintain production EKS clusters across multiple AWS regions\n• Automate CI/CD pipelines to achieve < 10min safe deployments\n• Conduct incident post-mortems and proactive chaos testing',
      skills: 'AWS, Kubernetes, Terraform, Docker, CI/CD, Prometheus',
      location: 'Remote (US/Canada)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.SENIOR,
      salaryMin: 160000,
      salaryMax: 200000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: techNova.id,
      recruiterId: recruiterProfiles[1].id,
      title: 'Lead UI/UX Product Designer',
      description: 'Shape the future of enterprise ATS interfaces. Craft intuitive Kanban flows, candidate profile views, and design token architectures in Figma.',
      requirements: '• 6+ years in digital product design for web applications\n• Strong portfolio demonstrating complex B2B workflow solutions\n• Proficiency creating scalable Figma component design systems',
      responsibilities: '• Lead end-to-end product design from discovery to pixel-perfect specs\n• Conduct user interviews with corporate talent acquisition leaders\n• Partner closely with frontend engineers during UI implementation',
      skills: 'Figma, UI/UX Design, Design Systems, User Research, Prototyping',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.LEAD,
      salaryMin: 155000,
      salaryMax: 195000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: cloudScale.id,
      recruiterId: recruiterProfiles[2].id,
      title: 'Systems Software Engineer (Distributed Systems)',
      description: 'Design low-latency data replication, distributed caching layers, and high-concurrency ingestion protocols in Go and C++.',
      requirements: '• 4+ years in distributed systems engineering (Go, Rust, or C++)\n• Solid understanding of consensus algorithms, TCP/IP networking, and memory optimization\n• Experience with Linux internals and kernel profiling',
      responsibilities: '• Build high-throughput data distribution primitives\n• Profile and eliminate latency bottlenecks in critical network paths',
      skills: 'Go, C++, Distributed Systems, Linux, Concurrency, Networking',
      location: 'New York, NY (On-site)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.SENIOR,
      salaryMin: 175000,
      salaryMax: 225000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: cloudScale.id,
      recruiterId: recruiterProfiles[2].id,
      title: 'Mid-Level Frontend Developer (Tailwind & React)',
      description: 'Collaborate with senior architects to implement fast, accessible, and responsive user dashboards with React and Tailwind CSS.',
      requirements: '• 2-4 years of experience with React, TypeScript, and modern CSS\n• Experience integrating RESTful endpoints and form handling',
      responsibilities: '• Develop clean, reusable React UI components\n• Write unit tests and participate in sprint grooming',
      skills: 'React, TypeScript, Tailwind CSS, Jest, Git',
      location: 'Remote (US)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.MID_LEVEL,
      salaryMin: 105000,
      salaryMax: 135000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: cloudScale.id,
      recruiterId: recruiterProfiles[2].id,
      title: 'Cloud Backend Engineer (Go & Microservices)',
      description: 'Build autonomous microservices, event-driven streaming workers, and cloud API gateways in Go and PostgreSQL.',
      requirements: '• 3+ years writing concurrent Go applications in production\n• Solid experience with relational databases and SQL optimization',
      responsibilities: '• Build and maintain scalable backend microservices\n• Author automated test suites and maintain CI workflows',
      skills: 'Go, PostgreSQL, Docker, Microservices, REST APIs',
      location: 'New York, NY (Hybrid)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.MID_LEVEL,
      salaryMin: 135000,
      salaryMax: 170000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: cloudScale.id,
      recruiterId: recruiterProfiles[2].id,
      title: 'Full-Stack Software Engineer (Growth & Integrations)',
      description: 'Develop integrations connecting HireFlow with Slack, Google Workspace, and enterprise HRIS systems using React and Node.js.',
      requirements: '• 3+ years of full-stack experience with JavaScript/TypeScript\n• Experience with OAuth2, Webhooks, and 3rd-party API integrations',
      responsibilities: '• Build partner integrations and webhook event listeners\n• Implement telemetry and onboarding funnel experiments',
      skills: 'TypeScript, React, Node.js, Webhooks, OAuth, PostgreSQL',
      location: 'Remote (US)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.MID_LEVEL,
      salaryMin: 125000,
      salaryMax: 155000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: techNova.id,
      recruiterId: recruiterProfiles[0].id,
      title: 'Computer Vision & Deep Learning Specialist (Draft)',
      description: 'Upcoming research role exploring multimodal video analysis for candidate remote interview transcriptions and sentiment modeling.',
      requirements: '• PhD or MS in Computer Science or Computer Vision\n• Experience with OpenCV, PyTorch, and multimodal transformer architectures',
      responsibilities: '• Explore automated interview captioning and visual analysis research',
      skills: 'Python, PyTorch, Computer Vision, OpenCV, Transformers',
      location: 'San Francisco, CA (On-site)',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.LEAD,
      salaryMin: 185000,
      salaryMax: 240000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.DRAFT,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: cloudScale.id,
      recruiterId: recruiterProfiles[2].id,
      title: 'Cloud Infrastructure Security Specialist (Archived)',
      description: 'Completed search for cloud infrastructure compliance and SOC2 auditing specialist across multi-tenant environments.',
      requirements: '• 5+ years in cloud security, IAM policies, and compliance auditing',
      responsibilities: '• Maintain SOC2 compliance, conduct quarterly penetration tests',
      skills: 'AWS Security, IAM, Terraform, Compliance, SOC2',
      location: 'New York, NY',
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceLevel: EXPERIENCE_LEVELS.SENIOR,
      salaryMin: 155000,
      salaryMax: 195000,
      salaryCurrency: 'USD',
      status: JOB_STATUS.ARCHIVED,
      deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ];

  const seededJobs: any[] = [];
  for (const jd of jobsData) {
    let job = await prisma.job.findFirst({
      where: { companyId: jd.companyId, title: jd.title },
    });
    if (!job) {
      job = await prisma.job.create({ data: jd });
      createdCounts.jobs++;
      logger.info(`✅ Job listing created: "${job.title}" (${job.status})`);
    } else {
      logger.info(`ℹ️ Job listing already exists: "${job.title}"`);
    }
    seededJobs.push(job);
  }

  // ==========================================
  // 6. APPLICATIONS (23 Applications Across All 6 Stages)
  // Stages: APPLIED (5), SCREENING (4), SHORTLISTED (4), INTERVIEW (4), SELECTED (3), REJECTED (3)
  // ==========================================
  const applicationsData = [
    // --- 5 APPLIED ---
    {
      jobIndex: 0, // Senior Frontend Engineer
      applicantIndex: 3, // Priya Patel
      stage: APPLICATION_STAGES.APPLIED,
      rating: 4,
      coverLetter: 'Hello Sarah! I have built responsive frontend modules for over 4 years and would love to contribute to TechNova design systems.',
      daysAgo: 1,
    },
    {
      jobIndex: 1, // Senior Backend Engineer
      applicantIndex: 9, // Daniel Becker
      stage: APPLICATION_STAGES.APPLIED,
      rating: 3,
      coverLetter: 'Dear TechNova team, my async backend experience with Python and relational databases fits this backend opportunity well.',
      daysAgo: 2,
    },
    {
      jobIndex: 3, // Python Engineer
      applicantIndex: 8, // Lucas Silva
      stage: APPLICATION_STAGES.APPLIED,
      rating: 3,
      coverLetter: 'Excited to apply my data engineering and Python script automation background to TechNova.',
      daysAgo: 2,
    },
    {
      jobIndex: 4, // Java Engineer
      applicantIndex: 2, // David Chen
      stage: APPLICATION_STAGES.APPLIED,
      rating: 4,
      coverLetter: 'I have strong distributed systems background in Go and Node, and look forward to scaling high-throughput enterprise pipelines at CloudScale.',
      daysAgo: 3,
    },
    {
      jobIndex: 7, // DevOps Engineer
      applicantIndex: 0, // Alex Rivera
      stage: APPLICATION_STAGES.APPLIED,
      rating: 4,
      coverLetter: 'Bringing my full stack and containerization experience to support CloudScale cloud reliability.',
      daysAgo: 3,
    },

    // --- 4 SCREENING ---
    {
      jobIndex: 0, // Senior Frontend Engineer
      applicantIndex: 7, // Aisha Mohammed (UI Designer)
      stage: APPLICATION_STAGES.SCREENING,
      rating: 4,
      coverLetter: 'Excited to bring both Figma design system leadership and frontend component craft to TechNova.',
      notes: 'Strong portfolio. Screening recruiter to assess depth of TypeScript vs pure UI design.',
      daysAgo: 4,
    },
    {
      jobIndex: 1, // Senior Backend Engineer
      applicantIndex: 3, // Priya Patel
      stage: APPLICATION_STAGES.SCREENING,
      rating: 4,
      coverLetter: 'Looking to expand into distributed Node.js backend services at TechNova.',
      notes: 'Good API knowledge. Scheduled introductory screening call.',
      daysAgo: 5,
    },
    {
      jobIndex: 6, // Data Analyst
      applicantIndex: 8, // Lucas Silva (Data Analyst)
      stage: APPLICATION_STAGES.SCREENING,
      rating: 5,
      coverLetter: 'I have transformed analytics warehouses using SQL and dbt, and would love to spearhead product analytics at TechNova.',
      notes: 'Resume is an exact match for BI models and SQL tuning. Screening in progress.',
      daysAgo: 5,
    },
    {
      jobIndex: 11, // Cloud Backend Go
      applicantIndex: 9, // Daniel Becker
      stage: APPLICATION_STAGES.SCREENING,
      rating: 4,
      coverLetter: 'Interested in low-latency microservices with CloudScale.',
      notes: 'Checking background in Go concurrency.',
      daysAgo: 6,
    },

    // --- 4 SHORTLISTED ---
    {
      jobIndex: 2, // Lead Full-Stack Architect
      applicantIndex: 2, // David Chen
      stage: APPLICATION_STAGES.SHORTLISTED,
      rating: 5,
      coverLetter: 'I have 6 years architecting high-volume microservices and APIs. Eager to take on full-stack architecture leadership at TechNova.',
      notes: 'Recruiter screen completed with flying colors. Strong systems design and great cultural fit.',
      daysAgo: 7,
    },
    {
      jobIndex: 5, // AI/ML Platform Engineer
      applicantIndex: 5, // Sarah Kim (AI Engineer)
      stage: APPLICATION_STAGES.SHORTLISTED,
      rating: 5,
      coverLetter: 'My work on RAG hallucination reduction and vector databases directly aligns with TechNova AI platform vision.',
      notes: 'Exceptional PyTorch and vector DB background. Passed initial talent screen. Moving to technical panel.',
      daysAgo: 8,
    },
    {
      jobIndex: 7, // DevOps Engineer
      applicantIndex: 4, // Marcus Aurelius (DevOps)
      stage: APPLICATION_STAGES.SHORTLISTED,
      rating: 5,
      coverLetter: 'Managing 40+ microservices on multi-region Kubernetes clusters is my core expertise. Excited about CloudScale infrastructure.',
      notes: 'Deep Terraform & EKS expertise. Shortlisted for Technical Interview round.',
      daysAgo: 8,
    },
    {
      jobIndex: 8, // Lead UI/UX Product Designer
      applicantIndex: 7, // Aisha Mohammed (UI Designer)
      stage: APPLICATION_STAGES.SHORTLISTED,
      rating: 5,
      coverLetter: 'I have led end-to-end B2B enterprise SaaS redesigns and built component systems in Figma for over 6 years.',
      notes: 'Stunning portfolio presentation. Team unanimously voted to shortlist.',
      daysAgo: 9,
    },

    // --- 4 INTERVIEW ---
    {
      jobIndex: 2, // Lead Full-Stack Architect
      applicantIndex: 0, // Alex Rivera
      stage: APPLICATION_STAGES.INTERVIEW,
      rating: 5,
      coverLetter: 'I have been following TechNova Solutions and would love to bring my React, TypeScript, and Node architecture experience to your flagship team.',
      notes: 'Top tier candidate. Coding challenge score: 98/100. Technical architecture interview scheduled with Sarah Jenkins.',
      daysAgo: 10,
    },
    {
      jobIndex: 1, // Senior Backend Engineer
      applicantIndex: 2, // David Chen
      stage: APPLICATION_STAGES.INTERVIEW,
      rating: 5,
      coverLetter: 'Excited about scaling relational databases and event-driven microservices at TechNova.',
      notes: 'Technical round scheduled on query optimization and concurrent transactions.',
      daysAgo: 11,
    },
    {
      jobIndex: 7, // Senior DevOps CloudScale
      applicantIndex: 4, // Marcus Aurelius
      stage: APPLICATION_STAGES.INTERVIEW,
      rating: 5,
      coverLetter: 'CloudScale low-latency systems infrastructure is exactly where I thrive.',
      notes: 'SRE deep-dive interview scheduled with Jessica Davis.',
      daysAgo: 12,
    },
    {
      jobIndex: 5, // AI/ML Platform Engineer
      applicantIndex: 5, // Sarah Kim
      stage: APPLICATION_STAGES.INTERVIEW,
      rating: 5,
      coverLetter: 'Looking forward to discussing RAG inference optimization and model serving pipelines with the team.',
      notes: 'Managerial and systems alignment round scheduled.',
      daysAgo: 12,
    },

    // --- 3 SELECTED (Hired / Extended Offer) ---
    {
      jobIndex: 0, // Senior Frontend Engineer
      applicantIndex: 1, // Elena Rostova
      stage: APPLICATION_STAGES.SELECTED,
      rating: 5,
      coverLetter: 'I am excited to bring frontend systems design and UI craft to TechNova flagship products.',
      notes: 'All interview rounds scored 5/5. Offer package extended and accepted. Welcome to TechNova!',
      daysAgo: 15,
    },
    {
      jobIndex: 4, // Enterprise Java Engineer
      applicantIndex: 6, // James Wilson (Java)
      stage: APPLICATION_STAGES.SELECTED,
      rating: 5,
      coverLetter: 'Over 8 years building mission-critical financial systems in Spring Boot and PostgreSQL.',
      notes: 'Perfect architectural fit. Offer extended and signed. Joining next month.',
      daysAgo: 18,
    },
    {
      jobIndex: 8, // Lead UI/UX Product Designer
      applicantIndex: 7, // Aisha Mohammed
      stage: APPLICATION_STAGES.SELECTED,
      rating: 5,
      coverLetter: 'Ready to drive world-class enterprise ATS user experiences.',
      notes: 'Design leadership round was outstanding. Candidate selected for the Lead role.',
      daysAgo: 20,
    },

    // --- 3 REJECTED ---
    {
      jobIndex: 0, // Senior Frontend Engineer
      applicantIndex: 4, // Marcus Aurelius (DevOps background applying for Frontend)
      stage: APPLICATION_STAGES.REJECTED,
      rating: 2,
      coverLetter: 'Interested in frontend opportunities.',
      notes: 'Candidate background is specialized in DevOps/Infra rather than Frontend Architecture. Sent polite rejection with referral to SRE role.',
      daysAgo: 14,
    },
    {
      jobIndex: 4, // Enterprise Java Engineer
      applicantIndex: 1, // Elena Rostova (Frontend applying for Java)
      stage: APPLICATION_STAGES.REJECTED,
      rating: 2,
      coverLetter: 'Applying for backend role.',
      notes: 'Profile does not meet minimum Spring Boot / Java requirements.',
      daysAgo: 16,
    },
    {
      jobIndex: 9, // Systems Software Engineer
      applicantIndex: 3, // Priya Patel
      stage: APPLICATION_STAGES.REJECTED,
      rating: 3,
      coverLetter: 'Applying for systems role.',
      notes: 'Role requires low-level C++/Go kernel optimization. Encouraged to apply for future full-stack roles.',
      daysAgo: 17,
    },
  ];

  const seededApplications: any[] = [];

  for (const ad of applicationsData) {
    const targetJob = seededJobs[ad.jobIndex];
    const targetApplicant = applicantProfiles[ad.applicantIndex];
    const applicantUser = applicantUsers[ad.applicantIndex];

    let application = await prisma.application.findUnique({
      where: {
        jobId_applicantId: {
          jobId: targetJob.id,
          applicantId: targetApplicant.id,
        },
      },
    });

    if (!application) {
      application = await prisma.application.create({
        data: {
          jobId: targetJob.id,
          applicantId: targetApplicant.id,
          currentStage: ad.stage,
          coverLetter: ad.coverLetter,
          notes: ad.notes,
          rating: ad.rating,
          appliedAt: new Date(Date.now() - ad.daysAgo * 24 * 60 * 60 * 1000),
        },
      });
      createdCounts.applications++;

      // Create realistic stage history trail
      const stageSequence = [
        APPLICATION_STAGES.APPLIED,
        APPLICATION_STAGES.SCREENING,
        APPLICATION_STAGES.SHORTLISTED,
        APPLICATION_STAGES.INTERVIEW,
        APPLICATION_STAGES.SELECTED,
      ];

      if (ad.stage === APPLICATION_STAGES.REJECTED) {
        // Staged to APPLIED then REJECTED
        await prisma.applicationStageHistory.createMany({
          data: [
            {
              applicationId: application.id,
              previousStage: null,
              newStage: APPLICATION_STAGES.APPLIED,
              changedById: applicantUser.id,
              reason: 'Application submitted by candidate',
              changedAt: new Date(Date.now() - ad.daysAgo * 24 * 60 * 60 * 1000),
            },
            {
              applicationId: application.id,
              previousStage: APPLICATION_STAGES.APPLIED,
              newStage: APPLICATION_STAGES.REJECTED,
              changedById: recruiterUsers[0].id,
              reason: ad.notes || 'Did not meet criteria for specified role',
              changedAt: new Date(Date.now() - (ad.daysAgo - 2) * 24 * 60 * 60 * 1000),
            },
          ],
        });
        createdCounts.stageHistories += 2;
      } else {
        const targetIndex = stageSequence.indexOf(ad.stage);
        const historyRecords: any[] = [];
        let prev: any = null;

        for (let i = 0; i <= targetIndex; i++) {
          const current = stageSequence[i];
          const daysOffset = ad.daysAgo - i * 2;
          historyRecords.push({
            applicationId: application.id,
            previousStage: prev,
            newStage: current,
            changedById: i === 0 ? applicantUser.id : recruiterUsers[0].id,
            reason: i === 0 ? 'Application submitted online' : `Moved to ${current} after review`,
            changedAt: new Date(Date.now() - Math.max(daysOffset, 0) * 24 * 60 * 60 * 1000),
          });
          prev = current;
        }

        await prisma.applicationStageHistory.createMany({ data: historyRecords });
        createdCounts.stageHistories += historyRecords.length;
      }

      logger.info(`✅ Application seeded: ${targetApplicant.fullName} -> "${targetJob.title}" [${ad.stage}]`);
    } else {
      logger.info(`ℹ️ Application already exists: ${targetApplicant.fullName} -> "${targetJob.title}"`);
    }
    seededApplications.push(application);
  }

  // ==========================================
  // 7. SCHEDULED INTERVIEWS (6 Realistic Interviews)
  // ==========================================
  const interviewsData = [
    {
      appIndex: 13, // Alex Rivera - Lead Full-Stack Architect
      recruiterUserIndex: 0,
      interviewerName: 'Sarah Jenkins',
      interviewerEmail: 'demo.recruiter1@hireflow.test',
      date: '2026-11-20',
      startTime: '14:00',
      endTime: '15:00',
      interviewType: INTERVIEW_TYPES.TECHNICAL,
      status: INTERVIEW_STATUSES.SCHEDULED,
      meetingLink: 'https://meet.google.com/hfw-alex-tech',
      notes: 'System architecture deep-dive: discuss state management, caching, and DB scaling.',
    },
    {
      appIndex: 14, // David Chen - Senior Backend Engineer
      recruiterUserIndex: 0,
      interviewerName: 'Sarah Jenkins',
      interviewerEmail: 'demo.recruiter1@hireflow.test',
      date: '2026-11-22',
      startTime: '11:00',
      endTime: '12:00',
      interviewType: INTERVIEW_TYPES.TECHNICAL,
      status: INTERVIEW_STATUSES.SCHEDULED,
      meetingLink: 'https://meet.google.com/hfw-david-node',
      notes: 'High concurrency live coding & PostgreSQL query optimization.',
    },
    {
      appIndex: 15, // Marcus Aurelius - Senior DevOps
      recruiterUserIndex: 2,
      interviewerName: 'Jessica Davis',
      interviewerEmail: 'demo.recruiter3@hireflow.test',
      date: '2026-11-24',
      startTime: '15:30',
      endTime: '16:30',
      interviewType: INTERVIEW_TYPES.TECHNICAL,
      status: INTERVIEW_STATUSES.SCHEDULED,
      meetingLink: 'https://zoom.us/j/hfw-marcus-k8s',
      notes: 'Terraform multi-region DR & Kubernetes ingress troubleshooting.',
    },
    {
      appIndex: 16, // Sarah Kim - AI/ML Platform Engineer
      recruiterUserIndex: 1,
      interviewerName: 'Michael Chang',
      interviewerEmail: 'demo.recruiter2@hireflow.test',
      date: '2026-11-25',
      startTime: '10:00',
      endTime: '11:00',
      interviewType: INTERVIEW_TYPES.MANAGERIAL,
      status: INTERVIEW_STATUSES.SCHEDULED,
      meetingLink: 'https://meet.google.com/hfw-sarah-aiml',
      notes: 'Model evaluation pipelines, latency tradeoffs, and team collaboration.',
    },
    {
      appIndex: 17, // Elena Rostova - Senior Frontend (Selected)
      recruiterUserIndex: 0,
      interviewerName: 'Sarah Jenkins',
      interviewerEmail: 'demo.recruiter1@hireflow.test',
      date: '2026-11-10',
      startTime: '13:00',
      endTime: '14:00',
      interviewType: INTERVIEW_TYPES.FINAL,
      status: INTERVIEW_STATUSES.COMPLETED,
      meetingLink: 'https://meet.google.com/hfw-elena-final',
      notes: 'Hiring Manager final round: culture, leadership, design tokens.',
      feedback: 'Exceptional candidate. Recommended for immediate offer.',
    },
    {
      appIndex: 18, // James Wilson - Enterprise Java (Selected)
      recruiterUserIndex: 2,
      interviewerName: 'Jessica Davis',
      interviewerEmail: 'demo.recruiter3@hireflow.test',
      date: '2026-11-12',
      startTime: '16:00',
      endTime: '17:00',
      interviewType: INTERVIEW_TYPES.TECHNICAL,
      status: INTERVIEW_STATUSES.COMPLETED,
      meetingLink: 'https://zoom.us/j/hfw-james-spring',
      notes: 'Spring Security, JPA batch operations, distributed tracing.',
      feedback: 'Flawless performance on distributed transaction isolation.',
    },
  ];

  for (const iv of interviewsData) {
    const targetApp = seededApplications[iv.appIndex];
    if (!targetApp) continue;

    const existingInterview = await prisma.interview.findFirst({
      where: { applicationId: targetApp.id, date: iv.date, startTime: iv.startTime },
    });

    if (!existingInterview) {
      await prisma.interview.create({
        data: {
          applicationId: targetApp.id,
          scheduledById: recruiterUsers[iv.recruiterUserIndex].id,
          interviewerName: iv.interviewerName,
          interviewerEmail: iv.interviewerEmail,
          date: iv.date,
          startTime: iv.startTime,
          endTime: iv.endTime,
          interviewType: iv.interviewType,
          status: iv.status,
          meetingLink: iv.meetingLink,
          notes: iv.notes,
          feedback: iv.feedback,
        },
      });
      createdCounts.interviews++;
      logger.info(`✅ Interview seeded: ${iv.interviewerName} on ${iv.date} [${iv.status}]`);
    } else {
      logger.info(`ℹ️ Interview already exists: ${iv.interviewerName} on ${iv.date}`);
    }
  }

  // ==========================================
  // 8. NOTIFICATIONS
  // ==========================================
  const notificationsData = [
    {
      userEmail: 'demo.applicant1@hireflow.test',
      type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
      title: 'Interview Scheduled! 📅',
      message: 'Your Technical Interview for "Lead Full-Stack Architect" is scheduled for 2026-11-20 at 14:00.',
    },
    {
      userEmail: 'demo.applicant2@hireflow.test',
      type: NOTIFICATION_TYPES.APPLICATION_STATUS,
      title: 'Offer Package Extended! 🎉',
      message: 'Congratulations! You have been selected for "Senior Frontend Engineer (React/Next.js)" at TechNova Solutions.',
    },
    {
      userEmail: 'demo.applicant3@hireflow.test',
      type: NOTIFICATION_TYPES.APPLICATION_STATUS,
      title: 'Application Shortlisted 🚀',
      message: 'Your application for "Senior Backend Engineer" has been shortlisted for team interviews.',
    },
    {
      userEmail: 'demo.recruiter1@hireflow.test',
      type: NOTIFICATION_TYPES.NEW_APPLICATION,
      title: 'New Applicant Received',
      message: 'Priya Patel submitted an application for "Senior Frontend Engineer".',
    },
    {
      userEmail: 'demo.company1@hireflow.test',
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Monthly Recruitment Report Ready',
      message: 'Your TechNova hiring funnel analytics for Q4 are ready for review.',
    },
  ];

  for (const n of notificationsData) {
    const u = await prisma.user.findUnique({ where: { email: n.userEmail } });
    if (!u) continue;

    const existingNotif = await prisma.notification.findFirst({
      where: { userId: u.id, title: n.title },
    });

    if (!existingNotif) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: false,
        },
      });
      createdCounts.notifications++;
    }
  }

  // ==========================================
  // 9. AUDIT LOGS
  // ==========================================
  const auditLogsData = [
    {
      actorEmail: adminEmail,
      action: AUDIT_ACTIONS.USER_LOGIN,
      entity: 'User',
      metadata: JSON.stringify({ role: ROLES.SUPER_ADMIN, action: 'Admin dashboard login' }),
    },
    {
      actorEmail: 'demo.recruiter1@hireflow.test',
      action: AUDIT_ACTIONS.JOB_CREATE,
      entity: 'Job',
      metadata: JSON.stringify({ title: 'Lead Full-Stack Architect', company: 'TechNova Solutions' }),
    },
    {
      actorEmail: 'demo.recruiter1@hireflow.test',
      action: AUDIT_ACTIONS.APPLICATION_STAGE_CHANGE,
      entity: 'Application',
      metadata: JSON.stringify({ previousStage: 'SHORTLISTED', newStage: 'INTERVIEW' }),
    },
    {
      actorEmail: 'demo.recruiter3@hireflow.test',
      action: AUDIT_ACTIONS.INTERVIEW_SCHEDULE,
      entity: 'Interview',
      metadata: JSON.stringify({ interviewer: 'Jessica Davis', type: 'TECHNICAL' }),
    },
  ];

  for (const al of auditLogsData) {
    const actor = await prisma.user.findUnique({ where: { email: al.actorEmail } });
    if (!actor) continue;

    const existingLog = await prisma.auditLog.findFirst({
      where: { actorId: actor.id, action: al.action, entity: al.entity },
    });

    if (!existingLog) {
      await prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: al.action,
          entity: al.entity,
          metadata: al.metadata,
        },
      });
      createdCounts.auditLogs++;
    }
  }

  logger.info('🎉 Seeding completed successfully!');
  logger.info('==================================================');
  logger.info('SEEDED RECORDS SUMMARY:');
  console.table(createdCounts);
  logger.info('==================================================');
  logger.info('DEMO LOGIN CREDENTIALS:');
  logger.info(`Password for all demo accounts: ${DEMO_PASSWORD}`);
  logger.info('1. Super Admin:      demo.admin@hireflow.test');
  logger.info('2. Company 1 (Tech): demo.company1@hireflow.test');
  logger.info('3. Company 2 (Cloud):demo.company2@hireflow.test');
  logger.info('4. Recruiter 1:      demo.recruiter1@hireflow.test (TechNova)');
  logger.info('5. Recruiter 2:      demo.recruiter2@hireflow.test (TechNova)');
  logger.info('6. Recruiter 3:      demo.recruiter3@hireflow.test (CloudScale)');
  logger.info('7. Applicant 1:      demo.applicant1@hireflow.test (Alex Rivera)');
  logger.info('8. Applicant 2:      demo.applicant2@hireflow.test (Elena Rostova)');
  logger.info('9. Applicant 3:      demo.applicant3@hireflow.test (David Chen)');
  logger.info('10. Applicant 4:     demo.applicant4@hireflow.test (Priya Patel)');
  logger.info('... Through to:      demo.applicant10@hireflow.test (Daniel Becker)');
  logger.info('==================================================');

  return createdCounts;
}

main()
  .catch((e) => {
    logger.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
