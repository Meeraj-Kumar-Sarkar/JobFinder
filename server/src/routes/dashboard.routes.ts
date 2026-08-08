import { Router } from "express";

import { employerDashboard } from "../controllers";

import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

router.get("/employer", authenticate, authorize("employer"), employerDashboard);

export default router;
