import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(2).max(100),

  description: z.string().max(3000),

  website: z.string().url().optional(),

  industry: z.string().min(2),

  location: z.string().min(2),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
