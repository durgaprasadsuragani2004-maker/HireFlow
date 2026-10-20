# HireFlow ATS — Production Architecture & Engineering Specification

## 1. Executive Summary

**HireFlow** is an enterprise-grade, full-stack Applicant Tracking System (ATS) designed for high-velocity recruitment teams, enterprise companies, and job seekers. The platform connects recruiters, hiring managers, applicants, and platform administrators through a responsive Kanban recruitment pipeline, automated interview scheduling, real-time notifications, strict role-based access controls (RBAC), and multi-tenant data isolation.

---

## 2. System Architecture Overview

HireFlow is architected with a decoupled client-server model separating presentation, business domain logic, and persistent storage:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Tier                            │
│  Next.js 14 (App Router) + React 18 + Tailwind CSS + dnd-kit │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST APIs
                               │ Authorization: Bearer <JWT>
┌──────────────────────────────▼──────────────────────────────┐
│                      API Service Tier                       │
│  Node.js + Express + TypeScript + Zod Validation + Helmet   │
│  Controllers ──► Services ──► Prisma ORM 5.x Client         │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ PostgreSQL Connection        │ AWS S3 SDK Presigner
               │                              │
┌──────────────▼──────────────┐ ┌─────────────▼───────────────┐
│     Persistent Database     │ │    Private Storage Bucket   │
│      Managed PostgreSQL     │ │       AWS S3 / S3-API       │
│  (Relational Data + Enums)  │ │ (Private Resumes + S3 URLs) │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 3. Frontend Architecture

### Core Technologies
- **Framework**: Next.js 14 (App Router architecture with React Server Components & Client Components).
- **Language**: TypeScript with end-to-end type safety.
- **Styling**: Tailwind CSS with custom responsive utilities, dark/light token compatibility, and accessible UI patterns.
- **Drag-and-Drop**: `@dnd-kit/core` & `@dnd-kit/sortable` delivering 60 FPS accessible Kanban stage progression.
- **Visual Analytics**: `recharts` for recruitment funnel graphs, applicant distribution, and hiring metrics.

### Component Organization
- **Kanban Board** (`client/src/components/kanban/`):
  - `KanbanBoard.tsx`: Orchestrates drag sensors, optimistic stage updates, API synchronization, and error rollback.
  - `KanbanColumn.tsx`: Renders stage-specific candidate columns with candidate counts and drop targets.
  - `KanbanCard.tsx`: Candidate cards with experience, rating, interview status, quick actions, and history modal triggers.
  - `StageHistoryModal.tsx`: Visual audit trail showing who transitioned the candidate, timestamp, and transition rationale.
- **Dashboards** (`client/src/components/dashboard/`):
  - `AdminDashboard.tsx`: High-level platform KPIs, user and company health metrics, recent system audit events.
  - `RecruiterDashboard.tsx`: Active job openings, application velocity, pipeline distribution, upcoming interviews.
  - `ApplicantDashboard.tsx`: Active job applications, real-time status progression, scheduled interviews, profile completeness.
- **Modals & Jobs** (`client/src/components/jobs/`, `client/src/components/interviews/`):
  - `ApplyModal.tsx`: One-click candidate application modal with custom cover letter and instant resume attachment.
  - `JobCard.tsx` & `JobFilter.tsx`: Responsive job search with department, location, employment type, and keyword filtering.
  - `ScheduleInterviewModal.tsx`: Conflict-checked interview scheduler with round type, interviewer details, and calendar links.
- **Shared UI & Layout** (`client/src/components/ui/`, `client/src/components/layout/`):
  - `Navbar.tsx`, `Sidebar.tsx`, `Modal.tsx`, `Button.tsx`, `Badge.tsx`, `Skeleton.tsx`, `EmptyState.tsx`.

### Frontend Services & State Management
- **API Client** (`client/src/lib/api.ts`):
  - Axios instance configured with `NEXT_PUBLIC_API_URL` environment binding.
  - Request Interceptor: Automatically inspects `localStorage` and injects `Authorization: Bearer <token>`.
  - Response Interceptor: Catches 401 Unauthorized responses, clears session credentials, and redirects cleanly to `/login`.
