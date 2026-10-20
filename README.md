# HireFlow — Enterprise Applicant Tracking & Recruitment Platform

HireFlow is an enterprise-grade Applicant Tracking System (ATS) and recruitment operations platform built for modern engineering and talent acquisition teams. It connects Candidates, Recruiters, Hiring Managers, and Super Administrators in a unified, multi-tenant workspace with real-time Kanban pipelines, interview scheduling with conflict detection, secure resume storage, and granular Role-Based Access Control (RBAC).

---

## 1. System Architecture

```text
                               +-------------------------------------------------+
                               |           Clients & Modern Browsers             |
                               +-------------------------------------------------+
                                        |                                |
                   HTTPS / WSS          |                                |  REST API / JSON
                                        v                                v
       +---------------------------------------------+       +---------------------------------------------+
       |             Next.js 14 Frontend             | ----> |           Express.js + TypeScript           |
       |  - React 18, Tailwind CSS, Lucide           |       |  - Helmet, Strict CORS, Rate Limiting       |
       |  - @dnd-kit Drag & Drop Kanban Pipeline     |       |  - JWT Auth (Access + Refresh Token)        |
       |  - Standalone Production Docker Container   |       |  - Zod Request Validation Middleware        |
       |  - Role-Aware Dynamic Navigation            |       |  - Comprehensive Swagger / OpenAPI 3.0 UI   |
       +---------------------------------------------+       +---------------------------------------------+
                                                                     |                        |
                                            Prisma ORM (PostgreSQL)  |                        |  AWS SDK v3
                                                                     v                        v
                                                     +-------------------------------+  +-------------------------+
                                                     |    PostgreSQL 16 Database     |  |      AWS S3 Bucket      |
                                                     |  - 13 Relational Tables       |  |  - Private Storage      |
                                                     |  - 9 Native Enums             |  |  - Pre-Signed URLs      |
                                                     |  - Foreign Key Cascades       |  |  - 5MB PDF/DOCX Limits  |
                                                     |  - Performance B-Tree Indexes |  |  - Zero Public Exposure |
                                                     +-------------------------------+  +-------------------------+
```

### Architectural Highlights
- **Frameworks:** Next.js 14 (App Router) on the client; Express.js (Node.js 20+) with strict TypeScript on the backend.
- **Database Layer:** Prisma ORM supporting SQLite for local zero-dependency development and PostgreSQL 16 for production.
- **Security & RBAC:** Enforced at the middleware and service layers. Zero client-side only security.
- **Resume Storage Abstraction:** Supports seamless switching between local disk storage and AWS S3 signed URLs without modifying business logic.
- **Real-Time Kanban Pipeline:** 6 recruitment stages (`APPLIED`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `SELECTED`, `REJECTED`) with optimistic UI updates and immutable `ApplicationStageHistory` audit logging.

---

## 2. Local Development

### Prerequisites
- Node.js v18+ (tested on Node v20/v24)
- npm v9+

### Quick Start (Development Mode)
```bash
# 1. Install root, backend, and frontend dependencies
npm install
npm install --prefix server
npm install --prefix client

# 2. Setup SQLite development database & seed realistic demo data
npm run db:setup --prefix server

# 3. Start Backend API in development mode (Port 5001)
npm run dev --prefix server

# 4. In a separate terminal, start Next.js Frontend (Port 3000)
npm run dev --prefix client
```

