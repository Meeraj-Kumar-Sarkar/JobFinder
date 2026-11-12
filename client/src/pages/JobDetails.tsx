import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { jobsApi, applicationsApi, getSafeExternalUrl, type Job } from "../services/api";
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

        // Check if current logged-in candidate already applied
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
        setError("Failed to load job details. The job may no longer exist.");
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
    return `$${(min! / 1000).toFixed(0)}k - $${(max! / 1000).toFixed(0)}k/year`;
  };

  const company =
    job && typeof job.company === "object" && job.company !== null
      ? job.company
      : null;
  const companyName = company?.name || "Hiring Company";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-10">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline mb-6"
        >
          ← Back to Jobs
        </Link>

        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-40 rounded-3xl bg-white p-8 border border-slate-200" />
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="h-96 rounded-3xl bg-white border border-slate-200" />
              <div className="h-96 rounded-3xl bg-white border border-slate-200" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-white p-12 text-center shadow-sm">
            <div className="text-4xl">⚠️</div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">Job Not Found</h2>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <Link
              to="/jobs"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
            >
              Browse All Available Jobs
            </Link>
          </div>
        )}

        {!loading && job && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left Main Content */}
            <div className="space-y-6">
              {/* Header Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-5">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-4xl shadow-sm">
                      💼
                    </div>

                    <div>
                      <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
                        {job.title}
                      </h1>

                      <p className="mt-1 text-lg font-semibold text-blue-600">
                        {companyName}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          📍 {job.location}
                        </span>

                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          💼 {job.jobType}
                        </span>

                        <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                          💰 {formatSalary(job.salaryMin, job.salaryMax)}
                        </span>

                        {job.category && (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            📂 {job.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shrink-0 ${
                      job.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {job.status === "active" ? "Active Opening" : "Closed"}
                  </span>
                </div>
              </div>

              {/* Description Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900">
                  Job Description
                </h2>
                <div className="mt-5 text-sm leading-8 text-slate-600 whitespace-pre-line">
                  {job.description}
                </div>
              </div>

              {/* Requirements Card */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Required Skills & Qualifications
                  </h2>

                  <ul className="mt-5 space-y-3">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                          ✓
                        </span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits Card */}
              {job.benefits && job.benefits.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Perks & Benefits
                  </h2>

                  <ul className="mt-5 space-y-3">
                    {job.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
                          ★
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Apply Action Card */}
              <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900">
                  Ready to Apply?
                </h2>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Submit your application directly to {companyName}'s hiring team.
                </p>

                {hasApplied ? (
                  <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                    <p className="text-sm font-bold text-emerald-800">
                      ✓ Application Submitted
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      You have already applied for this role.
                    </p>
                    <Link
                      to="/dashboard"
                      className="mt-3 block text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Track Application in Dashboard →
                    </Link>
                  </div>
                ) : user?.role === "employer" ? (
                  <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-center">
                    <p className="text-xs text-blue-800 font-semibold">
                      You are logged in as an Employer.
                    </p>
                    <Link
                      to="/employer/dashboard"
                      className="mt-2 block text-xs font-bold text-blue-600 hover:underline"
                    >
                      Go to Employer Dashboard →
                    </Link>
                  </div>
                ) : (
                  <Link
                    to={`/apply/${job._id}`}
                    className="mt-6 block w-full rounded-xl bg-blue-600 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                  >
                    Apply for this Job →
                  </Link>
                )}

                {/* Job Overview List */}
                <div className="mt-6 border-t border-slate-100 pt-6 space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-semibold text-slate-900">{job.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Job Type:</span>
                    <span className="font-semibold text-slate-900">{job.jobType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Experience:</span>
                    <span className="font-semibold text-slate-900">
                      {job.experience ? `${job.experience}+ Years` : "Open to All"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-semibold text-slate-900">{job.category || "General"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Applicants:</span>
                    <span className="font-semibold text-slate-900">
                      {job.applicants || 0} applied
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Info Card */}
              {company && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                      🏢
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{company.name}</h3>
                      <p className="text-xs text-slate-500">{company.industry || "Technology"}</p>
                    </div>
                  </div>

                  {company.description && (
                    <p className="mt-4 text-xs leading-relaxed text-slate-600">
                      {company.description}
                    </p>
                  )}

                  {getSafeExternalUrl(company.website) && (
                    <a
                      href={getSafeExternalUrl(company.website)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Visit Company Website ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default JobDetails;
