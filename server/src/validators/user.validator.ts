import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(3).max(50),

  phone: z
    .string()
    .regex(/^[0-9]{10}$/)
    .optional(),

  headline: z.string().max(100).optional(),

  bio: z.string().max(100).optional(),

  skills: z.array(z.string()).optional(),

  experience: z.number().min(0).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
