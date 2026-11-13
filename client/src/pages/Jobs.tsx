import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Code2,
  Filter,
  HeartPulse,
  Landmark,
  MapPin,
  Megaphone,
  Palette,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { jobsApi, type Job } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

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
      setError("Unable to load jobs right now. Please try refreshing.");
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
    return `$${(min! / 1000).toFixed(0)}k – $${(max! / 1000).toFixed(0)}k/yr`;
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case "technology":
        return <Code2 className="h-5 w-5 text-indigo-600" />;
      case "design":
        return <Palette className="h-5 w-5 text-fuchsia-600" />;
      case "marketing":
        return <Megaphone className="h-5 w-5 text-amber-600" />;
      case "business":
        return <Briefcase className="h-5 w-5 text-blue-600" />;
      case "healthcare":
        return <HeartPulse className="h-5 w-5 text-emerald-600" />;
      case "finance":
        return <Landmark className="h-5 w-5 text-violet-600" />;
      default:
        return <Zap className="h-5 w-5 text-indigo-600" />;
    }
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(location.trim()) ||
    category !== "All" ||
    jobType !== "All" ||
    sort !== "default";

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              OPPORTUNITY DIRECTORY
            </span>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Explore Open Roles
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Search verified positions by skill, location, work arrangement, or compensation.
            </p>
          </div>

          {user?.role === "employer" && (
            <Link
              to="/employer/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-600"
            >
              <Plus className="h-4 w-4" />
              Post a Job Opening
            </Link>
          )}
        </div>

        {/* Modern Filter Bar */}
        <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Keywords
              </label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Title, skill, or keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Location
              </label>
              <div className="relative mt-1.5">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Remote, Bangalore, New York..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Category
              </label>
              <div className="relative mt-1.5">
                <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
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
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Work Type
              </label>
              <div className="relative mt-1.5">
                <Briefcase className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                >
                  <option value="All">All Work Types</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="default">Newest First</option>
                <option value="salary">Highest Compensation</option>
                <option value="title">Alphabetical (A–Z)</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {loading ? "Searching..." : `${jobs.length} Roles Found`}
              </span>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 flex items-center justify-between">
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={fetchJobs}
              className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-60 animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
              />
            ))}
          </div>
        )}

        {/* Job Cards Grid */}
        {!loading && jobs.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => {
              const comp = getCompanyDetails(job);
              return (
                <Link
                  key={job._id}
                  to={`/jobs/${job._id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-950/5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50">
                          {getCategoryIcon(job.category)}
                        </div>

                        <div>
                          <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                            {job.title}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-500">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {comp.name}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shrink-0">
                        {job.jobType}
                      </span>
                    </div>

                    <p className="mt-4 text-xs line-clamp-2 text-slate-500 leading-relaxed">
                      {job.description}
                    </p>

                    {job.requirements && job.requirements.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {job.requirements.slice(0, 4).map((req, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                          >
                            {req}
                          </span>
                        ))}
                        {job.requirements.length > 4 && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                            +{job.requirements.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <span className="block text-sm font-extrabold text-slate-900">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {job.location}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
                      Details & Apply
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Search className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No matching roles found
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto">
              Try broadening your search keywords or resetting the category and location filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Jobs;
