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
   * Update user profile (supports both general and candidate/worker fields)
   */
  async updateUserProfile(userId, updateData) {
    if (!isValidObjectId(userId)) {
      throw new ServiceError(400, "Invalid user ID format");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ServiceError(404, "User not found");
    }

    if (updateData.name !== undefined) {
      const trimmedName = String(updateData.name).trim();
      if (!trimmedName) {
        throw new ServiceError(400, "Name cannot be empty");
      }
      user.name = trimmedName;
    }

    if (updateData.phone !== undefined) {
      user.phone = String(updateData.phone).trim();
    }

    if (updateData.profileImage !== undefined) {
      user.profileImage = updateData.profileImage
        ? sanitizeUrl(updateData.profileImage)
        : "";
    }

    if (updateData.headline !== undefined) {
      user.headline = String(updateData.headline).trim();
    }

    if (updateData.bio !== undefined) {
      user.bio = String(updateData.bio).trim();
    }

    if (updateData.skills !== undefined) {
      if (Array.isArray(updateData.skills)) {
        user.skills = updateData.skills.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof updateData.skills === "string") {
        user.skills = updateData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    if (updateData.experience !== undefined) {
      const expNum = Number(updateData.experience);
      if (!isNaN(expNum) && expNum >= 0) {
        user.experience = expNum;
      }
    }

    if (updateData.education !== undefined && Array.isArray(updateData.education)) {
      user.education = updateData.education;
    }

    if (updateData.resumeURL !== undefined) {
      const rawResume = String(updateData.resumeURL).trim();
      if (rawResume) {
        const safeResume = sanitizeUrl(rawResume);
        if (!safeResume) {
          throw new ServiceError(400, "Please provide a valid HTTP/HTTPS URL for your resume");
        }
        user.resumeURL = safeResume;
      } else {
        user.resumeURL = "";
      }
    }

    if (updateData.portfolioURL !== undefined) {
      const rawPortfolio = String(updateData.portfolioURL).trim();
      if (rawPortfolio) {
        const safePortfolio = sanitizeUrl(rawPortfolio);
        if (!safePortfolio) {
          throw new ServiceError(400, "Please provide a valid HTTP/HTTPS URL for your portfolio");
        }
        user.portfolioURL = safePortfolio;
      } else {
        user.portfolioURL = "";
      }
    }

    if (updateData.expectedSalary !== undefined) {
      user.expectedSalary = Number(updateData.expectedSalary);
    }

    if (updateData.preferredJobType !== undefined) {
      user.preferredJobType = String(updateData.preferredJobType).trim();
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
