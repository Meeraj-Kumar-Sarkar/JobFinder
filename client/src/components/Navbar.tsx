import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-2xl shadow-md text-white">
            💼
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-600">
              JobFinder
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Find your dream job
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center gap-6">
          <Link
            to="/"
            className="text-sm font-semibold text-slate-700 transition hover:text-blue-600"
          >
            Home
          </Link>

          <Link
            to="/jobs"
            className="text-sm font-semibold text-slate-700 transition hover:text-blue-600"
          >
            Find Jobs
          </Link>

          {isAuthenticated ? (
            <>
              {user?.role === "candidate" ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-sm font-semibold text-slate-700 transition hover:text-blue-600"
                  >
                    Candidate Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/employer/dashboard"
                    className="text-sm font-semibold text-slate-700 transition hover:text-blue-600"
                  >
                    Employer Dashboard
                  </Link>
                </>
              )}

              {/* User badge */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
                <span className="max-w-[120px] truncate">{user?.name}</span>
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700 uppercase">
                  {user?.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-xl border border-blue-600 px-5 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
