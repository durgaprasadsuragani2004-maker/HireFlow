# HireFlow ATS — 10–15 Minute HR & Technical Demo Guide

This presentation guide is tailored for hiring managers, technical interviewers, and HR panels. Follow this step-by-step walkthrough to showcase the end-to-end functionality, engineering quality, security, and UI polish of HireFlow ATS.

---

## 🎯 Demo Preparation & Credentials Quick Reference

| Role | Email | Password | Primary Purpose in Demo |
|---|---|---|---|
| **Applicant** | `alex.dev@gmail.com` | `Applicant@123456` | Search jobs, submit application, view progress & interviews |
| **Recruiter** | `sarah.recruiter@technova.com` | `Recruiter@123456` | Review candidates, Kanban drag-and-drop, schedule interview |
| **Super Admin** | `admin@hireflow.dev` | `Admin@123456` | Enterprise governance, user management, global audit logs |

**Local Environment URLs**:
- Frontend: `http://localhost:3000`
- Backend Health: `http://localhost:5001/api/health`
- Swagger Documentation: `http://localhost:5001/api/docs`

---

## ⏱️ Step-by-Step 15-Minute Demonstration Flow

### Step 1: The Landing Page (Minute 0:00 – 1:00)
- **URL**: `http://localhost:3000`
- **WHAT TO SHOW**:
  - The landing page hero section showcasing the HireFlow platform value proposition.
  - The clean, modern typography, responsive layout, and feature highlights (Kanban pipeline, automated interviews, deep analytics).
  - The navigation bar displaying options for "Browse Jobs", "Sign In", and "Get Started".
- **WHAT TO EXPLAIN**:
  - *"HireFlow is a full-stack enterprise recruitment platform built with Next.js 14 and Express."*
  - Explain that the application uses a decoupled microservices-ready REST architecture with Tailwind CSS styling and role-based entry points.

---

### Step 2: Applicant Login (Minute 1:00 – 2:00)
- **URL**: `http://localhost:3000/login`
- **WHAT TO SHOW**:
  - Click **Sign In** in the navbar.
  - Show the one-click **"Applicant Demo"** quick-fill button (or enter `alex.dev@gmail.com` / `Applicant@123456`).
  - Click **Sign In to HireFlow** and observe smooth transition into the authenticated session.
- **WHAT TO EXPLAIN**:
  - Explain that authentication issues a signed JWT access token stored in `localStorage` and sent via Axios request interceptors.
  - Point out that the backend enforces bcrypt password hashing with salt rounds and strict rate limiting (50 attempts per 15 minutes) to protect against brute-force attacks.

---

### Step 3: Browse Published Jobs (Minute 2:00 – 3:30)
- **URL**: `http://localhost:3000/jobs`
- **WHAT TO SHOW**:
  - The job directory showing published positions from TechNova Solutions and QuantumLabs.
  - Use the search bar to filter by keyword (e.g., `"Cloud"` or `"Engineer"`).
  - Use the department filter (Engineering, Product) or employment type (Full-time, Contract).
  - Click on a job card (e.g., *"Senior Full-Stack Engineer"* or *"Cloud Infrastructure Architect"*).
- **WHAT TO EXPLAIN**:
  - Jobs are indexed in PostgreSQL and queried with case-insensitive search and status filtering (`status = PUBLISHED`).
  - Job cards display salary transparency (`salaryMin` to `salaryMax`), employment types, experience levels, and application deadlines.

---

### Step 4: Apply for a Job (Minute 3:30 – 5:00)
- **URL**: `http://localhost:3000/jobs/[id]`
- **WHAT TO SHOW**:
  - Click the **"Apply Now"** button to open the modal.
  - Show how the candidate's existing profile, contact information, and uploaded resume are automatically recognized.
  - Enter a brief cover letter (e.g., *"Excited to bring my Next.js and distributed systems expertise to the team."*).
  - Click **"Submit Application"**. Show the success toast and the button state changing to **"Applied"**.
