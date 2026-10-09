import { Schema, model } from "mongoose";

const UserSchema = new Schema(
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

export default model("User", UserSchema);
