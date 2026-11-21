import axios, { type InternalAxiosRequestConfig } from "axios";

const LIVE_FALLBACK_API_URL = "https://jobfinder-gc0s.onrender.com/api";

function resolveInitialApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL || "").trim();
  if (envUrl) {
    const normalized = envUrl.replace(/\/+$/, "");
    return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000/api";
    }
    // On deployed hosts (Vercel/Netlify/Render), use relative '/api' rewrite first
    return "/api";
  }

  return "http://localhost:5000/api";
}

export const API_BASE_URL = resolveInitialApiBaseUrl();

/**
 * Validates external URLs on the client to prevent javascript: or data: URI XSS in href attributes
 */
export function getSafeExternalUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves a job's creation Date from `createdAt` or falls back to the MongoDB ObjectId timestamp.
 */
export function getJobTimestamp(createdAt?: string, id?: string): Date | null {
  if (createdAt) {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
    const seconds = parseInt(id.substring(0, 8), 16);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return new Date(seconds * 1000);
    }
  }
  return null;
}

/**
 * Formats how old a job post is in a human-readable relative string (e.g., "Just now", "3h ago", "4 days ago").
 */
export function formatJobAge(
  createdAt?: string,
  id?: string,
  withPrefix = false,
): string {
  const date = getJobTimestamp(createdAt, id);
  if (!date) return withPrefix ? "Posted recently" : "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  let label: string;
  if (diffMin < 1) {
    label = "Just now";
  } else if (diffMin < 60) {
    label = `${diffMin}m ago`;
  } else if (diffHr < 24) {
    label = `${diffHr}h ago`;
  } else if (diffDays === 1) {
    label = "1 day ago";
  } else if (diffDays < 7) {
    label = `${diffDays} days ago`;
  } else if (diffWeeks === 1) {
    label = "1 week ago";
  } else if (diffDays < 30) {
    label = `${diffWeeks} weeks ago`;
  } else if (diffMonths === 1) {
    label = "1 month ago";
  } else if (diffDays < 365) {
    label = `${diffMonths} months ago`;
  } else if (diffYears === 1) {
    label = "1 year ago";
  } else {
    label = `${diffYears} years ago`;
  }

  if (!withPrefix) return label;
  return label === "Just now" ? "Posted just now" : `Posted ${label}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45s timeout to gracefully handle Render cold starts
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization Bearer token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jobportal_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor:
// 1. If a static host without '/api' rewrite returns index.html (text/html) for an '/api' request,
//    automatically switch to the live Render backend and retry the request.
// 2. Retry once on transient network / 502 / 503 / 504 cold-start errors.
// 3. Clear invalid/expired JWT on 401.
api.interceptors.response.use(
  async (response) => {
    const contentType = String(response.headers?.["content-type"] || "");
    const config = response.config as InternalAxiosRequestConfig & {
      _retriedDirectBackend?: boolean;
    };

    if (
      contentType.includes("text/html") &&
      typeof response.data === "string" &&
      !config._retriedDirectBackend &&
      api.defaults.baseURL === "/api"
    ) {
      config._retriedDirectBackend = true;
      api.defaults.baseURL = LIVE_FALLBACK_API_URL;
      config.baseURL = LIVE_FALLBACK_API_URL;
      return api.request(config);
    }

    return response;
  },
  async (error) => {
    const config = error.config as
      | (InternalAxiosRequestConfig & {
          _retryCount?: number;
          _retriedDirectBackend?: boolean;
        })
      | undefined;

    // If relative '/api' returned 404/405 from a static host that didn't proxy '/api', switch to live backend
    if (
      config &&
      !config._retriedDirectBackend &&
      api.defaults.baseURL === "/api" &&
      (error.response?.status === 404 || error.response?.status === 405) &&
      String(error.response?.headers?.["content-type"] || "").includes("text/html")
    ) {
      config._retriedDirectBackend = true;
      api.defaults.baseURL = LIVE_FALLBACK_API_URL;
      config.baseURL = LIVE_FALLBACK_API_URL;
      return api.request(config);
    }

    // Retry once on transient cold-start or gateway errors for idempotent GET requests
    if (
      config &&
      (config.method || "get").toLowerCase() === "get" &&
      (config._retryCount || 0) < 1 &&
      (!error.response || [502, 503, 504].includes(error.response.status))
    ) {
      config._retryCount = (config._retryCount || 0) + 1;
      await new Promise((r) => setTimeout(r, 1500));
      return api.request(config);
    }

    if (error.response?.status === 401) {
      const currentToken = localStorage.getItem("jobportal_token");
      if (currentToken && !error.config?.url?.includes("/auth/login")) {
        localStorage.removeItem("jobportal_token");
        localStorage.removeItem("jobportal_user");
      }
    }
    return Promise.reject(error);
  },
);

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "candidate" | "employer" | "hr";
  userType?: "worker" | "institution";
  phone?: string;
  profileImage?: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  experience?: number;
  preferredJobType?: string;
  resumeURL?: string;
  portfolioURL?: string;
  company?: string | { _id: string; name: string; industry?: string; location?: string; website?: string };
  companyRole?: string;
  createdAt?: string;
}

export interface Company {
  _id: string;
  name: string;
  description?: string;
  industry?: string;
  location?: string;
  website?: string;
  logo?: string;
  employees?: number;
}

export interface Job {
  _id: string;
  title: string;
  company: Company | string;
  category?: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  jobType: string;
  experience?: number;
  status: "active" | "closed";
  applicants?: number;
  createdAt?: string;
  recommendationScore?: number;
  skillMatchScore?: number;
}

export interface AiInterviewQuestion {
  questionNumber: number;
  question: string;
  topic: string;
  expectedKeyPoints?: string[];
  candidateAnswer?: string;
  score?: number;
  aiFeedback?: string;
}

export interface AiInterviewReport {
  overallScore: number;
  verdict: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  completedAt?: string;
}

export interface AiInterviewSession {
  enabled: boolean;
  status: "not_configured" | "scheduled" | "in_progress" | "completed";
  scheduledDate?: string;
  questionCount: number;
  topicFocus?: string;
  joinLink?: string;
  questions: AiInterviewQuestion[];
  report?: AiInterviewReport;
}

export interface Application {
  _id: string;
  candidate: User | string;
  job: Job | string;
  resumeURL: string;
  coverLetter?: string;
  interviewDate?: string;
  feedback?: string;
  aiInterview?: AiInterviewSession;
  status:
    | "Applied"
    | "Screening"
    | "Technical"
    | "HR"
    | "Offer"
    | "Hired"
    | "Rejected";
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  _id: string;
  user: string;
  sender?: { _id: string; name: string; email?: string; role?: string } | string;
  job?: Job | string;
  application?: Application | string;
  companyName?: string;
  type?:
    | "status_update"
    | "interview"
    | "decision"
    | "employer_message"
    | "application_received"
    | "general";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  synthetic?: boolean;
}

// Auth API
export const authApi = {
  login: async (credentials: {
    email?: string;
    password?: string;
    idToken?: string;
    name?: string;
    photoURL?: string;
    role?: "candidate" | "employer";
    companyName?: string;
  }) => {
    const res = await api.post("/auth/login", credentials);
    return res.data;
  },

  register: async (data: Record<string, any>) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
  },
};

// Jobs API
export const jobsApi = {
  getAll: async (params?: {
    search?: string;
    category?: string;
    location?: string;
    jobType?: string;
    status?: string;
    company?: string;
    createdBy?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get("/jobs", { params });
    return res.data;
  },

  /**
   * Personalized Job Recommendation Algorithm (Only for signed-in users).
   * Calls POST /api/jobs/recommend and normalizes `{ details, score }` items from JobQueue.
   */
  getRecommended: async (
    candidateId: string,
    params?: {
      search?: string;
      category?: string;
      location?: string;
      jobType?: string;
      limit?: number;
    },
    candidateProfile?: Partial<User> | null,
  ) => {
    try {
      const res = await api.post(
        "/jobs/recommend",
        { candidate_id: candidateId },
        { params },
      );
      const rawRecommended: Array<{ details?: Job; score?: number } & Job> =
        res.data?.recommended_jobs ||
        res.data?.data?.recommended_jobs ||
        res.data?.data?.jobs ||
        [];

      const jobs: Job[] = rawRecommended.map((item) => {
        if (item && item.details && typeof item.details === "object") {
          return {
            ...item.details,
            recommendationScore:
              item.score !== undefined
                ? Math.round(Number(item.score))
                : item.details.recommendationScore,
          };
        }
        return item as Job;
      });

      return {
        success: true,
        isRecommended: true,
        data: {
          jobs,
          recommended_jobs: rawRecommended,
          pagination: {
            total: jobs.length,
            page: 1,
            limit: params?.limit || jobs.length || 10,
            totalPages: 1,
          },
        },
      };
    } catch {
      // Fallback if /jobs/recommend fails or isn't deployed yet:
      // Fetch standard chronological active jobs (sort: "newest" bypasses server-side recommendation)
      // and run the exact same weighted JobQueue recommendation formula on the client.
      const normalRes = await api.get("/jobs", {
        params: { ...params, sort: "newest", limit: 50 },
      });
      const allJobs: Job[] =
        normalRes.data?.data?.jobs || normalRes.data?.jobs || [];

      const skills = (candidateProfile?.skills || []).map((s) =>
        s.toLowerCase().trim(),
      );
      const preference = (
        candidateProfile?.preferredJobType || "Full Time"
      ).toLowerCase();
      const experience = Number(candidateProfile?.experience) || 0;

      const scored = allJobs
        .map((job) => {
          const reqs = Array.isArray(job.requirements) ? job.requirements : [];
          const matched = reqs.filter((r) =>
            skills.includes(String(r).toLowerCase().trim()),
          ).length;
          const skill_score = reqs.length > 0 ? (matched / reqs.length) * 100 : 0;
          const preference_score =
            preference === String(job.jobType || "").toLowerCase() ? 1 : 0;
          const experience_score =
            experience >= (Number(job.experience) || 0) ? 1 : 0;
          const score = Math.round(
            skill_score * 0.5 +
              preference_score * 100 * 0.2 +
              experience_score * 100 * 0.3,
          );
          return {
            ...job,
            recommendationScore: score,
            skillMatchScore: Math.round(skill_score),
          };
        })
        .sort(
          (a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0),
        );

      const maxLimit = params?.limit || 10;
      const sliced = scored.slice(0, maxLimit);

      return {
        success: true,
        isRecommended: true,
        data: {
          jobs: sliced,
          pagination: {
            total: scored.length,
            page: 1,
            limit: maxLimit,
            totalPages: 1,
          },
        },
      };
    }
  },

  getById: async (id: string) => {
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },

  create: async (jobData: Record<string, any>) => {
    const res = await api.post("/jobs", jobData);
    return res.data;
  },

  update: async (id: string, updateData: Record<string, any>) => {
    const res = await api.patch(`/jobs/${id}`, updateData);
    return res.data;
  },
};

const LOCAL_AI_INTERVIEW_KEY = "jobportal_ai_interviews_v1";

function getLocalAiInterviews(): Record<string, AiInterviewSession> {
  try {
    const raw = localStorage.getItem(LOCAL_AI_INTERVIEW_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAiInterview(applicationId: string, session: AiInterviewSession | null) {
  try {
    const map = getLocalAiInterviews();
    if (!session || !session.enabled) {
      delete map[applicationId];
    } else {
      map[applicationId] = session;
    }
    localStorage.setItem(LOCAL_AI_INTERVIEW_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function hydrateApplicationAiInterview(app: Application): Application {
  if (!app || !app._id) return app;
  if (app.aiInterview && app.aiInterview.enabled) {
    saveLocalAiInterview(app._id, app.aiInterview);
    return app;
  }
  const localMap = getLocalAiInterviews();
  if (localMap[app._id]) {
    return { ...app, aiInterview: localMap[app._id] };
  }
  return app;
}

function generateClientFallbackQuestions(
  job: Partial<Job> | null | undefined,
  questionCount = 5,
  topicFocus = "",
): AiInterviewQuestion[] {
  const count = Math.max(1, Math.min(15, Number(questionCount) || 5));
  const jobTitle = job?.title || "Role";
  const category = job?.category || "Technology";
  const reqs = Array.isArray(job?.requirements) ? job.requirements : [];
  const customTopics = topicFocus
    ? topicFocus
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const topicPool = [
    ...customTopics,
    ...reqs,
    `${jobTitle} Architecture`,
    "Problem Solving & Debugging",
    "Production Best Practices",
    "System Scalability & Trade-offs",
    "Code Quality & Testing",
  ];

  const templates = [
    (topic: string) => ({
      question: `In the context of a ${jobTitle} role, walk through how you have applied ${topic} in a production scenario. What architectural decisions or trade-offs did you make?`,
      expectedKeyPoints: [
        `Hands-on experience with ${topic}`,
        "Clear explanation of trade-offs and design decisions",
        "Production reliability and performance impact",
      ],
    }),
    (topic: string) => ({
      question: `Suppose you encounter a critical performance bottleneck or edge-case failure involving ${topic} on our ${category} platform. How would you diagnose, isolate, and resolve it?`,
      expectedKeyPoints: [
        "Systematic debugging and root-cause analysis",
        `Deep understanding of ${topic} failure modes`,
        "Preventative monitoring and testing",
      ],
    }),
    (topic: string) => ({
      question: `What are the most important best practices, security considerations, or quality standards you follow when building solutions with ${topic} for a ${jobTitle} position?`,
      expectedKeyPoints: [
        `Best practices for ${topic}`,
        "Security, maintainability, and edge-case handling",
        "Automated testing and verification",
      ],
    }),
    (topic: string) => ({
      question: `Describe a complex feature or requirement you delivered using ${topic}. How did you structure your approach from design through deployment?`,
      expectedKeyPoints: [
        "Structured problem decomposition",
        `Effective implementation with ${topic}`,
        "End-to-end delivery and quality assurance",
      ],
    }),
    (topic: string) => ({
      question: `When integrating ${topic} with other services or modules in a ${jobTitle} workflow, how do you ensure clean interfaces, resilience, and maintainability?`,
      expectedKeyPoints: [
        "Clean abstraction and API boundaries",
        `Resilience and error handling with ${topic}`,
        "Long-term maintainability",
      ],
    }),
  ];

  const result: AiInterviewQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const topic = topicPool[i % topicPool.length] || jobTitle;
    const tpl = templates[i % templates.length](topic);
    result.push({
      questionNumber: i + 1,
      question: tpl.question,
      topic,
      expectedKeyPoints: tpl.expectedKeyPoints,
      candidateAnswer: "",
      score: 0,
      aiFeedback: "",
    });
  }
  return result;
}

// Applications API
export const applicationsApi = {
  apply: async (data: {
    jobId: string;
    candidateId?: string;
    resumeURL: string;
    coverLetter?: string;
    phone?: string;
    experience?: number;
    skills?: string[];
  }) => {
    const res = await api.post("/applications", data);
    return res.data;
  },

  getById: async (applicationId: string) => {
    const res = await api.get(`/applications/${applicationId}`);
    const appData = res.data?.data || res.data;
    if (appData && appData._id) {
      const hydrated = hydrateApplicationAiInterview(appData);
      if (res.data?.data) res.data.data = hydrated;
    }
    return res.data;
  },

  getMyApplications: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
    candidateId?: string;
  }) => {
    let resolvedCandidateId = params?.candidateId;
    if (!resolvedCandidateId) {
      try {
        const saved = localStorage.getItem("jobportal_user");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?._id) resolvedCandidateId = parsed._id;
        }
      } catch {
        // ignore storage errors
      }
    }
    const queryParams = resolvedCandidateId
      ? { ...params, candidateId: resolvedCandidateId }
      : params;
    const res = await api.get("/applications/my-applications", {
      params: queryParams,
    });
    const list: Application[] = res.data?.data?.applications || res.data?.applications || [];
    const hydrated = list.map(hydrateApplicationAiInterview);
    if (res.data?.data?.applications) res.data.data.applications = hydrated;
    if (res.data?.applications) res.data.applications = hydrated;
    return res.data;
  },

  getEmployerApplications: async (
    employerId?: string,
    params?: { status?: string; page?: number; limit?: number },
  ) => {
    const url = employerId
      ? `/applications/employer/${employerId}`
      : "/applications/employer-applications";
    const res = await api.get(url, { params });
    const list: Application[] = res.data?.data?.applications || res.data?.applications || [];
    const hydrated = list.map(hydrateApplicationAiInterview);
    if (res.data?.data?.applications) res.data.data.applications = hydrated;
    if (res.data?.applications) res.data.applications = hydrated;
    return res.data;
  },

  getJobApplicants: async (jobId: string, params?: { status?: string }) => {
    const res = await api.get(`/applications/job/${jobId}`, { params });
    const list: Application[] = res.data?.data?.applicants || res.data?.applicants || [];
    const hydrated = list.map(hydrateApplicationAiInterview);
    if (res.data?.data?.applicants) res.data.data.applicants = hydrated;
    return res.data;
  },

  updateStatus: async (applicationId: string, status: string, feedback?: string) => {
    const res = await api.patch(`/applications/${applicationId}/status`, {
      status,
      feedback,
    });
    return res.data;
  },

  scheduleInterview: async (
    applicationId: string,
    interviewDate: string,
    feedback?: string,
    aiConfig?: {
      enableAiInterview?: boolean;
      questionCount?: number;
      topicFocus?: string;
      jobContext?: Partial<Job> | null;
    },
  ) => {
    const res = await api.post(`/applications/${applicationId}/schedule-interview`, {
      interviewDate,
      feedback,
      enableAiInterview: aiConfig?.enableAiInterview,
      questionCount: aiConfig?.questionCount,
      topicFocus: aiConfig?.topicFocus,
    });

    if (aiConfig?.enableAiInterview !== undefined) {
      if (aiConfig.enableAiInterview) {
        const serverSession = res.data?.data?.aiInterview;
        if (serverSession && serverSession.enabled) {
          saveLocalAiInterview(applicationId, serverSession);
        } else {
          const fallbackQuestions = generateClientFallbackQuestions(
            aiConfig.jobContext,
            aiConfig.questionCount || 5,
            aiConfig.topicFocus || "",
          );
          const session: AiInterviewSession = {
            enabled: true,
            status: "scheduled",
            scheduledDate: interviewDate,
            questionCount: fallbackQuestions.length,
            topicFocus: aiConfig.topicFocus || "",
            joinLink: `/interview/${applicationId}`,
            questions: fallbackQuestions,
          };
          saveLocalAiInterview(applicationId, session);
        }
      } else {
        saveLocalAiInterview(applicationId, null);
      }
    }

    return res.data;
  },

  configureAiInterview: async (
    applicationId: string,
    config: {
      enabled: boolean;
      interviewDate?: string;
      questionCount?: number;
      topicFocus?: string;
      feedback?: string;
      stage?: string;
      jobContext?: Partial<Job> | null;
    },
  ) => {
    try {
      const res = await api.post(
        `/applications/${applicationId}/ai-interview/configure`,
        config,
      );
      const serverSession: AiInterviewSession | undefined =
        res.data?.data?.aiInterview || res.data?.data?.application?.aiInterview;
      if (config.enabled && serverSession) {
        saveLocalAiInterview(applicationId, serverSession);
      } else if (!config.enabled) {
        saveLocalAiInterview(applicationId, null);
      }
      return res.data;
    } catch {
      // Fallback if the remote server hasn't deployed /ai-interview/configure yet
      if (!config.enabled) {
        saveLocalAiInterview(applicationId, null);
        return {
          success: true,
          data: {
            applicationId,
            aiInterview: { enabled: false, status: "not_configured", questionCount: 5, questions: [] },
          },
        };
      }

      const dateStr = config.interviewDate || new Date().toISOString();
      const questions = generateClientFallbackQuestions(
        config.jobContext,
        config.questionCount || 5,
        config.topicFocus || "",
      );
      const joinLink = `/interview/${applicationId}`;
      const session: AiInterviewSession = {
        enabled: true,
        status: "scheduled",
        scheduledDate: dateStr,
        questionCount: questions.length,
        topicFocus: config.topicFocus || "",
        joinLink,
        questions,
      };
      saveLocalAiInterview(applicationId, session);

      await api.post(`/applications/${applicationId}/schedule-interview`, {
        interviewDate: dateStr,
        feedback: `Live AI Q&A Interview (${questions.length} questions) scheduled for ${new Date(
          dateStr,
        ).toLocaleString()}. Join link: ${joinLink}`,
      });

      return {
        success: true,
        data: {
          applicationId,
          aiInterview: session,
        },
      };
    }
  },

  submitAiInterview: async (
    applicationId: string,
    answers: Array<{ questionNumber: number; answer: string }>,
    existingSession?: AiInterviewSession | null,
  ) => {
    try {
      const res = await api.post(
        `/applications/${applicationId}/ai-interview/submit`,
        { answers },
      );
      const serverSession: AiInterviewSession | undefined =
        res.data?.data?.aiInterview || res.data?.data?.application?.aiInterview;
      if (serverSession) {
        saveLocalAiInterview(applicationId, serverSession);
      }
      return res.data;
    } catch {
      // Fallback evaluation if remote server hasn't deployed /ai-interview/submit yet
      const baseSession =
        existingSession || getLocalAiInterviews()[applicationId];
      const questions = (baseSession?.questions || []).map((q, i) => {
        const ansObj = answers.find(
          (a) => Number(a.questionNumber) === Number(q.questionNumber || i + 1),
        );
        const ans = (ansObj?.answer || "").trim();
        const wordCount = ans ? ans.split(/\s+/).length : 0;
        const lowerAns = ans.toLowerCase();
        const topicWords = String(q.topic || "")
          .toLowerCase()
          .split(/[\s,/+-]+/)
          .filter((w) => w.length > 2);
        const topicHit = topicWords.some((w) => lowerAns.includes(w));

        let score = 0;
        let aiFeedback = "";
        if (wordCount === 0) {
          score = 0;
          aiFeedback = "No response was provided for this question.";
        } else if (wordCount < 10) {
          score = 30 + (topicHit ? 10 : 0);
          aiFeedback = `Response on ${q.topic} was brief (${wordCount} words) and lacked detailed implementation examples.`;
        } else {
          const lengthScore = Math.min(48, Math.round((wordCount / 50) * 48));
          const relScore = (topicHit ? 24 : 12) + (wordCount >= 30 ? 22 : 10);
          score = Math.min(96, lengthScore + relScore);
          aiFeedback =
            score >= 75
              ? `Strong, structured response demonstrating practical proficiency in ${q.topic}.`
              : `Solid overview of ${q.topic}; expanding on production edge cases would make it even stronger.`;
        }

        return {
          ...q,
          candidateAnswer: ans,
          score,
          aiFeedback,
        };
      });

      const overallScore = Math.round(
        questions.reduce((acc, q) => acc + (q.score || 0), 0) /
          Math.max(1, questions.length),
      );
      const verdict =
        overallScore >= 80
          ? "Strong Hire — Advance to Next Stage"
          : overallScore >= 65
            ? "Recommended — Proceed to Next Stage"
            : overallScore >= 45
              ? "Borderline — Manual Review Recommended"
              : "Does Not Meet Bar";

      const report: AiInterviewReport = {
        overallScore,
        verdict,
        summary: `Candidate completed the ${questions.length}-question Live AI Q&A Interview with an overall score of ${overallScore}/100 (${verdict}).`,
        strengths: questions
          .filter((q) => (q.score || 0) >= 70)
          .map((q) => `Strong proficiency in ${q.topic}`),
        improvements: questions
          .filter((q) => (q.score || 0) < 70)
          .map((q) => `Probe deeper into ${q.topic}`),
        completedAt: new Date().toISOString(),
      };
      if (report.strengths.length === 0) {
        report.strengths.push("Completed all assigned interview questions");
      }
      if (report.improvements.length === 0) {
        report.improvements.push("Explore system scaling scenarios in final round");
      }

      const updatedSession: AiInterviewSession = {
        ...(baseSession || {
          enabled: true,
          questionCount: questions.length,
        }),
        enabled: true,
        status: "completed",
        questions,
        report,
      };
      saveLocalAiInterview(applicationId, updatedSession);

      return {
        success: true,
        data: {
          applicationId,
          aiInterview: updatedSession,
          report,
        },
      };
    }
  },

  hiringDecision: async (
    applicationId: string,
    decision: "Hired" | "Rejected" | "hire" | "reject",
    feedback?: string,
  ) => {
    const normalized =
      decision === "hire" ? "Hired" : decision === "reject" ? "Rejected" : decision;
    const res = await api.post(`/applications/${applicationId}/decision`, {
      decision: normalized,
      feedback,
    });
    return res.data;
  },

  withdraw: async (applicationId: string) => {
    const res = await api.delete(`/applications/${applicationId}`);
    return res.data;
  },
};

// Users API
export const usersApi = {
  getProfile: async (id?: string) => {
    const url = id ? `/users/${id}` : "/users/profile";
    const res = await api.get(url);
    return res.data;
  },

  updateProfile: async (profileData: Record<string, any>) => {
    const res = await api.put("/users/profile", profileData);
    return res.data;
  },
};

// Companies API
export const companiesApi = {
  getById: async (id: string) => {
    const res = await api.get(`/companies/${id}`);
    return res.data;
  },
};

// Notifications & Messages API
export const notificationsApi = {
  getAll: async (params?: { limit?: number }) => {
    const res = await api.get("/notifications", { params });
    return res.data;
  },

  sendMessage: async (data: {
    recipientId?: string;
    applicationId?: string;
    jobId?: string;
    title?: string;
    message: string;
    type?: string;
  }) => {
    const res = await api.post("/notifications/send", data);
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.patch("/notifications/read-all");
    return res.data;
  },

  remove: async (id: string) => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },
};
