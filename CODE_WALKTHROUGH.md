# HireFlow ATS — Code Walkthrough Guide

Use this reference guide when an interviewer or HR panel asks you to walk through the codebase. It details the exact files, their architectural purpose, and the key functions to highlight.

---

## 1. FRONTEND ARCHITECTURE

### File: `client/src/lib/api.ts`
- **Purpose**: Centralized Axios HTTP client configuring API communications.
- **Key Code to Show**:
  - `API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'`: Dynamic backend URL binding.
  - Request Interceptor (`lines 14–25`): Automatically extracts token from `localStorage` and attaches `Authorization: Bearer <token>`.
  - Response Interceptor (`lines 28–39`): Automatically catches HTTP 401 Unauthorized errors and redirects to `/login`.

### File: `client/src/app/layout.tsx`
- **Purpose**: Global application shell encapsulating routing, navigation, and state providers.
- **Key Code to Show**:
  - Provider wrapping: Integrates `ToastProvider` and `AuthProvider`.
  - Responsive layout shell: Dynamically renders `Navbar.tsx` and `Sidebar.tsx`.

### File: `client/src/providers/AuthContext.tsx`
- **Purpose**: Client-side authentication and session state provider.
- **Key Code to Show**:
  - `login()` and `logout()` state management.
  - Role preservation in user session enabling conditional navigation.

---

## 2. BACKEND ARCHITECTURE

### File: `server/src/server.ts`
- **Purpose**: HTTP server entry point and lifecycle manager.
- **Key Code to Show**:
  - Platform `PORT` binding (`env.PORT`).
  - Graceful shutdown listeners on `SIGTERM` and `SIGINT` to safely drain database connections.

### File: `server/src/app.ts`
- **Purpose**: Express application configuration and security middleware pipeline.
- **Key Code to Show**:
  - Helmet middleware (`lines 18–22`): Configures secure HTTP response headers.
  - Production CORS configuration (`lines 24–48`): Whitelists `CLIENT_URL` and `CORS_ORIGIN`, explicitly rejecting wildcard `*` origins for authenticated requests.
  - Rate limiting (`lines 51–71`): Global API rate limiter (1000 req/15min) and strict authentication rate limiter (50 req/15min).
  - Health check endpoint (`GET /api/health`, `lines 84–102`): Queries database connectivity and returns `ok`/`degraded` status without exposing secrets.

### File: `server/src/routes/index.ts`
- **Purpose**: Master API router aggregating domain-specific route modules.
- **Key Code to Show**:
  - Modular mounts for `/auth`, `/users`, `/jobs`, `/applications`, `/candidates`, `/interviews`, `/notifications`, `/dashboard`, `/companies`, `/audit`.

---

## 3. DATABASE SCHEMA & MIGRATIONS

### File: `server/prisma/schema.prisma`
- **Purpose**: Prisma PostgreSQL schema definition, relational entities, enums, and index declarations.
- **Key Code to Show**:
  - Enums (`lines 12–74`): `Role` (`SUPER_ADMIN`, `RECRUITER`, `APPLICANT`), `ApplicationStage` (`APPLIED`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `SELECTED`, `REJECTED`), `InterviewType`, `InterviewStatus`.
  - Model `User` (`lines 76–95`): Central authentication model with relations to `RecruiterProfile`, `ApplicantProfile`, `Notification`, and `AuditLog`.
  - Model `Application` (`lines 236–256`): Links `Job` and `ApplicantProfile` with compound unique index `@@unique([jobId, applicantId])` preventing duplicate applications.
  - Model `ApplicationStageHistory` (`lines 258–272`): Audit trail tracking previous stage, new stage, actor ID, reason, and timestamp.
  - Model `Interview` (`lines 274–299`): Round type, date, start/end time, meeting link, and conflict indices.

### File: `server/prisma/migrations/20261020000000_init_postgresql/migration.sql`
- **Purpose**: Versioned production SQL migration generating relational tables, foreign key constraints (`ON DELETE CASCADE`), and B-tree indexes.

---

## 4. AUTHENTICATION IMPLEMENTATION

### File: `server/src/services/authService.ts`
- **Purpose**: Core authentication business logic, password hashing, and token issuance.
- **Key Code to Show**:
  - `register()`: Validates existing email, hashes password with `bcrypt.hash(password, 10)`, creates `User` and role-specific profile (`ApplicantProfile` or `RecruiterProfile`).
  - `login()`: Validates password via `bcrypt.compare(password, user.passwordHash)` and generates JWT access and refresh token pair.

