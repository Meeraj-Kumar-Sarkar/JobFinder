import express from "express";
import cors from "cors";
import applicationRoutes from "./routes/application.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import companyRoutes from "./routes/company.routes.js";
import jobRoutes from "./routes/job.routes.js";
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

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Modular RESTful API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

// Direct routes (backward-compatible)
app.post("/create_newUser", create_newUser);
app.post("/update_newUser", update_newUser);
app.post("/create_newJob", create_newJob);
app.post("/create_newApplication", create_newApplication);
app.post("/my_JobApplications", my_JobApplications);
app.post("/get_applications", employee_getJobApplications);
app.post("/update_ApplicationStatus", update_ApplicationStatus);
app.post("/hiring_decision", final_hiringDecision);
app.post("/schedule_interview", schedule_interview);
app.post("/withdraw_application", withdraw_application);
app.post("/create_company", create_company);

export default app;
