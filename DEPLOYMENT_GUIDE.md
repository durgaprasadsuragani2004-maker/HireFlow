# HireFlow ATS — Production Deployment & Operations Guide

This guide provides comprehensive architectural, deployment, and operational procedures for HireFlow, covering local setup, Neon PostgreSQL configuration, Vercel deployments, network independence, and troubleshooting.

---

## 1. Architecture Overview

- **Frontend**: Next.js 14 (App Router, Tailwind CSS, Axios) deployed to Vercel.
- **Backend**: Express + TypeScript REST API deployed to Vercel Serverless Functions or Render.
- **Database**: Neon Serverless PostgreSQL (`neondb`), AWS `us-east-2`.
- **ORM**: Prisma 5.22.0.
  - Runtime queries: Pooled connection (`DATABASE_URL`) via PgBouncer for scalable connection multiplexing.
  - Schema migrations: Unpooled direct connection (`DATABASE_URL_UNPOOLED` / `directUrl`) supporting PostgreSQL session advisory locks.
- **Authentication**: Stateless JWT (`Authorization: Bearer <token>`) with RBAC (`SUPER_ADMIN`, `COMPANY`, `RECRUITER`, `APPLICANT`).
- **File Storage**: Dual-mode storage service (AWS S3 for production cloud persistence, local filesystem fallback for offline development).

---

## 2. Environment Variables Specification

### Backend Configuration (`server/.env` or Vercel Project Settings)

| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment mode | `production` or `development` |
| `PORT` | Local server listening port | `5001` |
| `DATABASE_URL` | Neon pooled PostgreSQL connection string | `postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | Neon direct PostgreSQL connection string | `postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/neondb?sslmode=require` |
| `JWT_ACCESS_SECRET` | Primary JWT signing key (min 32 chars) | Cryptographically secure random hex string |
| `JWT_SECRET` | Fallback secret alias | Cryptographically secure random hex string |
| `JWT_EXPIRES_IN` | Access token lifespan | `7d` |
| `JWT_REFRESH_SECRET` | Refresh token signing key | Cryptographically secure random hex string |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `30d` |
| `CLIENT_URL` | Public frontend URL | `https://hireflow-client.vercel.app` |
| `SERVER_URL` | Public backend URL | `https://hireflow-api.vercel.app` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated or wildcard) | `https://hireflow-client.vercel.app` |
| `STORAGE_TYPE` | Resume storage backend (`s3` for production, `local` for dev) | `s3` |
| `UPLOAD_DIR` | Local disk storage path (used when `STORAGE_TYPE=local`) | `./uploads` |
| `AWS_REGION` | AWS S3 region for resume storage | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key with S3 PutObject permissions | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Access Key | `wJalr...` |
| `AWS_S3_BUCKET` | AWS S3 bucket name | `hireflow-resumes-production` |

### Frontend Configuration (`client/.env.local` or Vercel Project Settings)

| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL of deployed backend REST API | `https://hireflow-api.vercel.app/api` |
| `NEXT_PUBLIC_APP_NAME` | Display application title | `HireFlow ATS` |

---

## 3. Local Database Connectivity & Troubleshooting

### Understanding the P1001 Error & ISP DNS Refusal
When connecting to Neon PostgreSQL from certain local ISPs (notably Reliance Jio, Airtel, and select corporate Wi-Fi routers in India):
- **Symptom**: Prisma commands fail with `P1001: Can't reach database server at ...`.
- **Root Cause**: The default ISP/router DNS resolver (`192.168.29.1` / `reliance.reliance`) returns `Query refused` (`RCODE_REFUSED`) when queried for subdomains matching `*.aws.neon.tech`.
- **Diagnostic Proof**:
  - `nslookup ep-fancy-queen-...c-8.us-east-2.aws.neon.tech` -> `Query refused`.
  - `nslookup ep-fancy-queen-...c-8.us-east-2.aws.neon.tech 1.1.1.1` -> Resolves immediately with valid IPs (`3.14.138.241`, `77.112.129.102`, `3.142.41.151`).
  - `Test-NetConnection -ComputerName 3.14.138.241 -Port 5432` -> `TcpTestSucceeded: True` (port 5432 is completely open; no firewall block).

