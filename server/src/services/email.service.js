import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

// Escape dynamic values before inserting them into HTML
const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

/**
 * Send an email when a candidate progresses
 * to the next interview stage.
 */
export const sendInterviewProgressEmail = async ({
  candidateName,
  candidateEmail,
  jobTitle,
  previousStage,
  nextStage,
}) => {
  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  if (!candidateEmail || !previousStage || !nextStage) {
    throw new Error("Missing required interview email details");
  }

  const safeName = escapeHtml(candidateName || "Candidate");
  const safeJobTitle = escapeHtml(jobTitle || "the position");
  const safePreviousStage = escapeHtml(previousStage);
  const safeNextStage = escapeHtml(nextStage);

  const mailOptions = {
    from: `"JobFinder Recruitment" <${env.EMAIL_USER}>`,
    to: candidateEmail,

    subject: `Congratulations! You've progressed to the ${nextStage} Round`,

    text: `
Hello ${candidateName || "Candidate"},

Congratulations!

You have successfully cleared the ${previousStage} round for ${jobTitle || "the position"}.

You have been shortlisted for the next stage: ${nextStage}.

Further interview details will be shared with you.

Best wishes,
JobFinder Recruitment Team
    `,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 20px auto;
        padding: 30px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        color: #333;
      ">

        <h2 style="color: #2563eb;">
          Congratulations, ${safeName}!
        </h2>

        <p>
          We are pleased to inform you that you have
          successfully cleared the
          <strong>${safePreviousStage} Round</strong>.
        </p>

        <p>
          Your application for
          <strong>${safeJobTitle}</strong>
          has progressed to the next stage of our
          recruitment process.
        </p>

        <div style="
          background: #eff6ff;
          padding: 18px;
          border-radius: 8px;
          margin: 25px 0;
        ">
          <p style="margin: 0; color: #555;">
            Your Next Interview Stage
          </p>

          <h2 style="color: #2563eb; margin-bottom: 0;">
            ${safeNextStage} Round
          </h2>
        </div>

        <p>
          Further details regarding your upcoming interview
          will be shared with you.
        </p>

        <p>
          We wish you the very best for the next round!
        </p>

        <hr style="border: 0; border-top: 1px solid #eee;">

        <p style="font-size: 13px; color: #777;">
          Regards,<br>
          <strong>JobFinder Recruitment Team</strong>
        </p>

      </div>
    `,
  };

  const result = await transporter.sendMail(mailOptions);

  console.log("Interview progression email sent:", result.messageId);

  return result;
};
