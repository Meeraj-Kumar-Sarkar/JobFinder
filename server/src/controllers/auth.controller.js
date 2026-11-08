import { authService } from "../services/auth.service.js";
import { ServiceError } from "../services/application.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const handleAuthError = (res, error, defaultMessage) => {
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists.",
    });
  }

  console.error(`${defaultMessage}:`, error);
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined,
  });
};

export class AuthController {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      return res
        .status(201)
        .json(new ApiResponse(201, result, "User registered successfully"));
    } catch (error) {
      return handleAuthError(res, error, "Failed to register user");
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Login successful"));
    } catch (error) {
      return handleAuthError(res, error, "Failed to authenticate user");
    }
  }

  async getMe(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Authentication required" });
      }

      const user = await authService.getMe(userId);
      return res
        .status(200)
        .json(new ApiResponse(200, user, "User profile retrieved successfully"));
    } catch (error) {
      return handleAuthError(res, error, "Failed to retrieve user profile");
    }
  }

  async logout(req, res) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Logged out successfully"));
  }
}

export const authController = new AuthController();
