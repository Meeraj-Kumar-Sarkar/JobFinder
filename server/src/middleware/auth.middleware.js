import { isValidObjectId } from "mongoose";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { firebaseAuth } from "../config/firebase.js";
import { verifyCustomToken } from "../utils/token.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Extract authenticated user from Authorization Bearer token.
 * Supports both Firebase ID Tokens and custom backend JWTs.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Support x-user-id header ONLY outside production for automated local test harnesses
      if (
        process.env.NODE_ENV !== "production" &&
        req.headers["x-user-id"] &&
        isValidObjectId(req.headers["x-user-id"])
      ) {
        const testUser = await User.findById(req.headers["x-user-id"]);
        if (testUser) {
          req.user = testUser;
          return next();
        }
      }
      return res.status(401).json({
        success: false,
        message: "Missing or invalid authorization header. Bearer token required.",
      });
    }

    const token = authHeader.slice(7).trim();
    let user = null;

    // 1. Try Custom Backend JWT
    const customPayload = verifyCustomToken(token);
    if (customPayload && customPayload.userId) {
      user = await User.findById(customPayload.userId);
    }

    // 2. If not custom JWT, try Firebase ID token
    if (!user) {
      try {
        const decoded = await firebaseAuth.verifyIdToken(token);
        if (decoded && decoded.uid) {
          user = await User.findOne({ firebaseUID: decoded.uid });
          if (!user && decoded.email) {
            user = await User.findOne({ email: decoded.email.toLowerCase() });
          }
        }
      } catch (fbErr) {
        // Not a valid firebase token
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authorization token.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
};

/**
 * Optional authentication - extracts user if valid token is provided, but proceeds if not.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const customPayload = verifyCustomToken(token);
      if (customPayload?.userId) {
        req.user = await User.findById(customPayload.userId);
      } else {
        try {
          const decoded = await firebaseAuth.verifyIdToken(token);
          if (decoded?.uid) {
            req.user = await User.findOne({ firebaseUID: decoded.uid });
          }
        } catch {
          // Ignore token error for optional auth
        }
      }
    } else if (
      process.env.NODE_ENV !== "production" &&
      req.headers["x-user-id"] &&
      isValidObjectId(req.headers["x-user-id"])
    ) {
      req.user = await User.findById(req.headers["x-user-id"]);
    }
    next();
  } catch {
    next();
  }
};

/**
 * Restrict access to specific global user roles (e.g. employer, candidate, hr).
 */
export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role) && !roles.includes(req.user.companyRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. One of the following roles is required: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Middleware: Verify and enforce company database and job portal access.
 * Checks whether the user is the company owner OR an active company worker/HR.
 * Enforces dynamic terms: If the company changed terms (status suspended/revoked or hasAccess=false),
 * access is immediately denied.
 */
export const requireCompanyAccess = (requiredPermission = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to access company resources.",
        });
      }

      // Determine the target company ID from params, body, query, or user's assigned company
      const companyId =
        req.params.companyId ||
        req.params.id ||
        req.body.companyId ||
        req.body.company ||
        req.query.companyId ||
        req.user.company;

      if (!companyId || !isValidObjectId(companyId)) {
        return res.status(400).json({
          success: false,
          message: "Valid Company ID is required for access verification.",
        });
      }

      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Company not found.",
        });
      }

      req.targetCompany = company;

      // 1. Is the caller the company owner?
      if (company.owner.toString() === req.user._id.toString()) {
        req.isCompanyOwner = true;
        req.hasFullCompanyAccess = true;
        return next();
      }

      // 2. The caller is a worker / HR member. Verify membership & dynamic terms.
      const userCompanyId = req.user.company ? req.user.company.toString() : null;
      if (userCompanyId !== company._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You are not affiliated with this company.",
        });
      }

      // Check User's local company access terms
      const userTerms = req.user.companyAccessTerms || {};
      
      // Also cross-verify with Company workers record for absolute sync
      const workerRecord = company.workers.find(
        (w) => w.user.toString() === req.user._id.toString(),
      );

      const effectiveStatus = workerRecord ? workerRecord.status : userTerms.status;
      const effectiveHasAccess =
        userTerms.hasAccess !== false && effectiveStatus === "active";

      if (!effectiveHasAccess) {
        return res.status(403).json({
          success: false,
          code: "COMPANY_ACCESS_REVOKED",
          message: `Access denied. Your access to this company database is ${effectiveStatus || "inactive"}. Company terms have changed.`,
          termsStatus: effectiveStatus || "inactive",
        });
      }

      // 3. Permission check
      if (requiredPermission) {
        const userPermissions = workerRecord?.permissions || userTerms.permissions || [];
        const hasPermission =
          userPermissions.includes(requiredPermission) ||
          userPermissions.includes("manage_company") ||
          req.user.companyRole === "admin";

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            code: "INSUFFICIENT_COMPANY_PERMISSION",
            message: `Access denied. You do not have the required '${requiredPermission}' permission in this company.`,
          });
        }
      }

      req.isCompanyWorker = true;
      req.workerTerms = userTerms;
      req.workerRecord = workerRecord;
      next();
    } catch (err) {
      console.error("requireCompanyAccess error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to verify company access permissions.",
      });
    }
  };
};
