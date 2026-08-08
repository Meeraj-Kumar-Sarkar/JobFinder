import { Router } from "express";

import { updateProfile, saveJob } from "../controllers/user.controller";

import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";

import { updateProfileSchema } from "../validators/user.validator";

const router = Router();

router.patch(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  updateProfile,
);

router.post(
  "/saved-jobs/:jobId",
  authenticate,
  authorize("candidate"),
  saveJob,
);

export default router;
