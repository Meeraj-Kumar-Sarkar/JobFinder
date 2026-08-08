import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(3).max(100),

  company: z.string().length(24),

  description: z.string().min(20),

  requirements: z.array(z.string()),

  benefits: z.array(z.string()).default([]),

  salaryMin: z.number().nonnegative(),

  salaryMax: z.number().nonnegative(),

  location: z.string().min(2),

  jobType: z.enum([
    "Full Time",
    "Part Time",
    "Internship",
    "Contract",
    "Remote",
  ]),

  experience: z.number().min(0),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
