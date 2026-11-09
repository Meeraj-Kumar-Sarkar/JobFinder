import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
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

// Response interceptor for handling 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token is invalid or expired, clear it
      const currentToken = localStorage.getItem("jobportal_token");
      if (currentToken && !error.config.url?.includes("/auth/login")) {
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
  company?: string | { _id: string; name: string };
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
  status:
    | "Applied"
    | "Screening"
    | "Technical"
    | "HR"
    | "Offer"
    | "Hired"
    | "Rejected";
  createdAt: string;
}

// Auth API
export const authApi = {
  login: async (credentials: { email?: string; password?: string; idToken?: string }) => {
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
    bypassSkillCheck?: boolean;
  }) => {
    const res = await api.post("/applications", {
      ...data,
      bypassSkillCheck: true,
    });
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

  hiringDecision: async (applicationId: string, decision: "hire" | "reject", feedback?: string) => {
    const res = await api.post(`/applications/${applicationId}/decision`, {
      decision,
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
