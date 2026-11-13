import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { applicationsApi, usersApi, type Application } from "../services/api";
import { fetchUnifiedNotifications } from "../utils/notifications";
import toast from "react-hot-toast";
import {
  FileText,
  User as UserIcon,
  Bell,
  Compass,
  LogOut,
  RefreshCw,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Clock,
  Briefcase,
  Building2,
  ArrowUpRight,
  Trash2,
  Save,
  Link as LinkIcon,
  Award,
  Sparkles,
  XCircle,
} from "lucide-react";

const ATS_STAGES = ["Applied", "Screening", "Technical", "HR", "Offer", "Hired"];

function CandidateDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"applications" | "profile">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [headline, setHeadline] = useState(user?.headline || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState(user?.skills ? user.skills.join(", ") : "");
  const [experience, setExperience] = useState<number>(user?.experience || 0);
  const [resumeURL, setResumeURL] = useState(user?.resumeURL || "");
  const [portfolioURL, setPortfolioURL] = useState(user?.portfolioURL || "");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setHeadline(user.headline || "");
      setBio(user.bio || "");
      setSkills(user.skills ? user.skills.join(", ") : "");
      setExperience(user.experience || 0);
      setResumeURL(user.resumeURL || "");
      setPortfolioURL(user.portfolioURL || "");
    }
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const [res, notifResult] = await Promise.all([
        applicationsApi.getMyApplications(),
        fetchUnifiedNotifications(user),
      ]);
      const list = res?.data?.applications || res?.data || [];
      setApplications(list);
      setUnreadCount(notifResult.unreadCount);
    } catch (err) {
      console.error("Error loading candidate applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId: string) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) {
      return;
    }

    try {
      await applicationsApi.withdraw(applicationId);
      toast.success("Application withdrawn successfully");
      setApplications((prev) => prev.filter((a) => a._id !== applicationId));
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to withdraw application.";
      toast.error(msg);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const parsedSkills = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await usersApi.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        skills: parsedSkills,
        experience: Number(experience),
        resumeURL: resumeURL.trim(),
        portfolioURL: portfolioURL.trim(),
      });

      const updated = res.data?.user || res.data;
      updateUser(updated);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update profile.";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Compute live statistics
  const stats = {
    total: applications.length,
    underReview: applications.filter((a) =>
      ["Applied", "Screening"].includes(a.status),
    ).length,
    interviewing: applications.filter((a) =>
      ["Technical", "HR", "Offer"].includes(a.status),
    ).length,
    hired: applications.filter((a) => a.status === "Hired").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Applied":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Screening":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Technical":
      case "HR":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Offer":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Hired":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStageIndex = (status: string) => {
    const idx = ATS_STAGES.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl flex-1 flex flex-col lg:flex-row gap-6 px-4 py-8 sm:px-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 font-bold text-white text-lg shadow-sm shadow-indigo-500/20">
                {user?.name?.[0]?.toUpperCase() || "C"}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-slate-900 truncate">{user?.name}</h3>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Candidate Portal
                </span>
              </div>
            </div>

            <nav className="mt-5 space-y-1.5">
              <button
                onClick={() => setActiveTab("applications")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-between ${
                  activeTab === "applications"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4" />
                  My Applications
                </span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  {applications.length}
                </span>
              </button>

              <Link
                to="/notifications"
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center justify-between"
              >
                <span className="flex items-center gap-2.5">
                  <Bell className="h-4 w-4 text-indigo-600" />
                  Messages & Alerts
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">
                    {unreadCount} new
                  </span>
                )}
              </Link>

              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2.5 ${
                  activeTab === "profile"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <UserIcon className="h-4 w-4" />
                Candidate Profile
              </button>

              <Link
                to="/jobs"
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Compass className="h-4 w-4" />
                Explore Jobs
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
                Candidate Workspace
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track your real-time ATS stage progression, scheduled interviews, and hiring team messages.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                to="/notifications"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition"
              >
                <Bell className="h-4 w-4 text-indigo-600" />
                Inbox
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 transition"
              >
                Browse Roles
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Dynamic Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Applied</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Briefcase className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.total}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Under Review</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-amber-600 mt-2">{stats.underReview}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Interview Stage</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Calendar className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-purple-600 mt-2">{stats.interviewing}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Offers / Hired</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 mt-2">{stats.hired}</p>
            </div>
          </div>

          {/* TAB 1: APPLICATIONS */}
          {activeTab === "applications" && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Active Applications & ATS Pipeline
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time hiring stage and direct notes from employer hiring teams
                  </p>
                </div>
                <button
                  onClick={fetchApplications}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="py-16 text-center text-slate-500">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  <p className="mt-3 text-sm font-medium">Loading your applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    No Applications Submitted Yet
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Browse verified roles and submit your first application to track your live ATS pipeline here.
                  </p>
                  <Link
                    to="/jobs"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                  >
                    Find and Apply for Jobs
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => {
                    const job = typeof app.job === "object" ? app.job : null;
                    const company =
                      job && typeof job.company === "object"
                        ? job.company
                        : null;
                    const jobTitle = job?.title || "Job Posting";
                    const companyName = company?.name || "Hiring Team";
                    const currentStageIdx = getStageIndex(app.status);
                    const isRejected = app.status === "Rejected";

                    return (
                      <div
                        key={app._id}
                        className="rounded-2xl border border-slate-200/90 bg-white p-5 transition hover:border-indigo-200 hover:shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-bold text-white text-sm">
                              {companyName[0]?.toUpperCase() || "C"}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                {job ? (
                                  <Link
                                    to={`/jobs/${job._id}`}
                                    className="text-base font-bold text-slate-900 hover:text-indigo-600 transition"
                                  >
                                    {jobTitle}
                                  </Link>
                                ) : (
                                  <span className="text-base font-bold text-slate-900">
                                    {jobTitle}
                                  </span>
                                )}
                                <span
                                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(
                                    app.status,
                                  )}`}
                                >
                                  {app.status}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                  {companyName}
                                </span>
                                <span>•</span>
                                <span>
                                  Applied{" "}
                                  {app.createdAt
                                    ? new Date(app.createdAt).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : "Recently"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {!["Hired", "Rejected"].includes(app.status) && (
                            <button
                              onClick={() => handleWithdraw(app._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Withdraw
                            </button>
                          )}
                        </div>

                        {/* Visual 6-Stage ATS Stepper */}
                        {!isRejected ? (
                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <div className="grid grid-cols-6 gap-1.5">
                              {ATS_STAGES.map((stage, idx) => {
                                const completed = idx <= currentStageIdx;
                                const isCurrent = idx === currentStageIdx;
                                return (
                                  <div key={stage} className="flex flex-col">
                                    <div
                                      className={`h-1.5 rounded-full transition-all ${
                                        completed
                                          ? app.status === "Hired"
                                            ? "bg-emerald-500"
                                            : "bg-indigo-600"
                                          : "bg-slate-100"
                                      }`}
                                    />
                                    <span
                                      className={`mt-1.5 text-[10px] font-semibold truncate ${
                                        isCurrent
                                          ? "text-indigo-600 font-bold"
                                          : completed
                                            ? "text-slate-700"
                                            : "text-slate-400"
                                      }`}
                                    >
                                      {stage}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50/70 border border-rose-200/70 px-3.5 py-2 text-xs text-rose-700">
                            <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                            <span>
                              This application was closed by the hiring team.
                            </span>
                          </div>
                        )}

                        {/* Interview & Employer Message Callouts */}
                        {(app.interviewDate || app.feedback) && (
                          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                            {app.interviewDate && (
                              <div className="flex items-start gap-2.5 rounded-xl border border-purple-200/80 bg-purple-50/60 p-3">
                                <Calendar className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <p className="font-bold text-purple-950">
                                    Scheduled Interview
                                  </p>
                                  <p className="text-purple-800 mt-0.5 font-medium">
                                    {new Date(app.interviewDate).toLocaleString(undefined, {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })}
                                  </p>
                                </div>
                              </div>
                            )}

                            {app.feedback && (
                              <div className="flex items-start justify-between gap-2.5 rounded-xl border border-indigo-200/80 bg-indigo-50/60 p-3 sm:col-span-2">
                                <div className="flex items-start gap-2.5">
                                  <MessageSquare className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                                  <div className="text-xs">
                                    <p className="font-bold text-indigo-950">
                                      Message from {companyName}
                                    </p>
                                    <p className="text-indigo-900 mt-0.5 leading-relaxed whitespace-pre-line">
                                      {app.feedback}
                                    </p>
                                  </div>
                                </div>
                                <Link
                                  to="/notifications"
                                  className="shrink-0 text-[11px] font-bold text-indigo-600 hover:underline"
                                >
                                  View in Inbox →
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CANDIDATE PROFILE */}
          {activeTab === "profile" && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm max-w-3xl">
              <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Candidate Profile & Credentials
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your skills and resume link are shared automatically with hiring managers when you apply.
                  </p>
                </div>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSaveProfile}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer • React & Node.js"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bio / Executive Summary
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief summary of your engineering background, key achievements, and career goals..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                      <Award className="h-3.5 w-3.5 text-indigo-600" />
                      Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="React, TypeScript, Node.js, AWS"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                      <LinkIcon className="h-3.5 w-3.5 text-indigo-600" />
                      Resume Link (PDF / Google Drive)
                    </label>
                    <input
                      type="url"
                      value={resumeURL}
                      onChange={(e) => setResumeURL(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                      <LinkIcon className="h-3.5 w-3.5 text-indigo-600" />
                      Portfolio / GitHub URL
                    </label>
                    <input
                      type="url"
                      value={portfolioURL}
                      onChange={(e) => setPortfolioURL(e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 transition disabled:opacity-50 text-xs"
                  >
                    <Save className="h-4 w-4" />
                    {savingProfile ? "Saving Profile..." : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CandidateDashboard;
