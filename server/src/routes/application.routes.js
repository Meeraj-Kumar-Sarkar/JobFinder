import { Router } from "express";
import { applicationController } from "../controllers/application.controller.js";

const router = Router();

// Candidate: Apply for a job
router.post("/", (req, res) => applicationController.createApplication(req, res));
router.post("/apply", (req, res) => applicationController.createApplication(req, res));

// Candidate: View submitted applications
router.get("/my-applications", (req, res) =>
  applicationController.getCandidateApplications(req, res),
);
router.post("/my-applications", (req, res) =>
  applicationController.getCandidateApplications(req, res),
);

// Employer: View all applications across all posted jobs
router.get("/employer/:employerId", (req, res) =>
  applicationController.getEmployerApplications(req, res),
);
router.get("/employer-applications", (req, res) =>
  applicationController.getEmployerApplications(req, res),
);

// Employer: Pipeline stats for a specific job
router.get("/stats/:jobId", (req, res) =>
  applicationController.getApplicationStats(req, res),
);

// Employer: View applicants for a specific job
router.get("/job/:jobId", (req, res) =>
  applicationController.getJobApplications(req, res),
);
router.post("/job-applicants", (req, res) =>
  applicationController.getJobApplications(req, res),
);

// Single application details
router.get("/:id", (req, res) =>
  applicationController.getApplicationById(req, res),
);

// Employer: Update application status (ATS stage progression)
router.patch("/:id/status", (req, res) =>
  applicationController.updateApplicationStatus(req, res),
);
router.post("/update-status", (req, res) =>
  applicationController.updateApplicationStatus(req, res),
);

// Employer: Schedule interview
router.post("/:id/schedule-interview", (req, res) =>
  applicationController.scheduleInterview(req, res),
);
router.post("/schedule-interview", (req, res) =>
  applicationController.scheduleInterview(req, res),
);

// Employer: Final hiring decision (Hired / Rejected)
router.post("/:id/decision", (req, res) =>
  applicationController.hiringDecision(req, res),
);
router.post("/decision", (req, res) =>
  applicationController.hiringDecision(req, res),
);

// Candidate: Withdraw application
router.delete("/:id", (req, res) =>
  applicationController.withdrawApplication(req, res),
);
router.post("/withdraw", (req, res) =>
  applicationController.withdrawApplication(req, res),
);

export default router;