- **WHAT TO EXPLAIN**:
  - Explain the backend validation: duplicate applications for the same job are strictly rejected at the database level with a compound unique index `@@unique([jobId, applicantId])`.
  - Explain that application submission initiates a transactional database record, creates an initial `APPLIED` stage history event, logs a security audit trail, and dispatches a notification to the assigned recruiter.

---

### Step 5: Applicant Dashboard (Minute 5:00 – 6:00)
- **URL**: `http://localhost:3000/dashboard` (or click "Dashboard" / "My Applications")
- **WHAT TO SHOW**:
  - View the candidate's active application portfolio.
  - Point out the status badge showing the current stage (e.g., `APPLIED`).
  - Show the candidate's skills list and profile completeness.
- **WHAT TO EXPLAIN**:
  - The dashboard provides real-time transparency into where the applicant stands in the recruitment funnel without requiring manual recruiter emails.

---

### Step 6: Recruiter Login (Minute 6:00 – 7:00)
- **Action**: Click the profile icon in the top right $\rightarrow$ **Logout**.
- **URL**: `http://localhost:3000/login`
- **WHAT TO SHOW**:
  - Click the **"Recruiter Demo"** button (or enter `sarah.recruiter@technova.com` / `Recruiter@123456`).
  - Click **Sign In**.
- **WHAT TO EXPLAIN**:
  - Notice the dynamic UI shift: the navigation bar and sidebar automatically adapt to Recruiter privileges based on the user's role payload in the JWT.
  - The user's company context (`TechNova Solutions`) is injected into the session, ensuring complete multi-tenant tenant isolation.

---

### Step 7: Recruiter Dashboard (Minute 7:00 – 8:00)
- **URL**: `http://localhost:3000/dashboard`
- **WHAT TO SHOW**:
  - Key metrics cards: Active Jobs, Total Applications, In-Review Candidates, Upcoming Interviews.
  - The Recruitment Funnel Recharts visualization illustrating stage drop-off and conversion rates.
  - Recent activity feed showing recent candidate submissions.
- **WHAT TO EXPLAIN**:
  - Explain that all metrics are computed in PostgreSQL aggregated queries restricted strictly to `companyId = recruiter.companyId`. Recruiters cannot see metrics from competing companies.

---

### Step 8: Candidate Profile & Resume Inspection (Minute 8:00 – 9:00)
- **URL**: `http://localhost:3000/applicants`
- **WHAT TO SHOW**:
  - View the candidates list filtered for TechNova's jobs.
  - Click on a candidate (e.g., `Alex Morgan`).
  - Show verified skills, years of experience, work history, and education.
  - Click the **"Download Resume"** button.
- **WHAT TO EXPLAIN**:
  - Explain BOLA (Broken Object Level Authorization) protection:
    - If a recruiter tries to download a candidate who did NOT apply to their company, the backend rejects it with `403 Forbidden`.
    - If configured with AWS S3, the backend verifies authorization and generates a time-limited 15-minute presigned S3 download URL.

---

### Step 9: The Interactive Kanban Pipeline (Minute 9:00 – 10:00)
- **URL**: `http://localhost:3000/applications/kanban/[jobId]` (Access via Jobs $\rightarrow$ Click Kanban icon)
- **WHAT TO SHOW**:
  - The 5 pipeline stages: **Applied**, **Screening**, **Shortlisted**, **Interview**, **Selected** (plus Rejected).
  - Candidate cards showing applicant names, applied dates, match scores, and interview badges.
- **WHAT TO EXPLAIN**:
  - Built with `@dnd-kit/core` with hardware-accelerated CSS transforms.
  - Columns dynamically calculate candidate counts and average time in stage.

---

### Step 10: Drag-and-Drop Candidate Stage Progression (Minute 10:00 – 11:00)
- **WHAT TO SHOW**:
  - Drag a candidate card from **"Applied"** to **"Screening"**, and then to **"Shortlisted"**.
  - Show the instantaneous UI update and the success toast.
  - Click the **"History"** clock icon on the card to open `StageHistoryModal.tsx`.
  - Show the complete audit trail: who moved the candidate, previous stage, new stage, and exact timestamp.
