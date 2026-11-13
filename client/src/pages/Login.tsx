import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const loggedUser = await login({ email: email.trim(), password });
      toast.success(`Welcome back, ${loggedUser.name}!`);

      if (redirectParam && redirectParam.startsWith("/")) {
        navigate(redirectParam);
      } else if (loggedUser.role === "employer") {
        navigate("/employer/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Unable to reach the server. Please check your connection and try again."
          : "Sign in failed. Please check your email and password.");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const signupUrl = redirectParam
    ? `/signup?redirect=${encodeURIComponent(redirectParam)}`
    : "/signup";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
        {/* Left Side */}
        <div className="hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white font-bold text-blue-600">
                💼
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
              Explore verified job openings, connect directly with hiring teams,
              and track every step of your application in real time.
            </p>

            <div className="mt-8 space-y-3 text-sm text-blue-100">
              <p>✓ Direct applications to hiring managers</p>
              <p>✓ Live ATS stage updates & interview scheduling</p>
              <p>✓ Dedicated dashboards for Candidates & Employers</p>
            </div>
          </div>

          <p className="text-sm text-blue-200">© 2026 JobFinder Portal</p>
        </div>

        {/* Right Side */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <Link to="/" className="text-sm font-semibold text-blue-600 lg:hidden mb-6">
            ← Back to Home
          </Link>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              WELCOME BACK
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Sign in to your account
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Enter your email and password to access your dashboard.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              ⚠️ {errorMessage}
            </div>
          )}

          <form className="mt-6 space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>
              </div>

              <div className="relative mt-1.5">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-xl disabled:opacity-50"
            >
              {submitting ? "Signing In..." : "Sign In →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to={signupUrl} className="font-semibold text-blue-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