- **Context Providers** (`client/src/providers/`):
  - `AuthContext.tsx`: Persistent user authentication state, token refresh, and role-based route guard wrapper.
  - `ToastContext.tsx`: Non-blocking, accessible system notifications and success/error feedback.

---

## 4. Backend Architecture

### Core Technologies
- **Runtime**: Node.js (LTS v20+).
- **Framework**: Express.js with TypeScript.
- **ORM**: Prisma ORM 5.x with native PostgreSQL client and migration engine.
- **Security**: Helmet HTTP headers, CORS origin isolation, Express Rate Limiting, bcryptjs password hashing.
- **Documentation**: Swagger UI & OpenAPI 3.0 mounted at `/api/docs`.

### Layered Separation of Concerns
```
HTTP Request
  │
  ▼
[Rate Limiter] ──► [Helmet & CORS] ──► [Express JSON Parser]
  │
  ▼
[Routing Layer] (server/src/routes/)
  │
  ▼
[Authentication & RBAC Middleware] (server/src/middleware/auth.ts)
  │
  ▼
[Zod Schema Validation Middleware] (server/src/middleware/validate.ts)
  │
  ▼
[Controller Layer] (server/src/controllers/)
  │ Extracts parameters, manages HTTP status codes and responses
  ▼
[Service Layer] (server/src/services/)
  │ Enforces tenant isolation, business rules, stage transitions, audits
  ▼
[Data Layer] (Prisma ORM + PostgreSQL)
```

### Key Modules & Controllers
- `authController.ts` & `authService.ts`: Registration, bcrypt verification, JWT access & refresh token generation.
- `jobController.ts` & `jobService.ts`: Job lifecycle management (Draft, Published, Archived), recruiter ownership enforcement.
- `applicationController.ts` & `applicationService.ts`: Application submission, duplicate prevention, Kanban stage updates, stage history.
- `candidateController.ts` & `candidateService.ts`: Candidate profile search, resume upload, and access-controlled resume download.
- `interviewController.ts` & `interviewService.ts`: Interview scheduling with scheduling conflict prevention algorithms.
- `dashboardController.ts` & `dashboardService.ts`: Role-customized analytics queries and aggregations.
- `notificationController.ts` & `notificationService.ts`: In-app event-driven notification dispatch.
- `auditController.ts` & `auditService.ts`: Immutable security audit logs for compliance tracking.
- `companyController.ts` & `companyService.ts`: Enterprise company directory and profile management.

---

## 5. Database Architecture (PostgreSQL & Prisma)

