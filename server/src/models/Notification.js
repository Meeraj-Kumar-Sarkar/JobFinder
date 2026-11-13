import { Schema, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },

    application: {
      type: Schema.Types.ObjectId,
      ref: "Application",
    },

    companyName: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "status_update",
        "interview",
        "decision",
        "employer_message",
        "application_received",
        "general",
      ],
      default: "general",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default model("Notification", NotificationSchema);
