export const USER_ROLES = {
  CANDIDATE: "candidate",
  EMPLOYER: "employer",
} as const;

export const JOB_STATUS = {
  ACTIVE: "active",
  CLOSED: "closed",
} as const;

export const APPLICATION_STATUS = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  TECHNICAL: "Technical",
  HR: "HR",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
} as const;

export const FILE_TYPES = {
  PDF: "application/pdf",
  PNG: "image/png",
  JPG: "image/jpg",
  JPEG: "image/jpeg",
} as const;

export const MAX_RESUME_SIZE = 5 * 1024 * 1024;
