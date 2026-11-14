import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Compass,
  Home as HomeIcon,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchUnifiedNotifications } from "../utils/notifications";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !user) {
      setUnreadCount(0);
      return;
    }

    const loadUnread = async () => {
      const { unreadCount: count } = await fetchUnifiedNotifications(user);
      if (active) setUnreadCount(count);
    };

    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, user, location.pathname]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const dashboardPath =
    user?.role === "employer" ? "/employer/dashboard" : "/dashboard";

  const navItems = [
    { path: "/", label: "Home", icon: HomeIcon, active: isActive("/") },
    {
      path: "/jobs",
      label: "Explore Jobs",
      icon: Compass,
      active: isActive("/jobs"),
    },
    ...(isAuthenticated
      ? [
          {
            path: dashboardPath,
            label: user?.role === "employer" ? "Employer Hub" : "My Workspace",
            icon: LayoutDashboard,
            active:
              isActive("/dashboard") || isActive("/employer/dashboard"),
          },
          {
            path: "/notifications",
            label: "Messages & Alerts",
            icon: Bell,
            active: isActive("/notifications"),
            badge: unreadCount,
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/70 bg-white/70 dark:border-white/10 dark:bg-slate-950/65 backdrop-blur-2xl shadow-[0_8px_32px_-12px_rgba(15,23,42,0.07)] dark:shadow-[0_12px_36px_-12px_rgba(0,0,0,0.65)] transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/25 transition-all duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/40">
            <Briefcase className="h-5 w-5" />
          </div>

          <div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Job
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                Finder
              </span>
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-400 leading-none mt-0.5">
              Talent & ATS Cloud
            </span>
          </div>
        </Link>

        {/* Desktop Glass Capsule Navigation with Sliding Active Pill */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-200/70 bg-slate-100/65 dark:border-white/10 dark:bg-slate-900/70 p-1 backdrop-blur-xl shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                  item.active
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {item.active && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 32,
                    }}
                    className="absolute inset-0 -z-10 rounded-full bg-white dark:bg-slate-800/95 shadow-[0_2px_10px_rgba(15,23,42,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.45)] ring-1 ring-slate-900/5 dark:ring-white/10"
                  />
                )}
                <Icon
                  className={`h-3.5 w-3.5 transition-colors ${
                    item.active
                      ? "text-indigo-600 dark:text-indigo-400"
                      : ""
                  }`}
                />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-1 text-[10px] font-bold text-white shadow-xs">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Animated Glass Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 text-slate-600 backdrop-blur-md shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <Sun className="h-4 w-4 text-amber-400" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <Moon className="h-4 w-4 text-indigo-600" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {isAuthenticated ? (
            <>
              {/* Quick Bell Button */}
              <Link
                to="/notifications"
                title="View Messages & Notifications"
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 ${
                  isActive("/notifications")
                    ? "border-indigo-300 bg-indigo-50/90 text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-950/60 dark:text-indigo-400"
                    : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-indigo-300 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:text-white"
                }`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Profile Glass Pill */}
              <Link
                to={dashboardPath}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/75 px-3 py-1.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 dark:border-white/10 dark:bg-slate-900/75 dark:hover:border-indigo-500/40"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-[11px] font-bold text-white shadow-xs">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="text-left">
                  <p className="max-w-[110px] truncate text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 leading-tight">
                    {user?.role}
                  </p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-400 dark:hover:border-rose-900/50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800/70 transition"
              >
                Sign In
              </Link>

              <Link
                to="/signup"
                className="btn-premium rounded-xl px-4 py-2 text-xs font-bold text-white"
              >
                Get Started →
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Trigger & Quick Theme Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-300"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600" />
            )}
          </button>

          {isAuthenticated && (
            <Link
              to="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-300"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-300"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Animated Mobile Dropdown Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-slate-200/70 bg-white/90 px-4 py-4 space-y-2 md:hidden dark:border-white/10 dark:bg-slate-950/90 backdrop-blur-2xl"
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <HomeIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Home
            </Link>
            <Link
              to="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Explore Jobs
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <LayoutDashboard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  {user?.role === "employer"
                    ? "Employer Dashboard"
                    : "Candidate Dashboard"}
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <span className="flex items-center gap-2.5">
                    <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Messages & Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                      {unreadCount} new
                    </span>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-premium rounded-xl py-2.5 text-center text-xs font-bold text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
