import { isValidObjectId } from "mongoose";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import { ServiceError } from "./application.service.js";

export class JobService {
  /**
   * Create a new job posting for a company.
   * Can be performed by Company Owner or an active HR with create_job permission.
   */
  async createJob(input, callerUser) {
    const {
      title,
      company: companyId,
      description,
      requirements = [],
      benefits = [],
      salaryMin,
      salaryMax,
      location,
      jobType = "Full Time",
      experience,
      createdBy,
    } = input;

    if (!title || !title.trim()) {
      throw new ServiceError(400, "Job title is required");
    }

    const effectiveCompanyId = companyId || callerUser?.company;
    if (!effectiveCompanyId || !isValidObjectId(effectiveCompanyId)) {
      throw new ServiceError(400, "Valid Company ID is required to post a job");
    }

    const company = await Company.findById(effectiveCompanyId);
    if (!company) {
      throw new ServiceError(404, "Company not found");
    }

    // Access control check if callerUser is provided
    if (callerUser) {
      const isOwner = company.owner.toString() === callerUser._id.toString();
      if (!isOwner) {
        // Must be an active worker of this company with permission
        if (callerUser.company?.toString() !== company._id.toString()) {
          throw new ServiceError(403, "You do not belong to this company");
        }

        const workerRecord = company.workers.find(
          (w) => w.user.toString() === callerUser._id.toString(),
        );
        const status = workerRecord ? workerRecord.status : callerUser.companyAccessTerms?.status;
        if (status !== "active") {
          throw new ServiceError(
            403,
            `Access denied. Your company portal access status is ${status || "inactive"}. Company terms have changed.`,
          );
        }

        const permissions = workerRecord?.permissions || callerUser.companyAccessTerms?.permissions || [];
        if (!permissions.includes("create_job") && !permissions.includes("operate_job_portal")) {
          throw new ServiceError(403, "Insufficient permissions to post jobs for this company");
        }
      }
    }

    const creatorId = callerUser?._id || createdBy || company.owner;

    const job = await Job.create({
      title: title.trim(),
      company: company._id,
      description: description?.trim() || "",
      requirements: Array.isArray(requirements) ? requirements : [],
      benefits: Array.isArray(benefits) ? benefits : [],
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      location: location?.trim() || "Remote",
      jobType: jobType || "Full Time",
      experience: experience !== undefined ? Number(experience) : 0,
      createdBy: creatorId,
      status: "active",
      applicants: 0,
      assignedRecruiters: callerUser && callerUser.companyRole === "hr" ? [callerUser._id] : [],
    });

    return job;
  }

  /**
   * List jobs with filtering and pagination
   */
  async getJobs(filter = {}) {
    const query = {};
    if (filter.company && isValidObjectId(filter.company)) {
      query.company = filter.company;
    }
    if (filter.status) {
      query.status = filter.status;
    } else {
      query.status = "active";
    }
    if (filter.jobType) {
      query.jobType = filter.jobType;
    }
    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: "i" } },
        { description: { $regex: filter.search, $options: "i" } },
      ];
    }

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate("company", "name logo industry location")
        .populate("assignedRecruiters", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(query),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single job by ID
   */
  async getJobById(jobId) {
    if (!isValidObjectId(jobId)) {
      throw new ServiceError(400, "Invalid job ID format");
    }

    const job = await Job.findById(jobId)
      .populate("company", "name logo industry location description website")
      .populate("assignedRecruiters", "name email phone headline");

    if (!job) {
      throw new ServiceError(404, "Job not found");
    }

    return job;
  }

  /**
   * Get jobs assigned to a specific HR / Worker
   */
  async getAssignedJobs(workerUserId) {
    if (!isValidObjectId(workerUserId)) {
      throw new ServiceError(400, "Invalid worker user ID format");
    }

    const user = await User.findById(workerUserId);
    if (!user) {
      throw new ServiceError(404, "Worker user not found");
    }

    // Verify user is active in their company
    if (user.companyAccessTerms?.status !== "active") {
      throw new ServiceError(
        403,
        `Access denied. Your company portal access status is ${user.companyAccessTerms?.status || "inactive"}. Company terms have changed.`,
      );
    }

    const assignedIds = user.companyAccessTerms?.assignedJobs || [];
    const jobs = await Job.find({
      $or: [{ _id: { $in: assignedIds } }, { assignedRecruiters: user._id }],
    }).populate("company", "name logo location");

    return jobs;
  }

  /**
   * Update job posting
   */
  async updateJob(jobId, updateData, callerUser) {
    if (!isValidObjectId(jobId)) {
      throw new ServiceError(400, "Invalid job ID format");
    }

    const job = await Job.findById(jobId);
    if (!job) {
      throw new ServiceError(404, "Job not found");
    }

    if (callerUser) {
      const company = await Company.findById(job.company);
      const isOwner = company && company.owner.toString() === callerUser._id.toString();
      const isAssigned =
        job.assignedRecruiters.some((r) => r.toString() === callerUser._id.toString()) ||
        callerUser.companyAccessTerms?.assignedJobs?.some(
          (j) => j.toString() === job._id.toString(),
        );

      if (!isOwner && !isAssigned) {
        throw new ServiceError(403, "You do not have permission to manage this job post");
      }
    }

    const allowed = [
      "title",
      "description",
      "requirements",
      "benefits",
      "salaryMin",
      "salaryMax",
      "location",
      "jobType",
      "experience",
      "status",
    ];

    for (const key of allowed) {
      if (updateData[key] !== undefined) {
        job[key] = updateData[key];
      }
    }

    await job.save();
    return job;
  }
}

export const jobService = new JobService();
