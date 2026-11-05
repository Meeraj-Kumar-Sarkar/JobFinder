
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-2xl shadow-lg">
            💼
          </div>

          <div>
            <h1 className="text-2xl font-bold text-blue-600">
              JobFinder
            </h1>
            <p className="text-sm text-slate-500">
              Find your dream job
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-5">

          <Link to="/" className="font-semibold text-slate-800 hover:text-blue-600">
            Home
          </Link>

          <Link to="/jobs" className="font-semibold text-slate-800 hover:text-blue-600">
            Find Jobs
          </Link>

          <Link to="/jobs" className="font-semibold text-slate-800 hover:text-blue-600">
            Categories
          </Link>

          <Link to="/" className="font-semibold text-slate-800 hover:text-blue-600">
            About
          </Link>

          <Link to="/dashboard" className="font-semibold text-slate-800 hover:text-blue-600">
            Candidate Dashboard
          </Link>

          <Link to="/employer/dashboard" className="font-semibold text-slate-800 hover:text-blue-600">
            Employer Dashboard
          </Link>

          <Link
            to="/login"
            className="rounded-xl border border-blue-600 px-5 py-3 font-semibold text-blue-600 hover:bg-blue-600 hover:text-white"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg hover:bg-blue-700"
          >
            Sign Up
          </Link>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
