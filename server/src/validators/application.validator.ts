import { z } from "zod";

export const applyJobSchema = z
  .object({
    job: z.string().optional(),
    jobId: z.string().optional(),
    resumeURL: z.string().url("Please provide a valid resume URL"),
    coverLetter: z.string().max(3000).optional(),
  })
  .refine((data) => data.job || data.jobId, {
    message: "Job ID is required",
    path: ["jobId"],
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
