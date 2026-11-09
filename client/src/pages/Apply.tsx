import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { jobsApi, applicationsApi, type Job } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function Apply() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);

  // Form states
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [experience, setExperience] = useState<string>(
    user?.experience ? String(user.experience) : "1",
  );
  const [resumeURL, setResumeURL] = useState(user?.resumeURL || "");
  const [coverLetter, setCoverLetter] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name || "");
      if (!email) setEmail(user.email || "");
      if (!phone && user.phone) setPhone(user.phone);
      if (!resumeURL && user.resumeURL) setResumeURL(user.resumeURL);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!job && !id) {
      toast.error("Please select a valid job to apply for.");
      return;
    }

    if (!resumeURL.trim()) {
      toast.error("Please provide a resume URL (e.g. Google Drive, LinkedIn, or PDF link).");
      return;
    }

    setSubmitting(true);
    const targetJobId = id || job?._id;

    try {
      await applicationsApi.apply({
        jobId: targetJobId!,
        candidateId: user?._id,
        resumeURL: resumeURL.trim(),
        coverLetter: coverLetter.trim(),
        bypassSkillCheck: true,
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl border border-slate-200">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600">
              ✓
            </div>

            <h1 className="mt-6 text-3xl font-extrabold text-slate-900">
              Application Submitted!
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Congratulations! Your application for{" "}
              <strong className="text-slate-900">{job?.title || "this position"}</strong> at{" "}
              <strong className="text-slate-900">{companyName}</strong> has been delivered
              to the hiring team.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                to="/dashboard"
                className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                View My Applications in Dashboard →
              </Link>

              <Link
                to="/jobs"
                className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Explore More Job Openings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-10">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-blue-600 hover:underline mb-6 flex items-center gap-1"
        >
          ← Back
        </button>

        {loadingJob ? (
          <div className="h-40 rounded-3xl bg-white p-8 border border-slate-200 animate-pulse" />
        ) : (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              SUBMITTING APPLICATION
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {job?.title || "Job Application"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {companyName} • {job?.location || "Remote"} • {job?.jobType || "Full Time"}
            </p>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Candidate Application Details
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Please fill in your current information and link to your resume.
          </p>

          {!isAuthenticated && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800 flex items-center justify-between">
              <span>Have an account? Sign in to autofill your profile & resume.</span>
              <Link to="/login" className="font-bold underline ml-2">
                Sign In
              </Link>
            </div>
          )}

          {errorMessage && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              ⚠️ {errorMessage}
            </div>
          )}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Full Name *
              </label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Years of Relevant Experience *
                </label>
                <select
                  required
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="0">Entry Level / Fresher (0-1 yr)</option>
                  <option value="2">Junior (1-3 yrs)</option>
                  <option value="4">Mid-Level (3-5 yrs)</option>
                  <option value="7">Senior (5-8 yrs)</option>
                  <option value="10">Lead / Principal (8+ yrs)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Resume Link (PDF / Portfolio URL) *
                </label>
                <input
                  required
                  type="url"
                  value={resumeURL}
                  onChange={(e) => setResumeURL(e.target.value)}
                  placeholder="https://storage.example.com/resume.pdf"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Cover Letter / Why You Are a Great Fit
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Share your relevant background, projects, or why you'd excel in this position..."
                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-xl disabled:opacity-50"
            >
              {submitting ? "Submitting Application..." : "Submit Application →"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Apply;
