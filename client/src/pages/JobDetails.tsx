import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Layers,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import {
  jobsApi,
  applicationsApi,
  getSafeExternalUrl,
  formatJobAge,
  getJobTimestamp,
  type Job,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      setLoading(true);
      setError("");

      try {
        const res = await jobsApi.getById(id);
        const jobData = res.data?.job || res.data;
        setJob(jobData);

        if (isAuthenticated && user?.role === "candidate") {
          try {
            const appsRes = await applicationsApi.getMyApplications();
            const myApps = appsRes.data?.applications || appsRes.data || [];
            const applied = myApps.some(
              (app: any) =>
                (typeof app.job === "object" ? app.job?._id : app.job) === id,
            );
            setHasApplied(applied);
          } catch {
            // ignore check error
          }
        }
      } catch (err: any) {
        console.error("Error loading job:", err);
        setError("Failed to load job details. The posting may no longer exist.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, isAuthenticated, user]);

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Competitive Salary";
    if (min && !max) return `From $${(min / 1000).toFixed(0)}k/year`;
    if (!min && max) return `Up to $${(max / 1000).toFixed(0)}k/year`;
    return `$${(min! / 1000).toFixed(0)}k – $${(max! / 1000).toFixed(0)}k/year`;
  };

  const company =
    job && typeof job.company === "object" && job.company !== null
      ? job.company
      : null;
  const companyName = company?.name || "Hiring Company";

  const candidateSkillSet = new Set(
    (user?.skills || []).map((s) => s.toLowerCase().trim()),
  );

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 mb-6 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to All Jobs
        </Link>

        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 rounded-3xl bg-white p-8 border border-slate-200" />
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="h-96 rounded-3xl bg-white border border-slate-200" />
              <div className="h-96 rounded-3xl bg-white border border-slate-200" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-rose-200 bg-white p-12 text-center shadow-2xs">
            <h2 className="text-2xl font-bold text-slate-900">Job Not Found</h2>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <Link
              to="/jobs"
              className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              Browse All Open Roles
            </Link>
          </div>
        )}

        {!loading && job && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-8 lg:grid-cols-[1fr_360px]"
          >
            {/* Left Main Content */}
            <div className="space-y-6">
              {/* Header Card */}
              <div className="glass-panel rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4 sm:gap-5">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25">
                      <Briefcase className="h-7 w-7" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600">
                          {companyName}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            job.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {job.status === "active" ? "Actively Hiring" : "Closed"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          <Clock className="h-3 w-3 text-indigo-500" />
                          {formatJobAge(job.createdAt, job._id, true)}
                        </span>
                      </div>

                      <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        {job.title}
                      </h1>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          {job.location}
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          {job.jobType}
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          <DollarSign className="h-3.5 w-3.5" />
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </span>

                        {job.category && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                            <Layers className="h-3.5 w-3.5" />
                            {job.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Card */}
              <div className="glass-panel rounded-3xl p-6 sm:p-8">
                <h2 className="text-lg font-extrabold text-slate-900">
                  About the Role
                </h2>
                <div className="mt-4 text-sm leading-7 text-slate-600 whitespace-pre-line">
                  {job.description}
                </div>
              </div>

              {/* Requirements Card */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="glass-panel rounded-3xl p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Required Skills & Qualifications
                    </h2>
                    {isAuthenticated && user?.role === "candidate" && (
                      <span className="text-xs font-semibold text-slate-500">
                        Matched against your profile skills
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.requirements.map((req, i) => {
                      const isMatch = candidateSkillSet.has(req.toLowerCase().trim());
                      return (
                        <div
                          key={i}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                            isMatch
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          <CheckCircle2
                            className={`h-4 w-4 ${
                              isMatch ? "text-emerald-600" : "text-indigo-500"
                            }`}
                          />
                          <span>{req}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Benefits Card */}
              {job.benefits && job.benefits.length > 0 && (
                <div className="glass-panel rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Compensation & Benefits
                  </h2>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {job.benefits.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs font-semibold text-slate-700"
                      >
                        <Sparkles className="h-4 w-4 shrink-0 text-indigo-600" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Apply Action Card */}
              <div className="glass-panel sticky top-24 rounded-3xl p-6">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Apply for this position
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Your profile and resume will be sent directly to {companyName}'s hiring team with live ATS tracking.
                </p>

                {hasApplied ? (
                  <div className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                    <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Application Submitted
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      You have already applied for this opening.
                    </p>
                    <Link
                      to="/dashboard"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Track Status in Dashboard →
                    </Link>
                  </div>
                ) : user?.role === "employer" ? (
                  <div className="mt-5 rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-center">
                    <p className="text-xs text-indigo-900 font-semibold">
                      Signed in with an Employer account
                    </p>
                    <Link
                      to="/employer/dashboard"
                      className="mt-2 inline-block text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Open Employer Hub →
                    </Link>
                  </div>
                ) : job.status === "closed" ? (
                  <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-center text-xs font-bold text-slate-600">
                    This position is no longer accepting applications
                  </div>
                ) : (
                  <Link
                    to={`/apply/${job._id}`}
                    className="btn-premium mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-center text-xs font-bold text-white"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                {/* Job Overview List */}
                <div className="mt-6 border-t border-slate-100 pt-5 space-y-3.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Posted</span>
                    <span
                      title={
                        getJobTimestamp(job.createdAt, job._id)?.toLocaleString() ||
                        ""
                      }
                      className="font-bold text-indigo-600"
                    >
                      {formatJobAge(job.createdAt, job._id)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Location</span>
                    <span className="font-bold text-slate-900">{job.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Employment Type</span>
                    <span className="font-bold text-slate-900">{job.jobType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Experience Level</span>
                    <span className="font-bold text-slate-900">
                      {job.experience ? `${job.experience}+ Years` : "Entry / Open"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Department</span>
                    <span className="font-bold text-slate-900">
                      {job.category || "General"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      Applicants
                    </span>
                    <span className="font-bold text-slate-900">
                      {job.applicants || 0} applied
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Info Card */}
              {company && (
                <div className="glass-panel rounded-3xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {company.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {company.industry || "Technology"}
                      </p>
                    </div>
                  </div>

                  {company.description && (
                    <p className="mt-3.5 text-xs leading-relaxed text-slate-600">
                      {company.description}
                    </p>
                  )}

                  {getSafeExternalUrl(company.website) && (
                    <a
                      href={getSafeExternalUrl(company.website)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Visit Company Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default JobDetails;
