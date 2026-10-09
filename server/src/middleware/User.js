import { isValidObjectId } from "mongoose";
import { firebaseAuth, firestore } from "../config/firebase.js";
import User from "../models/User.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const ROLES = ["candidate", "employer"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

const handleError = (res, e, fallback) => {
  if (e instanceof HttpError) {
    return res.status(e.status).json({ message: e.message });
  }
  switch (e?.code) {
    case "auth/email-already-exists":
      return res.status(409).json({ message: "Email is already in use" });
    case "auth/invalid-email":
      return res.status(400).json({ message: "Invalid email address" });
    case "auth/invalid-password":
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    case "auth/id-token-expired":
    case "auth/argument-error":
    case "auth/invalid-id-token":
      return res.status(401).json({ message: "Invalid or expired token" });
    case 11000:
      return res.status(409).json({ message: "User already exists" });
  }
  console.error(`${fallback}:`, e);
  return res.status(500).json({ message: fallback });
};

const getAuthenticationUser = async (req) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing authorization token");
  }

  const decoded = await firebaseAuth.verifyIdToken(header.slice(7));
  const user = await User.findOne({ firebaseUID: decoded.uid });
  if (!user) throw new HttpError(404, "User not found");

  return user;
};

const buildProfileUpdate = (body, role) => {
  const update = {};

  for (const key of ["phone", "profileImage", "resumeURL", "headline", "bio"]) {
    const value = body[key];
    if (value === undefined) continue;
    if (typeof value !== "string") {
      throw new HttpError(400, `${key} must be a string`);
    }
    update[key] = value.trim();
  }

  if (body.skills && Array.isArray(body.skills)) {
    update.skills = body.skills;
  }
  if (typeof body.experience === "number") {
    update.experience = body.experience;
  }
  return update;
};

export const create_newUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (role != "employer" && role != "candidate")
      res.status(500).json({ message: "Invalid role" });
    else {
      const user = await firebaseAuth.createUser({
        displayName: name,
        email,
        password,
      });
      console.log(user);
      await firestore.collection(`${role}`).doc(user.uid).set({
        name,
        email,
        role,
      });
      await User.create({
        firebaseUID: user.uid,
        name,
        email,
        role,
      });
      console.log(role, " created successfully!!");
      res.status(200).json({
        message: `${role} created successfully!!`,
        uid: user.uid,
        name: user.displayName,
      });
    }
  } catch (e) {
    console.error("Error Message:", e);
    res.status(500).json({
      message: "Error while creating a user!!",
    });
  }
};

export const update_newUser = async (req, res) => {
  try {
    const {
      id,
      phone,
      profileImage,
      resumeURL,
      headline,
      bio,
      skills,
      experience,
      company,
      savedJobs,
    } = req.body;
    let update = {};
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (phone && phone !== "") {
      update.phone = phone;
    }

    if (profileImage && profileImage !== "") {
      update.profileImage = profileImage;
    }

    if (resumeURL && resumeURL !== "") {
      update.resumeURL = resumeURL;
    }

    if (headline && headline !== "") {
      update.headline = headline;
    }

    if (bio && bio !== "") {
      update.bio = bio;
    }

    if (skills && skills.length > 0) {
      update.skills = skills;
    }

    if (experience && experience !== "" && experience !== 0) {
      update.experience = experience;
    }

    if (company && company !== "") {
      update.company = company;
    }

    if (savedJobs && savedJobs !== "") {
      update.savedJobs = savedJobs;
    }

    await firestore.collection(user.role).doc(user.firebaseUID).set({
      update,
    });

    const change = await User.updateOne(
      { _id: id },
      { $set: update },
      { runValidators: true },
    );
    if (change.matchedCount >= 0) {
      res.status(200).json({ message: "Upadted Successfully!!" });
    } else {
      res.status(200).json({ message: "Nothing updated!!" });
    }
  } catch (e) {
    console.error("Error message", e);
    res.status(500).json({
      message: "Error while updating user",
    });
  }
};
