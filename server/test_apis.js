import mongoose from "mongoose";
import app from "./src/app.js";
import User from "./src/models/User.js";
import Company from "./src/models/Company.js";
import Job from "./src/models/Job.js";
import Application from "./src/models/Application.js";
import Notification from "./src/models/Notification.js";
import http from "http";

async function runTests() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect("mongodb://localhost:27017/jobportal_test");
  console.log("Connected to test database.");

  // Clean test collection
  await Application.deleteMany({});
  await Job.deleteMany({});
  await Company.deleteMany({});
  await User.deleteMany({});
  await Notification.deleteMany({});

  // 1. Create Employer User
  const employer = await User.create({
    firebaseUID: "test-emp-uid-1",
    name: "Tech Employer",
    email: "employer@techcorp.com",
    role: "employer",
    skills: [],
    experience: 5,
  });

  // 2. Create Company
  const company = await Company.create({
    name: "TechCorp Global",
    description: "Leading technology solutions provider",
    industry: "Information Technology",
    location: "Bengaluru, India",
    owner: employer._id,
    employees: 10,
  });

  employer.company = company._id;
  await employer.save();

  // 3. Create Candidate Users
  const candidateQualified = await User.create({
    firebaseUID: "test-cand-uid-1",
    name: "John Doe",
    email: "john@example.com",
    role: "candidate",
    headline: "Full Stack Engineer",
    skills: ["React", "Node.js", "TypeScript", "MongoDB", "Express"],
    experience: 3,
    resumeURL: "https://storage.example.com/resumes/john.pdf",
  });

  const candidateUnderqualified = await User.create({
    firebaseUID: "test-cand-uid-2",
    name: "Bob Beginner",
    email: "bob@example.com",
    role: "candidate",
    skills: ["HTML", "CSS"],
    experience: 0,
    resumeURL: "https://storage.example.com/resumes/bob.pdf",
  });

  // 4. Create Job
  const job = await Job.create({
    title: "Senior Full Stack Developer",
    company: company._id,
    description: "Build modern web applications",
    requirements: ["React", "Node.js", "TypeScript", "MongoDB"],
    salaryMin: 80000,
    salaryMax: 120000,
    location: "Remote",
    jobType: "Full Time",
    experience: 3,
    createdBy: employer._id,
    status: "active",
    applicants: 0,
  });

  console.log("\n--- TEST 1: Underqualified candidate skill threshold check ---");
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));

  const postJSON = async (url, body) => {
    const res = await fetch(`http://localhost:5099${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  const getJSON = async (url) => {
    const res = await fetch(`http://localhost:5099${url}`);
    const data = await res.json();
    return { status: res.status, data };
  };

  const patchJSON = async (url, body) => {
    const res = await fetch(`http://localhost:5099${url}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  const deleteJSON = async (url, body) => {
    const res = await fetch(`http://localhost:5099${url}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  // Test Underqualified application (should fail skill check)
  const failApply = await postJSON("/api/applications", {
    candidateId: candidateUnderqualified._id.toString(),
    jobId: job._id.toString(),
  });
  console.log("Underqualified apply status:", failApply.status, "message:", failApply.data.message);
  if (failApply.status !== 400) throw new Error("Expected status 400 for underqualified applicant");

  console.log("\n--- TEST 2: Qualified candidate applies successfully ---");
  const successApply = await postJSON("/api/applications", {
    candidateId: candidateQualified._id.toString(),
    jobId: job._id.toString(),
    coverLetter: "I am passionate about this position!",
  });
  console.log("Qualified apply status:", successApply.status, "appId:", successApply.data.data?.applicationId);
  if (successApply.status !== 201) throw new Error("Expected status 201 for qualified applicant");
  const applicationId = successApply.data.data.applicationId;

  // Check job applicant count updated
  const updatedJob = await Job.findById(job._id);
  console.log("Job applicants count after apply:", updatedJob?.applicants);
  if (updatedJob?.applicants !== 1) throw new Error("Expected job applicants to be 1");

  // Check notification created
  const notifs = await Notification.find({ user: employer._id });
  console.log("Employer notification count:", notifs.length, "Title:", notifs[0]?.title);
  if (notifs.length === 0) throw new Error("Expected notification for employer");

  console.log("\n--- TEST 3: Duplicate application prevention ---");
  const dupApply = await postJSON("/api/applications", {
    candidateId: candidateQualified._id.toString(),
    jobId: job._id.toString(),
  });
  console.log("Duplicate apply status:", dupApply.status, "message:", dupApply.data.message);
  if (dupApply.status !== 409) throw new Error("Expected status 409 for duplicate application");

  console.log("\n--- TEST 4: Get Candidate Applications ---");
  const candidateApps = await getJSON(`/api/applications/my-applications?candidateId=${candidateQualified._id}`);
  console.log("Candidate applications count:", candidateApps.data.data?.applications?.length);
  console.log("Populated job title:", candidateApps.data.data?.applications[0]?.job?.title);
  if (candidateApps.data.data?.applications?.length !== 1) throw new Error("Expected 1 candidate application");

  console.log("\n--- TEST 5: Get Job Applicants (Employer view) ---");
  const jobApplicants = await getJSON(`/api/applications/job/${job._id}`);
  console.log("Job applicants count:", jobApplicants.data.data?.applicants?.length);
  console.log("Candidate name:", jobApplicants.data.data?.applicants[0]?.candidate?.name);
  if (jobApplicants.data.data?.applicants?.length !== 1) throw new Error("Expected 1 job applicant");

  console.log("\n--- TEST 6: Get Single Application Details ---");
  const singleApp = await getJSON(`/api/applications/${applicationId}`);
  console.log("Single app status:", singleApp.status, "Candidate name:", singleApp.data.data?.candidate?.name);
  if (singleApp.status !== 200) throw new Error("Expected status 200 for single app");

  console.log("\n--- TEST 7: ATS Status Transition (Applied -> Screening) ---");
  const stepStatus = await patchJSON(`/api/applications/${applicationId}/status`, {});
  console.log("Next status:", stepStatus.data.data?.currentStatus);
  if (stepStatus.data.data?.currentStatus !== "Screening") throw new Error("Expected status Screening");

  console.log("\n--- TEST 8: Schedule Interview ---");
  const interviewRes = await postJSON(`/api/applications/${applicationId}/schedule-interview`, {
    interviewDate: new Date(Date.now() + 86400000).toISOString(),
    feedback: "Round 1 Technical Interview via Google Meet",
  });
  console.log("Interview scheduled status:", interviewRes.status, "New App status:", interviewRes.data.data?.currentStatus);
  if (interviewRes.data.data?.currentStatus !== "Technical") throw new Error("Expected status Technical after interview scheduling");

  console.log("\n--- TEST 9: Application Pipeline Stats ---");
  const statsRes = await getJSON(`/api/applications/stats/${job._id}`);
  console.log("Pipeline stats:", statsRes.data.data?.breakdown);
  if (statsRes.data.data?.breakdown?.Technical !== 1) throw new Error("Expected Technical count 1");

  console.log("\n--- TEST 10: Final Hiring Decision (Hired) ---");
  const hireRes = await postJSON(`/api/applications/${applicationId}/decision`, {
    decision: "Hired",
    feedback: "Outstanding technical performance and culture fit!",
  });
  console.log("Hire decision status:", hireRes.status, "Message:", hireRes.data.message);

  // Verify User company updated & Company employees count incremented
  const hiredUser = await User.findById(candidateQualified._id);
  const updatedCompany = await Company.findById(company._id);
  console.log("Hired user company:", hiredUser?.company?.toString(), "Expected:", company._id.toString());
  console.log("Updated company employees:", updatedCompany?.employees, "Expected: 11");
  if (hiredUser?.company?.toString() !== company._id.toString()) throw new Error("Hired candidate company mismatch");
  if (updatedCompany?.employees !== 11) throw new Error("Company employees count mismatch");

  console.log("\n--- TEST 11: Direct legacy endpoints compatibility ---");
  // Test legacy /create_newApplication with bypass
  const candidate2 = await User.create({
    firebaseUID: "test-cand-uid-3",
    name: "Alice Smith",
    email: "alice@example.com",
    role: "candidate",
    skills: ["React", "TypeScript", "Node.js"],
    experience: 2,
    resumeURL: "https://example.com/alice.pdf",
  });

  const legacyApply = await postJSON("/create_newApplication", {
    candidate: candidate2._id.toString(),
    job: job._id.toString(),
  });
  console.log("Legacy apply response:", legacyApply.data);
  if (legacyApply.data.message !== "Applied Successfully!!") throw new Error("Legacy apply failed");
  const legacyAppId = legacyApply.data.ApplicationId;

  const legacyMyApps = await postJSON("/my_JobApplications", {
    candidateId: candidate2._id.toString(),
  });
  console.log("Legacy my apps count:", legacyMyApps.data.applications?.length);

  const legacyJobApps = await postJSON("/get_applications", {
    jobId: job._id.toString(),
  });
  console.log("Legacy get applications count:", legacyJobApps.data.applicants?.length);

  const legacyUpdateStatus = await postJSON("/update_ApplicationStatus", {
    applicationId: legacyAppId,
  });
  console.log("Legacy update status:", legacyUpdateStatus.data);

  // Test withdraw application
  console.log("\n--- TEST 12: Withdraw Application ---");
  const withdrawRes = await deleteJSON(`/api/applications/${legacyAppId}`, {
    candidateId: candidate2._id.toString(),
  });
  console.log("Withdraw response:", withdrawRes.data);
  const postWithdrawJob = await Job.findById(job._id);
  console.log("Job applicants count after withdraw:", postWithdrawJob?.applicants);

  // Cleanup
  await Application.deleteMany({});
  await Job.deleteMany({});
  await Company.deleteMany({});
  await User.deleteMany({});
  await Notification.deleteMany({});
  server.close();
  await mongoose.disconnect();

  console.log("\n=================================");
  console.log("ALL JOB APPLICATION API TESTS PASSED!");
  console.log("=================================\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
