import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const loggedUser = await login({ email, password });
      toast.success(`Welcome back, ${loggedUser.name}!`);
      if (loggedUser.role === "employer") {
        navigate("/employer/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Login failed. Please check your credentials.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage("");
    setSubmitting(true);

    try {
      const loggedUser = await login({ email: demoEmail, password: demoPass });
      toast.success(`Logged in as ${loggedUser.name}!`);
      if (loggedUser.role === "employer") {
        navigate("/employer/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Demo login failed. Make sure the server is running.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
              Explore thousands of jobs, connect with top companies, and track
              every step of your application in real-time.
            </p>
          </div>

          <p className="text-sm text-blue-200">© 2026 JobFinder Portal</p>
        </div>

        {/* Right Side */}
        <div className="p-8 sm:p-12">
          <Link to="/" className="text-sm font-semibold text-blue-600 lg:hidden">
            ← Back to Home
          </Link>

          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              WELCOME BACK
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Sign in to your account
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Enter your credentials or try our one-click demo accounts below.
            </p>
          </div>

          {/* Quick Demo Logins */}
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-xs font-bold text-blue-800">⚡ QUICK DEMO ACCESS:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickDemo("candidate@example.com", "Password123!")
                }
                disabled={submitting}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm border border-blue-200 hover:bg-blue-600 hover:text-white transition disabled:opacity-50"
              >
                👤 Login as Candidate (Alex)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickDemo("employer@technova.com", "Password123!")
                }
                disabled={submitting}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm border border-indigo-200 hover:bg-indigo-600 hover:text-white transition disabled:opacity-50"
              >
                🏢 Login as Employer (TechNova)
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              ⚠️ {errorMessage}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                required
                type="email"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <Link to="/signup" className="font-semibold text-blue-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
