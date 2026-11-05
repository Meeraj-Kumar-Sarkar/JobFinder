import { Link } from "react-router-dom";
import { useState } from "react";

function Home() {
  const [darkMode, setDarkMode] = useState(false);

  const categories = [
    {
      icon: "💻",
      title: "Technology",
      jobs: "1,240 Jobs",
    },
    {
      icon: "🎨",
      title: "Design",
      jobs: "680 Jobs",
    },
    {
      icon: "📊",
      title: "Marketing",
      jobs: "520 Jobs",
    },
    {
      icon: "💼",
      title: "Business",
      jobs: "890 Jobs",
    },
  ];

  const jobs = [
    {
      icon: "💻",
      title: "Frontend Developer",
      company: "TechNova",
      location: "Remote",
      type: "Full Time",
      salary: "$60k - $85k",
    },
    {
      icon: "🎨",
      title: "UI/UX Designer",
      company: "Creative Labs",
      location: "Dhaka",
      type: "Full Time",
      salary: "$55k - $75k",
    },
    {
      icon: "⚙️",
      title: "Backend Developer",
      company: "Digital Stack",
      location: "Remote",
      type: "Full Time",
      salary: "$70k - $95k",
    },
  ];

  return (
    <div
      className={`min-h-screen overflow-hidden transition-colors duration-500 ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Navbar */}
      <nav
        className={`border-b backdrop-blur transition-colors duration-500 ${
          darkMode
            ? "border-slate-800 bg-slate-950/90"
            : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md">
              J
            </div>

            <div>
              <h1
                className={`text-sm font-bold ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                JobFinder
              </h1>

              <p className="text-[9px] text-slate-400">
                Find your dream job
              </p>
            </div>
          </Link>

          <div
            className={`hidden items-center gap-7 text-sm font-medium md:flex ${
              darkMode ? "text-slate-300" : "text-slate-600"
            }`}
          >
            <Link to="/" className="text-blue-600">
              Home
            </Link>

            <Link to="/jobs" className="transition hover:text-blue-600">
              Find Jobs
            </Link>

            <a href="#categories" className="transition hover:text-blue-600">
              Categories
            </a>

            <a href="#about" className="transition hover:text-blue-600">
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Day / Night Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle day and night mode"
              className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-all duration-300 ${
                darkMode
                  ? "bg-slate-800 text-yellow-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <Link
              to="/login"
              className="hidden rounded-lg border border-blue-600 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 sm:block"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              Sign Up
            </Link>
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
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="absolute right-1/4 top-1/2 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <div
              className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm ${
                darkMode
                  ? "border-blue-900 bg-slate-900 text-blue-400"
                  : "border-blue-200 bg-white text-blue-600"
              }`}
            >
              ✨ Thousands of opportunities waiting for you
            </div>

            <h2
              className={`max-w-2xl text-5xl font-bold leading-tight md:text-6xl ${
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
              Discover thousands of opportunities from top companies. Search,
              explore and find the perfect job for your future.
            </p>

            {/* Search */}
            <div
              className={`mt-8 rounded-2xl border p-3 shadow-xl transition-colors duration-500 ${
                darkMode
                  ? "border-slate-700 bg-slate-900 shadow-black/30"
                  : "border-slate-200 bg-white shadow-slate-200/70"
              }`}
            >
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  type="text"
                  placeholder="🔍 Job title or keyword"
                  className={`rounded-xl px-4 py-3 text-sm outline-none ${
                    darkMode
                      ? "bg-slate-800 text-white placeholder:text-slate-500"
                      : "bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  }`}
                />

                <input
                  type="text"
                  placeholder="📍 Location"
                  className={`rounded-xl px-4 py-3 text-sm outline-none ${
                    darkMode
                      ? "bg-slate-800 text-white placeholder:text-slate-500"
                      : "bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  }`}
                />

                <Link
                  to="/jobs"
                  className="rounded-xl bg-blue-600 px-7 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Search Jobs
                </Link>
              </div>
            </div>

            {/* Popular */}
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Popular:</span>

              {["React", "Developer", "Designer"].map((item) => (
                <Link
                  key={item}
                  to="/jobs"
                  className={`rounded-full px-3 py-2 shadow-sm transition hover:text-blue-600 ${
                    darkMode
                      ? "bg-slate-800 text-slate-300"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Hero Cards */}
          <div className="relative hidden min-h-[420px] lg:block">
            <div
              className={`absolute left-8 top-16 w-72 rotate-[-5deg] rounded-3xl p-6 shadow-2xl transition hover:rotate-0 ${
                darkMode ? "bg-slate-800" : "bg-white"
              }`}
            >
              <div className="flex gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                  💻
                </div>

                <div>
                  <h3 className="font-bold">Frontend Developer</h3>
                  <p className="text-xs text-slate-400">TechNova</p>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] text-blue-600">
                  Remote
                </span>

                <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] text-green-600">
                  Full Time
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="font-bold">$85k/year</span>

                <Link
                  to="/job-details"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  View Details
                </Link>
              </div>
            </div>

            <div
              className={`absolute right-8 top-36 w-72 rotate-[7deg] rounded-3xl p-6 shadow-2xl transition hover:rotate-0 ${
                darkMode ? "bg-slate-800" : "bg-white"
              }`}
            >
              <div className="flex gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-xl">
                  🎨
                </div>

                <div>
                  <h3 className="font-bold">UI/UX Designer</h3>
                  <p className="text-xs text-slate-400">Creative Labs</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs text-slate-400">
                  <span>Application progress</span>
                  <span>80%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-4/5 rounded-full bg-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section
        id="categories"
        className={`px-6 py-20 transition-colors duration-500 ${
          darkMode ? "bg-slate-900" : "bg-slate-50"
        }`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Explore
            </p>

            <h2
              className={`mt-3 text-3xl font-bold ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Explore job categories
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.title}
                to="/jobs"
                className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-2 hover:border-blue-400 hover:shadow-xl ${
                  darkMode
                    ? "border-slate-700 bg-slate-800"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
                  {category.icon}
                </div>

                <h3 className="mt-5 font-bold">{category.title}</h3>

                <p className="mt-2 text-xs text-slate-400">
                  {category.jobs}
                </p>

                <p className="mt-5 text-sm font-semibold text-blue-600">
                  Explore →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section
        className={`px-6 py-20 transition-colors duration-500 ${
          darkMode ? "bg-slate-950" : "bg-blue-50"
        }`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Opportunities
              </p>

              <h2
                className={`mt-3 text-3xl font-bold ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Featured jobs
              </h2>
            </div>

            <Link
              to="/jobs"
              className="rounded-lg border border-blue-600 px-5 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white"
            >
              View All Jobs →
            </Link>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {jobs.map((job) => (
              <div
                key={job.title}
                className={`rounded-3xl border p-6 shadow-sm transition hover:-translate-y-2 hover:shadow-xl ${
                  darkMode
                    ? "border-slate-700 bg-slate-800"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    {job.icon}
                  </div>

                  <span className="text-slate-400">♡</span>
                </div>

                <h3 className="mt-6 text-xl font-bold">{job.title}</h3>

                <p className="mt-2 text-sm text-blue-600">
                  {job.company}
                </p>

                <div className="mt-5 flex gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-[10px] text-slate-500">
                    📍 {job.location}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-2 text-[10px] text-slate-500">
                    💼 {job.type}
                  </span>
                </div>

                <div
                  className={`mt-6 flex items-center justify-between border-t pt-5 ${
                    darkMode
                      ? "border-slate-700"
                      : "border-slate-100"
                  }`}
                >
                  <span className="font-bold">{job.salary}</span>

                  <Link
                    to="/job-details"
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / CTA */}
      <section
        id="about"
        className={`px-6 py-20 transition-colors duration-500 ${
          darkMode ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-16 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-bold md:text-5xl">
            Ready to find your dream job?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-blue-100">
            Thousands of opportunities are waiting for you. Start your journey
            today and build your future.
          </p>

          <Link
            to="/jobs"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 font-bold text-blue-600 shadow-lg transition hover:-translate-y-1"
          >
            Start Finding Jobs →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 px-6 py-10 text-center text-sm text-slate-400">
        <p>© 2026 JobFinder. Find a job that fits your future.</p>
      </footer>
    </div>
  );
}

export default Home;