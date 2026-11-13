import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { jobsApi, applicationsApi, type Job } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

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
              Your application for{" "}
              <strong className="text-slate-900">
                {job?.title || "this position"}
              </strong>{" "}
              at <strong className="text-slate-900">{companyName}</strong> has been
              delivered to the hiring team. You can track real-time stage updates
              and interview invitations from your dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                to="/dashboard"
                className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                Track Application in Dashboard →
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

        {loadingJob || authLoading ? (
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
              {companyName} • {job?.location || "Remote"} •{" "}
              {job?.jobType || "Full Time"}
            </p>
          </div>
        )}

        {!authLoading && !isAuthenticated ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              🔐
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Sign in to Apply for This Role
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Create a free candidate account or sign in so your application,
              resume, and live ATS interview status can be tracked in your
              dashboard.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to={`/login?redirect=${encodeURIComponent(currentPath)}`}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                Sign In to Apply →
              </Link>
              <Link
                to={`/signup?redirect=${encodeURIComponent(currentPath)}`}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Create Candidate Account
              </Link>
            </div>
          </div>
        ) : !authLoading && user?.role === "employer" ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Logged in as Employer
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Employer accounts manage job postings and review applicants. To apply
              for jobs, please sign in with a Candidate account.
            </p>
            <Link
              to="/employer/dashboard"
              className="mt-5 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Go to Employer Dashboard →
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Candidate Application Details
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Review your contact details, highlight your matching skills, and
              provide a link to your resume.
            </p>

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
                    disabled
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
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
                  <input
                    required
                    type="number"
                    min={0}
                    max={50}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Resume Link (PDF / Google Drive / Portfolio URL) *
                  </label>
                  <input
                    required
                    type="url"
                    value={resumeURL}
                    onChange={(e) => setResumeURL(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Your Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="React, TypeScript, Node.js..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                {job?.requirements && job.requirements.length > 0 && (
                  <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                    <p className="text-xs font-semibold text-slate-700">
                      Role Required Skills (click to toggle skills you have):
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.requirements.map((req, idx) => {
                        const isMatched = normalizedCandidateSkills.includes(
                          req.toLowerCase().trim(),
                        );
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleRequiredSkill(req)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition border ${
                              isMatched
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
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
                <label className="text-xs font-semibold text-slate-700">
                  Cover Letter / Why You Are a Great Fit
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Share your relevant background, key projects, or why you'd excel in this position..."
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
        )}
      </main>
    </div>
  );
}

export default Apply;
