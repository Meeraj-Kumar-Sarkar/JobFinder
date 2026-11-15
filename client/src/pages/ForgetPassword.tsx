
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { firebaseAuth } from "../config/firebase";
import toast from "react-hot-toast";

import {
  Briefcase,
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleResetPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      if (!firebaseAuth) {
        throw new Error("Firebase is not configured.");
      }

      await sendPasswordResetEmail(
        firebaseAuth,
        email.trim()
      );

      setSent(true);

      toast.success(
        "Password reset email sent successfully!"
      );

    } catch (err: any) {
      const msg =
        err?.code === "auth/user-not-found"
          ? "No account found with this email address."
          : err?.code === "auth/invalid-email"
          ? "Please enter a valid email address."
          : err?.code === "auth/too-many-requests"
          ? "Too many attempts. Please try again later."
          : err?.message === "Firebase is not configured."
          ? err.message
          : "Unable to send reset email. Please try again.";

      setErrorMessage(msg);
      toast.error(msg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10 sm:px-6">

      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl lg:grid-cols-2">

        {/* Left Side */}
        <div className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">

          <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" />

          <div className="relative">

            <Link to="/" className="inline-flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                <Briefcase className="h-5 w-5" />
              </div>

              <div>
                <span className="text-lg font-extrabold tracking-tight">
                  Job<span className="text-indigo-400">Finder</span>
                </span>

                <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  ATS & Career Platform
                </span>
              </div>

            </Link>

          </div>

          <div className="relative">

            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              Account Recovery
            </span>

            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight">
              Don't worry! Let's get you back into your account.
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Forgot your password? We are here to help.
              Enter your registered email address and receive
              a secure password reset link.
            </p>

            <div className="mt-8 space-y-3 text-xs font-medium text-slate-200">

              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Secure password recovery</span>
              </div>

              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Email-based verification</span>
              </div>

              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Quick account recovery</span>
              </div>

            </div>

          </div>

          <p className="relative text-xs text-slate-400">
            © {new Date().getFullYear()} JobFinder ATS Platform
          </p>

        </div>

        {/* Right Side */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-8 w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>

          {!sent ? (

            <>

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Account Recovery
                </p>

                <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Forgot Your Password?
                </h1>

                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">
                  Don't worry! Enter your registered email address
                  and we'll send you a password reset link.
                </p>

              </div>

              {errorMessage && (

                <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">

                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />

                  <span>{errorMessage}</span>

                </div>

              )}

              <form
                onSubmit={handleResetPassword}
                className="mt-8 space-y-5"
              >

                {/* Email Address */}
                <div>

                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address
                  </label>

                  <div className="relative">

                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                  </div>

                </div>

                {/* Send Reset Link */}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-700 disabled:opacity-50"
                >

                  {loading
                    ? "Sending Reset Link..."
                    : "Send Reset Link"}

                  {!loading && (
                    <ArrowRight className="h-4 w-4" />
                  )}

                </button>

              </form>

              <p className="mt-8 text-center text-xs sm:text-sm text-slate-500">

                Remember your password?{" "}

                <Link
                  to="/login"
                  className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Sign In
                </Link>

              </p>

            </>

          ) : (

            /* Success Message */
            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">

                <CheckCircle2 className="h-8 w-8 text-emerald-600" />

              </div>

              <h1 className="mt-6 text-2xl font-extrabold text-slate-900">
                Check Your Email!
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                If your email is registered with Firebase,
                a password reset link has been sent to:
              </p>

              <p className="mt-3 font-bold text-indigo-600 break-all">
                {email}
              </p>

              <p className="mt-4 text-sm text-slate-500">
                Please check your inbox and spam folder.
                Follow the link to reset your password.
              </p>

              <Link
                to="/login"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Back to Login
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setErrorMessage("");
                }}
                className="mt-5 text-xs font-semibold text-indigo-600 hover:underline"
              >
                Try another email
              </button>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default ForgotPassword;
