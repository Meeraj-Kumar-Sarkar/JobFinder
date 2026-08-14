import { Router } from "express";

import {
  applyJob,
  getMyApplications,
  updateStatus,
} from "../controllers/application.controller";

import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";

import {
  applyJobSchema,
  updateApplicationStatusSchema,
} from "../validators/application.validator";

const router = Router();

// Candidate
router.get("/my", authenticate, authorize("candidate"), getMyApplications);

router.post(
  "/",
  authenticate,
  authorize("candidate"),
  validate(applyJobSchema),
  applyJob,
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("employer"),
  validate(updateApplicationStatusSchema),
  updateStatus,
);

export default router;

