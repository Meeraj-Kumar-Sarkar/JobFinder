import { Router } from "express";

import {
  createCompany,
  getCompany,
  updateCompany,
} from "../controllers/company.controller";

import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";

import { createCompanySchema } from "../validators/company.validator";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("employer"),
  validate(createCompanySchema),
  createCompany,
);

router.get("/:id", getCompany);

router.patch("/:id", authenticate, authorize("employer"), updateCompany);

export default router;
