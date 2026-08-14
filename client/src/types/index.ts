export type UserRole = "candidate" | "employer";

export interface User {
  _id: string;
  firebaseUID: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  profileImage?: string;
  resumeURL?: string;
  headline?: string;
  bio?: string;
  skills: string[];
  experience: number;
  company?: Company | string;
  savedJobs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  _id: string;
  name: string;
  logo?: string;
  website?: string;
  description?: string;
  industry?: string;
  location?: string;
}

export interface Job {
  _id: string;
  title: string;
  company: Company;
  description: string;
  requirements: string[];
  benefits: string[];
  salaryMin: number;
  salaryMax: number;
  location: string;
  jobType: string;
  experience: number;
  createdBy: string;
  status: "active" | "closed";
  applicants: number;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | "Applied"
  | "Screening"
  | "Technical"
  | "HR"
  | "Offer"
  | "Hired"
  | "Rejected";

export interface Application {
  _id: string;
  candidate: User;
  job: Job;
  resumeURL: string;
  coverLetter?: string;
  status: ApplicationStatus;
  feedback?: string;
  interviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  recentApplications: Application[];
}

export interface JobFilters {
  search?: string;
  location?: string;
  jobType?: string;
  minExperience?: number;
  maxSalary?: number;
}