Web Access:
- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Interactive Swagger Documentation:** [http://localhost:5001/api/docs](http://localhost:5001/api/docs)
- **Backend Health Check:** [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 3. PostgreSQL Setup & Production Database

HireFlow includes a production-ready PostgreSQL schema with native enums, indexes, and cascading delete rules.

### PostgreSQL Migration Commands
```bash
# Generate Prisma client for PostgreSQL schema
npm run prisma:generate:pg --prefix server

# Deploy PostgreSQL migrations
npm run prisma:migrate:pg --prefix server

# Seed PostgreSQL database with demo records
npm run prisma:seed:pg --prefix server
```

The migration SQL file is located at `server/prisma/migrations/20261020000000_init_postgresql/migration.sql`. It has been tested against PostgreSQL 16:
- **13 Tables:** `User`, `Company`, `RecruiterProfile`, `ApplicantProfile`, `ApplicantSkill`, `Experience`, `Education`, `Job`, `Application`, `ApplicationStageHistory`, `Interview`, `Notification`, `AuditLog`.
- **9 Native PostgreSQL Enums:** `Role`, `UserStatus`, `EmploymentType`, `ExperienceLevel`, `JobStatus`, `ApplicationStage`, `InterviewType`, `InterviewStatus`, `NotificationType`.
- **Cascading Integrity:** Foreign keys are configured with `ON DELETE CASCADE` (`ON DELETE SET NULL` for audit log actors).

---

## 4. Environment Variables

Create `.env` in `server/` (see `server/.env.example`):
```ini
NODE_ENV=production
PORT=5001
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/hireflow?schema=public"

JWT_SECRET="replace-with-a-very-long-random-secret-for-production-jwt"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="replace-with-another-very-long-random-secret-for-refresh-token"
JWT_REFRESH_EXPIRES_IN="30d"

CLIENT_URL="https://hireflow.example.com"
SERVER_URL="https://api.hireflow.example.com"
CORS_ORIGIN="https://hireflow.example.com"

STORAGE_TYPE="s3"
UPLOAD_DIR="./uploads"

AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_S3_BUCKET="hireflow-resumes"
```

In `client/.env.local`:
```ini
NEXT_PUBLIC_API_URL="https://api.hireflow.example.com/api"
NEXT_PUBLIC_APP_NAME="HireFlow ATS"
```

---

## 5. Seed Data & Dataset Architecture

The database seed script (`server/src/seeds/seed.ts`) generates realistic enterprise recruiting data.

| Entity | Count | Notes |
| :--- | :--- | :--- |
| **Super Admin** | 1 | `admin@hireflow.dev` (System-wide administration & audit trail) |
| **Companies** | 2 | TechNova Solutions (Cloud & SaaS) and QuantumLabs AI (AI & Robotics) |
| **Recruiters** | 2 | Sarah Jenkins (TechNova) & Marcus Vance (QuantumLabs) |
| **Applicants** | 5 | Alex Morgan, Elena Rostova, David Chen, Priya Patel, Lucas Silva |
| **Total Jobs** | 21 | 20 Published across engineering/design, 1 Internal Draft |
| **Applications** | 14 | Distributed across all 6 stages (`APPLIED`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `SELECTED`, `REJECTED`) |
| **Interviews** | 4 | Real technical & architectural interviews with conflict-checked time windows |
| **Notifications**| 43+ | Stage updates, interview confirmations, and application acknowledgments |

> **Note on 21 Total Jobs vs. 10 Inventory Items:**  
> The job catalog contains **21 total jobs** in the database. When calling `GET /api/jobs` without parameters, the endpoint returns the first paginated page of **10 jobs** by default (`limit=10`). Querying `GET /api/jobs?limit=50` returns all 20 published jobs, and an administrator querying `GET /api/jobs?status=ALL&limit=50` returns all 21 jobs.

---

## 6. AWS S3 Storage Configuration

HireFlow provides an enterprise storage layer with Broken Object-Level Authorization (BOLA) safeguards:
1. **Private Bucket:** S3 buckets should block all public access. Files are never stored with public ACLs.
2. **Pre-Signed URLs:** Downloads and previews generate temporary pre-signed URLs via `@aws-sdk/s3-request-presigner` that expire in 15 minutes.
3. **Authorization Checks Before Signing:**
   - **Applicants** can only download their own resume.
   - **Recruiters** can only access resumes of candidates who have applied to a job at their company.
   - **Cross-company recruiters and unrelated applicants** are rejected with `403 Forbidden` before any S3 URL is generated.
4. **Credential Protection:** AWS credentials remain strictly on the backend and are never sent to the client.

To enable S3 in production, simply configure `STORAGE_TYPE=s3` and provide the AWS credentials in `server/.env`.

---

## 7. Docker Deployment

A complete containerized stack is defined in `docker-compose.yml`:

```bash
# Build and start PostgreSQL 16, Backend API, and Next.js Frontend
docker-compose up --build
```

Container Map:
- **`hireflow_postgres`**: PostgreSQL 16 container (`5432:5432`)
- **`hireflow_backend`**: Node.js production runner (`5001:5001`)
- **`hireflow_frontend`**: Next.js standalone container (`3000:3000`)

---

## 8. Cloud Deployment Guide

### Option A: PaaS (Render / Railway / Fly.io)
1. **Database:** Create a managed PostgreSQL instance and copy the external `DATABASE_URL`.
2. **Backend:** Connect the Git repository and set the root directory to `server/`. Use the provided `render.yaml` blueprint.
3. **Frontend:** Connect the Git repository with root directory `client/`. Set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`.

### Option B: Vercel (Frontend) + Container Service (Backend)
1. Deploy `client/` directly to Vercel using `client/vercel.json`.
2. Deploy `server/` to AWS ECS, Google Cloud Run, or Render.
3. Configure `CORS_ORIGIN="https://your-app.vercel.app"` on the backend.

---

## 9. Automated Testing

All 38 integration tests run against real database transactions and endpoints:

```bash
npm test --prefix server
```

```text
PASS tests/applicant_and_notifications.test.ts
PASS tests/auth_and_rbac.test.ts
PASS tests/recruitment_pipeline.test.ts

Test Suites: 3 passed, 3 total
Tests:       38 passed, 38 total
Snapshots:   0 total
Time:        2.25 s
```

Coverage includes:
- Authentication, malformed tokens, expired sessions, and duplicate accounts.
- RBAC preventing applicants from editing jobs, deleting jobs, or accessing recruiter/admin portals.
- Cross-company candidate isolation preventing recruiters from viewing or altering other companies' candidates.
- Broken Object-Level Authorization (BOLA) tests on resume downloads.
- Interview conflict detection returning `409 Conflict` on overlapping schedules.
- Job deadline validation rejecting applications after job expiration.

---

## 10. Demo Credentials

| Role | Email | Password | Scope & Privileges |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@hireflow.dev` | `Admin@123456` | Platform-wide metrics, user suspension, global job audits |
| **Recruiter (TechNova)** | `sarah.recruiter@technova.com` | `Recruiter@123456` | Job requisition CRUD, Kanban candidate pipeline, interviews |
| **Recruiter (QuantumLabs)** | `marcus.recruiter@quantum.ai` | `Recruiter@123456` | Isolated company talent pipeline & AI engineering roles |
| **Applicant (Alex)** | `alex.dev@gmail.com` | `Applicant@123456` | Senior Full-Stack candidate (Shortlisted & Interviewed) |
| **Applicant (Elena)** | `elena.frontend@gmail.com` | `Applicant@123456` | Staff Frontend candidate (Selected / Offer stage) |
| **Applicant (David)** | `david.fullstack@gmail.com` | `Applicant@123456` | Systems & Cloud candidate (Screening stage) |

> **Pro Tip:** In local development, use the **"Switch Demo Role"** button in the top navigation bar to impersonate any role with a single click.

---

## 11. Production Security Checklist

- [x] **Rate Limiting:** Global API limiter (1000 req / 15 min) and brute-force auth limiter (50 req / 15 min).
- [x] **Strict CORS:** Restricted to configured `CORS_ORIGIN` domains in production; no wildcard `origin: *`.
- [x] **Helmet Headers:** X-Frame-Options, Content-Security-Policy, and X-Content-Type-Options active.
- [x] **Password Protection:** Hashes generated using `bcryptjs` (salt round 10); passwords and hashes stripped from all API outputs.
- [x] **Input Validation:** Zod schemas validate UUIDs, dates, email formats, and salary ranges.
- [x] **File Upload Controls:** File types constrained to `.pdf`, `.doc`, `.docx` with 5MB maximum size.
- [x] **Safe Error Responses:** Production mode suppresses internal error messages and stack traces.
- [x] **Audit Trail:** Immutable records in `AuditLog` track all critical events (logins, job postings, stage changes).
