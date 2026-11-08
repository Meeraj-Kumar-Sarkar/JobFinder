import { Schema, model, Types } from "mongoose";
import bcrypt from "bcryptjs";
import {
  USER_ROLES,
  USER_TYPES,
  COMPANY_ROLES,
  ACCESS_STATUSES,
  COMPANY_PERMISSIONS,
} from "../utils/constants.js";

const UserSchema = new Schema(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
      default: () => "usr_" + new Types.ObjectId().toString(),
    },

    password: {
      type: String,
      select: false,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      default: "candidate",
      required: true,
    },

    userType: {
      type: String,
      enum: USER_TYPES,
      default: function () {
        return this.role === "employer" ? "institution" : "worker";
      },
    },

    phone: String,

    profileImage: String,

    // Normal worker / candidate data collection fields
    resumeURL: String,

    portfolioURL: String,

    headline: String,

    bio: String,

    skills: {
      type: [String],
      default: [],
    },

    experience: {
      type: Number,
      default: 0,
    },

    education: [
      {
        degree: String,
        institution: String,
        year: Number,
      },
    ],

    expectedSalary: Number,

    preferredJobType: {
      type: String,
      default: "Full Time",
    },

    // Company association and terms of access
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },

    companyRole: {
      type: String,
      enum: COMPANY_ROLES,
    },

    companyAccessTerms: {
      hasAccess: {
        type: Boolean,
        default: true,
      },
      status: {
        type: String,
        enum: ACCESS_STATUSES,
        default: "active",
      },
      terms: {
        type: String,
        default: "Standard company operational terms",
      },
      permissions: {
        type: [String],
        enum: COMPANY_PERMISSIONS,
        default: [
          "view_company",
          "view_jobs",
          "operate_job_portal",
          "view_applications",
          "manage_applications",
          "schedule_interviews",
        ],
      },
      assignedJobs: [
        {
          type: Schema.Types.ObjectId,
          ref: "Job",
        },
      ],
      assignedAt: Date,
      updatedAt: Date,
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },

    savedJobs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
  },
  {
    timestamps: true,
  },
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default model("User", UserSchema);

