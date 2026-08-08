import { z } from "zod";

export const applyJobSchema = z.object({
  job: z.string().length(24),

  resumeURL: z.string().url(),

  coverLetter: z.string().max(3000).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    "Applied",
    "Screening",
    "Technical",
    "HR",
    "Offer",
    "Hired",
    "Rejected",
  ]),
});

export type ApplyJobInput = z.infer<typeof applyJobSchema>;

export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;
