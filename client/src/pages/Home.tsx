import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jobsApi, type Job } from "../services/api";

function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await jobsApi.getAll({ limit: 6 });
        const list = res.data?.jobs || res.data || [];
        setFeaturedJobs(list);
      } catch (err) {
        console.error("Error loading featured jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.append("search", search.trim());
    if (location.trim()) params.append("location", location.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  const categories = [
    {
      icon: "💻",
      title: "Technology",
      jobs: "1,240+ Openings",
    },
    {
      icon: "🎨",
      title: "Design",
      jobs: "680+ Openings",
    },
    {
      icon: "📊",
      title: "Marketing",
      jobs: "520+ Openings",
    },
    {
      icon: "💼",
      title: "Business",
      jobs: "890+ Openings",
    },
  ];

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Competitive";
    if (min && !max) return `From $${(min / 1000).toFixed(0)}k`;
    if (!min && max) return `Up to $${(max / 1000).toFixed(0)}k`;
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
      default:
        return "⚡";
    }
  };

  return (
    <div
      className={`min-h-screen overflow-hidden transition-colors duration-500 ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Navbar */}
      <nav
        className={`border-b backdrop-blur transition-colors duration-500 sticky top-0 z-50 ${
          darkMode
            ? "border-slate-800 bg-slate-950/90"
            : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md">
              💼
            </div>

            <div>
              <h1
                className={`text-base font-bold ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                JobFinder
              </h1>
              <p className="text-[10px] text-slate-400">Find your dream job</p>
            </div>
          </Link>

          <div
            className={`hidden items-center gap-7 text-sm font-medium md:flex ${
              darkMode ? "text-slate-300" : "text-slate-600"
            }`}
          >
            <Link to="/" className="text-blue-600 font-semibold">
              Home
            </Link>

            <Link to="/jobs" className="transition hover:text-blue-600">
              Find Jobs
            </Link>

            <a href="#categories" className="transition hover:text-blue-600">
              Categories
            </a>

            {isAuthenticated ? (
              user?.role === "employer" ? (
                <Link
                  to="/employer/dashboard"
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Employer Dashboard
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Candidate Dashboard
                </Link>
              )
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {/* Day / Night Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle day and night mode"
              className={`flex h-9 w-9 items-center justify-center rounded-full text-base transition-all duration-300 ${
                darkMode
                  ? "bg-slate-800 text-yellow-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to={user?.role === "employer" ? "/employer/dashboard" : "/dashboard"}
                  className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  👤 {user?.name?.split(" ")[0]}
                </Link>
                <button
                  onClick={() => logout()}
                  className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-lg border border-blue-600 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className={`relative overflow-hidden transition-colors duration-500 ${
          darkMode
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
            : "bg-gradient-to-br from-white via-blue-50 to-indigo-100"
        }`}
      >
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 top-1/2 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <div
              className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm ${
                darkMode
                  ? "border-blue-900 bg-slate-900 text-blue-400"
                  : "border-blue-200 bg-white text-blue-600"
              }`}
            >
              ✨ Direct Applications & Real-time ATS Tracking
            </div>

            <h2
              className={`max-w-2xl text-5xl font-extrabold leading-tight md:text-6xl ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Find a job
              <br />
              <span className="text-blue-600">that fits your</span>
              <br />
              <span className="text-blue-600">future.</span>
            </h2>

            <p
              className={`mt-6 max-w-xl text-base leading-7 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Discover active job opportunities from leading companies. Search,
              submit one-click applications, and track your interview progress live.
            </p>

            {/* Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className={`mt-8 rounded-2xl border p-3 shadow-xl transition-colors duration-500 ${
                darkMode
                  ? "border-slate-700 bg-slate-900 shadow-black/30"
                  : "border-slate-200 bg-white shadow-slate-200/70"
              }`}
            >
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="🔍 Job title, skill, or keyword"
                  className={`rounded-xl px-4 py-3 text-sm outline-none ${
                    darkMode
                      ? "bg-slate-800 text-white placeholder:text-slate-500"
                      : "bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  }`}
                />

                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="📍 Location or Remote"
                  className={`rounded-xl px-4 py-3 text-sm outline-none ${
                    darkMode
                      ? "bg-slate-800 text-white placeholder:text-slate-500"
                      : "bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  }`}
                />

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-7 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-200"
                >
                  Search Jobs
                </button>
              </div>
            </form>

            {/* Popular tags */}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>Popular:</span>
              {["React", "TypeScript", "Node.js", "Design", "Marketing"].map((item) => (
                <Link
                  key={item}
                  to={`/jobs?search=${encodeURIComponent(item)}`}
                  className={`rounded-full px-3 py-1.5 shadow-sm transition hover:text-blue-600 ${
                    darkMode
                      ? "bg-slate-800 text-slate-300"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Hero Cards */}
          <div className="relative hidden min-h-[420px] lg:block">
            {featuredJobs.length > 0 ? (
              <>
                <div
                  className={`absolute left-8 top-12 w-76 rotate-[-4deg] rounded-3xl p-6 shadow-2xl transition hover:rotate-0 hover:scale-105 duration-300 border ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                      💻
                    </div>

                    <div>
                      <h3 className="font-bold leading-tight">
                        {featuredJobs[0]?.title}
                      </h3>
                      <p className="text-xs text-blue-600 font-semibold mt-0.5">
                        {typeof featuredJobs[0]?.company === "object"
                          ? (featuredJobs[0]?.company as any)?.name
                          : "Hiring Company"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                      📍 {featuredJobs[0]?.location}
                    </span>

                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600">
                      💼 {featuredJobs[0]?.jobType}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="font-bold text-sm">
                      {formatSalary(featuredJobs[0]?.salaryMin, featuredJobs[0]?.salaryMax)}
                    </span>

                    <Link
                      to={`/jobs/${featuredJobs[0]?._id}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>

                {featuredJobs.length > 1 && (
                  <div
                    className={`absolute right-6 top-36 w-76 rotate-[5deg] rounded-3xl p-6 shadow-2xl transition hover:rotate-0 hover:scale-105 duration-300 border ${
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-2xl">
                        🎨
                      </div>

                      <div>
                        <h3 className="font-bold leading-tight">
                          {featuredJobs[1]?.title}
                        </h3>
                        <p className="text-xs text-blue-600 font-semibold mt-0.5">
                          {typeof featuredJobs[1]?.company === "object"
                            ? (featuredJobs[1]?.company as any)?.name
                            : "Company"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-xs text-slate-400">
                        <span>Application Status</span>
                        <span className="text-emerald-500 font-semibold">Active</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-4/5 rounded-full bg-blue-600" />
                      </div>
                    </div>

                    <div className="mt-5 text-right">
                      <Link
                        to={`/jobs/${featuredJobs[1]?._id}`}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Apply Now →
                      </Link>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section
        id="categories"
        className={`px-6 py-20 transition-colors duration-500 ${
          darkMode ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              EXPLORE BY DOMAIN
            </p>

            <h2
              className={`mt-2 text-3xl font-extrabold ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Popular Job Categories
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto">
              Browse openings across our core categories to find opportunities aligned with your background.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.title}
                to={`/jobs?category=${encodeURIComponent(cat.title)}`}
                className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-2 hover:border-blue-400 hover:shadow-xl ${
                  darkMode
                    ? "border-slate-800 bg-slate-800/80"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                  {cat.icon}
                </div>

                <h3 className="mt-5 font-bold text-lg">{cat.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{cat.jobs}</p>

                <p className="mt-4 text-xs font-bold text-blue-600">
                  Explore Openings →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section
        className={`px-6 py-20 transition-colors duration-500 ${
          darkMode ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                ACTIVE OPPORTUNITIES
              </p>

              <h2
                className={`mt-2 text-3xl font-extrabold ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Featured Job Openings
              </h2>
            </div>

            <Link
              to="/jobs"
              className="rounded-xl border border-blue-600 px-5 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white"
            >
              Browse All Jobs ({featuredJobs.length}+) →
            </Link>
          </div>

          {loading ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-48 rounded-2xl bg-white border border-slate-200 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job) => {
                const compName =
                  typeof job.company === "object" && job.company !== null
                    ? (job.company as any).name
                    : "Hiring Company";

                return (
                  <div
                    key={job._id}
                    className={`rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between ${
                      darkMode
                        ? "border-slate-800 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                          {getCategoryIcon(job.category)}
                        </div>

                        <div>
                          <h3 className="font-bold text-lg leading-snug">
                            {job.title}
                          </h3>
                          <p className="text-xs font-semibold text-blue-600">
                            {compName}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-xs line-clamp-2 text-slate-500">
                        {job.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                          📍 {job.location}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                          💼 {job.jobType}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="font-bold text-sm">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </span>

                      <Link
                        to={`/jobs/${job._id}`}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 shadow-sm"
                      >
                        View & Apply →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="about"
        className={`px-6 py-20 transition-colors duration-500 ${
          darkMode ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-16 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-extrabold md:text-5xl">
            Ready to Take Your Next Career Step?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-blue-100 text-sm md:text-base leading-relaxed">
            Whether you are looking for your next role or searching for top engineering
            and design talent to grow your team, JobFinder makes it effortless.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/jobs"
              className="rounded-xl bg-white px-7 py-3.5 font-bold text-blue-600 shadow-lg transition hover:-translate-y-0.5 text-sm"
            >
              Browse All Jobs →
            </Link>

            <Link
              to="/signup"
              className="rounded-xl border border-white/50 bg-white/10 backdrop-blur px-7 py-3.5 font-bold text-white transition hover:bg-white/20 text-sm"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 px-6 py-10 text-center text-xs text-slate-500">
        <p>© 2026 JobFinder. Full Stack Job Portal with Applicant Tracking System.</p>
      </footer>
    </div>
  );
}

export default Home;
