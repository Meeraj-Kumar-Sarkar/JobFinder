import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Dedicated Worker data collection / onboarding
router.put("/worker-profile", authenticate, (req, res) =>
  userController.updateWorkerProfile(req, res),
);
router.patch("/worker-profile", authenticate, (req, res) =>
  userController.updateWorkerProfile(req, res),
);

// Get current user profile
router.get("/profile", authenticate, (req, res) => userController.getProfile(req, res));

// Update general profile
router.put("/profile", authenticate, (req, res) => userController.updateProfile(req, res));
router.patch("/profile", authenticate, (req, res) => userController.updateProfile(req, res));

// Parameterized routes (by ID)
router.get("/:id", (req, res) => userController.getProfile(req, res));
router.put("/:id/worker-profile", (req, res) =>
  userController.updateWorkerProfile(req, res),
);
router.put("/:id", (req, res) => userController.updateProfile(req, res));
router.patch("/:id", (req, res) => userController.updateProfile(req, res));

export default router;
