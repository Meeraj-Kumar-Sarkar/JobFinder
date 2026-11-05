import { Link } from "react-router-dom";

function JobDetails() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
              J
            </div>

            <div>
              <h1 className="font-bold">JobFinder</h1>
              <p className="text-xs text-slate-400">
                Find your dream job
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/jobs"
              className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              ← Back to Jobs
            </Link>

            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left Side */}
          <div>
            {/* Job Header */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                    💻
                  </div>

                  <div>
                    <h1 className="text-3xl font-bold">
                      Frontend Developer
                    </h1>

                    <p className="mt-2 text-lg font-semibold text-blue-600">
                      TechNova
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-2 text-xs text-blue-600">
                        📍 Remote
                      </span>

                      <span className="rounded-full bg-green-50 px-3 py-2 text-xs text-green-600">
                        💼 Full Time
                      </span>

                      <span className="rounded-full bg-purple-50 px-3 py-2 text-xs text-purple-600">
                        💰 $60k - $85k
                      </span>
                    </div>
                  </div>
                </div>

                <button className="text-2xl text-slate-400 transition hover:text-red-500">
                  ♡
                </button>
              </div>
            </div>

            {/* Job Description */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8">
              <h2 className="text-2xl font-bold">
                Job Description
              </h2>

              <p className="mt-5 leading-8 text-slate-600">
                We are looking for a talented Frontend Developer to join our
                growing team. You will work closely with designers and backend
                developers to build beautiful, modern and high-performance web
                applications.
              </p>

              <p className="mt-4 leading-8 text-slate-600">
                You will have the opportunity to work on exciting projects,
                learn new technologies and help build products used by thousands
                of people.
              </p>
            </div>

            {/* Responsibilities */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8">
              <h2 className="text-2xl font-bold">
                Responsibilities
              </h2>

              <ul className="mt-6 space-y-4 text-slate-600">
                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  Build responsive and modern user interfaces.
                </li>

                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  Work closely with designers and backend developers.
                </li>

                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  Write clean and maintainable React code.
                </li>

                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  Improve application performance and user experience.
                </li>
              </ul>
            </div>

            {/* Requirements */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8">
              <h2 className="text-2xl font-bold">
                Requirements
              </h2>

              <ul className="mt-6 space-y-4 text-slate-600">
                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  2+ years of experience with React.
                </li>

                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  Strong knowledge of JavaScript and TypeScript.
                </li>

                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  Experience with Tailwind CSS.
                </li>

                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  Good communication and teamwork skills.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Sidebar */}
          <div>
            {/* Apply Card */}
            <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <h2 className="text-xl font-bold">
                Interested in this job?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Apply now and take the next step in your career.
              </p>

              {/* Apply Now - Connected to Apply Page */}
              <Link
                to="/apply"
                className="mt-6 block w-full rounded-xl bg-blue-600 px-5 py-4 text-center font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                Apply Now
              </Link>

              <button className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-4 font-semibold text-slate-600 transition hover:bg-slate-50">
                Save Job
              </button>

              <p className="mt-5 text-center text-xs text-slate-400">
                Posted 2 days ago
              </p>
            </div>

            {/* Job Overview */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold">
                Job Overview
              </h2>

              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-4">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="font-semibold">Remote</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xl">💼</span>
                  <div>
                    <p className="text-xs text-slate-400">Job Type</p>
                    <p className="font-semibold">Full Time</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xl">💰</span>
                  <div>
                    <p className="text-xs text-slate-400">Salary</p>
                    <p className="font-semibold">$60k - $85k</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="text-xs text-slate-400">Deadline</p>
                    <p className="font-semibold">30 March, 2026</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                  💻
                </div>

                <div>
                  <h3 className="font-bold">TechNova</h3>
                  <p className="text-sm text-slate-400">
                    Technology Company
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-500">
                We build modern digital products and create amazing experiences
                for users around the world.
              </p>

              <button className="mt-5 text-sm font-semibold text-blue-600">
                View Company →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default JobDetails;