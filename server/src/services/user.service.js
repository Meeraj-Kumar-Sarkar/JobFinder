import { isValidObjectId } from "mongoose";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { ServiceError } from "./application.service.js";
import { sanitizeUrl } from "../middleware/security.middleware.js";

export class UserService {
  /**
   * Get user profile by ID
   */
  async getUserById(userId) {
    if (!isValidObjectId(userId)) {
      throw new ServiceError(400, "Invalid user ID format");
    }

    const user = await User.findById(userId)
      .populate("company", "name industry location logo owner employees")
      .populate("companyAccessTerms.assignedJobs", "title location status applicants");

    if (!user) {
      throw new ServiceError(404, "User not found");
    }

    return user;
  }

  /**
   * Update general user profile
   */
  async updateUserProfile(userId, updateData) {
    if (!isValidObjectId(userId)) {
      throw new ServiceError(400, "Invalid user ID format");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ServiceError(404, "User not found");
    }

    // Allowed common fields
    const allowed = ["name", "phone", "profileImage", "headline", "bio"];
    for (const field of allowed) {
      if (updateData[field] !== undefined) {
        user[field] =
          field === "profileImage"
            ? sanitizeUrl(updateData[field])
            : String(updateData[field]).trim();
      }
    }

    await user.save();
    return user;
  }

  /**
   * Update normal worker data / candidate profile
   */
  async updateWorkerProfile(userId, workerData) {
    if (!isValidObjectId(userId)) {
      throw new ServiceError(400, "Invalid user ID format");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ServiceError(404, "User not found");
    }

    const {
      headline,
      bio,
      phone,
      profileImage,
      skills,
      experience,
      education,
      resumeURL,
      portfolioURL,
      expectedSalary,
      preferredJobType,
    } = workerData;

    if (headline !== undefined) user.headline = headline?.trim();
    if (bio !== undefined) user.bio = bio?.trim();
    if (phone !== undefined) user.phone = phone?.trim();
    if (profileImage !== undefined) user.profileImage = sanitizeUrl(profileImage);

    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        throw new ServiceError(400, "Skills must be an array of strings");
      }
      user.skills = skills.map((s) => String(s).trim()).filter(Boolean);
    }

    if (experience !== undefined) {
      const expNum = Number(experience);
      if (isNaN(expNum) || expNum < 0) {
        throw new ServiceError(400, "Experience must be a positive number");
      }
      user.experience = expNum;
    }

    if (education !== undefined) {
      if (!Array.isArray(education)) {
        throw new ServiceError(400, "Education must be an array");
      }
      user.education = education;
    }

    if (resumeURL !== undefined) user.resumeURL = sanitizeUrl(resumeURL);
    if (portfolioURL !== undefined) user.portfolioURL = sanitizeUrl(portfolioURL);
    if (expectedSalary !== undefined) user.expectedSalary = Number(expectedSalary);
    if (preferredJobType !== undefined) user.preferredJobType = preferredJobType?.trim();

    await user.save();
    return user;
  }
}

export const userService = new UserService();
