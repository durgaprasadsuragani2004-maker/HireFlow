# HireFlow — Enterprise Applicant Tracking & Recruitment Platform

HireFlow is an enterprise-grade Applicant Tracking System (ATS) and recruitment operations platform built for modern engineering and talent acquisition teams. It connects Candidates, Recruiters, Hiring Managers, and Super Administrators in a unified, multi-tenant workspace with real-time Kanban pipelines, interview scheduling with conflict detection, secure AWS S3 resume storage, and granular Role-Based Access Control (RBAC).

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
       |  - Deployed on Vercel Edge / Serverless     |       |  - Zod Request Validation Middleware        |
       |  - Role-Aware Dynamic Navigation            |       |  - Comprehensive Swagger / OpenAPI 3.0 UI   |
       +---------------------------------------------+       +---------------------------------------------+
                                                                     |                        |
                                            Prisma ORM (PostgreSQL)  |                        |  AWS SDK v3
                                                                     v                        v
                                                     +-------------------------------+  +-------------------------+
                                                     |    PostgreSQL 16 Database     |  |      AWS S3 Bucket      |
                                                     |  - Managed Neon / Supabase    |  |  - Private Storage      |
                                                     |  - 13 Relational Tables       |  |  - Pre-Signed URLs      |
                                                     |  - 9 Native Enums             |  |  - 5MB PDF/DOCX Limits  |
                                                     |  - Foreign Key Cascades       |  |  - Zero Public Exposure |
                                                     |  - Performance B-Tree Indexes |  |                         |
                                                     +-------------------------------+  +-------------------------+
```

### Architectural Highlights
- **Frameworks:** Next.js 14 (App Router) on the client; Express.js (Node.js 20+) with strict TypeScript on the backend.
- **Database Layer:** Prisma ORM with **PostgreSQL 16 exclusively** across development, staging, and production.
- **Deployment:** Vercel-native serverless functions for API endpoints (`server/api/index.ts` + `server/vercel.json`) and Next.js frontend (`client/vercel.json`).
- **Security & RBAC:** Enforced at middleware and service layers. Zero client-side only security.
- **Resume Storage:** Private AWS S3 buckets with Broken Object-Level Authorization (BOLA) safeguards and 15-minute temporary pre-signed URLs.
- **Real-Time Kanban Pipeline:** 6 recruitment stages (`APPLIED`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `SELECTED`, `REJECTED`) with optimistic UI updates and immutable `ApplicationStageHistory` audit logging.

---

## 2. Local Development

### Prerequisites
- Node.js v18+ (tested on Node v20/v24)
- npm v9+
- PostgreSQL 16 instance (local via Docker or cloud via Neon/Supabase)

### Quick Start (PostgreSQL Database)
```bash
# 1. Install dependencies
npm run install:all

# 2. Configure environment variables
# Copy server/.env.example to server/.env and set your PostgreSQL DATABASE_URL
cp server/.env.example server/.env

# 3. Generate Prisma client & apply migrations to PostgreSQL
npm run prisma:generate --prefix server
npm run prisma:migrate --prefix server
npm run prisma:seed --prefix server

# 4. Start Backend API (Port 5001)
npm run dev --prefix server

# 5. In a separate terminal, start Next.js Frontend (Port 3000)
npm run dev --prefix client
```

Web Access:
- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Interactive Swagger Documentation:** [http://localhost:5001/api/docs](http://localhost:5001/api/docs)
- **Backend Health Check:** [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 3. Database Architecture (PostgreSQL 16 & Prisma)

HireFlow includes a production-ready PostgreSQL schema with native enums, indexes, and cascading delete rules (`server/prisma/schema.prisma`).

### PostgreSQL Commands
```bash
# Generate Prisma Client
npm run prisma:generate --prefix server

# Deploy PostgreSQL migrations
npm run prisma:migrate --prefix server

# Push schema directly to database (for rapid schema prototyping)
npm run prisma:push --prefix server

# Seed database with realistic demo records
npm run prisma:seed --prefix server

# Automated full setup (generate + migrate + seed)
npm run db:setup --prefix server
```

### Relational Schema Summary:
- **13 Tables:** `User`, `Company`, `RecruiterProfile`, `ApplicantProfile`, `ApplicantSkill`, `Experience`, `Education`, `Job`, `Application`, `ApplicationStageHistory`, `Interview`, `Notification`, `AuditLog`.
- **9 Native PostgreSQL Enums:** `Role`, `UserStatus`, `EmploymentType`, `ExperienceLevel`, `JobStatus`, `ApplicationStage`, `InterviewType`, `InterviewStatus`, `NotificationType`.
- **Cascading Integrity:** Foreign keys configured with `ON DELETE CASCADE` (`ON DELETE SET NULL` for audit log actors).

---

## 4. Environment Variables

### Backend (`server/.env` or Vercel Backend Environment Variables)
```ini
NODE_ENV=production
PORT=5001
DATABASE_URL="postgresql://postgres:password@ep-cool-db-12345.us-east-2.aws.neon.tech/hireflow?sslmode=require"

