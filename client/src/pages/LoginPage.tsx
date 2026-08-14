import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Briefcase, Mail, Lock } from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-email": "Invalid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/operation-not-allowed": "Email/Password sign-in is not enabled. Enable it in the Firebase Console → Authentication → Sign-in method.",
  "auth/network-request-failed": "Network error. Check your internet connection.",
  "auth/too-many-requests": "Too many failed attempts. Please wait and try again.",
  "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
};

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const syncUser = async () => {
    const res = await api.get("/auth/me");
    setUser(res.data.data);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      await syncUser();
      toast.success("Welcome back!");
      navigate("/");
    } catch (err: any) {
      const firebaseCode = err?.code as string | undefined;
      toast.error((firebaseCode && FIREBASE_ERRORS[firebaseCode]) || err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // Note: if user not registered, /me will 404 — send to register
      try {
        await syncUser();
        navigate("/");
      } catch {
        navigate("/register");
      }
    } catch (err: any) {
      const firebaseCode = err?.code as string | undefined;
      toast.error((firebaseCode && FIREBASE_ERRORS[firebaseCode]) || err?.message || "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
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
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your JobFinder account
            </p>
          </div>

          {/* Google */}
          <Button
            id="google-signin"
            variant="outline"
            className="w-full h-11 gap-2 mb-4"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {googleLoading ? "Signing in…" : "Continue with Google"}
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">
                or sign in with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            <Button
              id="login-submit"
              type="submit"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
