import { useState } from "react";
import { Link } from "react-router-dom";

function Apply() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Application Submitted!
          </h1>

          <p className="mt-4 leading-7 text-slate-500">
            Congratulations! Your application for Frontend Developer at TechNova
            has been submitted successfully.
          </p>

          <Link
            to="/jobs"
            className="mt-8 block rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700"
          >
            Explore More Jobs
          </Link>

          <Link
            to="/"
            className="mt-4 block font-semibold text-blue-600"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
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

          <Link
            to="/job-details"
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600"
          >
            ← Back
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <p className="font-semibold text-blue-600">
            APPLY FOR THIS JOB
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Frontend Developer
          </h1>

          <p className="mt-2 text-slate-500">
            TechNova • Remote • Full Time
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold">
            Application Form
          </h2>

          <p className="mt-2 text-slate-500">
            Fill in your information to apply for this position.
          </p>

          <form
            className="mt-8 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <div>
              <label className="font-semibold">Full Name</label>
              <input
                required
                type="text"
                placeholder="Enter your full name"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold">Email Address</label>
              <input
                required
                type="email"
                placeholder="Enter your email"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold">Phone Number</label>
              <input
                required
                type="text"
                placeholder="Enter your phone number"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold">Experience</label>

              <select
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">Select experience</option>
                <option>Fresher</option>
                <option>1-2 Years</option>
                <option>3-5 Years</option>
                <option>5+ Years</option>
              </select>
            </div>

            <div>
              <label className="font-semibold">Cover Letter</label>

              <textarea
                required
                rows={5}
                placeholder="Tell us why you are a good fit..."
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700"
            >
              Submit Application →
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Apply;