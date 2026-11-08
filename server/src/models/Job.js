import { Schema, model } from "mongoose";

const JobSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    description: String,

    requirements: {
      type: [String],
      default: [],
    },

    benefits: {
      type: [String],
      default: [],
    },

    salaryMin: Number,

    salaryMax: Number,

    location: String,

    jobType: {
      type: String,
      default: "Full Time",
    },

    experience: Number,

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    assignedRecruiters: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },

    applicants: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export default model("Job", JobSchema);
