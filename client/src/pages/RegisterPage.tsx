import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Briefcase, Mail, Lock, User, Building2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import type { UserRole } from "@/types";

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "This email is already registered. Please sign in instead.",
  "auth/invalid-email": "Invalid email address.",
  "auth/weak-password": "Password is too weak. Use at least 6 characters.",
  "auth/operation-not-allowed": "Email/Password sign-in is not enabled. Enable it in the Firebase Console → Authentication → Sign-in method.",
  "auth/network-request-failed": "Network error. Check your internet connection.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
};

const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["candidate", "employer"]),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("candidate");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "candidate" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Create Firebase user first
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      // Register on the backend
      const res = await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        role: data.role,
        firebaseUID: credential.user.uid,
      });

      setUser(res.data.data);
      toast.success("Account created! Welcome to JobFinder 🎉");
      navigate("/");
    } catch (err: any) {
      const firebaseCode = err?.code as string | undefined;
      const msg =
        (firebaseCode && FIREBASE_ERRORS[firebaseCode]) ||
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
              <Briefcase className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Create an account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Join JobFinder and start your journey
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="text-sm font-medium">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-name"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  className="pl-9"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="pl-9"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">I am a…</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="role-candidate"
                  type="button"
                  onClick={() => {
                    setRole("candidate");
                    setValue("role", "candidate");
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                    role === "candidate"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                  }`}
                >
                  <User
                    className={`h-6 w-6 ${role === "candidate" ? "text-primary" : ""}`}
                  />
                  Job Seeker
                </button>
                <button
                  id="role-employer"
                  type="button"
                  onClick={() => {
                    setRole("employer");
                    setValue("role", "employer");
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                    role === "employer"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                  }`}
                >
                  <Building2
                    className={`h-6 w-6 ${role === "employer" ? "text-primary" : ""}`}
                  />
                  Employer
                </button>
              </div>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              )}
            </div>

            <Button
              id="register-submit"
              type="submit"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
