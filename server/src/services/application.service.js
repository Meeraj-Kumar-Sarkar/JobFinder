import { isValidObjectId, Types } from "mongoose";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { APPLICATION_STATUSES } from "../utils/constants.js";
import { sanitizeUrl } from "../middleware/security.middleware.js";

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
          select: "title location jobType company",
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
   * Schedule an interview for an applicant.
   */
  async scheduleInterview(applicationId, interviewDate, feedback, stage) {
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
}

export const applicationService = new ApplicationService();
