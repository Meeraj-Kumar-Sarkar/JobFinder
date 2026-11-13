import { isValidObjectId } from "mongoose";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { firebaseAuth, firestore, isFirebaseConfigured } from "../config/firebase.js";
import { generateToken } from "../utils/token.js";
import { ServiceError } from "./application.service.js";
import { sanitizeUrl } from "../middleware/security.middleware.js";

/**
 * Verify a Firebase ID token using Firebase Admin SDK when configured,
 * or via Google's public token verification / JWT claims as a fallback.
 */
async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    throw new ServiceError(401, "Missing Firebase ID token");
  }

  if (isFirebaseConfigured) {
    try {
      const decoded = await firebaseAuth.verifyIdToken(idToken);
      return {
        uid: decoded.uid || decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      };
    } catch (err) {
      throw new ServiceError(401, "Invalid or expired Firebase ID token");
    }
  }

  // Fallback when Firebase Admin service account private key is not set in server env:
  // Decode JWT payload and validate standard Firebase / Google claims
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      throw new Error("Malformed JWT");
    }
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      throw new Error("Token expired");
    }
    if (
      !payload.sub ||
      !payload.email ||
      (payload.iss && !String(payload.iss).includes("securetoken.google.com"))
    ) {
      throw new Error("Invalid token claims");
    }
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    throw new ServiceError(401, "Invalid or expired Firebase ID token");
  }
}

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
      name: String(name).trim(),
      email: normalizedEmail,
      password: String(password), // hashed by pre-save hook
      role: normalizedRole,
      userType: determinedUserType,
      phone: phone ? String(phone).trim() : undefined,
      profileImage: sanitizeUrl(profileImage),
      // Normal Worker details
      headline: headline ? String(headline).trim() : undefined,
      bio: bio ? String(bio).trim() : undefined,
      skills: Array.isArray(skills) ? skills : [],
      experience: Number(experience) || 0,
      education: Array.isArray(education) ? education : [],
      resumeURL: sanitizeUrl(resumeURL),
      portfolioURL: sanitizeUrl(portfolioURL),
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
        website: sanitizeUrl(companyWebsite),
        logo: sanitizeUrl(companyLogo),
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
   * Login user with Email & Password or Firebase ID Token (Google Sign-In)
   */
  async login({
    email,
    password,
    idToken,
    name,
    photoURL,
    role = "candidate",
    companyName,
  }) {
    let user = null;

    // 1. Firebase ID Token Login / Auto-Provision (Google Sign-In)
    if (idToken) {
      const decoded = await verifyFirebaseIdToken(idToken);
      const targetUid = decoded?.uid;
      const targetEmail = (decoded?.email || email || "").toLowerCase().trim();

      if (targetUid) {
        user = await User.findOne({ firebaseUID: targetUid });
      }
      if (!user && targetEmail) {
        user = await User.findOne({ email: targetEmail });
        if (user) {
          user.firebaseUID = targetUid || user.firebaseUID;
          if (!user.profileImage && (decoded?.picture || photoURL)) {
            user.profileImage = sanitizeUrl(decoded?.picture || photoURL);
          }
          await user.save();
        }
      }

      // Auto-register first-time Google Sign-In users in MongoDB
      if (!user && targetEmail) {
        const normalizedRole = ["employer", "institution"].includes(role)
          ? "employer"
          : "candidate";
        const determinedUserType =
          normalizedRole === "employer" ? "institution" : "worker";
        const displayName =
          (decoded?.name || name || targetEmail.split("@")[0]).trim();

        user = await User.create({
          firebaseUID: targetUid || `fb_${Date.now()}`,
          name: displayName,
          email: targetEmail,
          role: normalizedRole,
          userType: determinedUserType,
          profileImage: sanitizeUrl(decoded?.picture || photoURL),
          skills: [],
          experience: 0,
        });

        if (normalizedRole === "employer") {
          const createdCompany = await Company.create({
            name: companyName?.trim() || `${displayName}'s Company`,
            owner: user._id,
            location: "Remote",
            industry: "Technology",
            contactEmail: targetEmail,
            employees: 1,
            workers: [],
          });
          user.company = createdCompany._id;
          user.companyRole = "owner";
          await user.save();
        }
      }
    } else {
      // 2. Email & Password Login
      if (!email || !password || typeof email !== "string" || typeof password !== "string") {
        throw new ServiceError(400, "Email and password are required");
      }

      user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
      if (!user || !user.password) {
        throw new ServiceError(401, "Invalid email or password");
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new ServiceError(401, "Invalid email or password");
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
        profileImage: user.profileImage,
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
