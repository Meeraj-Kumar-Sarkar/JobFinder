import { Schema, model } from "mongoose";

const ApplicationSchema = new Schema(
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

    aiInterview: {
      enabled: {
        type: Boolean,
        default: false,
      },
      status: {
        type: String,
        enum: ["not_configured", "scheduled", "in_progress", "completed"],
        default: "not_configured",
      },
      scheduledDate: Date,
      questionCount: {
        type: Number,
        default: 5,
      },
      topicFocus: {
        type: String,
        default: "",
      },
      joinLink: {
        type: String,
        default: "",
      },
      questions: [
        {
          questionNumber: Number,
          question: String,
          topic: String,
          expectedKeyPoints: [String],
          candidateAnswer: {
            type: String,
            default: "",
          },
          score: {
            type: Number,
            default: 0,
          },
          aiFeedback: {
            type: String,
            default: "",
          },
        },
      ],
      report: {
        overallScore: Number,
        verdict: String,
        summary: String,
        strengths: [String],
        improvements: [String],
        completedAt: Date,
      },
    },

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

export default model("Application", ApplicationSchema);
