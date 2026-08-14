import { Router } from "express";

import {
  createJob,
  getJobs,
  getMyJobs,
  getJobApplications,
  getJob,
  updateJob,
  deleteJob,
} from "../controllers/job.controller";

import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";

import { createJobSchema } from "../validators/job.validator";

const router = Router();

// Public routes
router.get("/", getJobs);

// Employer routes (Must be registered BEFORE /:id to prevent "mine" matching :id)
router.get("/mine", authenticate, authorize("employer"), getMyJobs);
router.get(
  "/:id/applications",
  authenticate,
  authorize("employer"),
  getJobApplications,
);

// Public route for single job
router.get("/:id", getJob);

// Employer routes
router.post(
  "/",
  authenticate,
  authorize("employer"),
  validate(createJobSchema),
  createJob,
);

router.patch("/:id", authenticate, authorize("employer"), updateJob);

router.delete("/:id", authenticate, authorize("employer"), deleteJob);

export default router;

