import {
  notificationsApi,
  applicationsApi,
  type NotificationItem,
  type Application,
  type User,
} from "../services/api";

const LOCAL_READ_IDS_KEY = "jobportal_read_notification_ids";
const LOCAL_DISMISSED_IDS_KEY = "jobportal_dismissed_notification_ids";

function getLocalSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function saveLocalSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // ignore storage errors
  }
}

export function markLocalNotificationRead(id: string) {
  const set = getLocalSet(LOCAL_READ_IDS_KEY);
  set.add(id);
  saveLocalSet(LOCAL_READ_IDS_KEY, set);
}

export function markAllLocalNotificationsRead(ids: string[]) {
  const set = getLocalSet(LOCAL_READ_IDS_KEY);
  for (const id of ids) {
    set.add(id);
  }
  saveLocalSet(LOCAL_READ_IDS_KEY, set);
}

export function dismissLocalNotification(id: string) {
  const set = getLocalSet(LOCAL_DISMISSED_IDS_KEY);
  set.add(id);
  saveLocalSet(LOCAL_DISMISSED_IDS_KEY, set);
}

/**
 * Fetches server notifications AND synthesizes any missing candidate messages,
 * interview invitations, and ATS stage updates directly from applications
 * so no message from an employer is ever missed.
 */
export async function fetchUnifiedNotifications(
  user: User | null,
): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  const readIds = getLocalSet(LOCAL_READ_IDS_KEY);
  const dismissedIds = getLocalSet(LOCAL_DISMISSED_IDS_KEY);

  let serverNotifications: NotificationItem[] = [];
  try {
    const res = await notificationsApi.getAll({ limit: 50 });
    const list = res?.data?.notifications || res?.data || [];
    if (Array.isArray(list)) {
      serverNotifications = list;
    }
  } catch {
    // Fallback gracefully if /api/notifications is not yet deployed on remote server
  }

  const synthesized: NotificationItem[] = [];

  if (user.role === "candidate") {
    try {
      const appsRes = await applicationsApi.getMyApplications({ limit: 50 });
      const apps: Application[] =
        appsRes?.data?.applications || appsRes?.data || [];

      for (const app of apps) {
        const jobObj = typeof app.job === "object" && app.job ? app.job : null;
        const compObj =
          jobObj && typeof jobObj.company === "object" && jobObj.company
            ? jobObj.company
            : null;
        const jobTitle = jobObj?.title || "Job Opening";
        const companyName = compObj?.name || "Hiring Team";
        const updatedTime = app.updatedAt || app.createdAt || new Date().toISOString();

        // 1. Direct Employer Feedback / Message on Application
        if (app.feedback && app.feedback.trim()) {
          const synthId = `synth-feedback-${app._id}-${app.feedback.trim().slice(0, 24)}`;
          const alreadyOnServer = serverNotifications.some(
            (n) =>
              n.message.includes(app.feedback!.trim()) ||
              ((typeof n.application === "object"
                ? n.application?._id
                : n.application) === app._id &&
                n.type === "employer_message"),
          );

          if (!alreadyOnServer && !dismissedIds.has(synthId)) {
            synthesized.push({
              _id: synthId,
              user: user._id,
              job: jobObj || undefined,
              application: app,
              companyName,
              type: "employer_message",
              title: `Message from ${companyName} — ${jobTitle}`,
              message: app.feedback.trim(),
              isRead: readIds.has(synthId),
              createdAt: updatedTime,
              synthetic: true,
            });
          }
        }

        // 2. Scheduled Interview Invitation
        if (app.interviewDate) {
          const synthId = `synth-interview-${app._id}-${app.interviewDate}`;
          const alreadyOnServer = serverNotifications.some(
            (n) =>
              (typeof n.application === "object"
                ? n.application?._id
                : n.application) === app._id && n.type === "interview",
          );

          if (!alreadyOnServer && !dismissedIds.has(synthId)) {
            const formattedDate = new Date(app.interviewDate).toLocaleString();
            const notePart = app.feedback?.trim()
              ? ` • Note: "${app.feedback.trim()}"`
              : "";
            synthesized.push({
              _id: synthId,
              user: user._id,
              job: jobObj || undefined,
              application: app,
              companyName,
              type: "interview",
              title: `Interview Scheduled — ${jobTitle}`,
              message: `${companyName} scheduled your interview for "${jobTitle}" on ${formattedDate}.${notePart}`,
              isRead: readIds.has(synthId),
              createdAt: updatedTime,
              synthetic: true,
            });
          }
        }

        // 3. ATS Stage Progression / Hiring Decision
        if (app.status && app.status !== "Applied") {
          const isDecision = app.status === "Hired" || app.status === "Rejected";
          const synthId = `synth-status-${app._id}-${app.status}`;
          const alreadyOnServer = serverNotifications.some(
            (n) =>
              (typeof n.application === "object"
                ? n.application?._id
                : n.application) === app._id &&
              n.message.toLowerCase().includes(app.status.toLowerCase()),
          );

          if (!alreadyOnServer && !dismissedIds.has(synthId)) {
            let statusMsg = `Your application for "${jobTitle}" at ${companyName} moved to the "${app.status}" stage.`;
            if (app.status === "Hired") {
              statusMsg = `Congratulations! ${companyName} has selected and hired you for "${jobTitle}".`;
            } else if (app.status === "Rejected") {
              statusMsg = `Update from ${companyName} regarding "${jobTitle}": Your application was not selected to move forward at this time.`;
            } else if (app.status === "Offer") {
              statusMsg = `Great news! ${companyName} has advanced your application for "${jobTitle}" to the Offer stage.`;
            }

            synthesized.push({
              _id: synthId,
              user: user._id,
              job: jobObj || undefined,
              application: app,
              companyName,
              type: isDecision ? "decision" : "status_update",
              title: isDecision
                ? `Hiring Decision: ${app.status} — ${jobTitle}`
                : `Stage Update: ${app.status} — ${jobTitle}`,
              message: statusMsg,
              isRead: readIds.has(synthId),
              createdAt: updatedTime,
              synthetic: true,
            });
          }
        } else if (app.status === "Applied") {
          const synthId = `synth-applied-${app._id}`;
          const alreadyOnServer = serverNotifications.some(
            (n) =>
              (typeof n.application === "object"
                ? n.application?._id
                : n.application) === app._id,
          );
          if (!alreadyOnServer && !dismissedIds.has(synthId)) {
            synthesized.push({
              _id: synthId,
              user: user._id,
              job: jobObj || undefined,
              application: app,
              companyName,
              type: "status_update",
              title: `Application Delivered — ${jobTitle}`,
              message: `Your application for "${jobTitle}" has been delivered to ${companyName}'s hiring team and is awaiting review.`,
              isRead: true, // Default initial submission confirmation to read so only employer updates trigger unread badge
              createdAt: app.createdAt || new Date().toISOString(),
              synthetic: true,
            });
          }
        }
      }
    } catch {
      // ignore if applications fetch fails
    }
  }

  // Merge and sort newest first
  const merged = [
    ...serverNotifications
      .filter((n) => !dismissedIds.has(n._id))
      .map((n) => ({
        ...n,
        isRead: n.isRead || readIds.has(n._id),
      })),
    ...synthesized,
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const unreadCount = merged.filter((n) => !n.isRead).length;
  return { notifications: merged, unreadCount };
}
