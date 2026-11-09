import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { jobsApi, type Job } from "../services/api";

function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [jobType, setJobType] = useState("All");
  const [sort, setSort] = useState("default");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await jobsApi.getAll({
        search: search.trim() || undefined,
        location: location.trim() || undefined,
        category: category !== "All" ? category : undefined,
        jobType: jobType !== "All" ? jobType : undefined,
        sort: sort !== "default" ? sort : undefined,
      });

      if (res?.data?.jobs) {
        setJobs(res.data.jobs);
      } else if (Array.isArray(res?.data)) {
        setJobs(res.data);
      } else {
        setJobs([]);
      }
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      setError("Unable to load jobs from server. Please verify the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [search, location, category, jobType, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const clearFilters = () => {
    setSearch("");
    setLocation("");
    setCategory("All");
    setJobType("All");
    setSort("default");
    setSearchParams({});
  };

  const getCompanyDetails = (job: Job) => {
    if (typeof job.company === "object" && job.company !== null) {
      return {
        name: job.company.name || "Company",
        industry: job.company.industry || job.category || "Technology",
      };
    }
    return { name: "Hiring Company", industry: job.category || "Technology" };
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Competitive Salary";
    if (min && !max) return `From $${(min / 1000).toFixed(0)}k/yr`;
    if (!min && max) return `Up to $${(max / 1000).toFixed(0)}k/yr`;
    return `$${(min! / 1000).toFixed(0)}k - $${(max! / 1000).toFixed(0)}k`;
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case "technology":
        return "💻";
      case "design":
        return "🎨";
      case "marketing":
        return "📢";
      case "business":
        return "💼";
      case "healthcare":
        return "🩺";
      case "finance":
        return "💰";
      default:
        return "⚡";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Explore Available Jobs
              </h1>
              <p className="mt-2 text-slate-600">
                Discover your next career opportunity from top verified tech and creative companies.
              </p>
            </div>

            <Link
              to="/employer/dashboard"
              className="rounded-xl border border-blue-600 bg-white px-5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50"
            >
              + Post a Job as Employer
            </Link>
          </div>

          {/* Search and Filters Bar */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Keywords
                </label>
                <input
                  type="text"
                  placeholder="Title, skills, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remote, Bangalore, New York"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="All">All Categories</option>
                  <option value="Technology">Technology</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Business">Business</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="All">All Types</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">SORT BY:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium bg-white"
                >
                  <option value="default">Newest First</option>
                  <option value="title">Alphabetical (Title)</option>
                  <option value="salary">Highest Salary First</option>
                </select>
              </div>

              <button
                onClick={clearFilters}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Reset All Filters
              </button>
            </div>
          </div>

          {/* Jobs Count Header */}
          <div className="mb-6 mt-8 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              Live Job Openings
            </h2>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
              {loading ? "Searching..." : `${jobs.length} Jobs Available`}
            </span>
          </div>

          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
              <p className="font-semibold">⚠️ Notice</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-5/6 rounded bg-slate-100" />
                  </div>
                  <div className="mt-6 h-10 rounded-xl bg-slate-200" />
                </div>
              ))}
            </div>
          )}

          {/* Job Cards */}
          {!loading && jobs.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => {
                const comp = getCompanyDetails(job);
                return (
                  <div
                    key={job._id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                            {getCategoryIcon(job.category)}
                          </div>

                          <div>
                            <h3 className="font-bold text-slate-900 leading-snug">
                              {job.title}
                            </h3>
                            <p className="text-sm font-semibold text-blue-600">
                              {comp.name}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shrink-0">
                          {job.jobType}
                        </span>
                      </div>

                      <p className="mt-4 text-xs line-clamp-2 text-slate-500 leading-relaxed">
                        {job.description}
                      </p>

                      <div className="mt-5 space-y-2 text-xs font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>💰</span>
                          <span className="font-semibold text-slate-900">
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                        </div>
                        {job.requirements && job.requirements.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {job.requirements.slice(0, 3).map((req, i) => (
                              <span
                                key={i}
                                className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                              >
                                {req}
                              </span>
                            ))}
                            {job.requirements.length > 3 && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                                +{job.requirements.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/jobs/${job._id}`}
                      className="mt-6 block w-full rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-100"
                    >
                      View Details & Apply →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && jobs.length === 0 && (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                🔍
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                No Jobs Matching Your Criteria
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                Try loosening your filters, changing your search terms, or check back soon for new postings.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Jobs;
