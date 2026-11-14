import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  ShieldCheck,
  Bell,
  Clock,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { jobsApi, formatJobAge, type Job } from "../services/api";

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
      accent:
        "from-indigo-500/15 to-blue-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-200/70 dark:border-indigo-500/30",
    },
    {
      icon: Palette,
      title: "Design",
      subtitle: "Product Design, UI/UX & Brand Systems",
      accent:
        "from-fuchsia-500/15 to-pink-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200/70 dark:border-fuchsia-500/30",
    },
    {
      icon: Megaphone,
      title: "Marketing",
      subtitle: "Growth, Content, SEO & Product Marketing",
      accent:
        "from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400 border-amber-200/70 dark:border-amber-500/30",
    },
    {
      icon: Briefcase,
      title: "Business",
      subtitle: "Operations, Product Management & Strategy",
      accent:
        "from-blue-500/15 to-cyan-500/15 text-blue-600 dark:text-blue-400 border-blue-200/70 dark:border-blue-500/30",
    },
    {
      icon: HeartPulse,
      title: "Healthcare",
      subtitle: "Clinical, HealthTech & Medical Operations",
      accent:
        "from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-500/30",
    },
    {
      icon: Landmark,
      title: "Finance",
      subtitle: "FinTech, Accounting & Financial Analysis",
      accent:
        "from-violet-500/15 to-purple-500/15 text-violet-600 dark:text-violet-400 border-violet-200/70 dark:border-violet-500/30",
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
        return <Code2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
      case "design":
        return <Palette className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400" />;
      case "marketing":
        return <Megaphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case "business":
        return <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "healthcare":
        return <HeartPulse className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case "finance":
        return <Landmark className="h-5 w-5 text-violet-600 dark:text-violet-400" />;
      default:
        return <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section with Floating Glassmorphic Elements */}
      <section className="relative overflow-hidden border-b border-slate-200/60 dark:border-white/10 pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Ambient Mesh Glow Orbs */}
        <div className="pointer-events-none absolute -top-28 left-1/4 h-[440px] w-[650px] rounded-full bg-gradient-to-tr from-indigo-500/20 via-blue-500/15 to-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute top-24 right-10 h-[360px] w-[420px] rounded-full bg-gradient-to-bl from-violet-500/15 via-fuchsia-500/10 to-cyan-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Hero Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 dark:border-indigo-500/30 bg-white/75 dark:bg-indigo-950/50 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Next-Gen Job Portal & Real-Time ATS Cloud</span>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl leading-[1.07]">
                Where ambitious talent meets{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 dark:from-indigo-400 dark:via-sky-400 dark:to-violet-400 bg-clip-text text-transparent">
                  modern hiring teams.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Browse verified roles, match your skills before you apply, and track every stage of your application—from initial screening to interview invites and offers.
              </p>

              {/* Frosted Glass Command-Style Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="glass-panel mt-8 rounded-2xl p-2.5"
              >
                <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
                  <div className="relative flex items-center">
                    <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Role, skill, or keyword..."
                      className="w-full rounded-xl border border-slate-200/70 bg-white/80 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <MapPin className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, Country, or Remote"
                      className="w-full rounded-xl border border-slate-200/70 bg-white/80 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-premium inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
                  >
                    <span>Search Jobs</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>

              {/* Quick Filter Glass Chips */}
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-400">Trending:</span>
                {["React", "TypeScript", "Node.js", "Remote", "Design"].map(
                  (item) => (
                    <Link
                      key={item}
                      to={
                        item === "Remote"
                          ? `/jobs?location=Remote`
                          : `/jobs?search=${encodeURIComponent(item)}`
                      }
                      className="rounded-full border border-slate-200/80 dark:border-white/10 bg-white/65 dark:bg-slate-900/60 backdrop-blur-md px-3.5 py-1 font-semibold text-slate-600 dark:text-slate-300 transition-all hover:-translate-y-0.5 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {item}
                    </Link>
                  ),
                )}
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg pt-4 border-t border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Verified Employers</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <Zap className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span>6-Stage Live ATS</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <Bell className="h-4 w-4 text-violet-500 shrink-0" />
                  <span>Direct Team Inbox</span>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Column — Live Interactive Glass Bento */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.65,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="lg:col-span-5"
            >
              <div className="glass-panel relative rounded-3xl p-6">
                <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Live ATS Activity
                    </span>
                  </div>
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                    Real-Time Sync
                  </span>
                </div>

                {/* Pipeline Stages Preview */}
                <div className="mt-4 space-y-3">
                  {featuredJobs.slice(0, 2).map((job) => {
                    const compName =
                      typeof job.company === "object" && job.company !== null
                        ? (job.company as any).name
                        : "Verified Employer";

                    return (
                      <Link
                        key={job._id}
                        to={`/jobs/${job._id}`}
                        className="glass-card block rounded-2xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100/80 dark:bg-slate-800/80">
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
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {job.location} • {job.jobType}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                            <Clock className="h-3 w-3 text-indigo-500" />
                            {formatJobAge(job.createdAt, job._id)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}

                  {/* ATS Pipeline Visual Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 p-4 text-white shadow-lg shadow-indigo-500/20">
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
                      {["Applied", "Screen", "Tech", "HR", "Offer"].map(
                        (stage, i) => (
                          <div
                            key={stage}
                            className={`rounded-lg py-1 text-center backdrop-blur-xs ${
                              i < 4
                                ? "bg-white/20 text-white"
                                : "bg-emerald-400 text-slate-950 font-bold shadow-xs"
                            }`}
                          >
                            {stage}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
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
              className="glass-card inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-indigo-600"
            >
              <span>
                View All Open Roles{" "}
                {totalJobsCount > 0 ? `(${totalJobsCount})` : ""}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="glass-panel h-56 animate-pulse rounded-2xl p-6"
                />
              ))}
            </div>
          ) : loadError ? (
            <div className="glass-panel mt-8 rounded-3xl p-10 text-center">
              <p className="text-base font-bold text-slate-900">
                Connecting to the live job server...
              </p>
              <p className="mt-1 text-xs text-slate-500">
                The backend service may be waking up. Click below to refresh.
              </p>
              <button
                onClick={fetchFeatured}
                className="btn-premium mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Loading Jobs
              </button>
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="glass-panel mt-8 rounded-3xl p-12 text-center">
              <p className="text-lg font-bold text-slate-900">
                No active job postings yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Are you hiring? Publish your first job opening on JobFinder.
              </p>
              <Link
                to="/signup"
                className="btn-premium mt-4 inline-block rounded-xl px-5 py-2.5 text-xs font-bold text-white"
              >
                Post a Job as Employer →
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job, index) => {
                const compName =
                  typeof job.company === "object" && job.company !== null
                    ? (job.company as any).name
                    : "Hiring Company";

                return (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      to={`/jobs/${job._id}`}
                      className="glass-card group flex h-full flex-col justify-between rounded-2xl p-6"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/80 transition-transform duration-300 group-hover:scale-105">
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

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="rounded-full bg-slate-100/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                              {job.jobType}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                              <Clock className="h-3 w-3 text-indigo-500" />
                              {formatJobAge(job.createdAt, job._id)}
                            </span>
                          </div>
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

                      <div className="mt-6 flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 pt-4">
                        <div>
                          <span className="block text-sm font-extrabold text-slate-900">
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {job.location}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 transition-all duration-300 group-hover:bg-indigo-600 group-hover:!text-white">
                          Apply
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Explore by Category */}
      <section
        id="categories"
        className="border-t border-slate-200/60 dark:border-white/10 py-16 sm:py-20"
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
            {categories.map((cat, idx) => {
              const IconComponent = cat.icon;
              return (
                <motion.div
                  key={cat.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                >
                  <Link
                    to={`/jobs?category=${encodeURIComponent(cat.title)}`}
                    className="glass-card group flex items-start gap-4 rounded-2xl p-5"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br transition-transform duration-300 group-hover:scale-105 ${cat.accent}`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {cat.title}
                        </h3>
                        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-indigo-600" />
                      </div>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {cat.subtitle}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom Glassmorphic CTA Banner */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-14 sm:px-12 sm:py-16 text-center text-white shadow-2xl relative">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />

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
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-md transition hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                <span>Explore Open Roles</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              {!isAuthenticated && (
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-6 py-3 text-xs sm:text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  Create Free Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Glass Footer */}
      <footer className="mt-auto border-t border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl px-4 py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>JobFinder Portal</span>
          </div>
          <p>© {new Date().getFullYear()} JobFinder. Job Portal & Applicant Tracking System.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
