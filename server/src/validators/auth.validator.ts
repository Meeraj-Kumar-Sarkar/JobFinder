import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),

  firebaseUID: z.string().min(1),

  role: z.enum(["candidate", "employer"]),
});

export const loginSchema = z.object({
  firebaseToken: z.string().min(1, "Firebase token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
