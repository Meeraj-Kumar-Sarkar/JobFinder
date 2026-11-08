import mongoose from "mongoose";
import http from "http";
import app from "./src/app.js";
import User from "./src/models/User.js";
import Company from "./src/models/Company.js";
import Job from "./src/models/Job.js";
import Application from "./src/models/Application.js";
import Notification from "./src/models/Notification.js";

async function runComprehensiveTests() {
  console.log("=================================================");
  console.log("RUNNING AUTH, DATA COLLECTION & COMPANY-WORKER TESTS");
  console.log("=================================================");

  console.log("Connecting to MongoDB...");
  await mongoose.connect("mongodb://localhost:27017/jobportal_auth_test");
  console.log("Connected to test database.");

  // Clean collections
  await Application.deleteMany({});
  await Job.deleteMany({});
  await Company.deleteMany({});
  await User.deleteMany({});
  await Notification.deleteMany({});

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5098, resolve));

  const postJSON = async (url, body, token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`http://localhost:5098${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  const getJSON = async (url, token) => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`http://localhost:5098${url}`, { headers });
    const data = await res.json();
    return { status: res.status, data };
  };

  const putJSON = async (url, body, token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`http://localhost:5098${url}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  const patchJSON = async (url, body, token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`http://localhost:5098${url}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  // ---------------------------------------------------------
  // TEST 1: Register Normal Worker with worker-specific data collection
  // ---------------------------------------------------------
  console.log("\n--- TEST 1: Register Normal Worker & Collect Data ---");
  const workerReg = await postJSON("/api/auth/register", {
    name: "Jane Smith",
    email: "jane.worker@example.com",
    password: "Password123!",
    role: "candidate",
    userType: "worker",
    headline: "Senior Frontend Engineer",
    bio: "Passionate about building responsive, accessible web interfaces",
    skills: ["React", "TypeScript", "TailwindCSS", "Next.js"],
    experience: 4,
    education: [
      {
        degree: "B.Tech Computer Science",
        institution: "Tech University",
        year: 2022,
      },
    ],
    resumeURL: "https://storage.example.com/resumes/jane.pdf",
    portfolioURL: "https://janesmith.dev",
    expectedSalary: 95000,
    preferredJobType: "Full Time",
  });

  console.log("Worker registration status:", workerReg.status, "User ID:", workerReg.data.data?.user?._id);
  if (workerReg.status !== 201) throw new Error("Failed to register normal worker");
  const workerToken = workerReg.data.data?.token;
  const workerId = workerReg.data.data?.user?._id;
  if (!workerToken) throw new Error("Worker auth token missing");

  // ---------------------------------------------------------
  // TEST 2: Update Worker Data Collection profile
  // ---------------------------------------------------------
  console.log("\n--- TEST 2: Update Worker Profile Data Collection ---");
  const workerUpdate = await putJSON(
    "/api/users/worker-profile",
    {
      skills: ["React", "TypeScript", "TailwindCSS", "Next.js", "GraphQL"],
      experience: 5,
      expectedSalary: 105000,
      headline: "Lead Frontend Engineer",
    },
    workerToken,
  );
  console.log("Worker update status:", workerUpdate.status, "data:", workerUpdate.data);
  if (workerUpdate.status !== 200) throw new Error("Failed to update worker profile");
  if (workerUpdate.data.data?.skills?.length !== 5) throw new Error("Expected 5 skills after update");

  // ---------------------------------------------------------
  // TEST 3: Register Institution / Company with company profile data collection
  // ---------------------------------------------------------
  console.log("\n--- TEST 3: Register Institution / Company & Collect Company Data ---");
  const companyReg = await postJSON("/api/auth/register", {
    name: "Apex Solutions Founder",
    email: "founder@apexsolutions.com",
    password: "SecurePass123!",
    role: "employer",
    userType: "institution",
    companyName: "Apex Solutions Inc",
    companyDescription: "Next-gen enterprise software solutions",
    companyIndustry: "Enterprise Software",
    companyLocation: "San Francisco, CA",
    companyWebsite: "https://apexsolutions.io",
    companyLogo: "https://apexsolutions.io/logo.png",
    registrationNumber: "US-CORP-984210",
  });

  console.log("Company registration status:", companyReg.status, "Company ID:", companyReg.data.data?.company?._id);
  if (companyReg.status !== 201) throw new Error("Failed to register institution/company");
  const companyToken = companyReg.data.data?.token;
  const companyOwnerId = companyReg.data.data?.user?._id;
  const companyId = companyReg.data.data?.company?._id;
  if (!companyToken || !companyId) throw new Error("Company token or company ID missing");

  // ---------------------------------------------------------
  // TEST 4: Login with Email & Password (Signin Backend)
  // ---------------------------------------------------------
  console.log("\n--- TEST 4: Login (Signin) for Company Owner & Worker ---");
  const workerLogin = await postJSON("/api/auth/login", {
    email: "jane.worker@example.com",
    password: "Password123!",
  });
  console.log("Worker login status:", workerLogin.status, "Name:", workerLogin.data.data?.user?.name);
  if (workerLogin.status !== 200) throw new Error("Worker login failed");

  const companyLogin = await postJSON("/api/auth/signin", {
    email: "founder@apexsolutions.com",
    password: "SecurePass123!",
  });
  console.log(
    "Company login status:",
    companyLogin.status,
    "Company name:",
    companyLogin.data.data?.company?.name,
    "Access status:",
    companyLogin.data.data?.company?.accessStatus,
  );
  if (companyLogin.status !== 200) throw new Error("Company login failed");

  // Check /api/auth/me
  const meRes = await getJSON("/api/auth/me", workerToken);
  console.log("Auth /me worker status:", meRes.status, "Role:", meRes.data.data?.role);
  if (meRes.status !== 200) throw new Error("Auth /me failed");

  // ---------------------------------------------------------
  // TEST 5: Company creates Job Posts
  // ---------------------------------------------------------
  console.log("\n--- TEST 5: Company Posts Jobs ---");
  const job1Res = await postJSON(
    "/api/jobs",
    {
      title: "Senior React Architect",
      company: companyId,
      description: "Lead our frontend web architecture",
      requirements: ["React", "TypeScript", "GraphQL"],
      salaryMin: 120000,
      salaryMax: 150000,
      location: "San Francisco / Remote",
      jobType: "Full Time",
      experience: 4,
    },
    companyToken,
  );
  console.log("Job 1 created status:", job1Res.status, "Job 1 ID:", job1Res.data.data?._id);
  if (job1Res.status !== 201) throw new Error("Failed to create Job 1");
  const job1Id = job1Res.data.data?._id;

  const job2Res = await postJSON(
    "/api/jobs",
    {
      title: "Backend Cloud Engineer",
      company: companyId,
      description: "Build distributed microservices",
      requirements: ["Node.js", "Docker", "Kubernetes"],
      salaryMin: 130000,
      salaryMax: 160000,
      location: "Remote",
      jobType: "Full Time",
      experience: 3,
    },
    companyToken,
  );
  console.log("Job 2 created status:", job2Res.status, "Job 2 ID:", job2Res.data.data?._id);
  if (job2Res.status !== 201) throw new Error("Failed to create Job 2");
  const job2Id = job2Res.data.data?._id;

  // ---------------------------------------------------------
  // TEST 6: Company Hires an HR Worker & Grants Access
  // ---------------------------------------------------------
  console.log("\n--- TEST 6: Company Hires HR Worker (Access Granted to Company DB & Portal) ---");
  const addHrRes = await postJSON(
    `/api/companies/${companyId}/workers`,
    {
      name: "Helen Recruiter",
      email: "helen.hr@apexsolutions.com",
      password: "HRPassword123!",
      companyRole: "hr",
      status: "active",
      terms: "Full-time HR Manager access with authority to post jobs and review candidates",
      permissions: [
        "view_company",
        "view_workers",
        "view_jobs",
        "create_job",
        "operate_job_portal",
        "view_applications",
        "manage_applications",
        "schedule_interviews",
        "hiring_decisions",
      ],
      assignedJobs: [job1Id],
    },
    companyToken,
  );
  console.log("Add HR status:", addHrRes.status, "Worker ID:", addHrRes.data.data?.workerId);
  if (addHrRes.status !== 201) throw new Error("Failed to add HR to company");
  const hrWorkerId = addHrRes.data.data?.workerId;

  // Login as HR
  const hrLogin = await postJSON("/api/auth/login", {
    email: "helen.hr@apexsolutions.com",
    password: "HRPassword123!",
  });
  console.log(
    "HR Login status:",
    hrLogin.status,
    "Role:",
    hrLogin.data.data?.user?.companyRole,
    "Access status:",
    hrLogin.data.data?.company?.accessStatus,
  );
  if (hrLogin.status !== 200) throw new Error("HR Login failed");
  const hrToken = hrLogin.data.data?.token;

  // ---------------------------------------------------------
  // TEST 7: Company views its workers and their details
  // ---------------------------------------------------------
  console.log("\n--- TEST 7: Company Sees its Workers and their Full Details ---");
  const companyWorkersRes = await getJSON(
    `/api/companies/${companyId}/workers`,
    companyToken,
  );
  console.log(
    "Company workers count:",
    companyWorkersRes.data.data?.totalWorkers,
    "Worker Name:",
    companyWorkersRes.data.data?.workers[0]?.name,
    "Worker Email:",
    companyWorkersRes.data.data?.workers[0]?.email,
    "Status:",
    companyWorkersRes.data.data?.workers[0]?.status,
    "Assigned jobs count:",
    companyWorkersRes.data.data?.workers[0]?.assignedJobs?.length,
  );
  if (companyWorkersRes.status !== 200) throw new Error("Failed to get company workers");
  if (companyWorkersRes.data.data?.totalWorkers !== 1)
    throw new Error("Expected 1 worker in company");

  // ---------------------------------------------------------
  // TEST 8: Company assigns / reassigns job posts to worker
  // ---------------------------------------------------------
  console.log("\n--- TEST 8: Company Assigns Job Posts to Worker ---");
  const assignRes = await postJSON(
    `/api/companies/${companyId}/workers/${hrWorkerId}/assign-jobs`,
    {
      jobIds: [job1Id, job2Id],
    },
    companyToken,
  );
  console.log(
    "Assign jobs status:",
    assignRes.status,
    "Assigned job count:",
    assignRes.data.data?.assignedJobCount,
  );
  if (assignRes.status !== 200) throw new Error("Failed to assign jobs to worker");
  if (assignRes.data.data?.assignedJobCount !== 2)
    throw new Error("Expected 2 assigned jobs");

  // HR views their assigned jobs
  const hrAssignedJobs = await getJSON("/api/jobs/assigned", hrToken);
  console.log(
    "HR assigned jobs retrieved count:",
    hrAssignedJobs.data.data?.length,
    "Title 1:",
    hrAssignedJobs.data.data?.[0]?.title,
  );
  if (hrAssignedJobs.data.data?.length !== 2)
    throw new Error("Expected 2 assigned jobs for HR");

  // ---------------------------------------------------------
  // TEST 9: HR Operates on Company Job Portal (Active Terms)
  // ---------------------------------------------------------
  console.log("\n--- TEST 9: HR Operates on Job Portal (Active Terms) ---");
  // 1. HR posts a new job for the company
  const hrPostJob = await postJSON(
    "/api/jobs",
    {
      title: "DevOps Engineer (Posted by HR)",
      company: companyId,
      description: "Manage CI/CD and AWS infrastructure",
      requirements: ["AWS", "Terraform", "CI/CD"],
      salaryMin: 110000,
      salaryMax: 140000,
    },
    hrToken,
  );
  console.log("HR post job status:", hrPostJob.status, "Job title:", hrPostJob.data.data?.title);
  if (hrPostJob.status !== 201) throw new Error("HR failed to post job under active terms");

  // 2. Candidate applies for Job 1
  const applyRes = await postJSON("/api/applications", {
    candidateId: workerId,
    jobId: job1Id,
    coverLetter: "Excited to apply for this React role!",
  });
  console.log("Application status:", applyRes.status, "App ID:", applyRes.data.data?.applicationId);
  const applicationId = applyRes.data.data?.applicationId;

  // 3. HR views employer applications
  const hrViewApps = await getJSON(
    `/api/applications/employer/${hrWorkerId}`,
    hrToken,
  );
  console.log(
    "HR view applications count:",
    hrViewApps.data.data?.applications?.length,
  );
  if (hrViewApps.status !== 200)
    throw new Error("HR could not view applications under active terms");

  // 4. HR updates candidate status to Screening
  const hrUpdateStatus = await patchJSON(
    `/api/applications/${applicationId}/status`,
    { status: "Screening" },
    hrToken,
  );
  console.log("HR update status:", hrUpdateStatus.data.data?.currentStatus);
  if (hrUpdateStatus.data.data?.currentStatus !== "Screening")
    throw new Error("HR status update failed");

  // ---------------------------------------------------------
  // TEST 10: Company CHANGES TERMS -> Worker Loses Access
  // ---------------------------------------------------------
  console.log("\n--- TEST 10: Company Changes Terms -> Worker Loses Access to DB & Portal ---");
  const changeTermsSuspend = await patchJSON(
    `/api/companies/${companyId}/workers/${hrWorkerId}/terms`,
    {
      status: "suspended",
      hasAccess: false,
      terms: "Access suspended pending quarterly compliance review",
    },
    companyToken,
  );
  console.log(
    "Terms change status:",
    changeTermsSuspend.status,
    "Message:",
    changeTermsSuspend.data.data?.message,
    "Worker Status:",
    changeTermsSuspend.data.data?.status,
  );
  if (changeTermsSuspend.status !== 200)
    throw new Error("Failed to change terms to suspended");

  // HR tries to view company workers -> MUST FAIL (403 Forbidden)
  const hrBlockedWorkers = await getJSON(
    `/api/companies/${companyId}/workers`,
    hrToken,
  );
  console.log(
    "Suspended HR access to workers status (expected 403):",
    hrBlockedWorkers.status,
    "Code:",
    hrBlockedWorkers.data.code,
  );
  if (hrBlockedWorkers.status !== 403)
    throw new Error("Expected 403 Forbidden for suspended HR trying to access company DB");

  // HR tries to post a job -> MUST FAIL (403 Forbidden)
  const hrBlockedPostJob = await postJSON(
    "/api/jobs",
    {
      title: "Unauthorized Job Post",
      company: companyId,
    },
    hrToken,
  );
  console.log(
    "Suspended HR post job status (expected 403):",
    hrBlockedPostJob.status,
    "Message:",
    hrBlockedPostJob.data.message,
  );
  if (hrBlockedPostJob.status !== 403)
    throw new Error("Expected 403 Forbidden for suspended HR trying to post job");

  // HR tries to view employer applications -> MUST FAIL (403 Forbidden)
  const hrBlockedApps = await getJSON(
    `/api/applications/employer/${hrWorkerId}`,
    hrToken,
  );
  console.log(
    "Suspended HR view applications status (expected 403):",
    hrBlockedApps.status,
    "Message:",
    hrBlockedApps.data.message,
  );
  if (hrBlockedApps.status !== 403)
    throw new Error("Expected 403 Forbidden for suspended HR trying to view applications");

  // ---------------------------------------------------------
  // TEST 11: Company RESTORES TERMS -> Worker Regains Access
  // ---------------------------------------------------------
  console.log("\n--- TEST 11: Company Restores Terms -> Worker Regains Access ---");
  const changeTermsRestore = await patchJSON(
    `/api/companies/${companyId}/workers/${hrWorkerId}/terms`,
    {
      status: "active",
      hasAccess: true,
      terms: "Access restored. Compliance review passed.",
    },
    companyToken,
  );
  console.log(
    "Terms restore status:",
    changeTermsRestore.status,
    "Message:",
    changeTermsRestore.data.data?.message,
    "Worker Status:",
    changeTermsRestore.data.data?.status,
  );
  if (changeTermsRestore.status !== 200)
    throw new Error("Failed to restore worker terms to active");

  // HR tries to view company workers -> MUST SUCCEED (200 OK)
  const hrRestoredWorkers = await getJSON(
    `/api/companies/${companyId}/workers`,
    hrToken,
  );
  console.log(
    "Restored HR access to workers status (expected 200):",
    hrRestoredWorkers.status,
    "Total workers:",
    hrRestoredWorkers.data.data?.totalWorkers,
  );
  if (hrRestoredWorkers.status !== 200)
    throw new Error("Expected 200 OK for restored HR accessing company workers");

  // HR resumes operations: schedule interview
  const hrSchedule = await postJSON(
    `/api/applications/${applicationId}/schedule-interview`,
    {
      interviewDate: new Date(Date.now() + 86400000).toISOString(),
      feedback: "Culture & Architecture interview with engineering lead",
    },
    hrToken,
  );
  console.log(
    "Restored HR schedule interview status (expected 200):",
    hrSchedule.status,
    "Status:",
    hrSchedule.data.data?.currentStatus,
  );
  if (hrSchedule.status !== 200)
    throw new Error("Expected 200 OK for restored HR scheduling interview");

  // Cleanup
  await Application.deleteMany({});
  await Job.deleteMany({});
  await Company.deleteMany({});
  await User.deleteMany({});
  await Notification.deleteMany({});
  server.close();
  await mongoose.disconnect();

  console.log("\n========================================================");
  console.log("ALL AUTH, DATA COLLECTION & COMPANY-WORKER TESTS PASSED!");
  console.log("========================================================\n");
}

runComprehensiveTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
