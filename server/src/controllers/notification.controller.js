import { isValidObjectId } from "mongoose";
import Notification from "../models/Notification.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export class NotificationController {
  /**
   * GET /api/notifications
   * Fetch notifications for the authenticated user (or userId query param)
   */
  async getMyNotifications(req, res) {
    try {
      const userId = (
        req.user?._id ||
        req.query.userId ||
        req.params.userId
      )?.toString();

      if (!userId || !isValidObjectId(userId)) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to fetch notifications",
        });
      }

      const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));

      const [notifications, unreadCount] = await Promise.all([
        Notification.find({ user: userId })
          .populate({
            path: "job",
            select: "title location jobType company",
            populate: { path: "company", select: "name logo" },
          })
          .populate("sender", "name email role")
          .populate("application", "status interviewDate feedback")
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),
        Notification.countDocuments({ user: userId, isRead: false }),
      ]);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            notifications,
            unreadCount,
          },
          "Notifications retrieved successfully",
        ),
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
      });
    }
  }

  /**
   * POST /api/notifications/send
   * Send a direct message / notification to a candidate (and optionally attach to their application)
   */
  async sendMessage(req, res) {
    try {
      const { recipientId, applicationId, jobId, title, message, type } = req.body;

      if (!message || !String(message).trim()) {
        return res.status(400).json({
          success: false,
          message: "Message content is required",
        });
      }

      let targetUserId = recipientId;
      let targetJobId = jobId;
      let companyName = "";

      if (applicationId && isValidObjectId(applicationId)) {
        const app = await Application.findById(applicationId).populate({
          path: "job",
          select: "title company",
          populate: { path: "company", select: "name" },
        });

        if (app) {
          targetUserId = targetUserId || app.candidate?.toString();
          targetJobId = targetJobId || app.job?._id?.toString();
          companyName = app.job?.company?.name || "";

          // Also persist latest message in application.feedback so candidate sees it everywhere
          app.feedback = String(message).trim();
          await app.save();
        }
      }

      if (!targetUserId || !isValidObjectId(targetUserId)) {
        return res.status(400).json({
          success: false,
          message: "Valid recipient user ID or application ID is required",
        });
      }

      let jobTitle = "your application";
      if (targetJobId && isValidObjectId(targetJobId)) {
        const jobDoc = await Job.findById(targetJobId)
          .populate("company", "name")
          .select("title company");
        if (jobDoc) {
          jobTitle = jobDoc.title;
          if (!companyName && jobDoc.company?.name) {
            companyName = jobDoc.company.name;
          }
        }
      }

      const notification = await Notification.create({
        user: targetUserId,
        sender: req.user?._id || undefined,
        job: targetJobId && isValidObjectId(targetJobId) ? targetJobId : undefined,
        application:
          applicationId && isValidObjectId(applicationId) ? applicationId : undefined,
        companyName: companyName || undefined,
        type: type || "employer_message",
        title:
          title?.trim() ||
          `Message from ${companyName || "Hiring Team"} — ${jobTitle}`,
        message: String(message).trim(),
        isRead: false,
      });

      return res
        .status(201)
        .json(new ApiResponse(201, notification, "Message sent to candidate"));
    } catch (error) {
      console.error("Error sending notification message:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send message",
      });
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      if (!id || !isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Valid notification ID is required",
        });
      }

      const query = { _id: id };
      if (req.user?._id) {
        query.user = req.user._id;
      }

      const updated = await Notification.findOneAndUpdate(
        query,
        { isRead: true },
        { new: true },
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      return res
        .status(200)
        .json(new ApiResponse(200, updated, "Notification marked as read"));
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update notification",
      });
    }
  }

  /**
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req, res) {
    try {
      const userId = (req.user?._id || req.body.userId)?.toString();
      if (!userId || !isValidObjectId(userId)) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      await Notification.updateMany(
        { user: userId, isRead: false },
        { $set: { isRead: true } },
      );

      return res
        .status(200)
        .json(new ApiResponse(200, null, "All notifications marked as read"));
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read",
      });
    }
  }

  /**
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      if (!id || !isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Valid notification ID is required",
        });
      }

      const query = { _id: id };
      if (req.user?._id) {
        query.user = req.user._id;
      }

      await Notification.findOneAndDelete(query);
      return res
        .status(200)
        .json(new ApiResponse(200, null, "Notification deleted"));
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete notification",
      });
    }
  }
}

export const notificationController = new NotificationController();
