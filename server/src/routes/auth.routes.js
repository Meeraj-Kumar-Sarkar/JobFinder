import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Registration / Signup
router.post("/register", (req, res) => authController.register(req, res));
router.post("/signup", (req, res) => authController.register(req, res));

// Login / Signin (Email+Password or Firebase Google ID Token)
router.post("/login", (req, res) => authController.login(req, res));
router.post("/signin", (req, res) => authController.login(req, res));
router.post("/google", (req, res) => authController.login(req, res));

// Current authenticated user & live permissions
router.get("/me", authenticate, (req, res) => authController.getMe(req, res));

// Logout
router.post("/logout", (req, res) => authController.logout(req, res));

export default router;
