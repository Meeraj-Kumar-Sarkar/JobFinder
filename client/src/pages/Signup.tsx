import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function Signup() {
  const [role, setRole] = useState<"candidate" | "employer">("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Candidate fields
  const [headline, setHeadline] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState(0);
  const [resumeURL, setResumeURL] = useState("");

  // Employer fields
  const [companyName, setCompanyName] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("Technology");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      const msg = "Password must be at least 6 characters long.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);

    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
        userType: role === "employer" ? "institution" : "worker",
      };

      if (role === "candidate") {
        payload.headline = headline.trim() || undefined;
        payload.skills = skills
          ? skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        payload.experience = Number(experience) >= 0 ? Number(experience) : 0;
        if (resumeURL.trim()) {
          payload.resumeURL = resumeURL.trim();
        }
      } else {
        payload.companyName = companyName.trim();
        payload.companyIndustry = companyIndustry;
        payload.companyLocation = companyLocation.trim() || "Remote";
        if (companyWebsite.trim()) {
          payload.companyWebsite = companyWebsite.trim();
        }
      }

      const registeredUser = await register(payload);
      toast.success(`Account created! Welcome, ${registeredUser.name}!`);

      if (redirectParam && redirectParam.startsWith("/")) {
        navigate(redirectParam);
      } else if (registeredUser.role === "employer") {
        navigate("/employer/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Unable to reach the server. Please check your connection and try again."
          : "Registration failed. Please check your details and try again.");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const loginUrl = redirectParam
    ? `/login?redirect=${encodeURIComponent(redirectParam)}`
    : "/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
        {/* Left Side */}
        <div className="hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
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

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
              START YOUR JOURNEY
            </p>

            <h2 className="mt-3 text-4xl font-bold leading-tight">
              Create an account with JobFinder.
            </h2>

            <p className="mt-5 leading-7 text-blue-100">
              Whether you are searching for your next career move or looking to hire
              qualified talent, JobFinder connects candidates with hiring teams.
            </p>

            <div className="mt-8 space-y-3 text-sm text-blue-100">
              <p>✓ Access verified job postings & hiring companies</p>
              <p>✓ Real-time applicant tracking & pipeline status</p>
              <p>✓ Direct applications & interview scheduling</p>
            </div>
          </div>

          <p className="text-sm text-blue-200">© 2026 JobFinder Portal</p>
        </div>

        {/* Right Side */}
        <div className="p-8 sm:p-12">
          <Link to="/" className="text-sm font-semibold text-blue-600 lg:hidden">
            ← Back to Home
          </Link>

          <div className="mt-6 lg:mt-0">
            <h2 className="text-3xl font-bold text-slate-900">
              Create an Account
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose your account type to get started.
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
            <button
              type="button"
              onClick={() => setRole("candidate")}
              className={`rounded-xl py-2.5 text-xs font-bold transition ${
                role === "candidate"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              👤 Job Seeker (Candidate)
            </button>
            <button
              type="button"
              onClick={() => setRole("employer")}
              className={`rounded-xl py-2.5 text-xs font-bold transition ${
                role === "employer"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏢 Employer / Company
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              ⚠️ {errorMessage}
            </div>
          )}

          <form className="mt-5 space-y-4" onSubmit={handleSignup}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Email Address *
              </label>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Password * (min 6 characters)
              </label>
              <div className="relative mt-1">
                <input
                  required
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Candidate-specific fields */}
            {role === "candidate" ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Professional Headline *
                  </label>
                  <input
                    required
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Full Stack Developer, Product Designer, Data Analyst"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Key Skills * (comma separated)
                    </label>
                    <input
                      required
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="React, Node.js, TypeScript"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Years of Experience *
                    </label>
                    <input
                      required
                      type="number"
                      min={0}
                      max={50}
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Resume Link (Google Drive / Cloud PDF / Portfolio URL)
                  </label>
                  <input
                    type="url"
                    value={resumeURL}
                    onChange={(e) => setResumeURL(e.target.value)}
                    placeholder="https://drive.google.com/... (can also be added later)"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </>
            ) : (
              /* Employer-specific fields */
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Company Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Innovations Inc."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Industry *
                    </label>
                    <select
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Business">Business</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Headquarters / Location *
                    </label>
                    <input
                      required
                      type="text"
                      value={companyLocation}
                      onChange={(e) => setCompanyLocation(e.target.value)}
                      placeholder="e.g. Remote, New York, Bangalore"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Company Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-xl disabled:opacity-50"
            >
              {submitting ? "Creating Account..." : "Create Account →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to={loginUrl} className="font-semibold text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
