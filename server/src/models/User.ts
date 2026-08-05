import { Schema, model, Document, Types } from "mongoose";

export type UserRole = "candidate" | "employer";

export interface IUser extends Document {
  firebaseUID: string;
  name: string;
  email: string;
  role: UserRole;

  phone?: string;
  profileImage?: string;
  resumeURL?: string;

  headline?: string;
  bio?: string;

  skills: string[];

  experience: number;

  company?: Types.ObjectId;

  savedJobs: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
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
    },

    role: {
      type: String,
      enum: ["candidate", "employer"],
      required: true,
    },

    phone: String,

    profileImage: String,

    resumeURL: String,

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

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
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

export default model<IUser>("User", UserSchema);