The persistent database layer utilizes PostgreSQL, configured and managed via `server/prisma/schema.prisma`.

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o| RecruiterProfile : has
    User ||--o| ApplicantProfile : has
    User ||--o{ Notification : receives
    User ||--o{ AuditLog : acts
    User ||--o{ ApplicationStageHistory : changes
    User ||--o{ Interview : schedules

    Company ||--o{ RecruiterProfile : employs
    Company ||--o{ Job : offers

    RecruiterProfile ||--o{ Job : posts

    ApplicantProfile ||--o{ ApplicantSkill : possesses
    ApplicantProfile ||--o{ Experience : worked
    ApplicantProfile ||--o{ Education : studied
    ApplicantProfile ||--o{ Application : submits

    Job ||--o{ Application : receives

    Application ||--o{ ApplicationStageHistory : records
    Application ||--o{ Interview : hosts
```

### Entity Specifications

| Entity | Primary Key | Key Attributes | Relational Associations |
|---|---|---|---|
| **User** | UUID (`id`) | `email`, `passwordHash`, `role`, `status`, `createdAt` | 1:1 `RecruiterProfile`, 1:1 `ApplicantProfile`, 1:N `Notification`, 1:N `AuditLog` |
| **Company** | UUID (`id`) | `name`, `logo`, `description`, `industry`, `location`, `website` | 1:N `RecruiterProfile`, 1:N `Job` |
| **RecruiterProfile**| UUID (`id`) | `title`, `department`, `phone`, `companyId`, `userId` | N:1 `Company`, 1:1 `User`, 1:N `Job` |
| **ApplicantProfile**| UUID (`id`) | `fullName`, `phone`, `headline`, `summary`, `resumeUrl`, `resumeFileName` | 1:1 `User`, 1:N `ApplicantSkill`, 1:N `Experience`, 1:N `Application` |
| **Job** | UUID (`id`) | `title`, `description`, `location`, `salaryMin`, `salaryMax`, `status` | N:1 `Company`, N:1 `RecruiterProfile`, 1:N `Application` |
| **Application** | UUID (`id`) | `currentStage`, `coverLetter`, `rating`, `notes`, `appliedAt` | N:1 `Job`, N:1 `ApplicantProfile`, 1:N `ApplicationStageHistory`, 1:N `Interview` |
| **ApplicationStageHistory** | UUID (`id`) | `previousStage`, `newStage`, `reason`, `changedAt`, `changedById` | N:1 `Application`, N:1 `User` (actor) |
| **Interview** | UUID (`id`) | `interviewerName`, `interviewerEmail`, `date`, `startTime`, `endTime`, `interviewType`, `status`, `meetingLink` | N:1 `Application`, N:1 `User` (scheduler) |
| **Notification** | UUID (`id`) | `type`, `title`, `message`, `read`, `metadata`, `createdAt` | N:1 `User` |
| **ApplicantSkill** | UUID (`id`) | `name`, `level`, `yearsOfExperience` | N:1 `ApplicantProfile` |
| **AuditLog** | UUID (`id`) | `action`, `entity`, `entityId`, `metadata`, `ipAddress`, `createdAt` | N:1 `User` (`actorId`) |

---

## 6. API Documentation Summary

Every API endpoint is prefixed with `/api` and enforces strict input validation and HTTP response standards.

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create candidate or recruiter account with role assignment.
- `POST /api/auth/login` — Authenticate credentials via bcrypt and return JWT access/refresh tokens.
- `POST /api/auth/refresh` — Refresh expired access token using valid refresh token.
- `GET /api/auth/me` — Return authenticated profile with nested roles and company associations.
- `POST /api/auth/logout` — Terminate user session.

### Recruitment Pipeline & Applications (`/api/applications`)
- `POST /api/applications` — Submit candidate application for a published job.
- `GET /api/applications/my` — Retrieve authenticated applicant's application portfolio.
- `GET /api/applications/job/:jobId` — Fetch Kanban applications categorized by stage (Recruiter company-isolated).
- `PATCH /api/applications/:id/stage` — Move application stage (e.g. `APPLIED` $\rightarrow$ `SCREENING` $\rightarrow$ `SHORTLISTED`).
- `GET /api/applications/:id/history` — Audit log of all historical stage transitions for an application.

### Candidate & Resume Management (`/api/candidates`)
- `GET /api/candidates` — Multi-facet candidate search with filters (skills, stages, jobs).
- `GET /api/candidates/:id` — Candidate detailed profile including verified experience and skills.
- `POST /api/candidates/resume/upload` — Multipart PDF/DOCX resume upload with MIME-type validation.
- `GET /api/candidates/resumes/:filename` — Secure BOLA-protected resume download endpoint.
- `POST /api/candidates/skills` — Batch update candidate skills.

### Job Management (`/api/jobs`)
- `GET /api/jobs` — Public/authenticated job listing with pagination, search, and department filters.
- `POST /api/jobs` — Recruiter creates a new job requisition.
- `GET /api/jobs/:id` — Detailed job specification with company metadata.
- `PATCH /api/jobs/:id` — Update job status (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
- `DELETE /api/jobs/:id` — Remove job requisition.

### Interviews & Scheduling (`/api/interviews`)
- `POST /api/interviews` — Schedule interview round with automatic interviewer calendar collision prevention.
- `GET /api/interviews/my` — List upcoming and past interviews for the authenticated user.
- `PATCH /api/interviews/:id/status` — Update status (`SCHEDULED`, `COMPLETED`, `CANCELLED`).

### Notifications, Analytics & Health
- `GET /api/notifications` — Retrieve paginated notifications with unread counts.
- `PATCH /api/notifications/:id/read` — Mark notification as acknowledged.
- `GET /api/dashboard/recruiter` — Pipeline throughput, funnel metrics, and candidate distribution.
- `GET /api/dashboard/admin` — Global platform metrics, user registry, and security audit logs.
- `GET /api/health` — Platform health check verifying live database connectivity.
- `GET /api/docs` — Interactive OpenAPI 3.0 Swagger UI documentation.

---

## 7. Role-Based Access Control (RBAC) & Multi-Tenant Security

HireFlow implements a defense-in-depth security model across authentication, endpoint authorization, and service-layer tenant isolation:

```
[Incoming Request]
        │
        ▼
[JWT Authentication Middleware: authenticate]
        │ ➔ Extracts Bearer token
        │ ➔ Validates signature & expiry
        │ ➔ Rehydrates User + RecruiterProfile / ApplicantProfile
        │ ➔ Blocks suspended users (403)
        ▼
[Role Whitelist: authorizeRoles(RoleType[])]
        │ ➔ Ensures role in allowed list (SUPER_ADMIN, RECRUITER, APPLICANT)
        │ ➔ Emits 403 Forbidden if role unauthorized
        ▼
[Tenant & Resource Isolation in Service Layer]
        │ ➔ Recruiter can ONLY access/modify candidates belonging to their Company
        │ ➔ Applicant can ONLY access their own applications and profile
        │ ➔ Resume downloads enforce strict BOLA authorization
        ▼
[Database Mutation inside Prisma Transaction]
```

### Permission Matrix

| Operation | APPLICANT | RECRUITER | SUPER_ADMIN |
|---|:---:|:---:|:---:|
| Browse & Search Published Jobs | ✅ | ✅ | ✅ |
| Submit Job Application | ✅ | ❌ | ❌ |
| View Own Applications & Status | ✅ | ❌ | ❌ |
| Download Own Resume | ✅ | ❌ | ✅ |
| Create & Publish Jobs | ❌ | ✅ (Own Company) | ✅ |
| View Company Candidates & Kanban | ❌ | ✅ (Own Company) | ✅ |
| Change Candidate Kanban Stage | ❌ | ✅ (Own Company) | ✅ |
| Schedule Interviews | ❌ | ✅ (Own Company) | ✅ |
| Download Candidate Resume | ❌ | ✅ (If applied to company) | ✅ |
| Download Unrelated Candidate Resume | ❌ | ❌ (Blocked 403) | ✅ |
| Manage System Users & Companies | ❌ | ❌ | ✅ |
| View Global Audit Logs | ❌ | ❌ | ✅ |

---

## 8. The Recruitment Pipeline & Stage Transition Workflow

### Kanban Lifecycle
```
                 ┌───────────────┐
                 │    APPLIED    │
                 └───────┬───────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
 ┌───────────────┐               ┌───────────────┐
 │   SCREENING   │               │   REJECTED    │
 └───────┬───────┘               └───────────────┘
         │
         ▼
 ┌───────────────┐
 │  SHORTLISTED  │
 └───────┬───────┘
         │
         ▼
 ┌───────────────┐
 │   INTERVIEW   │
 └───────┬───────┘
         │
         ▼
 ┌───────────────┐
 │   SELECTED    │
 └───────────────┘
```

### Technical Sequence of a Stage Transition
1. **User Interaction**: Recruiter drags candidate card from "Screening" to "Shortlisted" in `KanbanBoard.tsx`.
2. **Optimistic UI**: React updates card column immediately to provide responsive feedback.
3. **HTTP Dispatch**: Axios triggers `PATCH /api/applications/:id/stage` with `{ stage: "SHORTLISTED", reason: "Strong system design skills" }`.
4. **Authentication & RBAC**: `authenticate` middleware verifies JWT; `authorizeRoles('RECRUITER', 'SUPER_ADMIN')` validates role.
5. **Tenant Isolation**: `applicationService.changeStage` verifies `application.job.companyId === recruiter.companyId`. If mismatched, throws 403 Forbidden.
6. **Atomic Transaction**:
   - `tx.application.update`: Updates `currentStage` to `SHORTLISTED`.
   - `tx.applicationStageHistory.create`: Creates permanent audit record with previous stage, new stage, actor user ID, reason, and timestamp.
7. **Automated Notification**: `notificationService.notify` inserts a real-time notification to the candidate's account:
   *"Congratulations! You have been Shortlisted for [Job Title] at [Company Name]."*
8. **Security Audit**: `auditService.log` writes an immutable security record with action `APPLICATION_STAGE_CHANGE`.
9. **UI Confirmation**: Frontend receives 200 OK with refreshed data and displays success toast.

---

## 9. Resume Storage Architecture & S3 Abstraction

HireFlow abstracts physical file storage behind `StorageService` (`server/src/services/storageService.ts`):

- **Local Storage Mode**: Used for local development and offline environments, writing to `server/uploads/` with stream controllers.
- **AWS S3 Mode**: Production mode enabled via `STORAGE_TYPE=s3`:
  - Uploads stream directly to a private AWS S3 bucket under the prefix `resumes/<uuid>-<filename>`.
  - Local temp files are unlinked immediately after upload.
  - S3 buckets remain 100% private with public access blocked.
  - **Presigned URLs**: Resume download requests hit `/api/candidates/resumes/:filename`. The backend validates applicant/recruiter authorization, and only upon passing generates a time-limited (15 minutes) AWS S3 pre-signed download URL (`getSignedDownloadUrl`) and issues an HTTP 302 redirect.

---

## 10. Automated Testing & Verification Status

The HireFlow ATS project maintains comprehensive automated test coverage:

| Test Suite / Script | Target Scope | Test Count | Status |
|---|---|:---:|:---:|
| **Jest Auth & RBAC** | JWT verification, token expiration, password hashing, role gates | 14 tests | **PASS (100%)** |
| **Jest Pipeline & Kanban** | Application submission, stage changes, history records, scheduling | 14 tests | **PASS (100%)** |
| **Jest Applicant & Notifications**| Profile updates, resume upload, notification triggers, read status | 10 tests | **PASS (100%)** |
| **Security & Isolation Script** | BOLA checks, cross-tenant isolation, file upload guards, Helmet headers | 12 checks | **PASS (100%)** |
| **Production E2E Verification** | 25-step live lifecycle (Register $\rightarrow$ Apply $\rightarrow$ Move $\rightarrow$ Interview $\rightarrow$ Admin) | 25 steps | **PASS (100%)** |
| **Full 30-Step Demonstration** | 30-step live simulated recruitment flow across all 3 user roles | 30 steps | **PASS (100%)** |
| **Total Automated Tests** | Comprehensive Unit, Integration, Security, and E2E Coverage | **105 / 105** | **PASS (100%)** |

---

## 11. Production Deployment Topology

The existing codebase is turnkey-ready for enterprise cloud deployment:

- **Frontend Tier**: Vercel-ready with standalone Next.js 14 output (`client/vercel.json`), static asset optimization, and edge proxying.
- **Backend Tier**: Render-ready Node.js web service defined via declarative [`render.yaml`](file:///Users/durgaprasad/Documents/company/render.yaml).
- **Database Tier**: Managed PostgreSQL instance with automated schema deployment via `prisma migrate deploy` on startup.
- **Containerization**: Dual Dockerfiles (`client/Dockerfile`, `server/Dockerfile`) and unified [`docker-compose.yml`](file:///Users/durgaprasad/Documents/company/docker-compose.yml) supporting single-command local containerized orchestration.
- **Environment Management**: Fully decoupled configuration via environment variables with zero hardcoded credentials.
