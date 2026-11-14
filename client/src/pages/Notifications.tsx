import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Building2,
  ArrowLeft,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  notificationsApi,
  type NotificationItem,
  type Application,
  type Job,
} from "../services/api";
import {
  fetchUnifiedNotifications,
  markLocalNotificationRead,
  markAllLocalNotificationsRead,
  dismissLocalNotification,
} from "../utils/notifications";
import toast from "react-hot-toast";

type FilterCategory = "all" | "unread" | "messages" | "interviews" | "status";

function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications: list } = await fetchUnifiedNotifications(user);
      setNotifications(list);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (item: NotificationItem) => {
    markLocalNotificationRead(item._id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)),
    );

    if (!item.synthetic) {
      try {
        await notificationsApi.markAsRead(item._id);
      } catch {
        // local state already updated
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    const allIds = notifications.map((n) => n._id);
    markAllLocalNotificationsRead(allIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await notificationsApi.markAllAsRead();
    } catch {
      // local state already updated
    }
    toast.success("All messages marked as read");
  };

  const handleDismiss = async (item: NotificationItem) => {
    dismissLocalNotification(item._id);
    setNotifications((prev) => prev.filter((n) => n._id !== item._id));

    if (!item.synthetic) {
      try {
        await notificationsApi.remove(item._id);
      } catch {
        // local state already updated
      }
    }
    toast.success("Message removed");
  };

  const filteredList = notifications.filter((item) => {
    if (filter === "unread" && item.isRead) return false;
    if (filter === "messages" && item.type !== "employer_message") return false;
    if (filter === "interviews" && item.type !== "interview") return false;
    if (
      filter === "status" &&
      item.type !== "status_update" &&
      item.type !== "decision"
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inMessage = item.message.toLowerCase().includes(q);
      const inCompany = (item.companyName || "").toLowerCase().includes(q);
      return inTitle || inMessage || inCompany;
    }

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const interviewCount = notifications.filter((n) => n.type === "interview").length;
  const directMessagesCount = notifications.filter(
    (n) => n.type === "employer_message",
  ).length;

  const getIconConfig = (type?: string, title?: string) => {
    if (type === "interview" || title?.toLowerCase().includes("interview")) {
      return {
        icon: <Calendar className="h-5 w-5 text-violet-600 dark:text-violet-300" />,
        bg: "bg-violet-50 border-violet-200 dark:bg-violet-500/15 dark:border-violet-500/30",
        badge:
          "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200 dark:border dark:border-violet-500/30",
        label: "Interview Invite",
      };
    }
    if (type === "employer_message" || title?.toLowerCase().includes("message")) {
      return {
        icon: <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />,
        bg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/15 dark:border-indigo-500/30",
        badge:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border dark:border-indigo-500/30",
        label: "Hiring Team Message",
      };
    }
    if (type === "decision" || title?.toLowerCase().includes("decision")) {
      const isHired = title?.toLowerCase().includes("hired");
      return {
        icon: (
          <CheckCircle2
            className={`h-5 w-5 ${
              isHired
                ? "text-emerald-600 dark:text-emerald-300"
                : "text-slate-600 dark:text-slate-300"
            }`}
          />
        ),
        bg: isHired
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30"
          : "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700",
        badge: isHired
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border dark:border-emerald-500/30"
          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        label: isHired ? "Offer / Hired" : "Decision Update",
      };
    }
    return {
      icon: <Sparkles className="h-5 w-5 text-blue-600 dark:text-sky-300" />,
      bg: "bg-blue-50 border-blue-200 dark:bg-sky-500/15 dark:border-sky-500/30",
      badge:
        "bg-blue-100 text-blue-700 dark:bg-sky-500/20 dark:text-sky-200 dark:border dark:border-sky-500/30",
      label: "ATS Stage Update",
    };
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to={user?.role === "employer" ? "/employer/dashboard" : "/dashboard"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {user?.role === "employer" ? "Employer Hub" : "Candidate Dashboard"}
          </Link>

          <button
            onClick={loadNotifications}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync Messages
          </button>
        </div>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Messages & Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Real-time hiring team messages, interview invitations, and ATS stage updates for your applications.
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="btn-premium inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shrink-0"
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </button>
            )}
          </div>

          {/* Quick Summary Counters */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5 border-t border-slate-200/70 dark:border-slate-800/80 pt-6">
            <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 p-4 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Total Updates
              </p>
              <p className="mt-1.5 text-2xl font-extrabold text-slate-900 dark:text-white">
                {notifications.length}
              </p>
            </div>
            <div className="rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 p-4 border border-indigo-200/70 dark:border-indigo-500/30 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Recruiter Messages
              </p>
              <p className="mt-1.5 text-2xl font-extrabold text-indigo-700 dark:text-indigo-200">
                {directMessagesCount}
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50/80 dark:bg-violet-950/60 p-4 border border-violet-200/70 dark:border-violet-500/30 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                Interviews Scheduled
              </p>
              <p className="mt-1.5 text-2xl font-extrabold text-violet-700 dark:text-violet-200">
                {interviewCount}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs & Search Bar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="glass-panel flex flex-wrap items-center gap-1.5 rounded-2xl p-1.5">
            {(
              [
                { id: "all", label: "All Updates" },
                { id: "unread", label: `Unread (${unreadCount})` },
                { id: "messages", label: "Hiring Team Messages" },
                { id: "interviews", label: "Interviews" },
                { id: "status", label: "Stage Changes" },
              ] as { id: FilterCategory; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  filter === tab.id
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages or company..."
              className="glass-panel w-full rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl p-12 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Inbox className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                No messages in this view
              </h2>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
                When employers review your applications, send you direct messages, or schedule interviews, they will appear right here.
              </p>
              {filter !== "all" ? (
                <button
                  onClick={() => setFilter("all")}
                  className="btn-premium mt-5 rounded-xl px-5 py-2.5 text-xs font-bold text-white"
                >
                  Show All Messages
                </button>
              ) : (
                <Link
                  to="/jobs"
                  className="btn-premium mt-5 inline-block rounded-xl px-5 py-2.5 text-xs font-bold text-white"
                >
                  Explore Open Roles →
                </Link>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredList.map((item, idx) => {
                const cfg = getIconConfig(item.type, item.title);
                const jobObj =
                  typeof item.job === "object" && item.job ? (item.job as Job) : null;
                const appObj =
                  typeof item.application === "object" && item.application
                    ? (item.application as Application)
                    : null;
                const companyName =
                  item.companyName ||
                  (jobObj && typeof jobObj.company === "object"
                    ? jobObj.company?.name
                    : "");

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(idx * 0.04, 0.25),
                    }}
                    key={item._id}
                    onClick={() => {
                      if (!item.isRead) handleMarkAsRead(item);
                    }}
                    className={`glass-card group relative rounded-2xl p-5 sm:p-6 ${
                      item.isRead
                        ? ""
                        : "ring-1 ring-indigo-500/30 border-indigo-300/60"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${cfg.bg}`}
                      >
                        {cfg.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}
                            >
                              {cfg.label}
                            </span>

                            {companyName && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                {companyName}
                              </span>
                            )}

                            {!item.isRead && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                New
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(item.createdAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(item);
                              }}
                              title="Dismiss notification"
                              className="rounded-lg p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="mt-2.5 text-base font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>

                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                          {item.message}
                        </p>

                        {/* Extra Interview Callout Box if interviewDate exists */}
                        {appObj?.interviewDate && (
                          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50/70 dark:bg-violet-950/50 px-3.5 py-2.5 text-xs">
                            <span className="font-bold text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                              Scheduled Interview:{" "}
                              {new Date(appObj.interviewDate).toLocaleString()}
                            </span>
                            {appObj.status && (
                              <span className="rounded-full bg-white dark:bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-bold text-violet-700 dark:text-violet-200 border border-violet-200 dark:border-violet-500/30">
                                Stage: {appObj.status}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action Footer */}
                        <div className="mt-4 flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          {jobObj?._id && (
                            <Link
                              to={`/jobs/${jobObj._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
                            >
                              View Job Posting
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}

                          <Link
                            to={
                              user?.role === "employer"
                                ? "/employer/dashboard"
                                : "/dashboard"
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                          >
                            Open ATS Pipeline →
                          </Link>

                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(item);
                              }}
                              className="ml-auto text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              ✓ Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}

export default Notifications;
