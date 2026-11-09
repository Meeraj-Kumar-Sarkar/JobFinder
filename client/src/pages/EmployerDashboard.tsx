import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  jobsApi,
  applicationsApi,
  type Job,
  type Application,
  type User,
} from "../services/api";
import toast from "react-hot-toast";

function EmployerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"jobs" | "applicants" | "post-job">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter applicants by job
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");

  // Post Job Form State
  const [jobTitle, setJobTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [location, setLocation] = useState("Remote");
  const [jobType, setJobType] = useState("Full Time");
  const [salaryMin, setSalaryMin] = useState<number>(60000);
  const [salaryMax, setSalaryMax] = useState<number>(90000);
  const [experience, setExperience] = useState<number>(2);
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");
  const [description, setDescription] = useState("");
  const [postingJob, setPostingJob] = useState(false);

  // Interview Schedule Modal State
  const [scheduleModalApp, setScheduleModalApp] = useState<Application | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [scheduling, setScheduling] = useState(false);

  // Cover Letter View Modal
  const [coverLetterModal, setCoverLetterModal] = useState<{
    candidateName: string;
    text: string;
  } | null>(null);

  const effectiveCompanyId =
    typeof user?.company === "object" ? user.company?._id : user?.company;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Employer Jobs
      const jobsRes = await jobsApi.getAll({
        company: effectiveCompanyId,
        createdBy: user?._id,
        status: "all",
      });
      const fetchedJobs: Job[] = jobsRes?.data?.jobs || jobsRes?.data || [];
      setJobs(fetchedJobs);

      // 2. Fetch Employer Applications
      const appsRes = await applicationsApi.getEmployerApplications(user?._id);
      const fetchedApps: Application[] =
        appsRes?.data?.applications || appsRes?.data || [];
      setApplications(fetchedApps);
    } catch (err) {
      console.error("Error fetching employer dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId, user?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Post Job
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingJob(true);

    try {
      const parsedReqs = requirements
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const parsedBenefits = benefits
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean);

      await jobsApi.create({
        title: jobTitle.trim(),
        company: effectiveCompanyId,
        category,
        location: location.trim(),
        jobType,
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
        experience: Number(experience),
        requirements: parsedReqs,
        benefits: parsedBenefits,
        description: description.trim(),
      });

      toast.success("Job posted successfully!");
      // Reset form
      setJobTitle("");
      setDescription("");
      setRequirements("");
      setBenefits("");
      setActiveTab("jobs");
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to post job.";
      toast.error(msg);
    } finally {
      setPostingJob(false);
    }
  };

  // Toggle Job Status (active / closed)
  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "closed" : "active";
    try {
      await jobsApi.update(jobId, { status: nextStatus });
      toast.success(`Job marked as ${nextStatus}`);
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, status: nextStatus } : j)),
      );
    } catch (err: any) {
      toast.error("Failed to update job status.");
    }
  };

  // Update Application Status (ATS stage)
  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      if (newStatus === "Hired") {
        await applicationsApi.hiringDecision(applicationId, "hire");
      } else if (newStatus === "Rejected") {
        await applicationsApi.hiringDecision(applicationId, "reject");
      } else {
        await applicationsApi.updateStatus(applicationId, newStatus);
      }

      toast.success(`Applicant status updated to ${newStatus}`);
      setApplications((prev) =>
        prev.map((a) =>
          a._id === applicationId ? ({ ...a, status: newStatus } as Application) : a,
        ),
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update status.";
      toast.error(msg);
    }
  };

  // Schedule Interview
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalApp || !interviewDate) return;

    setScheduling(true);
    try {
      await applicationsApi.scheduleInterview(scheduleModalApp._id, interviewDate);
      toast.success("Interview scheduled successfully!");
      setScheduleModalApp(null);
      setInterviewDate("");
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to schedule interview.";
      toast.error(msg);
    } finally {
      setScheduling(false);
    }
  };

  // Filtered applications
  const filteredApplications =
    selectedJobFilter === "all"
      ? applications
      : applications.filter((app) => {
          const jId = typeof app.job === "object" ? app.job?._id : app.job;
          return jId === selectedJobFilter;
        });

  // Dynamic statistics
  const stats = {
    activeJobs: jobs.filter((j) => j.status === "active").length,
    totalApplicants: applications.length,
    interviewing: applications.filter((a) =>
      ["Technical", "HR", "Offer"].includes(a.status),
    ).length,
    hired: applications.filter((a) => a.status === "Hired").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white p-6 border-r border-slate-200">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 font-bold text-white text-lg">
              🏢
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-slate-900 truncate">
                {typeof user?.company === "object"
                  ? (user.company as any).name
                  : user?.name}
              </h3>
              <p className="text-xs text-indigo-600 font-semibold truncate">
                Employer Account
              </p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`w-full text-left p-3 rounded-xl font-semibold text-sm transition flex items-center justify-between ${
                activeTab === "jobs"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>💼 Manage Jobs</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {jobs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("applicants")}
              className={`w-full text-left p-3 rounded-xl font-semibold text-sm transition flex items-center justify-between ${
                activeTab === "applicants"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>👥 Applicants (ATS)</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {applications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("post-job")}
              className={`w-full text-left p-3 rounded-xl font-semibold text-sm transition ${
                activeTab === "post-job"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>➕ Post a New Job</span>
            </button>

            <Link
              to="/jobs"
              className="block p-3 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-50"
            >
              🔍 View Live Portal
            </Link>

            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-full text-left p-3 rounded-xl font-semibold text-sm text-red-600 hover:bg-red-50 mt-4"
            >
              🚪 Logout
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Employer Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your job postings, track applicant pipeline, and schedule candidate interviews.
              </p>
            </div>

            <button
              onClick={() => setActiveTab("post-job")}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition"
            >
              + Post a New Job
            </button>
          </div>

          {/* Dynamic Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Openings
              </p>
              <h2 className="text-3xl font-extrabold text-blue-600 mt-2">
                {stats.activeJobs}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Applicants
              </p>
              <h2 className="text-3xl font-extrabold text-indigo-600 mt-2">
                {stats.totalApplicants}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                In Interviews
              </p>
              <h2 className="text-3xl font-extrabold text-purple-600 mt-2">
                {stats.interviewing}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Hired Candidates
              </p>
              <h2 className="text-3xl font-extrabold text-emerald-600 mt-2">
                {stats.hired}
              </h2>
            </div>
          </div>

          {/* TAB 1: MANAGE JOBS */}
          {activeTab === "jobs" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Posted Jobs & Status
                </h2>
                <button
                  onClick={fetchData}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  🔄 Refresh Jobs
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="mt-3 text-sm">Loading your jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-3">💼</div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    No Jobs Posted Yet
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Post your first job opening to start attracting candidates!
                  </p>
                  <button
                    onClick={() => setActiveTab("post-job")}
                    className="mt-5 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
                  >
                    + Post a Job Opening
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 font-semibold">Job Title</th>
                        <th className="pb-3 font-semibold">Category</th>
                        <th className="pb-3 font-semibold">Location</th>
                        <th className="pb-3 font-semibold">Applicants</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jobs.map((job) => (
                        <tr key={job._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-4 font-semibold text-slate-900">
                            <Link
                              to={`/jobs/${job._id}`}
                              className="hover:text-blue-600 hover:underline"
                            >
                              {job.title}
                            </Link>
                            <span className="block text-xs font-normal text-slate-500">
                              {job.jobType}
                            </span>
                          </td>

                          <td className="py-4 text-slate-600">{job.category || "General"}</td>

                          <td className="py-4 text-slate-600">{job.location}</td>

                          <td className="py-4 font-bold text-blue-600">
                            <button
                              onClick={() => {
                                setSelectedJobFilter(job._id);
                                setActiveTab("applicants");
                              }}
                              className="hover:underline flex items-center gap-1"
                            >
                              👥 {job.applicants || 0} applicants
                            </button>
                          </td>

                          <td className="py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                job.status === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {job.status === "active" ? "Active" : "Closed"}
                            </span>
                          </td>

                          <td className="py-4 text-right space-x-2">
                            <button
                              onClick={() => handleToggleJobStatus(job._id, job.status)}
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                            >
                              {job.status === "active" ? "Close Job" : "Re-open"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPLICANTS ATS PIPELINE */}
          {activeTab === "applicants" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Applicant Tracking Pipeline (ATS)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review resumes, advance candidates through stages, and schedule interviews.
                  </p>
                </div>

                {/* Filter by Job selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Filter by Job:</span>
                  <select
                    value={selectedJobFilter}
                    onChange={(e) => setSelectedJobFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-white outline-none focus:border-blue-500"
                  >
                    <option value="all">All Jobs ({applications.length})</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredApplications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-3">📬</div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    No Applicants Found
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    No candidates have applied to the selected job opening yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 font-semibold">Candidate</th>
                        <th className="pb-3 font-semibold">Role Applied</th>
                        <th className="pb-3 font-semibold">Resume & Details</th>
                        <th className="pb-3 font-semibold">Stage / Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredApplications.map((app) => {
                        const cand = typeof app.candidate === "object" ? app.candidate as User : null;
                        const job = typeof app.job === "object" ? app.job as Job : null;

                        return (
                          <tr key={app._id} className="hover:bg-slate-50/60 transition">
                            <td className="py-4">
                              <p className="font-bold text-slate-900">
                                {cand?.name || "Candidate"}
                              </p>
                              <p className="text-xs text-slate-500">{cand?.email}</p>
                              {cand?.phone && (
                                <p className="text-[11px] text-slate-400">{cand.phone}</p>
                              )}
                              {cand?.headline && (
                                <p className="text-xs text-blue-600 mt-0.5">{cand.headline}</p>
                              )}
                            </td>

                            <td className="py-4">
                              <span className="font-semibold text-slate-800">
                                {job?.title || "Job Posting"}
                              </span>
                              <span className="block text-xs text-slate-400">
                                {app.createdAt
                                  ? new Date(app.createdAt).toLocaleDateString()
                                  : "Recent"}
                              </span>
                            </td>

                            <td className="py-4 space-y-1">
                              {app.resumeURL ? (
                                <a
                                  href={app.resumeURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                >
                                  📄 View Resume ↗
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400">No resume URL</span>
                              )}

                              {app.coverLetter && (
                                <button
                                  onClick={() =>
                                    setCoverLetterModal({
                                      candidateName: cand?.name || "Candidate",
                                      text: app.coverLetter || "",
                                    })
                                  }
                                  className="block text-xs font-semibold text-slate-600 hover:text-blue-600 hover:underline"
                                >
                                  ✉️ Read Cover Letter
                                </button>
                              )}

                              {app.interviewDate && (
                                <p className="text-xs text-purple-700 font-semibold">
                                  📅 {new Date(app.interviewDate).toLocaleString()}
                                </p>
                              )}
                            </td>

                            <td className="py-4">
                              <select
                                value={app.status}
                                onChange={(e) =>
                                  handleStatusChange(app._id, e.target.value)
                                }
                                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold outline-none focus:border-blue-500 bg-white"
                              >
                                <option value="Applied">1. Applied</option>
                                <option value="Screening">2. Screening</option>
                                <option value="Technical">3. Technical</option>
                                <option value="HR">4. HR Interview</option>
                                <option value="Offer">5. Offer</option>
                                <option value="Hired">✓ Hired</option>
                                <option value="Rejected">✗ Rejected</option>
                              </select>
                            </td>

                            <td className="py-4 text-right">
                              <button
                                onClick={() => setScheduleModalApp(app)}
                                className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
                              >
                                📅 Interview
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: POST A JOB */}
          {activeTab === "post-job" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm max-w-3xl">
              <h2 className="text-xl font-bold text-slate-900">
                Post a New Job Opening
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Publish a job post to the JobFinder portal to start receiving qualified applicants.
              </p>

              <form className="mt-6 space-y-5" onSubmit={handlePostJob}>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Job Title *
                  </label>
                  <input
                    required
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Full Stack React Engineer"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Business">Business</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Job Type *
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Location *
                    </label>
                    <input
                      required
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Remote, San Francisco, Bangalore"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Minimum Experience (Years)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Salary Min ($/year)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Salary Max ($/year)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Required Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="React, TypeScript, Node.js, MongoDB"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Perks & Benefits (comma separated)
                  </label>
                  <input
                    type="text"
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    placeholder="Health insurance, Remote stipend, 401k matching"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Job Description *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed responsibilities, expectations, and culture..."
                    className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={postingJob}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                  >
                    {postingJob ? "Publishing Job..." : "Publish Job Opening →"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("jobs")}
                    className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50 transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* SCHEDULE INTERVIEW MODAL */}
      {scheduleModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">
              Schedule Candidate Interview
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select date and time for candidate interview.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleScheduleSubmit}>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Interview Date & Time *
                </label>
                <input
                  required
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalApp(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {scheduling ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COVER LETTER MODAL */}
      {coverLetterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                Cover Letter — {coverLetterModal.candidateName}
              </h3>
              <button
                onClick={() => setCoverLetterModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {coverLetterModal.text}
            </p>
            <div className="mt-6 text-right">
              <button
                onClick={() => setCoverLetterModal(null)}
                className="rounded-xl bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployerDashboard;
