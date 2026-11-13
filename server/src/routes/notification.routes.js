import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(optionalAuth);

// Fetch user's notifications
router.get("/", (req, res) => notificationController.getMyNotifications(req, res));

// Send a direct message / notification to a candidate
router.post("/send", (req, res) => notificationController.sendMessage(req, res));

// Mark all notifications as read
router.patch("/read-all", (req, res) =>
  notificationController.markAllAsRead(req, res),
);

// Mark single notification as read
router.patch("/:id/read", (req, res) =>
  notificationController.markAsRead(req, res),
);

// Delete single notification
router.delete("/:id", (req, res) =>
  notificationController.deleteNotification(req, res),
);

export default router;
