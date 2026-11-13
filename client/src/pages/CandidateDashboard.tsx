import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { applicationsApi, usersApi, type Application } from "../services/api";
import toast from "react-hot-toast";

function CandidateDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"applications" | "profile">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
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
      const res = await applicationsApi.getMyApplications();
      const list = res?.data?.applications || res?.data || [];
      setApplications(list);
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

  const getStatusColor = (status: string) => {
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white p-6 border-r border-slate-200">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 font-bold text-white text-lg">
              {user?.name?.[0]?.toUpperCase() || "C"}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-slate-900 truncate">{user?.name}</h3>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            <button
              onClick={() => setActiveTab("applications")}
              className={`w-full text-left p-3 rounded-xl font-semibold text-sm transition flex items-center justify-between ${
                activeTab === "applications"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>📄 My Applications</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {applications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left p-3 rounded-xl font-semibold text-sm transition ${
                activeTab === "profile"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              👤 My Candidate Profile
            </button>

            <Link
              to="/jobs"
              className="block p-3 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-50"
            >
              🔍 Browse Jobs
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
                Candidate Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Welcome back, {user?.name}! Track your applications and manage your profile.
              </p>
            </div>

            <Link
              to="/jobs"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition"
            >
              Search New Jobs →
            </Link>
          </div>

          {/* Dynamic Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Applied
              </p>
              <h2 className="text-3xl font-extrabold text-blue-600 mt-2">
                {stats.total}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                In Review
              </p>
              <h2 className="text-3xl font-extrabold text-amber-600 mt-2">
                {stats.underReview}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Interview / Shortlisted
              </p>
              <h2 className="text-3xl font-extrabold text-purple-600 mt-2">
                {stats.interviewing}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Hired Offers
              </p>
              <h2 className="text-3xl font-extrabold text-emerald-600 mt-2">
                {stats.hired}
              </h2>
            </div>
          </div>

          {/* TAB 1: APPLICATIONS */}
          {activeTab === "applications" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  My Submitted Applications
                </h2>
                <button
                  onClick={fetchApplications}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  🔄 Refresh Status
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="mt-3 text-sm">Loading your applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-3">📬</div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    No Applications Yet
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    You haven't submitted any job applications yet.
                  </p>
                  <Link
                    to="/jobs"
                    className="mt-5 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
                  >
                    Find and Apply for Jobs
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 font-semibold">Job Title & Updates</th>
                        <th className="pb-3 font-semibold">Company</th>
                        <th className="pb-3 font-semibold">Date Applied</th>
                        <th className="pb-3 font-semibold">ATS Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.map((app) => {
                        const job = typeof app.job === "object" ? app.job : null;
                        const company =
                          job && typeof job.company === "object"
                            ? job.company
                            : null;
                        const jobTitle = job?.title || "Job Posting";
                        const companyName = company?.name || "Company";

                        return (
                          <tr key={app._id} className="hover:bg-slate-50/60 transition">
                            <td className="py-4 font-semibold text-slate-900">
                              {job ? (
                                <Link
                                  to={`/jobs/${job._id}`}
                                  className="hover:text-blue-600 hover:underline"
                                >
                                  {jobTitle}
                                </Link>
                              ) : (
                                jobTitle
                              )}
                              {app.interviewDate && (
                                <p className="text-xs text-purple-700 font-semibold mt-1">
                                  📅 Interview Scheduled:{" "}
                                  {new Date(app.interviewDate).toLocaleString()}
                                </p>
                              )}
                              {app.feedback && (
                                <p className="text-xs text-slate-600 font-normal mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 max-w-md">
                                  💬 <span className="font-semibold">Hiring Team Note:</span>{" "}
                                  {app.feedback}
                                </p>
                              )}
                            </td>

                            <td className="py-4 text-slate-600">{companyName}</td>

                            <td className="py-4 text-xs text-slate-500">
                              {app.createdAt
                                ? new Date(app.createdAt).toLocaleDateString()
                                : "Recent"}
                            </td>

                            <td className="py-4">
                              <span
                                className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${getStatusColor(
                                  app.status,
                                )}`}
                              >
                                {app.status}
                              </span>
                            </td>

                            <td className="py-4 text-right">
                              {!["Hired", "Rejected"].includes(app.status) && (
                                <button
                                  onClick={() => handleWithdraw(app._id)}
                                  className="text-xs font-semibold text-red-600 hover:text-red-800 transition"
                                >
                                  Withdraw
                                </button>
                              )}
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

          {/* TAB 2: CANDIDATE PROFILE */}
          {activeTab === "profile" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm max-w-3xl">
              <h2 className="text-xl font-bold text-slate-900">
                Edit Candidate Profile
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Keep your contact details, skills, and resume link updated so employers can evaluate your applications.
              </p>

              <form className="mt-6 space-y-5" onSubmit={handleSaveProfile}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Bio / Summary
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief summary of your professional background..."
                    className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="React, TypeScript, Node.js"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Resume Link (PDF / Cloud URL)
                    </label>
                    <input
                      type="url"
                      value={resumeURL}
                      onChange={(e) => setResumeURL(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Portfolio / GitHub URL
                    </label>
                    <input
                      type="url"
                      value={portfolioURL}
                      onChange={(e) => setPortfolioURL(e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                >
                  {savingProfile ? "Saving Profile..." : "Save Profile Changes"}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CandidateDashboard;