# JWT Secrets (Use strong random strings)
JWT_ACCESS_SECRET="your-32-character-random-access-secret"
JWT_SECRET="your-32-character-random-access-secret"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-32-character-random-refresh-secret"
JWT_REFRESH_EXPIRES_IN="30d"

# Domain & CORS Configuration
CLIENT_URL="https://hireflow-client.vercel.app"
SERVER_URL="https://hireflow-api.vercel.app"
CORS_ORIGIN="https://hireflow-client.vercel.app"

# AWS S3 Resume Storage
STORAGE_TYPE="s3"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_S3_BUCKET="hireflow-resumes"
```

### Frontend (`client/.env.local` or Vercel Frontend Environment Variables)
```ini
NEXT_PUBLIC_API_URL="https://hireflow-api.vercel.app/api"
NEXT_PUBLIC_APP_NAME="HireFlow ATS"
```

---

## 5. Vercel Deployment Guide

HireFlow is configured for turnkey deployment on Vercel as two decoupled projects (or sub-projects):

### Step 1: Deploy Managed PostgreSQL Database
1. Create a free PostgreSQL 16 database on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Render](https://render.com).
2. Copy the connection string (`DATABASE_URL`). Ensure `?sslmode=require` is appended.
3. Run the migrations against your live database:
   ```bash
   DATABASE_URL="postgresql://..." npm run prisma:migrate --prefix server
   DATABASE_URL="postgresql://..." npm run prisma:seed --prefix server
   ```

### Step 2: Deploy Backend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
2. Select your HireFlow Git repository.
3. In **Project Settings**:
   - **Root Directory:** Click `Edit` and select `server`.
   - **Framework Preset:** Other.
   - **Build Command:** `npm run vercel-build` (runs `prisma generate && tsc -p tsconfig.build.json`).
   - **Output Directory:** Leave default.
4. Add the **Environment Variables** listed in Section 4:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET` / `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CLIENT_URL` (URL of your frontend)
   - `STORAGE_TYPE=s3`
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`
5. Click **"Deploy"**. Note your backend URL (e.g. `https://hireflow-api.vercel.app`).
6. Verify deployment by visiting `https://hireflow-api.vercel.app/api/health`.

### Step 3: Deploy Frontend to Vercel
1. Click **"Add New Project"** on Vercel.
2. Select the same repository.
3. In **Project Settings**:
   - **Root Directory:** Click `Edit` and select `client`.
   - **Framework Preset:** Next.js.
   - **Build Command:** `npm run build`.
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend URL + `/api` (e.g. `https://hireflow-api.vercel.app/api`).
5. Click **"Deploy"**.
6. Once deployed, ensure your backend's `CLIENT_URL` and `CORS_ORIGIN` variables match your frontend's Vercel domain.

---

## 6. AWS S3 Resume Storage Configuration

HireFlow provides an enterprise storage layer with Broken Object-Level Authorization (BOLA) safeguards:
1. **Private Bucket:** S3 buckets must block all public access. Files are never stored with public ACLs.
2. **Pre-Signed URLs:** Downloads and previews generate temporary pre-signed URLs via `@aws-sdk/s3-request-presigner` that expire in 15 minutes.
3. **Authorization Checks Before Signing:**
   - **Applicants** can only download their own resume.
   - **Recruiters** can only access resumes of candidates who have applied to a job at their company.
   - **Cross-company recruiters and unrelated applicants** are rejected with `403 Forbidden` before any S3 URL is generated.
4. **Serverless Compatibility:** Uploads stream directly without relying on local persistent server disks.

---

## 7. Docker Deployment (Local Full Stack)

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

## 8. Automated Testing

Run the test suite against PostgreSQL:

```bash
npm test --prefix server
```

Coverage includes:
- Authentication, malformed tokens, expired sessions, and duplicate accounts.
- RBAC preventing applicants from editing jobs, deleting jobs, or accessing recruiter/admin portals.
- Cross-company candidate isolation preventing recruiters from viewing or altering other companies' candidates.
- Broken Object-Level Authorization (BOLA) tests on resume downloads.
- Interview conflict detection returning `409 Conflict` on overlapping schedules.
- Job deadline validation rejecting applications after job expiration.

---

## 9. Demo Credentials

| Role | Email | Password | Scope & Privileges |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@hireflow.dev` | `Admin@123456` | Platform-wide metrics, user suspension, global job audits |
| **Recruiter (TechNova)** | `sarah.recruiter@technova.com` | `Recruiter@123456` | Job requisition CRUD, Kanban candidate pipeline, interviews |
| **Recruiter (QuantumLabs)** | `marcus.recruiter@quantum.ai` | `Recruiter@123456` | Isolated company talent pipeline & AI engineering roles |
| **Applicant (Alex)** | `alex.dev@gmail.com` | `Applicant@123456` | Senior Full-Stack candidate (Shortlisted & Interviewed) |
| **Applicant (Elena)** | `elena.frontend@gmail.com` | `Applicant@123456` | Staff Frontend candidate (Selected / Offer stage) |
| **Applicant (David)** | `david.fullstack@gmail.com` | `Applicant@123456` | Systems & Cloud candidate (Screening stage) |

> **Pro Tip:** In development, use the **"Switch Demo Role"** button in the top navigation bar to impersonate any role with a single click.
