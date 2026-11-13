import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  jobsApi,
  applicationsApi,
  notificationsApi,
  getSafeExternalUrl,
  type Job,
  type Application,
  type User,
} from "../services/api";
import toast from "react-hot-toast";
import {
  Briefcase,
  Users,
  PlusCircle,
  Compass,
  LogOut,
  Building2,
  RefreshCw,
  Calendar,
  MessageSquare,
  ExternalLink,
  FileText,
  CheckCircle2,
  Filter,
  Send,
  X,
  MapPin,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";

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
  const [salaryMin, setSalaryMin] = useState<number>(80000);
  const [salaryMax, setSalaryMax] = useState<number>(120000);
  const [experience, setExperience] = useState<number>(2);
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");
  const [description, setDescription] = useState("");
  const [postingJob, setPostingJob] = useState(false);

  // Interview Schedule Modal State
  const [scheduleModalApp, setScheduleModalApp] = useState<Application | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewNote, setInterviewNote] = useState("");
  const [scheduling, setScheduling] = useState(false);

  // Direct Message Candidate Modal State
  const [messageModalApp, setMessageModalApp] = useState<Application | null>(null);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Cover Letter View Modal
  const [coverLetterModal, setCoverLetterModal] = useState<{
    candidateName: string;
    text: string;
  } | null>(null);

  const effectiveCompanyId =
    typeof user?.company === "object" ? user.company?._id : user?.company;

  const companyDisplayName =
    typeof user?.company === "object" && (user.company as any)?.name
      ? (user.company as any).name
      : user?.name || "Employer";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const jobsRes = await jobsApi.getAll({
        company: effectiveCompanyId,
        createdBy: user?._id,
        status: "all",
      });
      const fetchedJobs: Job[] = jobsRes?.data?.jobs || jobsRes?.data || [];
      setJobs(fetchedJobs);

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
    } catch {
      toast.error("Failed to update job status.");
    }
  };

  // Update Application Status (ATS stage)
  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      if (newStatus === "Hired") {
        await applicationsApi.hiringDecision(applicationId, "Hired");
      } else if (newStatus === "Rejected") {
        await applicationsApi.hiringDecision(applicationId, "Rejected");
      } else {
        await applicationsApi.updateStatus(applicationId, newStatus);
      }

      toast.success(`Candidate moved to ${newStatus}`);
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
      await applicationsApi.scheduleInterview(
        scheduleModalApp._id,
        interviewDate,
        interviewNote.trim() || undefined,
      );

      // Also persist the note on feedback if provided so unified notifications pick it up immediately
      if (interviewNote.trim()) {
        try {
          const cand =
            typeof scheduleModalApp.candidate === "object"
              ? (scheduleModalApp.candidate as User)
              : null;
          const job =
            typeof scheduleModalApp.job === "object"
              ? (scheduleModalApp.job as Job)
              : null;
          await notificationsApi.sendMessage({
            applicationId: scheduleModalApp._id,
            recipientId: cand?._id,
            jobId: job?._id,
            title: `Interview Invitation: ${job?.title || "Role"}`,
            message: `Scheduled for ${new Date(interviewDate).toLocaleString()}. Details: ${interviewNote.trim()}`,
          });
        } catch {
          // Fallback to status update feedback if /notifications/send is not yet deployed
          await applicationsApi
            .updateStatus(
              scheduleModalApp._id,
              scheduleModalApp.status,
              interviewNote.trim(),
            )
            .catch(() => {});
        }
      }

      toast.success("Interview scheduled & candidate notified!");
      setScheduleModalApp(null);
      setInterviewDate("");
      setInterviewNote("");
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to schedule interview.";
      toast.error(msg);
    } finally {
      setScheduling(false);
    }
  };

  // Send Direct Message to Candidate
  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageModalApp || !messageBody.trim()) return;

    setSendingMessage(true);
    const trimmedMessage = messageBody.trim();
    const cand =
      typeof messageModalApp.candidate === "object"
        ? (messageModalApp.candidate as User)
        : null;
    const job =
      typeof messageModalApp.job === "object"
        ? (messageModalApp.job as Job)
        : null;

    try {
      try {
        await notificationsApi.sendMessage({
          applicationId: messageModalApp._id,
          recipientId: cand?._id,
          jobId: job?._id,
          title:
            messageTitle.trim() ||
            `Message from ${companyDisplayName}${job?.title ? ` — ${job.title}` : ""}`,
          message: trimmedMessage,
        });
      } catch {
        // Fallback: save message on application feedback via updateStatus so candidate still receives it
        await applicationsApi.updateStatus(
          messageModalApp._id,
          messageModalApp.status,
          trimmedMessage,
        );
      }

      setApplications((prev) =>
        prev.map((a) =>
          a._id === messageModalApp._id ? { ...a, feedback: trimmedMessage } : a,
        ),
      );
      toast.success(`Message delivered to ${cand?.name || "candidate"}!`);
      setMessageModalApp(null);
      setMessageTitle("");
      setMessageBody("");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send message.";
      toast.error(msg);
    } finally {
      setSendingMessage(false);
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl flex-1 flex flex-col lg:flex-row gap-6 px-4 py-8 sm:px-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 font-bold text-white shadow-sm shadow-indigo-500/20">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-slate-900 truncate">
                  {companyDisplayName}
                </h3>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Employer ATS
                </span>
              </div>
            </div>

            <nav className="mt-5 space-y-1.5">
              <button
                onClick={() => setActiveTab("jobs")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-between ${
                  activeTab === "jobs"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Briefcase className="h-4 w-4" />
                  Manage Jobs
                </span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  {jobs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("applicants")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-between ${
                  activeTab === "applicants"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="h-4 w-4" />
                  Applicants (ATS)
                </span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  {applications.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("post-job")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2.5 ${
                  activeTab === "post-job"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                Post a New Job
              </button>

              <Link
                to="/jobs"
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Compass className="h-4 w-4" />
                View Live Portal
              </Link>

              <div className="pt-3 mt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl font-semibold text-sm text-rose-600 hover:bg-rose-50 transition flex items-center gap-2.5"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Hiring & ATS Command Center
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage open roles, advance candidates through stages, schedule interviews, and message applicants directly.
              </p>
            </div>

            <button
              onClick={() => setActiveTab("post-job")}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 transition"
            >
              <PlusCircle className="h-4 w-4" />
              Post New Job
            </button>
          </div>

          {/* Dynamic Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Openings</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Briefcase className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.activeJobs}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Applicants</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-blue-600 mt-2">{stats.totalApplicants}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">In Interviews</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Calendar className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-purple-600 mt-2">{stats.interviewing}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Hired Candidates</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 mt-2">{stats.hired}</p>
            </div>
          </div>

          {/* TAB 1: MANAGE JOBS */}
          {activeTab === "jobs" && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Posted Jobs & Pipeline Volume
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click an applicant count to jump directly to that role's ATS pipeline
                  </p>
                </div>
                <button
                  onClick={fetchData}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="py-16 text-center text-slate-500">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  <p className="mt-3 text-sm font-medium">Loading your job openings...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    No Job Openings Published Yet
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Post your first job opening to start attracting qualified candidates.
                  </p>
                  <button
                    onClick={() => setActiveTab("post-job")}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Post a Job Opening
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                        <th className="pb-3 font-semibold">Role</th>
                        <th className="pb-3 font-semibold">Category</th>
                        <th className="pb-3 font-semibold">Location</th>
                        <th className="pb-3 font-semibold">Applicants</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jobs.map((job) => (
                        <tr key={job._id} className="hover:bg-slate-50/70 transition">
                          <td className="py-4 font-bold text-slate-900">
                            <Link
                              to={`/jobs/${job._id}`}
                              className="hover:text-indigo-600 transition"
                            >
                              {job.title}
                            </Link>
                            <span className="block text-xs font-normal text-slate-500 mt-0.5">
                              {job.jobType}
                            </span>
                          </td>

                          <td className="py-4 text-xs font-medium text-slate-600">
                            {job.category || "General"}
                          </td>

                          <td className="py-4 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {job.location}
                            </span>
                          </td>

                          <td className="py-4">
                            <button
                              onClick={() => {
                                setSelectedJobFilter(job._id);
                                setActiveTab("applicants");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                            >
                              <Users className="h-3.5 w-3.5" />
                              {job.applicants || 0} applicants
                            </button>
                          </td>

                          <td className="py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                job.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {job.status === "active" ? "Active" : "Closed"}
                            </span>
                          </td>

                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleToggleJobStatus(job._id, job.status)}
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition"
                            >
                              {job.status === "active" ? "Close Role" : "Re-open"}
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
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Applicant Tracking Pipeline (ATS)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluate candidates, move stages, schedule interviews, and send direct messages to their inbox.
                  </p>
                </div>

                {/* Filter by Job selector */}
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">Role:</span>
                  <select
                    value={selectedJobFilter}
                    onChange={(e) => setSelectedJobFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Roles ({applications.length})</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredApplications.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 mb-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    No Applicants Found
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    No candidates have applied to the selected job opening yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                        <th className="pb-3 font-semibold">Candidate & Skills</th>
                        <th className="pb-3 font-semibold">Role Applied</th>
                        <th className="pb-3 font-semibold">Credentials & Notes</th>
                        <th className="pb-3 font-semibold">ATS Stage</th>
                        <th className="pb-3 font-semibold text-right">Engage Candidate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredApplications.map((app) => {
                        const cand =
                          typeof app.candidate === "object"
                            ? (app.candidate as User)
                            : null;
                        const job =
                          typeof app.job === "object" ? (app.job as Job) : null;

                        return (
                          <tr key={app._id} className="hover:bg-slate-50/70 transition align-top">
                            <td className="py-4 pr-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700 text-xs">
                                  {cand?.name?.[0]?.toUpperCase() || "C"}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 flex items-center gap-2">
                                    {cand?.name || "Candidate"}
                                    {cand?.experience !== undefined && (
                                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                        {cand.experience} yr{cand.experience === 1 ? "" : "s"}
                                      </span>
                                    )}
                                  </p>
                                  {cand?.email && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                      <Mail className="h-3 w-3 text-slate-400" />
                                      {cand.email}
                                    </p>
                                  )}
                                  {cand?.phone && (
                                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <Phone className="h-3 w-3 text-slate-400" />
                                      {cand.phone}
                                    </p>
                                  )}
                                  {cand?.skills && cand.skills.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1 max-w-xs">
                                      {cand.skills.slice(0, 5).map((skill, idx) => (
                                        <span
                                          key={idx}
                                          className="rounded-md bg-indigo-50/80 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                      {cand.skills.length > 5 && (
                                        <span className="text-[10px] text-slate-400">
                                          +{cand.skills.length - 5}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-4 pr-4">
                              <span className="font-bold text-slate-800 text-xs block">
                                {job?.title || "Job Posting"}
                              </span>
                              <span className="block text-[11px] text-slate-400 mt-0.5">
                                Applied{" "}
                                {app.createdAt
                                  ? new Date(app.createdAt).toLocaleDateString()
                                  : "Recently"}
                              </span>
                            </td>

                            <td className="py-4 pr-4 space-y-1.5">
                              {getSafeExternalUrl(app.resumeURL) ? (
                                <a
                                  href={getSafeExternalUrl(app.resumeURL)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  Resume
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400 block">No resume link</span>
                              )}

                              {app.coverLetter && (
                                <button
                                  onClick={() =>
                                    setCoverLetterModal({
                                      candidateName: cand?.name || "Candidate",
                                      text: app.coverLetter || "",
                                    })
                                  }
                                  className="block text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:underline"
                                >
                                  Read Cover Letter
                                </button>
                              )}

                              {app.interviewDate && (
                                <p className="inline-flex items-center gap-1 text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(app.interviewDate).toLocaleString(undefined, {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                                </p>
                              )}

                              {app.feedback && (
                                <p
                                  className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1 max-w-[220px] truncate"
                                  title={app.feedback}
                                >
                                  Sent: "{app.feedback}"
                                </p>
                              )}
                            </td>

                            <td className="py-4 pr-4">
                              <select
                                value={app.status}
                                onChange={(e) =>
                                  handleStatusChange(app._id, e.target.value)
                                }
                                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 bg-white shadow-2xs"
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
                              <div className="inline-flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setMessageModalApp(app);
                                    setMessageTitle(
                                      `Update regarding ${job?.title || "your application"}`,
                                    );
                                    setMessageBody(app.feedback || "");
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                                  title="Send direct message to candidate"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  Message
                                </button>

                                <button
                                  onClick={() => {
                                    setScheduleModalApp(app);
                                    setInterviewNote(app.feedback || "");
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
                                  title="Schedule interview with candidate"
                                >
                                  <Calendar className="h-3.5 w-3.5" />
                                  Interview
                                </button>
                              </div>
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
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm max-w-3xl">
              <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Publish a New Job Opening
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your listing goes live immediately with full ATS pipeline tracking.
                  </p>
                </div>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handlePostJob}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Job Title *
                  </label>
                  <input
                    required
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Full Stack React Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Employment Type *
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Location *
                    </label>
                    <input
                      required
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Remote, San Francisco, Bengaluru"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Minimum Experience (Years)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Salary Min ($/year)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Salary Max ($/year)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Required Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="React, TypeScript, Node.js, MongoDB"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Perks & Benefits (comma separated)
                  </label>
                  <input
                    type="text"
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    placeholder="Health insurance, Remote stipend, Equity options"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Role Description *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed responsibilities, architectural challenges, and team culture..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={postingJob}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 transition disabled:opacity-50 text-xs"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {postingJob ? "Publishing Role..." : "Publish Job Opening"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("jobs")}
                    className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50 transition text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* DIRECT MESSAGE CANDIDATE MODAL */}
      {messageModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Message Candidate
                  </h3>
                  <p className="text-xs text-slate-500">
                    Delivered directly to{" "}
                    {typeof messageModalApp.candidate === "object"
                      ? (messageModalApp.candidate as User)?.name
                      : "the candidate"}
                    's Notifications & Messages inbox.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMessageModalApp(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSendMessageSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="Update regarding your application"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Message / Next Steps *
                </label>
                <textarea
                  required
                  rows={4}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Write your message, assessment link, or feedback for the candidate..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setMessageModalApp(null)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm shadow-indigo-500/20"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sendingMessage ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {scheduleModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Schedule Candidate Interview
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select date/time and include meeting instructions for the candidate.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScheduleModalApp(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleScheduleSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Interview Date & Time *
                </label>
                <input
                  required
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Meeting Link / Instructions for Candidate
                </label>
                <textarea
                  rows={3}
                  value={interviewNote}
                  onChange={(e) => setInterviewNote(e.target.value)}
                  placeholder="e.g. Google Meet link, agenda, or interviewer names..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setScheduleModalApp(null);
                    setInterviewNote("");
                  }}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition disabled:opacity-50 shadow-sm"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {scheduling ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COVER LETTER MODAL */}
      {coverLetterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                Cover Letter — {coverLetterModal.candidateName}
              </h3>
              <button
                onClick={() => setCoverLetterModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {coverLetterModal.text}
            </p>
            <div className="mt-6 text-right">
              <button
                onClick={() => setCoverLetterModal(null)}
                className="rounded-xl bg-slate-100 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
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
