import { Router } from "express";
import { jobController } from "../controllers/job.controller.js";
import { optionalAuth, authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Create new job posting (Company Owner or active HR with permissions)
router.post("/", optionalAuth, (req, res) => jobController.createJob(req, res));

// List / search jobs
router.get("/", (req, res) => jobController.getJobs(req, res));

// Get jobs assigned to the authenticated HR / worker
router.get("/assigned", authenticate, (req, res) =>
  jobController.getAssignedJobs(req, res),
);
router.get("/assigned/:workerId", optionalAuth, (req, res) =>
  jobController.getAssignedJobs(req, res),
);

// Get single job details
router.get("/:id", (req, res) => jobController.getJobById(req, res));

// Update job posting
router.put("/:id", optionalAuth, (req, res) => jobController.updateJob(req, res));
router.patch("/:id", optionalAuth, (req, res) => jobController.updateJob(req, res));

export default router;
