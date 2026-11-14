import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  jobsApi,
  applicationsApi,
  notificationsApi,
  getSafeExternalUrl,
  formatJobAge,
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
  Search,
  ArrowRight,
  ChevronRight,
  XCircle,
  LayoutGrid,
  Columns3,
  Award,
  Clock,
} from "lucide-react";

const ATS_PIPELINE_STAGES = [
  {
    id: "Applied",
    label: "Applied",
    step: 1,
    next: "Screening",
    dot: "bg-sky-500",
    badge:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
    headerBg: "from-sky-500/10 to-transparent",
  },
  {
    id: "Screening",
    label: "Screening",
    step: 2,
    next: "Technical",
    dot: "bg-amber-500",
    badge:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    headerBg: "from-amber-500/10 to-transparent",
  },
  {
    id: "Technical",
    label: "Technical",
    step: 3,
    next: "HR",
    dot: "bg-violet-500",
    badge:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30",
    headerBg: "from-violet-500/10 to-transparent",
  },
  {
    id: "HR",
    label: "HR Round",
    step: 4,
    next: "Offer",
    dot: "bg-purple-500",
    badge:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30",
    headerBg: "from-purple-500/10 to-transparent",
  },
  {
    id: "Offer",
    label: "Offer",
    step: 5,
    next: "Hired",
    dot: "bg-indigo-500",
    badge:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
    headerBg: "from-indigo-500/10 to-transparent",
  },
  {
    id: "Hired",
    label: "Hired",
    step: 6,
    next: null,
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    headerBg: "from-emerald-500/10 to-transparent",
  },
  {
    id: "Rejected",
    label: "Rejected",
    step: 7,
    next: null,
    dot: "bg-rose-500",
    badge:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    headerBg: "from-rose-500/10 to-transparent",
  },
] as const;

function EmployerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    "jobs" | "applicants" | "post-job"
  >("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter applicants by job, stage, search, and view mode
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all");
  const [applicantSearch, setApplicantSearch] = useState<string>("");
  const [atsViewMode, setAtsViewMode] = useState<"board" | "split">("board");
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(
    null,
  );
  const [drawerApplicantId, setDrawerApplicantId] = useState<string | null>(
    null,
  );
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

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
  const [scheduleModalApp, setScheduleModalApp] = useState<Application | null>(
    null,
  );
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewNote, setInterviewNote] = useState("");
  const [scheduling, setScheduling] = useState(false);

  // Direct Message Candidate Modal State
  const [messageModalApp, setMessageModalApp] = useState<Application | null>(
    null,
  );
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
  const handleToggleJobStatus = async (
    jobId: string,
    currentStatus: string,
  ) => {
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
  const handleStatusChange = async (
    applicationId: string,
    newStatus: string,
  ) => {
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
          a._id === applicationId
            ? ({ ...a, status: newStatus } as Application)
            : a,
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
      const msg =
        err.response?.data?.message || "Failed to schedule interview.";
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
          a._id === messageModalApp._id
            ? { ...a, feedback: trimmedMessage }
            : a,
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

  // Filtered applications (by Job + Search)
  const jobAndSearchFilteredApps = applications.filter((app) => {
    if (selectedJobFilter !== "all") {
      const jId = typeof app.job === "object" ? app.job?._id : app.job;
      if (jId !== selectedJobFilter) return false;
    }

    if (applicantSearch.trim()) {
      const q = applicantSearch.toLowerCase();
      const cand =
        typeof app.candidate === "object" ? (app.candidate as User) : null;
      const job = typeof app.job === "object" ? (app.job as Job) : null;
      const inName = (cand?.name || "").toLowerCase().includes(q);
      const inEmail = (cand?.email || "").toLowerCase().includes(q);
      const inRole = (job?.title || "").toLowerCase().includes(q);
      const inSkills = (cand?.skills || []).some((s) =>
        s.toLowerCase().includes(q),
      );
      return inName || inEmail || inRole || inSkills;
    }

    return true;
  });

  // Filtered applications including stage filter
  const filteredApplications =
    selectedStageFilter === "all"
      ? jobAndSearchFilteredApps
      : jobAndSearchFilteredApps.filter(
          (app) => app.status === selectedStageFilter,
        );

  // Active candidate for Split View or Slide-over Drawer
  const activeSplitApplicant =
    filteredApplications.find((a) => a._id === selectedApplicantId) ||
    filteredApplications[0] ||
    null;

  const activeDrawerApplicant =
    applications.find((a) => a._id === drawerApplicantId) || null;

  const getStageMeta = (status: string) =>
    ATS_PIPELINE_STAGES.find((s) => s.id === status) || ATS_PIPELINE_STAGES[0];

  // Reusable Candidate Dossier & Interactive Stage Controller (used in Split View & Slide-over Drawer)
  const renderCandidateDossier = (
    app: Application,
    onCloseDrawer?: () => void,
  ) => {
    const cand =
      typeof app.candidate === "object" ? (app.candidate as User) : null;
    const job = typeof app.job === "object" ? (app.job as Job) : null;
    const stageMeta = getStageMeta(app.status);
    const activeSteps = ATS_PIPELINE_STAGES.filter((s) => s.id !== "Rejected");
    const currentStepIdx = activeSteps.findIndex((s) => s.id === app.status);
    const isRejected = app.status === "Rejected";

    const jobReqSet = new Set(
      (job?.requirements || []).map((r) => r.toLowerCase().trim()),
    );
    const candSkills = cand?.skills || [];
    const matchedSkillsCount = candSkills.filter((s) =>
      jobReqSet.has(s.toLowerCase().trim()),
    ).length;

    return (
      <div className="flex flex-col h-full">
        {/* Top Candidate Identity Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 font-extrabold text-white text-lg shadow-md shadow-indigo-500/20">
              {cand?.name?.[0]?.toUpperCase() || "C"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {cand?.name || "Candidate"}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${stageMeta.badge}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${stageMeta.dot}`}
                  />
                  {stageMeta.label}
                </span>
              </div>

              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                Applied for: {job?.title || "Job Role"}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                {cand?.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {cand.email}
                  </span>
                )}
                {cand?.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {cand.phone}
                  </span>
                )}
                {cand?.experience !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <Clock className="h-3 w-3 text-indigo-500" />
                    {cand.experience} yr{cand.experience === 1 ? "" : "s"} exp
                  </span>
                )}
              </div>
            </div>
          </div>

          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Interactive Visual Pipeline Stepper (Replaces Dropdown!) */}
        <div className="mt-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Interactive ATS Stage Progression
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Click any stage node below to move this candidate immediately
              </p>
            </div>

            <div className="flex items-center gap-2">
              {stageMeta.next && (
                <button
                  type="button"
                  onClick={() => handleStatusChange(app._id, stageMeta.next!)}
                  className="btn-premium inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white"
                >
                  <span>Advance to {stageMeta.next}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              {!isRejected ? (
                <button
                  type="button"
                  onClick={() => handleStatusChange(app._id, "Rejected")}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStatusChange(app._id, "Screening")}
                  className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                >
                  Re-open to Screening
                </button>
              )}
            </div>
          </div>

          {/* 6-Node Clickable Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-3">
            {activeSteps.map((stepObj, idx) => {
              const isCompleted = !isRejected && idx <= currentStepIdx;
              const isCurrent = !isRejected && idx === currentStepIdx;

              return (
                <button
                  key={stepObj.id}
                  type="button"
                  onClick={() => handleStatusChange(app._id, stepObj.id)}
                  className={`group flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                    isCurrent
                      ? "border-indigo-500 bg-indigo-50/90 dark:bg-indigo-500/20 shadow-xs ring-2 ring-indigo-500/15"
                      : isCompleted
                        ? "border-indigo-200/80 dark:border-indigo-500/30 bg-white dark:bg-slate-800/80 hover:border-indigo-400"
                        : "border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold ${
                        isCurrent
                          ? "bg-indigo-600 text-white"
                          : isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {isCompleted && !isCurrent ? "✓" : stepObj.step}
                    </span>
                    <ChevronRight
                      className={`h-3 w-3 transition group-hover:translate-x-0.5 ${
                        isCurrent ? "text-indigo-600" : "text-slate-300"
                      }`}
                    />
                  </div>
                  <span
                    className={`mt-1.5 text-xs font-bold truncate w-full ${
                      isCurrent
                        ? "text-indigo-700 dark:text-indigo-200"
                        : isCompleted
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {stepObj.label}
                  </span>
                </button>
              );
            })}
          </div>

          {isRejected && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/15 px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-200">
              <span className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4" />
                Candidate is currently marked as Rejected
              </span>
              <span>Click any stage above to restore</span>
            </div>
          )}
        </div>

        {/* Quick Engagement Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setMessageModalApp(app);
              setMessageTitle(
                `Update regarding ${job?.title || "your application"}`,
              );
              setMessageBody(app.feedback || "");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
          >
            <MessageSquare className="h-4 w-4" />
            Message Candidate
          </button>

          <button
            type="button"
            onClick={() => {
              setScheduleModalApp(app);
              setInterviewNote(app.feedback || "");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
          >
            <Calendar className="h-4 w-4" />
            {app.interviewDate ? "Reschedule Interview" : "Schedule Interview"}
          </button>

          {getSafeExternalUrl(app.resumeURL) ? (
            <a
              href={getSafeExternalUrl(app.resumeURL)!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition"
            >
              <FileText className="h-4 w-4 text-indigo-600" />
              Open Resume PDF
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-400">
              No Resume Attached
            </span>
          )}
        </div>

        {/* Interview & Last Message Callouts */}
        {(app.interviewDate || app.feedback) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {app.interviewDate && (
              <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-3.5 text-xs">
                <p className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  Scheduled Interview
                </p>
                <p className="mt-1 font-semibold text-purple-800">
                  {new Date(app.interviewDate).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            )}

            {app.feedback && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs">
                <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  Latest Hiring Team Note
                </p>
                <p className="mt-1 text-indigo-800 line-clamp-2 whitespace-pre-line">
                  "{app.feedback}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Skills & Role Match Breakdown */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-600" />
              Candidate Skills ({candSkills.length})
            </span>
            {job?.requirements && job.requirements.length > 0 && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                {matchedSkillsCount} / {job.requirements.length} Role Skills
                Matched
              </span>
            )}
          </div>

          {candSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {candSkills.map((skill, idx) => {
                const isMatch = jobReqSet.has(skill.toLowerCase().trim());
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-xs font-bold ${
                      isMatch
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {isMatch && (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    )}
                    {skill}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              No skills listed on profile.
            </p>
          )}
        </div>

        {/* Cover Letter Section */}
        {app.coverLetter && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              Candidate Cover Letter / Note
            </p>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs leading-relaxed text-slate-700 whitespace-pre-line max-h-48 overflow-y-auto">
              {app.coverLetter}
            </div>
          </div>
        )}
      </div>
    );
  };

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
          <div className="glass-panel rounded-3xl p-6 sticky top-24">
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
                Manage open roles, advance candidates through stages, schedule
                interviews, and message applicants directly.
              </p>
            </div>

            <button
              onClick={() => setActiveTab("post-job")}
              className="btn-premium inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
            >
              <PlusCircle className="h-4 w-4" />
              Post New Job
            </button>
          </div>

          {/* Dynamic Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Active Openings
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Briefcase className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">
                {stats.activeJobs}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Total Applicants
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-blue-600 mt-2">
                {stats.totalApplicants}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  In Interviews
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Calendar className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-purple-600 mt-2">
                {stats.interviewing}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Hired Candidates
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 mt-2">
                {stats.hired}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* TAB 1: MANAGE JOBS */}
            {activeTab === "jobs" && (
              <motion.div
                key="jobs"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="glass-panel rounded-3xl p-6 sm:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Posted Jobs & Pipeline Volume
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click an applicant count to jump directly to that role's
                      ATS pipeline
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
                    <p className="mt-3 text-sm font-medium">
                      Loading your job openings...
                    </p>
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
                      Post your first job opening to start attracting qualified
                      candidates.
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
                          <th className="pb-3 font-semibold text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {jobs.map((job) => (
                          <tr
                            key={job._id}
                            className="hover:bg-slate-50/70 transition"
                          >
                            <td className="py-4 font-bold text-slate-900">
                              <Link
                                to={`/jobs/${job._id}`}
                                className="hover:text-indigo-600 transition"
                              >
                                {job.title}
                              </Link>
                              <span className="block text-xs font-normal text-slate-500 mt-0.5">
                                {job.jobType} • {formatJobAge(job.createdAt, job._id, true)}
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
                                onClick={() =>
                                  handleToggleJobStatus(job._id, job.status)
                                }
                                className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition"
                              >
                                {job.status === "active"
                                  ? "Close Role"
                                  : "Re-open"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: APPLICANTS ATS PIPELINE */}
            {activeTab === "applicants" && (
              <motion.div
                key="applicants"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="glass-panel rounded-3xl p-6 sm:p-8"
              >
                {/* Top Command Bar */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                        Visual ATS Pipeline & Stage Board
                      </h2>
                      <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                        {filteredApplications.length} Candidates
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Drag cards between stages, advance candidates with one
                      click, or switch to Split Focus Mode for high-volume
                      review.
                    </p>
                  </div>

                  {/* View Mode Toggle + Search + Role Filter */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search Input */}
                    <div className="relative min-w-[210px] flex-1 sm:flex-initial">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={applicantSearch}
                        onChange={(e) => setApplicantSearch(e.target.value)}
                        placeholder="Search name, skill, role..."
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Role Filter */}
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                      <select
                        value={selectedJobFilter}
                        onChange={(e) => setSelectedJobFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-500"
                      >
                        <option value="all">
                          All Roles ({applications.length})
                        </option>
                        {jobs.map((j) => (
                          <option key={j._id} value={j._id}>
                            {j.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* View Mode Switcher: Kanban Board vs Split Focus */}
                    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                      <button
                        type="button"
                        onClick={() => setAtsViewMode("board")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          atsViewMode === "board"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Columns3 className="h-3.5 w-3.5" />
                        Kanban Board
                      </button>
                      <button
                        type="button"
                        onClick={() => setAtsViewMode("split")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          atsViewMode === "split"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Split Focus
                      </button>
                    </div>
                  </div>
                </div>

                {/* Interactive 7-Stage Pipeline Funnel Ribbon */}
                <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStageFilter("all")}
                    className={`shrink-0 flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition ${
                      selectedStageFilter === "all"
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                    }`}
                  >
                    <span>All Stages</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        selectedStageFilter === "all"
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {jobAndSearchFilteredApps.length}
                    </span>
                  </button>

                  {ATS_PIPELINE_STAGES.map((stage) => {
                    const count = jobAndSearchFilteredApps.filter(
                      (a) => a.status === stage.id,
                    ).length;
                    const isActive = selectedStageFilter === stage.id;

                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() =>
                          setSelectedStageFilter(isActive ? "all" : stage.id)
                        }
                        className={`shrink-0 flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition ${
                          isActive
                            ? "border-indigo-500 bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                            : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isActive ? "bg-white" : stage.dot
                          }`}
                        />
                        <span>{stage.label}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {filteredApplications.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 mb-3">
                      <Users className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">
                      No Candidates Match This Filter
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Try clearing your stage filter or search query to see all
                      applicants.
                    </p>
                    {(selectedStageFilter !== "all" || applicantSearch) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStageFilter("all");
                          setApplicantSearch("");
                        }}
                        className="btn-premium mt-4 rounded-xl px-4 py-2 text-xs font-bold text-white"
                      >
                        Reset Pipeline Filters
                      </button>
                    )}
                  </div>
                ) : atsViewMode === "board" ? (
                  /* VIEW MODE 1: INTERACTIVE DRAG-AND-DROP KANBAN PIPELINE BOARD */
                  <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
                    {(selectedStageFilter === "all"
                      ? ATS_PIPELINE_STAGES
                      : ATS_PIPELINE_STAGES.filter(
                          (s) => s.id === selectedStageFilter,
                        )
                    ).map((stage) => {
                      const columnApps = filteredApplications.filter(
                        (a) => a.status === stage.id,
                      );
                      const isDragTarget = dragOverStage === stage.id;

                      return (
                        <div
                          key={stage.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverStage !== stage.id) {
                              setDragOverStage(stage.id);
                            }
                          }}
                          onDragLeave={() => setDragOverStage(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverStage(null);
                            if (draggedAppId) {
                              const draggedApp = applications.find(
                                (a) => a._id === draggedAppId,
                              );
                              if (
                                draggedApp &&
                                draggedApp.status !== stage.id
                              ) {
                                handleStatusChange(draggedAppId, stage.id);
                              }
                              setDraggedAppId(null);
                            }
                          }}
                          className={`flex w-76 shrink-0 flex-col rounded-2xl border transition-all ${
                            isDragTarget
                              ? "border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/20"
                              : "border-slate-200/80 bg-slate-50/60"
                          }`}
                        >
                          {/* Column Header */}
                          <div
                            className={`flex items-center justify-between rounded-t-2xl border-b border-slate-200/70 bg-gradient-to-r ${stage.headerBg} px-4 py-3`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${stage.dot}`}
                              />
                              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                                {stage.label}
                              </h3>
                            </div>
                            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-extrabold text-slate-700 border border-slate-200/80 shadow-2xs">
                              {columnApps.length}
                            </span>
                          </div>

                          {/* Column Cards Stack */}
                          <div className="flex-1 space-y-3 p-3 max-h-[560px] overflow-y-auto">
                            {columnApps.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-[11px] font-medium text-slate-400">
                                Drop candidate card here to move to{" "}
                                {stage.label}
                              </div>
                            ) : (
                              columnApps.map((app) => {
                                const cand =
                                  typeof app.candidate === "object"
                                    ? (app.candidate as User)
                                    : null;
                                const job =
                                  typeof app.job === "object"
                                    ? (app.job as Job)
                                    : null;

                                return (
                                  <div
                                    key={app._id}
                                    draggable
                                    onDragStart={() => setDraggedAppId(app._id)}
                                    onDragEnd={() => {
                                      setDraggedAppId(null);
                                      setDragOverStage(null);
                                    }}
                                    onClick={() =>
                                      setDrawerApplicantId(app._id)
                                    }
                                    className="glass-card cursor-pointer rounded-2xl p-4 text-left"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 font-bold text-white text-xs shadow-xs">
                                          {cand?.name?.[0]?.toUpperCase() ||
                                            "C"}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-slate-900 text-xs truncate">
                                            {cand?.name || "Candidate"}
                                          </p>
                                          <p className="text-[11px] text-indigo-600 font-semibold truncate">
                                            {job?.title || "Job Role"}
                                          </p>
                                        </div>
                                      </div>

                                      {cand?.experience !== undefined && (
                                        <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                          {cand.experience}y
                                        </span>
                                      )}
                                    </div>

                                    {/* Compact Skill Pills */}
                                    {cand?.skills && cand.skills.length > 0 && (
                                      <div className="mt-3 flex flex-wrap gap-1">
                                        {cand.skills
                                          .slice(0, 3)
                                          .map((skill, i) => (
                                            <span
                                              key={i}
                                              className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700"
                                            >
                                              {skill}
                                            </span>
                                          ))}
                                        {cand.skills.length > 3 && (
                                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                            +{cand.skills.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Scheduled Interview Pill */}
                                    {app.interviewDate && (
                                      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-purple-50 border border-purple-200 px-2.5 py-1 text-[10px] font-bold text-purple-700">
                                        <Calendar className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                          {new Date(
                                            app.interviewDate,
                                          ).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </span>
                                      </div>
                                    )}

                                    {/* One-Click Stage Advance Footer (No Dropdown Needed!) */}
                                    <div
                                      className="mt-3.5 flex items-center justify-between gap-1.5 pt-2.5 border-t border-slate-100"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {stage.next ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleStatusChange(
                                              app._id,
                                              stage.next!,
                                            )
                                          }
                                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 transition shadow-2xs"
                                        >
                                          <span>Advance → {stage.next}</span>
                                        </button>
                                      ) : (
                                        <span
                                          className={`text-[11px] font-bold ${
                                            stage.id === "Hired"
                                              ? "text-emerald-600"
                                              : "text-rose-600"
                                          }`}
                                        >
                                          {stage.id === "Hired"
                                            ? "✓ Offer Accepted / Hired"
                                            : "✗ Application Closed"}
                                        </span>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMessageModalApp(app);
                                          setMessageTitle(
                                            `Update regarding ${job?.title || "your application"}`,
                                          );
                                          setMessageBody(app.feedback || "");
                                        }}
                                        title="Message Candidate"
                                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition"
                                      >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setScheduleModalApp(app);
                                          setInterviewNote(app.feedback || "");
                                        }}
                                        title="Schedule Interview"
                                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 transition"
                                      >
                                        <Calendar className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* VIEW MODE 2: HIGH-VOLUME SPLIT FOCUS WORKSPACE */
                  <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    {/* Left Candidate Queue */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 max-h-[620px] overflow-y-auto space-y-2">
                      <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <span>
                          Candidate Queue ({filteredApplications.length})
                        </span>
                        <span>Click to Inspect</span>
                      </div>

                      {filteredApplications.map((app) => {
                        const cand =
                          typeof app.candidate === "object"
                            ? (app.candidate as User)
                            : null;
                        const job =
                          typeof app.job === "object" ? (app.job as Job) : null;
                        const isSelected =
                          activeSplitApplicant?._id === app._id;
                        const stageMeta = getStageMeta(app.status);

                        return (
                          <button
                            key={app._id}
                            type="button"
                            onClick={() => setSelectedApplicantId(app._id)}
                            className={`w-full rounded-2xl border p-3.5 text-left transition ${
                              isSelected
                                ? "border-indigo-500 bg-white shadow-sm ring-2 ring-indigo-500/15"
                                : "border-slate-200/80 bg-white/70 hover:border-indigo-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700 text-xs">
                                  {cand?.name?.[0]?.toUpperCase() || "C"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 text-xs truncate">
                                    {cand?.name || "Candidate"}
                                  </p>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {job?.title || "Job Role"}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${stageMeta.badge}`}
                              >
                                {stageMeta.label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Candidate Interactive Dossier & Visual Stage Stepper */}
                    <div className="glass-panel rounded-2xl p-5 sm:p-6">
                      {activeSplitApplicant ? (
                        renderCandidateDossier(activeSplitApplicant)
                      ) : (
                        <div className="py-20 text-center text-sm text-slate-400">
                          Select a candidate from the queue to inspect their
                          credentials and advance stages.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: POST A JOB */}
            {activeTab === "post-job" && (
              <motion.div
                key="post-job"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="glass-panel rounded-3xl p-6 sm:p-8 max-w-3xl"
              >
                <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Publish a New Job Opening
                    </h2>
                    <p className="text-xs text-slate-500">
                      Your listing goes live immediately with full ATS pipeline
                      tracking.
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
                      className="btn-premium inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white disabled:opacity-50 text-xs"
                    >
                      <PlusCircle className="h-4 w-4" />
                      {postingJob
                        ? "Publishing Role..."
                        : "Publish Job Opening"}
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
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* SLIDE-OVER CANDIDATE DOSSIER DRAWER (from Kanban Board click) */}
      <AnimatePresence>
        {activeDrawerApplicant && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setDrawerApplicantId(null)}
          >
            <motion.div
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel h-full w-full max-w-2xl overflow-y-auto p-6 sm:p-8 shadow-2xl border-l border-slate-200/80"
            >
              {renderCandidateDossier(activeDrawerApplicant, () =>
                setDrawerApplicantId(null),
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIRECT MESSAGE CANDIDATE MODAL */}
      {messageModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl"
          >
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
                  className="btn-premium inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sendingMessage ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {scheduleModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl"
          >
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
                    Select date/time and include meeting instructions for the
                    candidate.
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
                  className="btn-premium inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {scheduling ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* COVER LETTER MODAL */}
      {coverLetterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl"
          >
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
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default EmployerDashboard;
