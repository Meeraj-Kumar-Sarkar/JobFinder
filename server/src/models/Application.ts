import { Schema, model, Document, Types } from "mongoose";

export type ApplicationStatus =
  | "Applied"
  | "Screening"
  | "Technical"
  | "HR"
  | "Offer"
  | "Hired"
  | "Rejected";

export interface IApplication extends Document {
  candidate: Types.ObjectId;

  job: Types.ObjectId;

  resumeURL: string;

  coverLetter?: string;

  status: ApplicationStatus;

  feedback?: string;

  interviewDate?: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    candidate: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    resumeURL: {
      type: String,
      required: true,
    },

    coverLetter: String,

    feedback: String,

    interviewDate: Date,

    status: {
      type: String,
      enum: [
        "Applied",
        "Screening",
        "Technical",
        "HR",
        "Offer",
        "Hired",
        "Rejected",
      ],
      default: "Applied",
    },
  },
  {
    timestamps: true,
  },
);

ApplicationSchema.index(
  {
    candidate: 1,
    job: 1,
  },
  {
    unique: true,
  },
);

export default model<IApplication>("Application", ApplicationSchema);