### Resolution on Local Machine (Non-Intrusive)
To resolve this on your local machine without altering application source code:
1. **Windows 10 / 11**:
   - Open **Windows Settings** -> **Network & Internet** -> **Wi-Fi** (or **Ethernet**).
   - Click **Hardware properties** (or your active network).
   - Under **DNS server assignment**, click **Edit**.
   - Change from *Automatic (DHCP)* to **Manual**.
   - Enable **IPv4**:
     - Preferred DNS: `1.1.1.1` (Cloudflare) or `8.8.8.8` (Google).
     - Alternate DNS: `1.0.0.1` or `8.8.4.4`.
   - Click **Save**.
2. **Alternative for Mobile Hotspots**:
   - If connected through mobile tethering where DHCP DNS cannot be modified, configure DNS in Windows network adapter settings using the steps above.
3. **Cloud & Production Environments**:
   - Vercel, Render, AWS, and GCP utilize their own global internal DNS resolvers that resolve AWS Neon endpoints natively. No custom configuration is required in cloud environments.

---

## 4. Database Migrations Deployment

The repository includes two migration files in `server/prisma/migrations/`:
1. `20261020000000_init_postgresql` — Creates core tables (`User`, `Company`, `RecruiterProfile`, `ApplicantProfile`, `Job`, `Application`, etc.).
2. `20261030000000_add_company_role_and_user_relations` — Adds `COMPANY` role and multi-tenant user-company relations.

### Safe Production Migration Command
To safely apply pending migrations to your target Neon database without data loss:

```bash
# Navigate to backend directory
cd server

# Verify pending migrations status (read-only)
npx prisma migrate status --schema=prisma/schema.prisma

# Deploy pending migrations safely to Neon
npx prisma migrate deploy --schema=prisma/schema.prisma
```

### Seeding Initial Data (Optional)
Once migrations have succeeded:
```bash
npm run prisma:seed
```

> [!WARNING]
> Never run `prisma db push` or `prisma migrate reset` against production or shared Neon branches as this can drop tables or erase historical application records.

---

## 5. Vercel Deployment Guide

HireFlow is structured as a decoupled monorepo: the frontend and backend should be deployed as two distinct Vercel projects (or the backend on Render/AWS and the frontend on Vercel).

### Project A: Backend API on Vercel (`server`)
1. In the Vercel Dashboard, click **Add New...** -> **Project**.
2. Select the `HireFlow` repository.
3. In **Root Directory**, click *Edit* and select `server`.
4. Build and Development Settings:
   - Framework Preset: **Other**
   - Build Command: `npm run vercel-build`
   - Output Directory: Leave blank (Vercel routes via `server/vercel.json` and `server/api/index.ts`).
5. Configure Environment Variables in Vercel Project Settings:
   - `DATABASE_URL`: Your pooled Neon connection string.
   - `DATABASE_URL_UNPOOLED`: Your direct unpooled Neon connection string.
   - `JWT_ACCESS_SECRET`: Cryptographically strong random key.
   - `JWT_REFRESH_SECRET`: Cryptographically strong random key.
   - `CLIENT_URL`: Your deployed frontend Vercel domain (e.g. `https://hireflow-client.vercel.app`).
   - `CORS_ORIGIN`: Your deployed frontend Vercel domain.
   - `STORAGE_TYPE`: `s3` (for persistent AWS S3 resume storage).
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`.
6. Click **Deploy**.
7. Note your deployed Backend URL (e.g. `https://hireflow-api.vercel.app`).

### Project B: Frontend on Vercel (`client`)
1. In the Vercel Dashboard, click **Add New...** -> **Project**.
2. Select the `HireFlow` repository.
3. In **Root Directory**, click *Edit* and select `client`.
4. Build and Development Settings:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: Next.js default (`.next`)
5. Configure Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_API_URL`: Your deployed Backend URL with `/api` suffix (e.g., `https://hireflow-api.vercel.app/api`).
   - `NEXT_PUBLIC_APP_NAME`: `HireFlow ATS`
6. Click **Deploy**.

---

## 6. Security & Production Checklist

- [x] Secrets are excluded from version control (`.env*` in `.gitignore`).
- [x] No hardcoded passwords, tokens, or IP addresses in application code.
- [x] Prisma Client utilizes connection pooling (`DATABASE_URL`) to prevent connection exhaustion.
- [x] Prisma Migrations use unpooled connection (`directUrl`) for DDL advisory lock safety.
- [x] Dynamic and regex-validated CORS protecting against unauthorized cross-origin requests while supporting Vercel preview URLs.
- [x] Helmet security headers and express-rate-limit configured.
- [x] Authentication tokens transmitted via standard HTTP Authorization Bearer headers.
- [x] Ephemeral serverless storage guarded by routing resumes to Amazon S3.

