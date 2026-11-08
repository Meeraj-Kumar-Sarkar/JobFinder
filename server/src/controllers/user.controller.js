import { userService } from "../services/user.service.js";
import { ServiceError } from "../services/application.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const handleUserError = (res, error, defaultMessage) => {
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error(`${defaultMessage}:`, error);
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined,
  });
};

export class UserController {
  async getProfile(req, res) {
    try {
      const targetId = (req.params.id || req.user?._id)?.toString();
      if (!targetId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }

      const user = await userService.getUserById(targetId);
      return res.status(200).json(new ApiResponse(200, user, "User retrieved successfully"));
    } catch (error) {
      return handleUserError(res, error, "Failed to retrieve user");
    }
  }

  async updateProfile(req, res) {
    try {
      const targetId = (req.params.id || req.user?._id)?.toString();
      if (!targetId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }

      const updated = await userService.updateUserProfile(targetId, req.body);
      return res.status(200).json(new ApiResponse(200, updated, "Profile updated successfully"));
    } catch (error) {
      return handleUserError(res, error, "Failed to update profile");
    }
  }

  async updateWorkerProfile(req, res) {
    try {
      const targetId = (req.params.id || req.user?._id)?.toString();
      if (!targetId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }

      const updated = await userService.updateWorkerProfile(targetId, req.body);
      return res
        .status(200)
        .json(new ApiResponse(200, updated, "Worker profile updated successfully"));
    } catch (error) {
      return handleUserError(res, error, "Failed to update worker profile");
    }
  }
}

export const userController = new UserController();
