import { Schema, model, Document, Types } from "mongoose";

export interface IJob extends Document {
  title: string;

  company: Types.ObjectId;

  description: string;

  requirements: string[];

  benefits: string[];

  salaryMin: number;

  salaryMax: number;

  location: string;

  jobType: string;

  experience: number;

  createdBy: Types.ObjectId;

  status: "active" | "closed";

  applicants: number;
}

const JobSchema = new Schema<IJob>(
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

export default model<IJob>("Job", JobSchema);
