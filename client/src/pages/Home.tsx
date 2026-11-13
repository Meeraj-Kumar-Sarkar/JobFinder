import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Code2,
  HeartPulse,
  Landmark,
  MapPin,
  Megaphone,
  Palette,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { jobsApi, type Job } from "../services/api";

function Home() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [totalJobsCount, setTotalJobsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await jobsApi.getAll({ limit: 6 });
      const list = res.data?.jobs || res.data || [];
      const total = res.data?.pagination?.total ?? list.length;
      setFeaturedJobs(list);
      setTotalJobsCount(total);
    } catch (err) {
      console.error("Error loading featured jobs:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.append("search", search.trim());
    if (location.trim()) params.append("location", location.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  const categories = [
    {
      icon: Code2,
      title: "Technology",
      subtitle: "Software, Cloud, Data & AI Engineering",
      accent: "from-indigo-500/10 to-blue-500/10 text-indigo-600 border-indigo-200/70",
    },
    {
      icon: Palette,
      title: "Design",
      subtitle: "Product Design, UI/UX & Brand Systems",
      accent: "from-fuchsia-500/10 to-pink-500/10 text-fuchsia-600 border-fuchsia-200/70",
    },
    {
      icon: Megaphone,
      title: "Marketing",
      subtitle: "Growth, Content, SEO & Product Marketing",
      accent: "from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200/70",
    },
    {
      icon: Briefcase,
      title: "Business",
      subtitle: "Operations, Product Management & Strategy",
      accent: "from-blue-500/10 to-cyan-500/10 text-blue-600 border-blue-200/70",
    },
    {
      icon: HeartPulse,
      title: "Healthcare",
      subtitle: "Clinical, HealthTech & Medical Operations",
      accent: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200/70",
    },
    {
      icon: Landmark,
      title: "Finance",
      subtitle: "FinTech, Accounting & Financial Analysis",
      accent: "from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-200/70",
    },
  ];

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Competitive";
    if (min && !max) return `From $${(min / 1000).toFixed(0)}k`;
    if (!min && max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return `$${(min! / 1000).toFixed(0)}k – $${(max! / 1000).toFixed(0)}k`;
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

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-white pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Ambient Mesh Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[900px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-blue-500/10 to-violet-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Hero Column */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Direct Applications & Real-Time ATS Pipeline</span>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl leading-[1.08]">
                Where ambitious talent meets{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                  modern hiring teams.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
                Browse verified roles, match your skills before you apply, and track every stage of your application—from initial screening to interview invites and offers.
              </p>

              {/* Command-Style Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5"
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <div className="relative flex items-center">
                    <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Role, skill, or keyword..."
                      className="w-full rounded-xl bg-slate-50/80 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <MapPin className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, Country, or Remote"
                      className="w-full rounded-xl bg-slate-50/80 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                  >
                    <span>Search Jobs</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>

              {/* Quick Filter Chips */}
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-400">Trending:</span>
                {["React", "TypeScript", "Node.js", "Remote", "Design"].map((item) => (
                  <Link
                    key={item}
                    to={
                      item === "Remote"
                        ? `/jobs?location=Remote`
                        : `/jobs?search=${encodeURIComponent(item)}`
                    }
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Hero Column — Live Interactive Preview Bento */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-slate-200/80 bg-slate-50/70 p-6 shadow-xl shadow-slate-900/5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Live ATS Activity
                    </span>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                    Real-Time Sync
                  </span>
                </div>

                {/* Pipeline Stages Preview */}
                <div className="mt-4 space-y-3">
                  {featuredJobs.slice(0, 2).map((job, idx) => {
                    const compName =
                      typeof job.company === "object" && job.company !== null
                        ? (job.company as any).name
                        : "Verified Employer";

                    return (
                      <Link
                        key={job._id}
                        to={`/jobs/${job._id}`}
                        className="block rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-indigo-300 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                              {getCategoryIcon(job.category)}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">
                                {job.title}
                              </h3>
                              <p className="text-xs font-semibold text-indigo-600">
                                {compName}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {job.location} • {job.jobType}
                          </span>
                          <span className="font-bold text-indigo-600">
                            {idx === 0 ? "Actively Hiring →" : "Apply Direct →"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}

                  {/* ATS Pipeline Visual Card */}
                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-md">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-100">
                        Transparent Candidate Pipeline
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    </div>
                    <p className="mt-1 text-sm font-bold">
                      Instant notifications at every hiring stage
                    </p>
                    <div className="mt-3 grid grid-cols-5 gap-1.5 text-[10px] font-semibold">
                      {["Applied", "Screen", "Tech", "HR", "Offer"].map((stage, i) => (
                        <div
                          key={stage}
                          className={`rounded-lg py-1 text-center ${
                            i < 4
                              ? "bg-white/20 text-white"
                              : "bg-emerald-400 text-slate-950 font-bold"
                          }`}
                        >
                          {stage}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Job Openings */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
                <TrendingUp className="h-3.5 w-3.5" />
                Active Opportunities
              </div>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Featured Job Openings
              </h2>
            </div>

            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-indigo-300 hover:text-indigo-600"
            >
              <span>
                View All Open Roles {totalJobsCount > 0 ? `(${totalJobsCount})` : ""}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                />
              ))}
            </div>
          ) : loadError ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-2xs">
              <p className="text-base font-bold text-slate-900">
                Connecting to the live job server...
              </p>
              <p className="mt-1 text-xs text-slate-500">
                The backend service may be waking up. Click below to refresh.
              </p>
              <button
                onClick={fetchFeatured}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Loading Jobs
              </button>
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
              <p className="text-lg font-bold text-slate-900">
                No active job postings yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Are you hiring? Publish your first job opening on JobFinder.
              </p>
              <Link
                to="/signup"
                className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                Post a Job as Employer →
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job) => {
                const compName =
                  typeof job.company === "object" && job.company !== null
                    ? (job.company as any).name
                    : "Hiring Company";

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
                              {compName}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {job.jobType}
                        </span>
                      </div>

                      <p className="mt-4 text-xs leading-relaxed text-slate-500 line-clamp-2">
                        {job.description}
                      </p>

                      {job.requirements && job.requirements.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {job.requirements.slice(0, 3).map((req, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                            >
                              {req}
                            </span>
                          ))}
                          {job.requirements.length > 3 && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                              +{job.requirements.length - 3}
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
                        Apply
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Explore by Category */}
      <section
        id="categories"
        className="border-t border-slate-200/70 bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              BROWSE BY SPECIALIZATION
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Explore Roles Across Core Domains
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Filter openings by industry vertical to find positions tailored to your expertise.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <Link
                  key={cat.title}
                  to={`/jobs?category=${encodeURIComponent(cat.title)}`}
                  className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-md"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${cat.accent}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {cat.title}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {cat.subtitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 sm:px-12 sm:py-16 text-center text-white shadow-2xl relative">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to accelerate your career or build your team?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Join JobFinder to apply directly to verified companies, receive instant interview invitations, or manage your entire hiring pipeline in one place.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-sm transition hover:bg-indigo-50"
              >
                <span>Explore Open Roles</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              {!isAuthenticated && (
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Create Free Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white px-4 py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Briefcase className="h-4 w-4 text-indigo-600" />
            <span>JobFinder Portal</span>
          </div>
          <p>© 2026 JobFinder. Job Portal & Applicant Tracking System.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
