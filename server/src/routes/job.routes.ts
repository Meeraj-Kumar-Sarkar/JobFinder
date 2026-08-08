import { Router } from "express";

import {
  createJob,
  getJobs,
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
