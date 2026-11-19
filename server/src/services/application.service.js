import { isValidObjectId, Types } from "mongoose";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { APPLICATION_STATUSES } from "../utils/constants.js";
import { sanitizeUrl } from "../middleware/security.middleware.js";
import { call_Genai } from "../ai_models/genai_model.js";
import { sendInterviewProgressEmail } from "./email.service.js";

export class ServiceError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "ServiceError";
    this.statusCode = statusCode;
  }
}

export class ApplicationService {
  /**
   * Submit a new job application with skill verification, duplication prevention, and notifications.
   */
  async applyForJob(input) {
    const { candidateId, jobId, resumeURL, coverLetter, bypassSkillCheck } = input;

    if (!isValidObjectId(candidateId)) {
      throw new ServiceError(400, "Invalid candidate ID format");
    }
    if (!isValidObjectId(jobId)) {
      throw new ServiceError(400, "Invalid job ID format");
    }

    const [candidate, job] = await Promise.all([
      User.findById(candidateId),
      Job.findById(jobId),
    ]);

    if (!candidate) {
      throw new ServiceError(404, "Candidate not found");
    }
    if (candidate.role !== "candidate") {
      throw new ServiceError(403, "Only users with candidate role can apply for jobs");
    }

    if (!job) {
      throw new ServiceError(404, "Job not found");
    }
    if (job.status === "closed") {
      throw new ServiceError(400, "This job posting is closed and no longer accepting applications");
    }

    // Check for existing application
    const existingApplication = await Application.findOne({
      candidate: candidate._id,
      job: job._id,
    });
    if (existingApplication) {
      throw new ServiceError(409, "You have already applied for this job");
    }

    // Determine final resume URL (only allow safe http/https URLs)
    const rawResumeURL = resumeURL?.trim() || candidate.resumeURL?.trim();
    const finalResumeURL = sanitizeUrl(rawResumeURL);
    if (!finalResumeURL) {
      throw new ServiceError(
        400,
        "A valid HTTP/HTTPS Resume URL is required. Please provide a resume link.",
      );
    }

    // Sync candidate profile fields if provided during application submission
    let candidateModified = false;
    if (!candidate.resumeURL && finalResumeURL) {
      candidate.resumeURL = finalResumeURL;
      candidateModified = true;
    }
    if (input.phone && typeof input.phone === "string" && input.phone.trim()) {
      candidate.phone = input.phone.trim();
      candidateModified = true;
    }
    if (input.experience !== undefined && !isNaN(Number(input.experience)) && Number(input.experience) >= 0) {
      candidate.experience = Number(input.experience);
      candidateModified = true;
    }
    if (Array.isArray(input.skills) && input.skills.length > 0) {
      const mergedSkills = Array.from(
        new Set([
          ...(candidate.skills || []),
          ...input.skills.map((s) => String(s).trim()).filter(Boolean),
        ]),
      );
      candidate.skills = mergedSkills;
      candidateModified = true;
    }
    if (candidateModified) {
      await candidate.save();
    }

    // Skill match evaluation
    const jobRequirements = job.requirements || [];
    const candidateSkills = candidate.skills || [];
    let matchCount = 0;
    const matchedSkills = [];
    const missingSkills = [];

    if (jobRequirements.length > 0) {
      const candidateSkillsNormalized = candidateSkills.map((s) => s.toLowerCase().trim());
      for (const requirement of jobRequirements) {
        if (candidateSkillsNormalized.includes(requirement.toLowerCase().trim())) {
          matchCount++;
          matchedSkills.push(requirement);
        } else {
          missingSkills.push(requirement);
        }
      }

      // Minimum qualification threshold: at least 50% match
      const threshold = Math.ceil(jobRequirements.length / 2);
      if (!bypassSkillCheck && matchCount < threshold) {
        throw new ServiceError(
          400,
          `Minimum skill requirements not met. You matched ${matchCount}/${jobRequirements.length} required skills. Minimum required: ${threshold}. Missing skills: ${missingSkills.join(", ")}`,
        );
      }
    }

    // Create the application
    const newApplication = await Application.create({
      candidate: candidate._id,
      job: job._id,
      resumeURL: finalResumeURL,
      coverLetter: coverLetter?.trim() || "",
      status: "Applied",
    });

    // Increment applicants counter on the job
    await Job.findByIdAndUpdate(job._id, { $inc: { applicants: 1 } });

    // Send notification to job creator if available
    if (job.createdBy) {
      try {
        await Notification.create({
          user: job.createdBy,
          sender: candidate._id,
          job: job._id,
          application: newApplication._id,
          type: "application_received",
          title: "New Job Application",
          message: `${candidate.name} applied for "${job.title}".`,
          isRead: false,
        });
      } catch (err) {
        console.error("Failed to create application notification:", err);
      }
    }

    return {
      application: newApplication,
      matchSummary: {
        matchedCount: matchCount,
        totalRequirements: jobRequirements.length,
        matchedSkills,
        missingSkills,
      },
    };
  }

