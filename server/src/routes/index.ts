import { Router } from "express";

import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import companyRoutes from "./company.routes";
import jobRoutes from "./job.routes";
import applicationRoutes from "./application.routes";
import uploadRoutes from "./upload.routes";
import dashboardRoutes from "./dashboard.routes";
import notificationRoutes from "./notification.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/companies", companyRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/upload", uploadRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notification", notificationRoutes);

export default router;
