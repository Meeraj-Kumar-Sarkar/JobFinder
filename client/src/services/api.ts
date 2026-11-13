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
}

export interface Application {
  _id: string;
  candidate: User | string;
  job: Job | string;
  resumeURL: string;
  coverLetter?: string;
  interviewDate?: string;
  feedback?: string;
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

  getMyApplications: async (params?: { status?: string; page?: number; limit?: number }) => {
    const res = await api.get("/applications/my-applications", { params });
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
    return res.data;
  },

  getJobApplicants: async (jobId: string, params?: { status?: string }) => {
    const res = await api.get(`/applications/job/${jobId}`, { params });
    return res.data;
  },

  updateStatus: async (applicationId: string, status: string, feedback?: string) => {
    const res = await api.patch(`/applications/${applicationId}/status`, {
      status,
      feedback,
    });
    return res.data;
  },

  scheduleInterview: async (applicationId: string, interviewDate: string, feedback?: string) => {
    const res = await api.post(`/applications/${applicationId}/schedule-interview`, {
      interviewDate,
      feedback,
    });
    return res.data;
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
