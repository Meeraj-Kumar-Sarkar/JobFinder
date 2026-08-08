import { Router } from "express";

import { uploadResume } from "../controllers/upload.controller";

import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { upload } from "../middleware/upload";

const router = Router();

router.post(
  "/resume",
  authenticate,
  authorize("candidate"),
  upload.single("resume"),
  uploadResume,
);

export default router;
