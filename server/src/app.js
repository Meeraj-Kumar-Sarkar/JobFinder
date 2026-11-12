import express from "express";
import cors from "cors";
import helmet from "helmet";
import applicationRoutes from "./routes/application.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import companyRoutes from "./routes/company.routes.js";
import jobRoutes from "./routes/job.routes.js";
import {
  sanitizeRequest,
  createRateLimiter,
} from "./middleware/security.middleware.js";
import { create_newUser, update_newUser } from "./middleware/User.js";
import { create_newJob } from "./middleware/Job.js";
import {
  create_newApplication,
  final_hiringDecision,
  update_ApplicationStatus,
  my_JobApplications,
  employee_getJobApplications,
  schedule_interview,
  withdraw_application,
} from "./middleware/Application.js";
import { create_company } from "./middleware/Company.js";

const app = express();

// 1. Security HTTP Headers (X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options, etc.)
app.use(helmet());

// 2. Strict CORS Configuration
const getAllowedOrigins = () =>
  [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ]
    .filter(Boolean)
    .map((url) => url.replace(/\/+$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, health checks, or same-origin requests
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, "");
      const allowedOrigins = getAllowedOrigins();

      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(normalizedOrigin)
      ) {
        return callback(null, true);
      }

      // Allow localhost in non-production or preview URLs when CLIENT_URL is not yet locked down
      if (
        process.env.NODE_ENV !== "production" &&
        normalizedOrigin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }

      if (
        !process.env.CLIENT_URL &&
        (normalizedOrigin.endsWith(".vercel.app") ||
          normalizedOrigin.endsWith(".netlify.app") ||
          normalizedOrigin.endsWith(".onrender.com"))
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// 3. Payload Size Limits (prevents memory exhaustion / DoS attacks)
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// 4. NoSQL Injection & Prototype Pollution Sanitizer
app.use(sanitizeRequest);

// 5. Rate Limiting (Brute-force & Abuse Protection)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 auth attempts per 15 minutes per IP
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute per IP
  message: "Too many API requests from this IP. Please slow down.",
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Modular RESTful API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/companies", apiLimiter, companyRoutes);
app.use("/api/jobs", apiLimiter, jobRoutes);
app.use("/api/applications", apiLimiter, applicationRoutes);

// Direct routes (backward-compatible)
app.post("/create_newUser", authLimiter, create_newUser);
app.post("/update_newUser", apiLimiter, update_newUser);
app.post("/create_newJob", apiLimiter, create_newJob);
app.post("/create_newApplication", apiLimiter, create_newApplication);
app.post("/my_JobApplications", apiLimiter, my_JobApplications);
app.post("/get_applications", apiLimiter, employee_getJobApplications);
app.post("/update_ApplicationStatus", apiLimiter, update_ApplicationStatus);
app.post("/hiring_decision", apiLimiter, final_hiringDecision);
app.post("/schedule_interview", apiLimiter, schedule_interview);
app.post("/withdraw_application", apiLimiter, withdraw_application);
app.post("/create_company", apiLimiter, create_company);

// Global Error Handler (prevents stack trace leakage in production)
app.use((err, _req, res, _next) => {
  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Cross-Origin Request Blocked by CORS policy.",
    });
  }

  const statusCode = err?.status || err?.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err?.message || "Internal server error",
  });
});

export default app;
