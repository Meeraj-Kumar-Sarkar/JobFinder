import { Schema, model } from "mongoose";
import {
  COMPANY_ROLES,
  ACCESS_STATUSES,
  COMPANY_PERMISSIONS,
} from "../utils/constants.js";

const CompanyWorkerSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyRole: {
      type: String,
      enum: COMPANY_ROLES,
      default: "employee",
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
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: String,

    website: String,

    logo: String,

    industry: String,

    location: String,

    registrationNumber: String,

    contactEmail: String,

    contactPhone: String,

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    employees: {
      type: Number,
      default: 1,
    },

    workers: [CompanyWorkerSchema],
  },
  {
    timestamps: true,
  },
);

export default model("Company", CompanySchema);