- **WHAT TO EXPLAIN**:
  - Explain the backend transaction: when dropped, `PATCH /api/applications/:id/stage` executes inside a Prisma database transaction updating the application stage and inserting an immutable `ApplicationStageHistory` row.
  - Mention that this triggers an automatic notification to the applicant.

---

### Step 11: Schedule Interview (Minute 11:00 – 12:00)
- **WHAT TO SHOW**:
  - Click the **"Schedule Interview"** button on the candidate card.
  - Fill out:
    - Round: `Technical Interview`
    - Interviewer: `Sarah Jenkins` (`sarah.recruiter@technova.com`)
    - Date & Time: Tomorrow at 10:00 AM – 11:00 AM
    - Meeting Link: `https://meet.google.com/hfw-test-call`
  - Click **"Confirm Interview"**. Show the interview badge appear on the candidate card.
- **WHAT TO EXPLAIN**:
  - Point out that the backend runs a conflict-detection algorithm: if the interviewer already has an overlapping interview scheduled for that time window, the backend rejects the request with HTTP 409 Conflict.

---

### Step 12: Notifications System (Minute 12:00 – 12:30)
- **WHAT TO SHOW**:
  - Click the notification bell in the top navbar.
  - Show unread notification badges and click one to mark it as read.
  - Log out and log back in as the Applicant (`alex.dev@gmail.com`).
  - Open the Applicant's notification bell to reveal the automated alert:
    *"Congratulations! You have been Shortlisted"* and *"Interview Scheduled! 📅"*.
- **WHAT TO EXPLAIN**:
  - Notifications are decoupled, event-driven, and permanently stored with read/unread statuses and structured JSON metadata.

---

### Step 13: Analytics & Recruitment Insights (Minute 12:30 – 13:30)
- **WHAT TO SHOW**:
  - Show the recruiter analytics dashboard tabs (Funnel Conversion, Stage Duration, Rejection Reasons).
  - Demonstrate interactive Recharts tooltips and responsive scaling.
- **WHAT TO EXPLAIN**:
  - Data is aggregated via Prisma `groupBy` and count queries, giving talent acquisition leads full visibility into pipeline bottlenecks.

---

### Step 14: Super Admin Governance Dashboard (Minute 13:30 – 14:30)
- **Action**: Log in as `admin@hireflow.dev` / `Admin@123456`.
- **URL**: `http://localhost:3000/dashboard` & `http://localhost:3000/admin/users`
- **WHAT TO SHOW**:
  - Global cross-company platform statistics (Total Companies, Total Recruiters, Total Candidates, System Health).
  - User Management Table: Show ability to activate or suspend user accounts.
  - Audit Trail (`/admin/audit`): View the immutable log of system actions (logins, job posts, stage transitions, IP addresses).
- **WHAT TO EXPLAIN**:
  - Super Admin has global governance privileges without violating multi-tenant boundaries for everyday recruiters.
  - Audit logging satisfies enterprise compliance requirements (SOC 2 / GDPR tracking).

---

### Step 15: Interactive Swagger API Documentation (Minute 14:30 – 15:00)
- **URL**: `http://localhost:5001/api/docs`
- **WHAT TO SHOW**:
  - The live OpenAPI 3.0 / Swagger UI interface.
  - Expand endpoints (`/api/auth/login`, `/api/applications`, `/api/candidates/resumes/{filename}`).
  - Point out the `Authorize` button allowing live JWT token injection.
  - Show `/api/health` returning live database connectivity verification.
- **WHAT TO EXPLAIN**:
  - *"Every API endpoint is fully documented with request schemas, parameter types, error models, and live testing capabilities."*

---

## 💡 Quick Tips for a Flawless Presentation
1. **Keep DevTools Open**: Show the Network tab during the Kanban drag-and-drop to demonstrate the clean `PATCH /api/applications/:id/stage` request and 200 OK response.
2. **Highlight Optimistic Updates**: Mention that the UI doesn't stutter because it updates locally before syncing with the backend.
3. **Emphasize Security First**: Remind the interviewer that HireFlow was built with zero tolerance for authorization leaks (BOLA protection, rate limits, Helmet security headers, bcrypt encryption).
