import { isValidObjectId } from "mongoose";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { firebaseAuth, firestore } from "../config/firebase.js";
import { generateToken } from "../utils/token.js";
import { ServiceError } from "./application.service.js";

export class AuthService {
  /**
   * Register a new user: supports normal worker and institution/company.
   */
  async register(data) {
    const {
      name,
      email,
      password,
      role = "candidate",
      userType,
      phone,
      profileImage,
      // Worker data collection
      headline,
      bio,
      skills = [],
      experience = 0,
      education = [],
      resumeURL,
      portfolioURL,
      expectedSalary,
      preferredJobType,
      // Institution data collection
      companyName,
      companyDescription,
      companyIndustry,
      companyLocation,
      companyWebsite,
      companyLogo,
      registrationNumber,
      // Pre-assigned company code / invite
      companyId,
    } = data;

    if (!name || !name.trim()) {
      throw new ServiceError(400, "Name is required");
    }
    if (!email || !email.trim()) {
      throw new ServiceError(400, "Email is required");
    }
    if (!password || password.length < 6) {
      throw new ServiceError(400, "Password must be at least 6 characters");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new ServiceError(409, "User with this email already exists");
    }

    // Determine role and userType
    const normalizedRole = ["employer", "institution"].includes(role)
      ? "employer"
      : ["hr", "recruiter"].includes(role)
        ? "hr"
        : "candidate";

    const determinedUserType =
      userType || (normalizedRole === "employer" ? "institution" : "worker");

    // Try creating user in Firebase Auth if available
    let firebaseUID = null;
    try {
      const fbUser = await firebaseAuth.createUser({
        displayName: name.trim(),
        email: normalizedEmail,
        password: password,
      });
      firebaseUID = fbUser.uid;

      // Also record in firestore
      try {
        await firestore
          .collection(normalizedRole === "employer" ? "employer" : "candidate")
          .doc(fbUser.uid)
          .set({
            name: name.trim(),
            email: normalizedEmail,
            role: normalizedRole,
            userType: determinedUserType,
            createdAt: new Date().toISOString(),
          });
      } catch (fsErr) {
        // Firestore sync optional
      }
    } catch (fbErr) {
      if (fbErr.code === "auth/email-already-exists") {
        try {
          const existingFb = await firebaseAuth.getUserByEmail(normalizedEmail);
          firebaseUID = existingFb.uid;
        } catch {
          // Fallback if network
        }
      }
      // If Firebase credentials error or network, proceed with local MongoDB user
    }

    // Create User document in MongoDB
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password, // hashed by pre-save hook
      role: normalizedRole,
      userType: determinedUserType,
      phone: phone?.trim(),
      profileImage: profileImage?.trim(),
      // Normal Worker details
      headline: headline?.trim(),
      bio: bio?.trim(),
      skills: Array.isArray(skills) ? skills : [],
      experience: Number(experience) || 0,
      education: Array.isArray(education) ? education : [],
      resumeURL: resumeURL?.trim(),
      portfolioURL: portfolioURL?.trim(),
      expectedSalary: expectedSalary ? Number(expectedSalary) : undefined,
      preferredJobType: preferredJobType?.trim() || "Full Time",
    });

    if (firebaseUID) {
      user.firebaseUID = firebaseUID;
    }

    // If joining an existing company
    if (companyId && isValidObjectId(companyId)) {
      const targetCompany = await Company.findById(companyId);
      if (targetCompany) {
        user.company = targetCompany._id;
        user.companyRole = normalizedRole === "hr" ? "hr" : "employee";
        user.companyAccessTerms = {
          hasAccess: true,
          status: "active",
          terms: "Standard company operational terms",
          permissions:
            normalizedRole === "hr"
              ? [
                  "view_company",
                  "view_jobs",
                  "operate_job_portal",
                  "view_applications",
                  "manage_applications",
                  "schedule_interviews",
                ]
              : ["view_company", "view_jobs"],
          assignedJobs: [],
          assignedAt: new Date(),
        };

        targetCompany.workers.push({
          user: user._id,
          companyRole: user.companyRole,
          status: "active",
          terms: "Standard company operational terms",
          permissions: user.companyAccessTerms.permissions,
          assignedJobs: [],
          joinedAt: new Date(),
        });
        targetCompany.employees += 1;
        await targetCompany.save();
      }
    }

    await user.save();

    // If registering as an institution / employer and company info is provided, create the Company
    let createdCompany = null;
    if (normalizedRole === "employer") {
      const targetCompanyName = companyName?.trim() || `${name.trim()}'s Company`;
      createdCompany = await Company.create({
        name: targetCompanyName,
        description: companyDescription?.trim() || "",
        industry: companyIndustry?.trim() || "Technology",
        location: companyLocation?.trim() || "Remote",
        website: companyWebsite?.trim() || "",
        logo: companyLogo?.trim() || "",
        registrationNumber: registrationNumber?.trim() || "",
        contactEmail: normalizedEmail,
        contactPhone: phone?.trim() || "",
        owner: user._id,
        employees: 1,
        workers: [],
      });

      user.company = createdCompany._id;
      user.companyRole = "owner";
      await user.save();
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      userType: user.userType,
      companyId: user.company?.toString() || null,
    });

    return {
      user: {
        _id: user._id,
        firebaseUID: user.firebaseUID,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        headline: user.headline,
        skills: user.skills,
        experience: user.experience,
        resumeURL: user.resumeURL,
        company: user.company,
        companyRole: user.companyRole,
        companyAccessTerms: user.companyAccessTerms,
      },
      company: createdCompany,
      token,
    };
  }

  /**
   * Login user with Email & Password or Firebase ID Token
   */
  async login({ email, password, idToken }) {
    let user = null;

    // 1. Firebase ID Token Login
    if (idToken) {
      try {
        const decoded = await firebaseAuth.verifyIdToken(idToken);
        if (decoded?.uid) {
          user = await User.findOne({ firebaseUID: decoded.uid });
          if (!user && decoded.email) {
            user = await User.findOne({ email: decoded.email.toLowerCase() });
          }
        }
      } catch (err) {
        throw new ServiceError(401, "Invalid or expired Firebase ID token");
      }
    } else {
      // 2. Email & Password Login
      if (!email || !password) {
        throw new ServiceError(400, "Email and password are required");
      }

      user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
      if (!user) {
        throw new ServiceError(401, "Invalid email or password");
      }

      if (!user.password) {
        // User was created without a password hash (e.g. legacy or Firebase Auth)
        user.password = password;
        await user.save();
      } else {
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          throw new ServiceError(401, "Invalid email or password");
        }
      }
    }

    if (!user) {
      throw new ServiceError(404, "User account not found");
    }

    // Populate Company info and verify live access terms
    let companyDetails = null;
    let accessStatus = "active";
    let hasAccess = true;

    // If employer doesn't have a company yet, automatically associate or create one
    if (user.role === "employer" && !user.company) {
      let existingCompany = await Company.findOne({ owner: user._id });
      if (!existingCompany) {
        existingCompany = await Company.create({
          name: `${user.name}'s Company`,
          owner: user._id,
          location: "Remote",
          industry: "Technology",
          contactEmail: user.email,
        });
      }
      user.company = existingCompany._id;
      user.companyRole = "owner";
      await user.save();
      companyDetails = existingCompany.toObject ? existingCompany.toObject() : existingCompany;
    } else if (user.company) {
      companyDetails = await Company.findById(user.company).lean();
      if (companyDetails) {
        if (companyDetails.owner.toString() === user._id.toString()) {
          user.companyRole = "owner";
          hasAccess = true;
          accessStatus = "active";
        } else {
          // Check worker record in company
          const worker = (companyDetails.workers || []).find(
            (w) => w.user.toString() === user._id.toString(),
          );
          if (worker) {
            accessStatus = worker.status;
            hasAccess = worker.status === "active";
            // Synchronize with user's companyAccessTerms
            user.companyAccessTerms.status = worker.status;
            user.companyAccessTerms.hasAccess = hasAccess;
            user.companyAccessTerms.permissions = worker.permissions;
            user.companyAccessTerms.assignedJobs = worker.assignedJobs;
            await user.save();
          }
        }
      }
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      userType: user.userType,
      companyId: user.company?.toString() || null,
      companyStatus: accessStatus,
    });

    return {
      user: {
        _id: user._id,
        firebaseUID: user.firebaseUID,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        headline: user.headline,
        bio: user.bio,
        skills: user.skills,
        experience: user.experience,
        resumeURL: user.resumeURL,
        phone: user.phone,
        company: user.company,
        companyRole: user.companyRole,
        companyAccessTerms: user.companyAccessTerms,
      },
      company: companyDetails
        ? {
            _id: companyDetails._id,
            name: companyDetails.name,
            industry: companyDetails.industry,
            location: companyDetails.location,
            logo: companyDetails.logo,
            accessStatus,
            hasAccess,
          }
        : null,
      token,
    };
  }

  /**
   * Get current authenticated user details and live access terms
   */
  async getMe(userId) {
    let user = await User.findById(userId);

    if (!user) {
      throw new ServiceError(404, "User not found");
    }

    // If employer doesn't have a company yet, auto-create
    if (user.role === "employer" && !user.company) {
      let existingCompany = await Company.findOne({ owner: user._id });
      if (!existingCompany) {
        existingCompany = await Company.create({
          name: `${user.name}'s Company`,
          owner: user._id,
          location: "Remote",
          industry: "Technology",
          contactEmail: user.email,
        });
      }
      user.company = existingCompany._id;
      user.companyRole = "owner";
      await user.save();
    }

    user = await User.findById(userId)
      .populate("company", "name industry location logo owner employees workers")
      .populate("companyAccessTerms.assignedJobs", "title location jobType status applicants");

    // Refresh live company terms if associated with a company
    if (user.company) {
      const company = user.company;
      const isOwner = company.owner?.toString() === user._id.toString();

      if (!isOwner && company.workers) {
        const workerRecord = company.workers.find(
          (w) => w.user.toString() === user._id.toString(),
        );
        if (workerRecord) {
          user.companyAccessTerms.status = workerRecord.status;
          user.companyAccessTerms.hasAccess = workerRecord.status === "active";
          user.companyAccessTerms.permissions = workerRecord.permissions;
          user.companyAccessTerms.assignedJobs = workerRecord.assignedJobs;
        }
      }
    }

    return user;
  }
}

export const authService = new AuthService();