### File: `server/src/utils/jwt.ts`
- **Purpose**: Cryptographic JWT token generation and verification utility.
- **Key Code to Show**:
  - `generateTokens()`: Signs access token (7 days) and refresh token (30 days) with discrete secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`).
  - `verifyAccessToken()`: Validates signature and decodes user payload.

---

## 5. ROLE-BASED ACCESS CONTROL (RBAC) & TENANT ISOLATION

### File: `server/src/middleware/auth.ts`
- **Purpose**: Layered gatekeeping middleware for authentication and role authorization.
- **Key Code to Show**:
  - `authenticate` (`lines 8–76`): Extracts `Bearer <token>`, verifies signature via `verifyAccessToken`, rehydrates user from database, checks if account is suspended (`USER_STATUS.SUSPENDED`), and binds `req.user`.
  - `authorizeRoles` (`lines 78–96`): Reusable role guard checking `allowedRoles.includes(req.user.role)`, emitting HTTP 403 Forbidden on violation.
  - `requireRecruiterCompany` (`lines 98–108`): Verifies that recruiter accounts belong to an active enterprise company.

---

## 6. KANBAN RECRUITMENT PIPELINE

### File: `client/src/components/kanban/KanbanBoard.tsx`
- **Purpose**: Client-side interactive Kanban board component.
- **Key Code to Show**:
  - Integration of `@dnd-kit/core` (`DndContext`, `PointerSensor`, `useSensor`).
  - `handleDragEnd()`: Performs optimistic local column re-ordering, sends `PATCH /api/applications/:id/stage`, and rolls back on error.

### File: `client/src/components/kanban/KanbanCard.tsx`
- **Purpose**: Draggable candidate card component.
- **Key Code to Show**:
  - Displays candidate name, rating, applied date, interview badges, and stage history modal trigger.

### File: `server/src/controllers/applicationController.ts`
- **Purpose**: Application request handler.
- **Key Code to Show**:
  - `changeStage()` (`lines 21–32`): Extracts application ID and target stage, invoking `applicationService.changeStage()`.

### File: `server/src/services/applicationService.ts`
- **Purpose**: Transactional recruitment pipeline business logic.
- **Key Code to Show**:
  - `changeStage()` (`lines 130–231`):
    - Multi-tenant check: Verifies `application.job.companyId === changedByUser.recruiterProfile?.companyId` (throwing 403 on mismatch).
    - Database transaction: Atomic execution of `tx.application.update` and `tx.applicationStageHistory.create`.
    - Automated notification: Calls `notificationService.notify` with customized stage transition messages.
    - Audit logging: Calls `auditService.log` with action `APPLICATION_STAGE_CHANGE`.

---

## 7. INTERVIEW SCHEDULING & CONFLICT DETECTION

### File: `client/src/components/interviews/ScheduleInterviewModal.tsx`
- **Purpose**: Modal interface for scheduling candidate interview rounds.
- **Key Code to Show**:
  - Form validation with round selection (`TECHNICAL`, `HR`, `MANAGERIAL`, `BEHAVIORAL`, `FINAL`), date/time pickers, and meeting link.

### File: `server/src/services/interviewService.ts`
- **Purpose**: Interview scheduling service with collision detection.
- **Key Code to Show**:
  - Double-booking prevention algorithm: Queries existing interviews on the same date for the interviewer and throws HTTP 409 Conflict if `startTime < existing.endTime && endTime > existing.startTime`.
  - Automatically advances application stage to `INTERVIEW` upon successful scheduling.

---

## 8. NOTIFICATIONS SYSTEM

### File: `client/src/components/layout/Navbar.tsx`
- **Purpose**: Top navigation bar with live notification bell and unread indicator.
- **Key Code to Show**:
  - Notification popover displaying recent events and one-click "Mark as Read".

### File: `server/src/services/notificationService.ts`
- **Purpose**: Event-driven notification service.
- **Key Code to Show**:
  - `notify()`: Persists notification records in PostgreSQL with structured metadata for application status changes, new applicants, and interview invites.

---

## 9. RESUME STORAGE & BOLA ACCESS CONTROLS

### File: `server/src/services/storageService.ts`
- **Purpose**: Storage abstraction supporting both AWS S3 and local environments.
- **Key Code to Show**:
  - `isS3()`: Checks if S3 credentials and bucket name are configured.
  - `processUpload()`: Streams file directly to AWS S3 bucket using `PutObjectCommand` and cleans up temporary local files.
  - `getSignedDownloadUrl()`: Generates temporary 15-minute AWS S3 presigned URL using `@aws-sdk/s3-request-presigner`.

### File: `server/src/services/candidateService.ts`
- **Purpose**: Candidate profile logic and BOLA resume authorization.
- **Key Code to Show**:
  - `getResumeFilePath()` (`lines 62–105`):
    - Applicant guard: Rejects requests if `currentUser.role === 'APPLICANT'` and `applicant.userId !== currentUser.id` (403 Forbidden).
    - Recruiter guard: Rejects requests if recruiter's company does not match any job the applicant applied to (403 Forbidden).

---

## 10. AUTOMATED TEST SUITES

### File: `server/tests/auth_and_rbac.test.ts`
- **Purpose**: Integration tests for authentication, password hashing, JWT lifecycle, and role gates (14 tests).

### File: `server/tests/recruitment_pipeline.test.ts`
- **Purpose**: Integration tests for job postings, application submissions, duplicate prevention, Kanban stage updates, and interview conflict detection (14 tests).

### File: `server/tests/applicant_and_notifications.test.ts`
- **Purpose**: Integration tests for candidate profile updates, resume upload, notification triggers, and read states (10 tests).

### File: `server/scripts/verify_security.js`
- **Purpose**: Standalone security script testing 12 critical controls (BOLA, cross-tenant isolation, Helmet headers, error sanitization).

### File: `server/scripts/verify_production_e2e.js`
- **Purpose**: Complete 25-step production end-to-end recruitment lifecycle test.
