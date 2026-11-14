import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { jobsApi, applicationsApi, formatJobAge, type Job } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  MapPin,
  Briefcase,
  Lock,
  AlertCircle,
  Link as LinkIcon,
  Award,
  Send,
  Clock,
} from "lucide-react";

function Apply() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);

  // Form states
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [experience, setExperience] = useState<string>(
    user?.experience !== undefined ? String(user.experience) : "1",
  );
  const [skillsInput, setSkillsInput] = useState(
    user?.skills ? user.skills.join(", ") : "",
  );
  const [resumeURL, setResumeURL] = useState(user?.resumeURL || "");
  const [coverLetter, setCoverLetter] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || user.name || "");
      setEmail((prev) => prev || user.email || "");
      setPhone((prev) => prev || user.phone || "");
      if (user.experience !== undefined) {
        setExperience(String(user.experience));
      }
      if (user.skills && user.skills.length > 0 && !skillsInput) {
        setSkillsInput(user.skills.join(", "));
      }
      setResumeURL((prev) => prev || user.resumeURL || "");
    }
  }, [user]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) {
        setLoadingJob(false);
        return;
      }
      try {
        const res = await jobsApi.getById(id);
        const jobData = res.data?.job || res.data;
        setJob(jobData);
      } catch (err) {
        console.error("Error fetching job to apply:", err);
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
  }, [id]);

  const parsedCandidateSkills = skillsInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const normalizedCandidateSkills = parsedCandidateSkills.map((s) =>
    s.toLowerCase(),
  );

  const toggleRequiredSkill = (reqSkill: string) => {
    const lower = reqSkill.toLowerCase().trim();
    if (normalizedCandidateSkills.includes(lower)) {
      const updated = parsedCandidateSkills.filter(
        (s) => s.toLowerCase() !== lower,
      );
      setSkillsInput(updated.join(", "));
    } else {
      const updated = [...parsedCandidateSkills, reqSkill];
      setSkillsInput(updated.join(", "));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isAuthenticated || !user) {
      toast.error("Please sign in to submit your application.");
      navigate(`/login?redirect=${encodeURIComponent(`/apply/${id || ""}`)}`);
      return;
    }

    if (!job && !id) {
      toast.error("Please select a valid job to apply for.");
      return;
    }

    if (!resumeURL.trim()) {
      toast.error(
        "Please provide a valid resume URL (e.g. Google Drive, Dropbox, or portfolio PDF link).",
      );
      return;
    }

    setSubmitting(true);
    const targetJobId = id || job?._id;

    try {
      await applicationsApi.apply({
        jobId: targetJobId!,
        candidateId: user._id,
        resumeURL: resumeURL.trim(),
        coverLetter: coverLetter.trim(),
        phone: phone.trim() || undefined,
        experience: Number(experience) >= 0 ? Number(experience) : 0,
        skills: parsedCandidateSkills,
      });

      updateUser({
        name: fullName.trim() || user.name,
        phone: phone.trim() || user.phone,
        experience: Number(experience) >= 0 ? Number(experience) : user.experience,
        skills: parsedCandidateSkills,
        resumeURL: resumeURL.trim(),
      });

      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Failed to submit application. Please check your details and try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const company =
    job && typeof job.company === "object" && job.company !== null
      ? job.company
      : null;
  const companyName = company?.name || "Hiring Company";
  const currentPath = `/apply/${id || ""}`;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel w-full max-w-lg rounded-3xl p-10 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Application Delivered!
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Your application for{" "}
              <strong className="text-slate-900">
                {job?.title || "this position"}
              </strong>{" "}
              at <strong className="text-slate-900">{companyName}</strong> is now in the ATS pipeline. Track stage updates and hiring team messages in your workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                to="/dashboard"
                className="btn-premium inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white"
              >
                Track in Candidate Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/notifications"
                className="w-full rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                View Notifications & Messages
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Role Details
        </button>

        {loadingJob || authLoading ? (
          <div className="h-36 rounded-3xl bg-white p-8 border border-slate-200 animate-pulse" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-panel mb-6 rounded-3xl p-6 sm:p-8"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Direct ATS Application
            </span>

            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {job?.title || "Job Application"}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                {companyName}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {job?.location || "Remote"}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                {job?.jobType || "Full Time"}
              </span>
              {job && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                    <Clock className="h-3.5 w-3.5" />
                    {formatJobAge(job.createdAt, job._id, true)}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}

        {!authLoading && !isAuthenticated ? (
          <div className="glass-panel rounded-3xl p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Sign in to Apply for This Role
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Create a candidate account or sign in so your application, resume, and live ATS interview status are tracked in your workspace.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to={`/login?redirect=${encodeURIComponent(currentPath)}`}
                className="btn-premium inline-flex items-center gap-1.5 rounded-xl px-6 py-3 text-xs font-bold text-white"
              >
                Sign In to Apply
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={`/signup?redirect=${encodeURIComponent(currentPath)}`}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Create Candidate Account
              </Link>
            </div>
          </div>
        ) : !authLoading && user?.role === "employer" ? (
          <div className="glass-panel rounded-3xl p-8 text-center">
            <h2 className="text-lg font-bold text-slate-900">
              Signed in with an Employer Account
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Employer accounts manage job postings and ATS pipelines. To apply for roles, please sign in with a Candidate account.
            </p>
            <Link
              to="/employer/dashboard"
              className="btn-premium mt-5 inline-flex items-center gap-1.5 rounded-xl px-6 py-3 text-xs font-bold text-white"
            >
              Go to Employer Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="glass-panel rounded-3xl p-6 sm:p-8"
          >
            <h2 className="text-lg font-bold text-slate-900">
              Candidate Credentials & Resume
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Confirm your details, highlight matching skills, and attach your cloud resume link.
            </p>

            {errorMessage && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3.5 py-2.5 text-sm text-slate-500 outline-none"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Years of Relevant Experience *
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    max={50}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <LinkIcon className="h-3.5 w-3.5 text-indigo-600" />
                    Resume Link (PDF / Google Drive URL) *
                  </label>
                  <input
                    required
                    type="url"
                    value={resumeURL}
                    onChange={(e) => setResumeURL(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <Award className="h-3.5 w-3.5 text-indigo-600" />
                  Your Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="React, TypeScript, Node.js..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />

                {job?.requirements && job.requirements.length > 0 && (
                  <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5">
                    <p className="text-xs font-bold text-slate-700">
                      Role Required Skills (click to toggle skills you have):
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.requirements.map((req, idx) => {
                        const isMatched = normalizedCandidateSkills.includes(
                          req.toLowerCase().trim(),
                        );
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleRequiredSkill(req)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                              isMatched
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                            }`}
                          >
                            {isMatched ? "✓ " : "+ "}
                            {req}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cover Letter / Note to Hiring Manager
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Share your relevant background, key projects, or why you'd excel in this position..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-premium inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting Application..." : "Submit Application"}
              </button>
            </form>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default Apply;
