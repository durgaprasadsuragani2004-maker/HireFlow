const http = require('http');

function postJson(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw), headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, raw, headers: res.headers });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(url, token = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw), headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, raw, headers: res.headers });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function patchJson(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw), headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, raw, headers: res.headers });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('=== VERIFYING HIREFLOW FULL-STACK LIVE SERVICES ===\n');

  // 1. Health check
  const health = await getJson('http://localhost:5001/api/health');
  console.log('Backend Health Status:', health.status, health.data?.status, 'DB:', health.data?.database);
  if (health.status !== 200) throw new Error('Backend not healthy');

  // Check Client Server on 3000
  const clientRes = await getJson('http://localhost:3000');
  console.log('Frontend Home Page Status:', clientRes.status);
  if (clientRes.status !== 200) throw new Error('Frontend not running on 3000');

  // 2. Authentication
  console.log('\n--- 1. Authenticating Roles ---');
  const adminLogin = await postJson('http://localhost:5001/api/auth/login', {
    email: 'admin@hireflow.dev',
    password: 'Admin@123456',
  });
  console.log('Admin login status:', adminLogin.status, 'Role:', adminLogin.data?.data?.user?.role);
  const adminToken = adminLogin.data.data.tokens.accessToken;

  const recruiterLogin = await postJson('http://localhost:5001/api/auth/login', {
    email: 'sarah.recruiter@technova.com',
    password: 'Recruiter@123456',
  });
  console.log('Recruiter login status:', recruiterLogin.status, 'Company:', recruiterLogin.data?.data?.user?.recruiterProfile?.companyName);
  const recruiterToken = recruiterLogin.data.data.tokens.accessToken;
  const recruiterCompanyId = recruiterLogin.data.data.user.recruiterProfile.companyId;

  const applicantLogin = await postJson('http://localhost:5001/api/auth/login', {
    email: 'alex.dev@gmail.com',
    password: 'Applicant@123456',
  });
  console.log('Applicant login status:', applicantLogin.status, 'Name:', applicantLogin.data?.data?.user?.applicantProfile?.fullName);
  const applicantToken = applicantLogin.data.data.tokens.accessToken;

  // 3. Resume Download Verification
  console.log('\n--- 2. Resume Download Access & Isolation ---');
  // Unauthenticated -> 401
  const unauthResume = await getJson('http://localhost:5001/api/resumes/alex_morgan_resume.pdf');
  console.log('Unauthenticated resume download:', unauthResume.status, unauthResume.data?.message);
  if (unauthResume.status !== 401) throw new Error('Unauthenticated resume should return 401');

  // Admin with header -> 200
  const adminResume = await getJson('http://localhost:5001/api/resumes/alex_morgan_resume.pdf', adminToken);
  console.log('Admin resume download with header:', adminResume.status, adminResume.headers['content-type']);
  if (adminResume.status !== 200) throw new Error('Admin resume with header should return 200');

  // Query token (for new tab) -> 200
  const tabResume = await getJson(`http://localhost:5001/api/resumes/alex_morgan_resume.pdf?token=${adminToken}&view=inline`);
  console.log('Resume download via query token (new tab preview):', tabResume.status, tabResume.headers['content-type']);
  if (tabResume.status !== 200) throw new Error('Query token download should return 200');

  // Recruiter for applicant to their company -> 200
  const recruiterResume = await getJson('http://localhost:5001/api/resumes/alex_morgan_resume.pdf', recruiterToken);
  console.log('TechNova recruiter download Alex resume:', recruiterResume.status);
  if (recruiterResume.status !== 200) throw new Error('Recruiter should download applicant resume');

  // Candidate downloading another candidate resume -> 403
  const candidateCrossResume = await getJson('http://localhost:5001/api/resumes/elena_rostova_resume.pdf', applicantToken);
  console.log('Applicant downloading another candidate resume:', candidateCrossResume.status, candidateCrossResume.data?.message);
  if (candidateCrossResume.status !== 403) throw new Error('Candidate cannot download another candidate resume');

  // 4. Job Postings Application Status
  console.log('\n--- 3. Job Postings Application Status ---');
  const applicantJobs = await getJson('http://localhost:5001/api/jobs?limit=100', applicantToken);
  console.log('Applicant queried /api/jobs: total jobs =', applicantJobs.data?.data?.length);
  const appliedJobs = applicantJobs.data?.data?.filter((j) => j.hasApplied);
  console.log(`Applicant hasApplied=true on ${appliedJobs.length} jobs:`);
  appliedJobs.forEach((j) => {
    console.log(`  - [${j.title}] Stage: ${j.applicationInfo?.currentStage}, AppliedAt: ${j.applicationInfo?.appliedAt}`);
  });
  if (appliedJobs.length === 0) throw new Error('Applicant should have applied jobs in seed data');

  // 5. Job Editing Functionality
  console.log('\n--- 4. Job Editing Functionality & Validation ---');
  const existingJob = appliedJobs[0];
  const updatePayload = {
    title: existingJob.title,
    location: 'Remote (Worldwide)',
    salaryMin: 140000,
    salaryMax: 180000,
  };
  const editJobRes = await patchJson(`http://localhost:5001/api/jobs/${existingJob.id}`, updatePayload, adminToken);
  console.log('Super Admin edit job status:', editJobRes.status, 'New Location:', editJobRes.data?.data?.location);
  if (editJobRes.status !== 200) throw new Error('Admin edit job failed');

  // Invalid salary edit (salaryMin > salaryMax) -> 400
  const invalidSalaryEdit = await patchJson(`http://localhost:5001/api/jobs/${existingJob.id}`, { salaryMin: 200000, salaryMax: 100000 }, adminToken);
  console.log('Invalid salary edit (200k > 100k):', invalidSalaryEdit.status, invalidSalaryEdit.data?.message);
  if (invalidSalaryEdit.status !== 400) throw new Error('Invalid salary should return 400');

  // Applicant attempting to edit job -> 403
  const applicantEdit = await patchJson(`http://localhost:5001/api/jobs/${existingJob.id}`, { title: 'Hacked' }, applicantToken);
  console.log('Applicant edit job attempt:', applicantEdit.status);
  if (applicantEdit.status !== 403) throw new Error('Applicant editing job should return 403');

  // 6. Company Analytics & Recruitment Funnel
  console.log('\n--- 5. Company-Specific Recruitment Funnel ---');
  const companyAnalytics = await getJson(`http://localhost:5001/api/companies/${recruiterCompanyId}/analytics`, adminToken);
  console.log('TechNova Analytics:', {
    company: companyAnalytics.data?.data?.company?.name,
    totalJobs: companyAnalytics.data?.data?.totalJobs,
    totalApplications: companyAnalytics.data?.data?.totalApplications,
    funnel: companyAnalytics.data?.data?.funnel,
  });
  if (companyAnalytics.status !== 200) throw new Error('Failed to fetch company analytics');
  if (!Array.isArray(companyAnalytics.data?.data?.funnel)) throw new Error('Funnel must be an array');

  // Recruiter fetching their company analytics -> 200
  const recruiterSelfAnalytics = await getJson(`http://localhost:5001/api/companies/${recruiterCompanyId}/analytics`, recruiterToken);
  console.log('Recruiter self company analytics status:', recruiterSelfAnalytics.status);
  if (recruiterSelfAnalytics.status !== 200) throw new Error('Recruiter should fetch own company analytics');

  // Applicant fetching company analytics -> 403
  const applicantCompanyAnalytics = await getJson(`http://localhost:5001/api/companies/${recruiterCompanyId}/analytics`, applicantToken);
  console.log('Applicant company analytics attempt status:', applicantCompanyAnalytics.status);
  if (applicantCompanyAnalytics.status !== 403) throw new Error('Applicant cannot fetch company analytics');

  // 7. Organization & Company Profile Management
  console.log('\n--- 6. Organization Profile Management ---');
  // List companies for admin
  const allCompanies = await getJson('http://localhost:5001/api/companies/all', adminToken);
  console.log('Super Admin list all companies count:', allCompanies.data?.data?.length);
  if (allCompanies.status !== 200 || !allCompanies.data?.data?.length) throw new Error('Admin list companies failed');

  // Recruiter update company profile
  const recruiterUpdateComp = await patchJson('http://localhost:5001/api/companies', {
    description: 'Updated enterprise cloud engineering leader.',
    location: 'San Francisco, CA (HQ)',
  }, recruiterToken);
  console.log('Recruiter update company profile status:', recruiterUpdateComp.status, 'New Location:', recruiterUpdateComp.data?.data?.location);
  if (recruiterUpdateComp.status !== 200) throw new Error('Recruiter update company profile failed');

  console.log('\n=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===\n');
}

run().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
