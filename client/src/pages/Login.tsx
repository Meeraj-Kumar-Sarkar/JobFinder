import { Link } from "react-router-dom";
import { useState } from "react";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  if (loggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Welcome Back!
          </h1>

          <p className="mt-3 text-slate-500">
            You have successfully logged in to JobFinder.
          </p>

          <Link
            to="/"
            className="mt-8 block rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700"
          >
            Go to Home →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
        
        {/* Left Side */}
        <div className="hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white font-bold text-blue-600">
                J
              </div>

              <div>
                <h1 className="text-xl font-bold">JobFinder</h1>
                <p className="text-sm text-blue-100">
                  Find a job that fits your future.
                </p>
              </div>
            </Link>
          </div>

          <div>
            <h2 className="text-4xl font-bold leading-tight">
              Your next opportunity is waiting.
            </h2>

            <p className="mt-5 leading-7 text-blue-100">
              Explore thousands of jobs and take the next step
              in your career.
            </p>
          </div>

          <p className="text-sm text-blue-200">
            © 2026 JobFinder
          </p>
        </div>

        {/* Right Side */}
        <div className="p-8 sm:p-12">
          <Link
            to="/"
            className="text-sm font-semibold text-blue-600 lg:hidden"
          >
            ← Back to Home
          </Link>

          <div className="mt-8 lg:mt-0">
            <p className="text-sm font-bold text-blue-600">
              WELCOME BACK
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Sign in to your account
            </h2>

            <p className="mt-3 text-slate-500">
              Enter your details to continue your job search.
            </p>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setLoggedIn(true);
            }}
          >
            <div>
              <label className="font-semibold text-slate-700">
                Email Address
              </label>

              <input
                required
                type="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <label className="font-semibold text-slate-700">
                  Password
                </label>

                <button
                  type="button"
                  className="text-sm font-semibold text-blue-600"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative mt-2">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500">
              <input type="checkbox" className="h-4 w-4" />
              Remember me
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-xl"
            >
              Sign In →
            </button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">OR</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
            🔵 Continue with Google
          </button>

          <p className="mt-7 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <span className="font-semibold text-blue-600">
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;