  /**
   * Retrieve all applications submitted by a specific candidate.
   */
  async getCandidateApplications(candidateId, filter = {}) {
    if (!isValidObjectId(candidateId)) {
      throw new ServiceError(400, "Invalid candidate ID format");
    }

    const query = { candidate: candidateId };
    if (filter.status && APPLICATION_STATUSES.includes(filter.status)) {
      query.status = filter.status;
    }

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate({
          path: "job",
          select: "title company location salaryMin salaryMax jobType status requirements",
          populate: {
            path: "company",
            select: "name logo industry location website",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(query),
    ]);

    return {
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve all applications for a specific job (recruiter / employer view).
   */
  async getJobApplications(jobId, filter = {}) {
    if (!isValidObjectId(jobId)) {
      throw new ServiceError(400, "Invalid job ID format");
    }

    const job = await Job.findById(jobId).populate("company", "name logo");
    if (!job) {
      throw new ServiceError(404, "Job not found");
    }

    const query = { job: jobId };
    if (filter.status && APPLICATION_STATUSES.includes(filter.status)) {
      query.status = filter.status;
    }

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate({
          path: "candidate",
          select: "name email phone skills experience profileImage resumeURL headline bio",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(query),
    ]);

    return {
      job: {
        _id: job._id,
        title: job.title,
        company: job.company,
        status: job.status,
        applicants: job.applicants,
      },
      applicants: applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve all applications across all jobs for an employer.
   */
  async getEmployerAllApplications(employerId, filter = {}) {
    if (!isValidObjectId(employerId)) {
      throw new ServiceError(400, "Invalid employer ID format");
    }

    const employer = await User.findById(employerId);
    if (!employer) {
      throw new ServiceError(404, "Employer not found");
    }

    // Enforce dynamic terms for company workers / HR
    if (employer.role === "hr" || employer.companyRole === "hr") {
      const termsStatus = employer.companyAccessTerms?.status;
      const hasAccess = employer.companyAccessTerms?.hasAccess;
      if (hasAccess === false || ["suspended", "revoked"].includes(termsStatus)) {
        throw new ServiceError(
          403,
          `Access denied. Your company portal access is ${termsStatus || "inactive"}. Company terms have changed.`,
        );
      }
    }

    // Find jobs created by employer or associated with employer's company
    const jobQuery = {
      $or: [{ createdBy: employer._id }],
    };
    if (employer.company) {
      if (
        (employer.role === "hr" || employer.companyRole === "hr") &&
        employer.companyAccessTerms?.assignedJobs?.length > 0
      ) {
        jobQuery.$or.push({ _id: { $in: employer.companyAccessTerms.assignedJobs } });
      } else {
        jobQuery.$or.push({ company: employer.company });
      }
    }


    const jobs = await Job.find(jobQuery).select("_id");
    const jobIds = jobs.map((j) => j._id);

    if (jobIds.length === 0) {
      return {
        applications: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
    }

    const appQuery = { job: { $in: jobIds } };
    if (filter.status && APPLICATION_STATUSES.includes(filter.status)) {
      appQuery.status = filter.status;
    }

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      Application.find(appQuery)
        .populate({
          path: "candidate",
          select: "name email phone skills experience profileImage resumeURL headline",
        })
        .populate({
          path: "job",
          select: "title location jobType company requirements description category",
          populate: { path: "company", select: "name logo" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(appQuery),
    ]);

    return {
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single application by ID with full candidate and job populated details.
   */
  async getApplicationById(applicationId) {
    if (!isValidObjectId(applicationId)) {
      throw new ServiceError(400, "Invalid application ID format");
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: "candidate",
        select: "name email phone skills experience profileImage resumeURL headline bio",
      })
      .populate({
        path: "job",
        select: "title company description requirements benefits salaryMin salaryMax location jobType status",
        populate: {
          path: "company",
          select: "name description website logo industry location employees",
        },
      });

    if (!application) {
      throw new ServiceError(404, "Application not found");
    }

    return application;
  }

  /**
   * Update the status of an application in the ATS pipeline.
   * Supports either explicit status target or auto-advancing to the next logical stage.
   */
  async updateApplicationStatus(applicationId, targetStatus, feedback) {
    if (!isValidObjectId(applicationId)) {
      throw new ServiceError(400, "Invalid application ID format");
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      throw new ServiceError(404, "Application not found");
    }

    const previousStatus = application.status;

    let nextStatus;

    if (targetStatus) {
      if (!APPLICATION_STATUSES.includes(targetStatus)) {
        throw new ServiceError(
          400,
          `Invalid status: ${targetStatus}. Must be one of: ${APPLICATION_STATUSES.join(", ")}`,
        );
      }
      nextStatus = targetStatus;
    } else {
      // Step-by-step pipeline progression
      const current = application.status;
      switch (current) {
        case "Applied":
          nextStatus = "Screening";
          break;
        case "Screening":
          nextStatus = "Technical";
          break;
        case "Technical":
          nextStatus = "HR";
          break;
        case "HR":
          nextStatus = "Offer";
          break;
        case "Offer":
          nextStatus = "Hired";
          break;
        default:
          throw new ServiceError(
            400,
            `Cannot automatically advance application from current status "${current}"`,
          );
      }
    }

    // Apply hiring side-effects if status changed to "Hired"
    if (nextStatus === "Hired" && application.status !== "Hired") {
      await this.handleHiredSideEffects(application);
    }

    application.status = nextStatus;
    if (feedback !== undefined) {
      application.feedback = feedback.trim();
    }

    await application.save();

    // Send progression email when candidate moves to another stage
if (
  previousStatus !== nextStatus &&
  nextStatus !== "Rejected" &&
  previousStatus !== "Rejected"
) {
  try {
    const [candidate, job] = await Promise.all([
      User.findById(application.candidate).select("name email"),
      Job.findById(application.job).select("title"),
    ]);

    if (candidate?.email) {
      await sendInterviewProgressEmail({
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        jobTitle: job?.title || "the position",
        previousStage: previousStatus,
        nextStage: nextStatus,
      });
    }
  } catch (err) {
    console.error("Failed to send interview progression email:", err);
  }
}

    // Notify candidate
    try {
      const job = await Job.findById(application.job)
        .populate("company", "name")
        .select("title company");
      const companyName = job?.company?.name || "";
      const feedbackNote =
        feedback && feedback.trim() ? ` Note from hiring team: "${feedback.trim()}"` : "";
      await Notification.create({
        user: application.candidate,
        job: application.job,
        application: application._id,
        companyName: companyName || undefined,
        type: "status_update",
        title: `Application Status Updated: ${nextStatus}`,
        message: `Your application for "${job?.title || "the job"}"${companyName ? ` at ${companyName}` : ""} has moved to the "${nextStatus}" stage.${feedbackNote}`,
        isRead: false,
      });
    } catch (err) {
      console.error("Failed to notify candidate about status change:", err);
    }

    return application;
  }

  /**
   * Schedule an interview for an applicant (optionally configuring Live AI Q&A Interview).
   */
  async scheduleInterview(applicationId, interviewDate, feedback, stage, aiConfig = null) {
    if (aiConfig && aiConfig.enabled !== undefined) {
      if (aiConfig.enabled) {
        return this.configureAiInterview(applicationId, {
          enabled: true,
          interviewDate,
          feedback,
          stage,
          questionCount: aiConfig.questionCount,
          topicFocus: aiConfig.topicFocus,
        });
      } else {
        await this.configureAiInterview(applicationId, { enabled: false });
      }
    }

    if (!isValidObjectId(applicationId)) {
      throw new ServiceError(400, "Invalid application ID format");
    }

    const parsedDate = new Date(interviewDate);
    if (isNaN(parsedDate.getTime())) {
      throw new ServiceError(400, "Invalid interview date format");
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      throw new ServiceError(404, "Application not found");
    }

    application.interviewDate = parsedDate;
    if (feedback) {
      application.feedback = feedback.trim();
    }

    // Advance to Technical or HR if provided, or if currently Applied/Screening
    if (stage && APPLICATION_STATUSES.includes(stage)) {
      application.status = stage;
    } else if (application.status === "Applied" || application.status === "Screening") {
      application.status = "Technical";
    }

    await application.save();

    // Notify candidate
    try {
      const job = await Job.findById(application.job)
        .populate("company", "name")
        .select("title company");
      const companyName = job?.company?.name || "";
      const noteText =
        feedback && feedback.trim()
          ? ` Details / Meeting Link: ${feedback.trim()}`
          : "";
      await Notification.create({
        user: application.candidate,
        job: application.job,
        application: application._id,
        companyName: companyName || undefined,
        type: "interview",
        title: `Interview Scheduled — ${job?.title || "Application"}`,
        message: `An interview has been scheduled for "${job?.title || "your application"}"${companyName ? ` at ${companyName}` : ""} on ${parsedDate.toLocaleString()}.${noteText}`,
        isRead: false,
      });
    } catch (err) {
      console.error("Failed to notify candidate about interview:", err);
    }

    return application;
  }

  /**
   * Final hiring decision (Hired or Rejected) with company and applicant state updates.
   */
  async finalHiringDecision(applicationId, decision, feedback) {
    if (!isValidObjectId(applicationId)) {
      throw new ServiceError(400, "Invalid application ID format");
    }

    const normalizedDecision =
      typeof decision === "string" && decision.toLowerCase().startsWith("hire")
        ? "Hired"
        : typeof decision === "string" && decision.toLowerCase().startsWith("reject")
          ? "Rejected"
          : decision;

    if (normalizedDecision !== "Hired" && normalizedDecision !== "Rejected") {
      throw new ServiceError(400, 'Decision must be either "Hired" or "Rejected"');
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      throw new ServiceError(404, "Application not found");
    }

    const previousStatus = application.status;
    application.status = normalizedDecision;
    if (feedback) {
      application.feedback = feedback.trim();
    }
    await application.save();

    const [job, candidate] = await Promise.all([
      Job.findById(application.job),
      User.findById(application.candidate),
    ]);

    if (!job || !candidate) {
      throw new ServiceError(404, "Associated job or candidate user not found");
    }

    if (normalizedDecision === "Hired" && previousStatus !== "Hired") {
      await this.handleHiredSideEffects(application);
    }

    // Send notification to candidate
    try {
      const populatedJob = await Job.findById(application.job)
        .populate("company", "name")
        .select("title company");
      const companyName = populatedJob?.company?.name || "";
      const feedbackNote =
        feedback && feedback.trim() ? ` Feedback: "${feedback.trim()}"` : "";
      await Notification.create({
        user: candidate._id,
        job: job._id,
        application: application._id,
        companyName: companyName || undefined,
        type: "decision",
        title: `Application Decision: ${normalizedDecision} — ${job.title}`,
        message:
          normalizedDecision === "Hired"
            ? `Congratulations! You have been selected and hired for "${job.title}"${companyName ? ` at ${companyName}` : ""}.${feedbackNote}`
            : `Thank you for your interest in "${job.title}"${companyName ? ` at ${companyName}` : ""}. Unfortunately, your application was not selected for this role.${feedbackNote}`,
        isRead: false,
      });
    } catch (err) {
      console.error("Failed to notify candidate about final decision:", err);
    }

    return {
      application,
      candidateName: candidate.name,
      decision: normalizedDecision,
    };
  }

  /**
   * Candidate withdraws an application.
   */
  async withdrawApplication(applicationId, candidateId) {
    if (!isValidObjectId(applicationId)) {
      throw new ServiceError(400, "Invalid application ID format");
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      throw new ServiceError(404, "Application not found");
    }

    if (candidateId && application.candidate.toString() !== candidateId.toString()) {
      throw new ServiceError(403, "You are not authorized to withdraw this application");
    }

    if (application.status === "Hired") {
      throw new ServiceError(400, "Cannot withdraw an application that has already been hired");
    }

    // Decrement applicants counter on Job
    await Job.findByIdAndUpdate(application.job, {
      $inc: { applicants: -1 },
    });

    await Application.findByIdAndDelete(applicationId);

    return {
      message: "Application successfully withdrawn",
      applicationId,
    };
  }

  /**
   * Get application pipeline statistics for a job (counts per ATS stage).
   */
  async getJobApplicationStats(jobId) {
    if (!isValidObjectId(jobId)) {
      throw new ServiceError(400, "Invalid job ID format");
    }

    const job = await Job.findById(jobId).select("title applicants");
    if (!job) {
      throw new ServiceError(404, "Job not found");
    }

    const statusCounts = await Application.aggregate([
      { $match: { job: new Types.ObjectId(jobId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats = {
      Applied: 0,
      Screening: 0,
      Technical: 0,
      HR: 0,
      Offer: 0,
      Hired: 0,
      Rejected: 0,
    };

    let total = 0;
    for (const item of statusCounts) {
      if (item._id && stats[item._id] !== undefined) {
        stats[item._id] = item.count;
      }
      total += item.count;
    }

    return {
      job: {
        _id: job._id,
        title: job.title,
      },
      total,
      breakdown: stats,
    };
  }

  /**
   * Internal helper to update user company and company employee count when hired.
   */
  async handleHiredSideEffects(application) {
    const job = await Job.findById(application.job);
    if (!job) return;

    if (job.company) {
      await User.findByIdAndUpdate(application.candidate, {
        company: job.company,
      });

      await Company.findByIdAndUpdate(job.company, {
        $inc: { employees: 1 },
      });
    }
  }

  /**
   * Helper: Generate tailored Q&A interview questions using Gemini AI (with domain-aware fallback).
   */
  async generateAiQuestionsForJob(job, questionCount = 5, topicFocus = "") {
    const count = Math.max(1, Math.min(15, Number(questionCount) || 5));
    const jobTitle = job?.title || "Software Engineer";
    const category = job?.category || "Technology";
    const description = job?.description || "";
    const requirements = Array.isArray(job?.requirements) ? job.requirements : [];
    const customTopics = topicFocus ? topicFocus.trim() : "";

    const prompt = `
You are an expert technical interviewer and Applicant Tracking System (ATS) assessment designer.

Generate exactly ${count} interview questions for a candidate applying for the following role:
- Job Title: ${jobTitle}
- Category: ${category}
- Required Skills: ${JSON.stringify(requirements)}
- Job Description: ${description}
- Additional Topic Focus from Hiring Manager: ${customTopics || "Core role competencies & practical problem solving"}

INSTRUCTIONS:
1. Create ${count} highly relevant, scenario-based or technical/domain questions that test real competency for this specific role and required skills.
2. For each question, specify:
   - "questionNumber": integer from 1 to ${count}
   - "question": the clear, direct interview question
   - "topic": the specific skill or topic being assessed
   - "expectedKeyPoints": array of 2 to 4 key concepts a strong answer should cover
3. Return ONLY a valid JSON array of objects. Do not wrap in markdown code fences or add extra commentary.
`;

    try {
      const raw = await call_Genai(prompt, { maxOutputTokens: 1800 });
      if (raw) {
        const cleaned = String(raw)
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        const startIdx = cleaned.indexOf("[");
        const endIdx = cleaned.lastIndexOf("]");
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          const parsed = JSON.parse(cleaned.slice(startIdx, endIdx + 1));
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, count).map((q, idx) => ({
              questionNumber: idx + 1,
              question: String(q.question || "").trim(),
              topic: String(
                q.topic || requirements[idx % Math.max(1, requirements.length)] || category,
              ).trim(),
              expectedKeyPoints: Array.isArray(q.expectedKeyPoints)
                ? q.expectedKeyPoints.map((p) => String(p).trim()).filter(Boolean)
                : ["Core concepts", "Practical implementation", "Trade-offs & best practices"],
              candidateAnswer: "",
              score: 0,
              aiFeedback: "",
            }));
          }
        }
      }
    } catch (err) {
      console.error("AI question generation fallback triggered:", err?.message || err);
    }

    // Fallback generator tailored to job requirements, topicFocus, and role title
    const topicPool = [
      ...(customTopics
        ? customTopics
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : []),
      ...requirements,
      `${jobTitle} Architecture`,
      "Problem Solving & Debugging",
      "Production Best Practices",
      "System Scalability & Trade-offs",
      "Team Collaboration & Delivery",
    ];

    const templates = [
      (topic) => ({
        question: `In the context of a ${jobTitle} role, walk through how you have used ${topic} in a production scenario. What architectural decisions or trade-offs did you make?`,
        expectedKeyPoints: [
          `Practical hands-on application of ${topic}`,
          "Clear explanation of trade-offs and design decisions",
          "Measurable impact or production reliability considerations",
        ],
      }),
      (topic) => ({
        question: `Suppose you encounter a critical performance bottleneck or edge-case failure involving ${topic} while working on our ${category} platform. How would you diagnose, isolate, and resolve the issue?`,
        expectedKeyPoints: [
          "Systematic debugging and root-cause analysis methodology",
          `Deep understanding of ${topic} internals and failure modes`,
          "Preventative monitoring and testing strategy",
        ],
      }),
      (topic) => ({
        question: `What are the most important best practices, security considerations, or quality standards you follow when designing solutions with ${topic} for a ${jobTitle} position?`,
        expectedKeyPoints: [
          `Industry best practices for ${topic}`,
          "Security, maintainability, and edge-case handling",
          "Code quality and automated verification",
        ],
      }),
      (topic) => ({
        question: `Describe a challenging requirement you delivered using ${topic}. How did you structure your approach from initial design to final deployment?`,
        expectedKeyPoints: [
          "End-to-end ownership and structured problem decomposition",
          `Effective utilization of ${topic}`,
          "Handling constraints and stakeholder alignment",
        ],
      }),
      (topic) => ({
        question: `When integrating ${topic} with other components in a ${jobTitle} workflow, how do you ensure reliability, clean interfaces, and long-term maintainability?`,
        expectedKeyPoints: [
          "Clean abstraction and interface design",
          `Resilience and error handling with ${topic}`,
          "Documentation and team scalability",
        ],
      }),
    ];

    const fallbackQuestions = [];
    for (let i = 0; i < count; i++) {
      const topic = topicPool[i % topicPool.length] || jobTitle;
      const tpl = templates[i % templates.length](topic);
      fallbackQuestions.push({
        questionNumber: i + 1,
        question: tpl.question,
        topic,
        expectedKeyPoints: tpl.expectedKeyPoints,
        candidateAnswer: "",
        score: 0,
        aiFeedback: "",
      });
    }
    return fallbackQuestions;
  }

  /**
   * Employer: Add (Enable/Schedule) or Remove (Disable) Live AI Q&A Interview on an application.
   */
  async configureAiInterview(applicationId, config = {}) {
    if (!isValidObjectId(applicationId)) {
      throw new ServiceError(400, "Invalid application ID format");
    }

    const application = await Application.findById(applicationId)
      .populate("job")
      .populate("candidate", "name email");

    if (!application) {
      throw new ServiceError(404, "Application not found");
    }

    const enabled = config.enabled !== undefined ? Boolean(config.enabled) : true;

    // If employer removes the AI Q&A interview from this stage
    if (!enabled) {
      application.aiInterview = {
        enabled: false,
        status: "not_configured",
        scheduledDate: undefined,
        questionCount: 5,
        topicFocus: "",
        joinLink: "",
        questions: [],
        report: undefined,
      };
      await application.save();
      return application;
    }

    const questionCount = Math.max(1, Math.min(15, Number(config.questionCount) || 5));
    const topicFocus = config.topicFocus ? String(config.topicFocus).trim() : "";
    const parsedDate = config.interviewDate
      ? new Date(config.interviewDate)
      : application.interviewDate || new Date();

    if (isNaN(parsedDate.getTime())) {
      throw new ServiceError(400, "Valid interview date and time is required");
    }

    // Generate AI questions based on the job details and topic relevance
    const generatedQuestions = await this.generateAiQuestionsForJob(
      application.job,
      questionCount,
      topicFocus,
    );

    const joinLink = `/interview/${application._id}`;

    application.interviewDate = parsedDate;
    if (config.stage && APPLICATION_STATUSES.includes(config.stage)) {
      application.status = config.stage;
    } else if (["Applied", "Screening"].includes(application.status)) {
      application.status = "Technical";
    }

    application.aiInterview = {
      enabled: true,
      status: "scheduled",
      scheduledDate: parsedDate,
      questionCount: generatedQuestions.length,
      topicFocus,
      joinLink,
      questions: generatedQuestions,
      report: undefined,
    };

    const scheduleSummary = `Live AI Q&A Interview (${generatedQuestions.length} questions) scheduled for ${parsedDate.toLocaleString()}. Join link: ${joinLink}${
      config.feedback ? ` • Note: ${config.feedback.trim()}` : ""
    }`;
    application.feedback = scheduleSummary;

    await application.save();

    // Notify the candidate with the scheduled date and direct join link
    try {
      const populatedJob = await Job.findById(application.job?._id || application.job)
        .populate("company", "name")
        .select("title company");
      const companyName = populatedJob?.company?.name || "";

      await Notification.create({
        user: application.candidate?._id || application.candidate,
        job: application.job?._id || application.job,
        application: application._id,
        companyName: companyName || undefined,
        type: "interview",
        title: `Live AI Q&A Interview Scheduled — ${populatedJob?.title || "Role"}`,
        message: `You have been invited to a Live AI Q&A Interview (${generatedQuestions.length} questions${
          topicFocus ? ` focused on ${topicFocus}` : ""
        }) scheduled for ${parsedDate.toLocaleString()}. Join via your interview room link: ${joinLink}`,
        isRead: false,
      });
    } catch (err) {
      console.error("Failed to create AI interview notification:", err);
    }

    return application;
  }

  /**
   * Candidate: Submit answers for Live AI Q&A Interview -> AI evaluates, scores, and stores report for employer.
   */
  async submitAiInterview(applicationId, payload = {}) {
    if (!isValidObjectId(applicationId)) {
      throw new ServiceError(400, "Invalid application ID format");
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: "job",
        populate: { path: "company", select: "name" },
      })
      .populate("candidate", "name email skills experience");

    if (!application) {
      throw new ServiceError(404, "Application not found");
    }

    if (!application.aiInterview?.enabled) {
      throw new ServiceError(
        400,
        "Live AI Q&A Interview is not enabled for this application",
      );
    }

    const rawAnswers = Array.isArray(payload.answers) ? payload.answers : [];
    const questions = application.aiInterview.questions || [];

    if (questions.length === 0) {
      throw new ServiceError(400, "No interview questions found for this session");
    }

    // Map candidate answers onto each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const match = rawAnswers.find(
        (a) =>
          typeof a === "object" &&
          a !== null &&
          Number(a.questionNumber) === Number(q.questionNumber || i + 1),
      );
      const answerText =
        match?.answer !== undefined
          ? String(match.answer).trim()
          : typeof rawAnswers[i] === "string"
            ? rawAnswers[i].trim()
            : typeof rawAnswers[i]?.answer === "string"
              ? rawAnswers[i].answer.trim()
              : "";
      q.candidateAnswer = answerText;
    }

    const jobTitle = application.job?.title || "Role";
    const jobReqs = application.job?.requirements || [];

    // Evaluate with Gemini AI
    const evalPrompt = `
You are an expert technical hiring committee and ATS Interview Evaluator.

Evaluate the candidate's responses for the "${jobTitle}" role (Required Skills: ${JSON.stringify(jobReqs)}).

QUESTIONS AND CANDIDATE ANSWERS:
${JSON.stringify(
  questions.map((q) => ({
    questionNumber: q.questionNumber,
    topic: q.topic,
    question: q.question,
    expectedKeyPoints: q.expectedKeyPoints,
    candidateAnswer: q.candidateAnswer,
  })),
  null,
  2,
)}

INSTRUCTIONS:
1. Score each question from 0 to 100 based on technical accuracy, depth, relevance to expectedKeyPoints, and clarity.Empty or irrelevant answers must score 0-15.
2. Provide concise, constructive "aiFeedback" (1-2 sentences) for each question explaining why it received that score.
3. Calculate "overallScore" (integer 0 to 100) as the average of all question scores.
4. Determine "verdict" from one of:
   - "Strong Hire — Advance to Next Stage" (score >= 80)
   - "Recommended — Proceed to Next Stage" (score 65-79)
   - "Borderline — Manual Review Recommended" (score 45-64)
   - "Does Not Meet Bar" (score < 45)
5. Write an executive "summary" (2-3 sentences) for the hiring manager.
6. Provide "strengths" (array of 2-3 specific strengths demonstrated) and "improvements" (array of 2-3 gaps or follow-up areas).

Return ONLY a valid JSON object with the exact shape:
{
  "evaluations": [
    { "questionNumber": 1, "score": 85, "aiFeedback": "..." }
  ],
  "overallScore": 85,
  "verdict": "Strong Hire — Advance to Next Stage",
  "summary": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}
`;

    let aiParsedReport = null;
    try {
      const rawEval = await call_Genai(evalPrompt, { maxOutputTokens: 2000 });
      if (rawEval) {
        const cleaned = String(rawEval)
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        const startIdx = cleaned.indexOf("{");
        const endIdx = cleaned.lastIndexOf("}");
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          aiParsedReport = JSON.parse(cleaned.slice(startIdx, endIdx + 1));
        }
      }
    } catch (err) {
      console.error("AI evaluation fallback triggered:", err?.message || err);
    }

    // Apply per-question scores & feedback (from AI or deterministic rubric fallback)
    let totalScore = 0;
    const strengthsSet = new Set();
    const improvementsSet = new Set();

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const aiItem = aiParsedReport?.evaluations?.find(
        (e) => Number(e.questionNumber) === Number(q.questionNumber || i + 1),
      );

      if (
        aiItem &&
        Number.isFinite(Number(aiItem.score)) &&
        Number(aiItem.score) >= 0 &&
        Number(aiItem.score) <= 100
      ) {
        q.score = Math.round(Number(aiItem.score));
        q.aiFeedback = String(
          aiItem.aiFeedback || "Evaluated against role competency rubric.",
        ).trim();
      } else {
        // Rubric-based fallback scoring
        const ans = (q.candidateAnswer || "").trim();
        const wordCount = ans ? ans.split(/\s+/).length : 0;
        const lowerAns = ans.toLowerCase();
        const topicWords = String(q.topic || "")
          .toLowerCase()
          .split(/[\s,/+-]+/)
          .filter((w) => w.length > 2);
        const keyPointHits = (q.expectedKeyPoints || []).filter((kp) =>
          String(kp)
            .toLowerCase()
            .split(/\s+/)
            .some((w) => w.length > 3 && lowerAns.includes(w)),
        ).length;
        const topicHit = topicWords.some((w) => lowerAns.includes(w));

        let computed = 0;
        if (wordCount === 0) {
          computed = 0;
          q.aiFeedback = "No response was provided for this question.";
        } else if (wordCount < 10) {
          computed = 25 + (topicHit ? 10 : 0);
          q.aiFeedback = `Response on ${q.topic} was very brief (${wordCount} words) and lacked implementation depth or concrete examples.`;
        } else {
          const lengthScore = Math.min(45, Math.round((wordCount / 55) * 45));
          const relevanceScore =
            (topicHit ? 20 : 8) +
            Math.min(35, keyPointHits * 12 + (wordCount >= 35 ? 11 : 0));
          computed = Math.min(96, lengthScore + relevanceScore);
          q.aiFeedback =
            computed >= 75
              ? `Strong, detailed explanation of ${q.topic} covering practical architecture and trade-offs.`
              : `Adequate coverage of ${q.topic}, though deeper discussion of edge cases and production trade-offs would strengthen the answer.`;
        }
        q.score = computed;
      }

      totalScore += q.score;
      if (q.score >= 75) {
        strengthsSet.add(`Strong competency demonstrated in ${q.topic}`);
      } else {
        improvementsSet.add(`Further depth recommended in ${q.topic}`);
      }
    }

    const avgScore = Math.round(totalScore / Math.max(1, questions.length));
    const overallScore =
      aiParsedReport &&
      Number.isFinite(Number(aiParsedReport.overallScore)) &&
      Number(aiParsedReport.overallScore) >= 0 &&
      Number(aiParsedReport.overallScore) <= 100
        ? Math.round(Number(aiParsedReport.overallScore))
        : avgScore;

    const defaultVerdict =
      overallScore >= 80
        ? "Strong Hire — Advance to Next Stage"
        : overallScore >= 65
          ? "Recommended — Proceed to Next Stage"
          : overallScore >= 45
            ? "Borderline — Manual Review Recommended"
            : "Does Not Meet Bar";

    const verdict = String(aiParsedReport?.verdict || defaultVerdict).trim();
    const summary = String(
      aiParsedReport?.summary ||
        `${application.candidate?.name || "The candidate"} completed the ${questions.length}-question Live AI Interview for ${jobTitle} with an overall score of ${overallScore}/100 (${verdict}).`,
    ).trim();

    const strengths =
      Array.isArray(aiParsedReport?.strengths) &&
      aiParsedReport.strengths.length > 0
        ? aiParsedReport.strengths.map((s) => String(s).trim())
        : Array.from(strengthsSet).length > 0
          ? Array.from(strengthsSet)
          : ["Completed all assigned interview questions on schedule"];

    const improvements =
      Array.isArray(aiParsedReport?.improvements) &&
      aiParsedReport.improvements.length > 0
        ? aiParsedReport.improvements.map((s) => String(s).trim())
        : Array.from(improvementsSet).length > 0
          ? Array.from(improvementsSet)
          : ["Probe production scaling scenarios in the next round"];

    application.aiInterview.status = "completed";
    application.aiInterview.report = {
      overallScore,
      verdict,
      summary,
      strengths,
      improvements,
      completedAt: new Date(),
    };

    await application.save();

    // Notify the employer that the AI Interview Report is ready for evaluation
    if (application.job?.createdBy) {
      try {
        await Notification.create({
          user: application.job.createdBy,
          sender: application.candidate?._id,
          job: application.job._id,
          application: application._id,
          companyName: application.job?.company?.name,
          type: "interview",
          title: `AI Interview Report Ready (${overallScore}/100) — ${application.candidate?.name || "Applicant"}`,
          message: `${application.candidate?.name || "Candidate"} completed the Live AI Q&A Interview for "${jobTitle}". Overall Score: ${overallScore}/100 (${verdict}). Open your Employer ATS Dashboard to review the full Q&A report and advance the candidate.`,
          isRead: false,
        });
      } catch (err) {
        console.error("Failed to notify employer of completed AI interview:", err);
      }
    }

    return application;
  }
}

export const applicationService = new ApplicationService();
