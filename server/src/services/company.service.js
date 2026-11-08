import { isValidObjectId, Types } from "mongoose";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import { ServiceError } from "./application.service.js";
import { authService } from "./auth.service.js";

export class CompanyService {
  /**
   * Create a new company / Institution profile
   */
  async createCompany(data, ownerId) {
    const {
      name,
      description,
      website,
      logo,
      industry,
      location,
      registrationNumber,
      contactEmail,
      contactPhone,
      employees = 1,
    } = data;

    if (!name || !name.trim()) {
      throw new ServiceError(400, "Company name is required");
    }

    const effectiveOwnerId = ownerId || data.owner;
    if (!effectiveOwnerId || !isValidObjectId(effectiveOwnerId)) {
      throw new ServiceError(400, "Valid company owner ID is required");
    }

    const owner = await User.findById(effectiveOwnerId);
    if (!owner) {
      throw new ServiceError(404, "Owner user not found");
    }

    const company = await Company.create({
      name: name.trim(),
      description: description?.trim() || "",
      website: website?.trim() || "",
      logo: logo?.trim() || "",
      industry: industry?.trim() || "Technology",
      location: location?.trim() || "Remote",
      registrationNumber: registrationNumber?.trim() || "",
      contactEmail: contactEmail?.trim() || owner.email,
      contactPhone: contactPhone?.trim() || owner.phone || "",
      owner: owner._id,
      employees: Number(employees) || 1,
      workers: [],
    });

    owner.company = company._id;
    owner.companyRole = "owner";
    owner.role = "employer";
    owner.userType = "institution";
    await owner.save();

    return company;
  }

  /**
   * Get company profile by ID
   */
  async getCompanyById(companyId) {
    if (!isValidObjectId(companyId)) {
      throw new ServiceError(400, "Invalid company ID format");
    }

    const company = await Company.findById(companyId)
      .populate("owner", "name email phone role")
      .populate("workers.user", "name email phone skills experience resumeURL headline")
      .populate("workers.assignedJobs", "title location jobType status applicants");

    if (!company) {
      throw new ServiceError(404, "Company not found");
    }

    return company;
  }

  /**
   * View all workers and their complete profile details for a company
   */
  async getCompanyWorkers(companyId, callerId) {
    if (!isValidObjectId(companyId)) {
      throw new ServiceError(400, "Invalid company ID format");
    }

    const company = await Company.findById(companyId)
      .populate({
        path: "workers.user",
        select:
          "name email phone profileImage headline bio skills experience education resumeURL portfolioURL userType role companyAccessTerms",
      })
      .populate({
        path: "workers.assignedJobs",
        select: "title location salaryMin salaryMax jobType status applicants",
      });

    if (!company) {
      throw new ServiceError(404, "Company not found");
    }

    // Transform and return clean worker list with all their operational details
    const workers = company.workers.map((w) => {
      const u = w.user;
      return {
        workerId: u?._id,
        name: u?.name,
        email: u?.email,
        phone: u?.phone,
        profileImage: u?.profileImage,
        headline: u?.headline,
        bio: u?.bio,
        skills: u?.skills || [],
        experience: u?.experience || 0,
        education: u?.education || [],
        resumeURL: u?.resumeURL,
        portfolioURL: u?.portfolioURL,
        companyRole: w.companyRole,
        status: w.status,
        terms: w.terms,
        permissions: w.permissions,
        assignedJobs: w.assignedJobs,
        joinedAt: w.joinedAt,
        updatedAt: w.updatedAt,
      };
    });

    return {
      companyId: company._id,
      companyName: company.name,
      totalWorkers: workers.length,
      workers,
    };
  }

  /**
   * Get single worker details within a company
   */
  async getWorkerDetail(companyId, workerUserId) {
    if (!isValidObjectId(companyId) || !isValidObjectId(workerUserId)) {
      throw new ServiceError(400, "Invalid company or worker ID format");
    }

    const company = await Company.findById(companyId);
    if (!company) {
      throw new ServiceError(404, "Company not found");
    }

    const workerRecord = company.workers.find(
      (w) => w.user.toString() === workerUserId.toString(),
    );
    if (!workerRecord) {
      throw new ServiceError(404, "Worker not found in this company");
    }

    const [user, jobs] = await Promise.all([
      User.findById(workerUserId).select(
        "name email phone profileImage headline bio skills experience education resumeURL portfolioURL companyAccessTerms",
      ),
      Job.find({ _id: { $in: workerRecord.assignedJobs || [] } }).select(
        "title location salaryMin salaryMax jobType status applicants createdAt",
      ),
    ]);

    return {
      worker: user,
      companyRole: workerRecord.companyRole,
      status: workerRecord.status,
      terms: workerRecord.terms,
      permissions: workerRecord.permissions,
      assignedJobs: jobs,
      joinedAt: workerRecord.joinedAt,
      updatedAt: workerRecord.updatedAt,
    };
  }

  /**
   * Add / Hire a worker or HR into the company
   */
  async addWorker(companyId, workerData, callerId) {
    if (!isValidObjectId(companyId)) {
      throw new ServiceError(400, "Invalid company ID format");
    }

    const company = await Company.findById(companyId);
    if (!company) {
      throw new ServiceError(404, "Company not found");
    }

    let workerUser = null;

    // Check if worker is specified by ID or Email, or creating a new account
    if (workerData.userId && isValidObjectId(workerData.userId)) {
      workerUser = await User.findById(workerData.userId);
    } else if (workerData.email) {
      workerUser = await User.findOne({ email: workerData.email.toLowerCase().trim() });
    }

    // If user does not exist and name + password are provided, create new worker account
    if (!workerUser && workerData.name && workerData.email && workerData.password) {
      const registered = await authService.register({
        name: workerData.name,
        email: workerData.email,
        password: workerData.password,
        role: workerData.companyRole === "hr" ? "hr" : "candidate",
        phone: workerData.phone,
        headline: workerData.headline,
      });
      workerUser = await User.findById(registered.user._id);
    }

    if (!workerUser) {
      throw new ServiceError(
        404,
        "Worker user not found. Please provide an existing userId, valid email, or complete signup info.",
      );
    }

    // Verify if already a member of this company
    const alreadyWorker = company.workers.find(
      (w) => w.user.toString() === workerUser._id.toString(),
    );
    if (alreadyWorker) {
      throw new ServiceError(409, "User is already a worker in this company");
    }

    const companyRole = workerData.companyRole || "hr";
    const status = workerData.status || "active";
    const terms = workerData.terms || "Standard employment terms";
    const permissions =
      workerData.permissions && Array.isArray(workerData.permissions)
        ? workerData.permissions
        : [
            "view_company",
            "view_jobs",
            "create_job",
            "operate_job_portal",
            "view_applications",
            "manage_applications",
            "schedule_interviews",
            "hiring_decisions",
          ];

    // Validate assigned jobs if provided
    let assignedJobs = [];
    if (workerData.assignedJobs && Array.isArray(workerData.assignedJobs)) {
      assignedJobs = workerData.assignedJobs.filter((id) => isValidObjectId(id));
      // Ensure all jobs belong to this company
      const validJobs = await Job.find({
        _id: { $in: assignedJobs },
        company: company._id,
      });
      assignedJobs = validJobs.map((j) => j._id);
    }

    // Update Company workers list
    company.workers.push({
      user: workerUser._id,
      companyRole,
      status,
      terms,
      permissions,
      assignedJobs,
      joinedAt: new Date(),
      updatedAt: new Date(),
    });
    company.employees = (company.employees || 0) + 1;
    await company.save();

    // Update User record with company reference and terms
    workerUser.company = company._id;
    workerUser.companyRole = companyRole;
    workerUser.companyAccessTerms = {
      hasAccess: status === "active",
      status,
      terms,
      permissions,
      assignedJobs,
      assignedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: callerId ? new Types.ObjectId(callerId) : company.owner,
    };
    await workerUser.save();

    // Add recruiter to assigned jobs
    if (assignedJobs.length > 0) {
      await Job.updateMany(
        { _id: { $in: assignedJobs } },
        { $addToSet: { assignedRecruiters: workerUser._id } },
      );
    }

    return {
      message: `Worker ${workerUser.name} added to company successfully as ${companyRole}`,
      workerId: workerUser._id,
      companyId: company._id,
      companyRole,
      status,
      terms,
      permissions,
      assignedJobs,
    };
  }

  /**
   * Assign or reassign Job Posts to a specific Worker / HR
   */
  async assignJobsToWorker(companyId, workerUserId, jobIds, callerId) {
    if (!isValidObjectId(companyId) || !isValidObjectId(workerUserId)) {
      throw new ServiceError(400, "Invalid company or worker ID format");
    }

    if (!Array.isArray(jobIds)) {
      throw new ServiceError(400, "jobIds must be an array of Job IDs");
    }

    const company = await Company.findById(companyId);
    if (!company) {
      throw new ServiceError(404, "Company not found");
    }

    const workerIndex = company.workers.findIndex(
      (w) => w.user.toString() === workerUserId.toString(),
    );
    if (workerIndex === -1) {
      throw new ServiceError(404, "Worker not found in this company");
    }

    // Verify all jobs belong to this company
    const validJobs = await Job.find({
      _id: { $in: jobIds },
      company: company._id,
    });
    const verifiedJobIds = validJobs.map((j) => j._id);

    // Update company.workers subdocument
    company.workers[workerIndex].assignedJobs = verifiedJobIds;
    company.workers[workerIndex].updatedAt = new Date();
    await company.save();

    // Update user.companyAccessTerms
    const user = await User.findById(workerUserId);
    if (user) {
      if (!user.companyAccessTerms) {
        user.companyAccessTerms = {};
      }
      user.companyAccessTerms.assignedJobs = verifiedJobIds;
      user.companyAccessTerms.updatedAt = new Date();
      if (callerId && isValidObjectId(callerId)) {
        user.companyAccessTerms.updatedBy = new Types.ObjectId(callerId);
      }
      await user.save();
    }

    // Update Job models: remove user from jobs they are no longer assigned to, and add to newly assigned jobs
    await Job.updateMany(
      { company: company._id, _id: { $nin: verifiedJobIds } },
      { $pull: { assignedRecruiters: workerUserId } },
    );
    await Job.updateMany(
      { company: company._id, _id: { $in: verifiedJobIds } },
      { $addToSet: { assignedRecruiters: workerUserId } },
    );

    return {
      message: "Job posts assigned to worker successfully",
      workerId: workerUserId,
      assignedJobCount: verifiedJobIds.length,
      assignedJobs: validJobs.map((j) => ({
        _id: j._id,
        title: j.title,
        status: j.status,
      })),
    };
  }

  /**
   * Update Terms of Access for a Company Worker (HR / Recruiter)
   * If Company changes terms, worker loses or gains access to company database and portal!
   */
  async updateWorkerTerms(companyId, workerUserId, termsUpdate, callerId) {
    if (!isValidObjectId(companyId) || !isValidObjectId(workerUserId)) {
      throw new ServiceError(400, "Invalid company or worker ID format");
    }

    const company = await Company.findById(companyId);
    if (!company) {
      throw new ServiceError(404, "Company not found");
    }

    const workerIndex = company.workers.findIndex(
      (w) => w.user.toString() === workerUserId.toString(),
    );
    if (workerIndex === -1) {
      throw new ServiceError(404, "Worker not found in this company");
    }

    const { status, terms, permissions, companyRole, hasAccess, assignedJobs } = termsUpdate;

    // Determine new status and access flag
    const currentWorker = company.workers[workerIndex];
    let newStatus = status !== undefined ? status : currentWorker.status;
    let newHasAccess =
      hasAccess !== undefined
        ? Boolean(hasAccess)
        : newStatus === "active";

    // If status is suspended or revoked, hasAccess must be false
    if (["suspended", "revoked"].includes(newStatus)) {
      newHasAccess = false;
    }

    // Apply updates to Company worker subdocument
    if (status !== undefined) currentWorker.status = newStatus;
    if (terms !== undefined) currentWorker.terms = terms.trim();
    if (permissions && Array.isArray(permissions)) currentWorker.permissions = permissions;
    if (companyRole !== undefined) currentWorker.companyRole = companyRole;
    if (assignedJobs && Array.isArray(assignedJobs)) {
      const validJobs = await Job.find({
        _id: { $in: assignedJobs },
        company: company._id,
      });
      currentWorker.assignedJobs = validJobs.map((j) => j._id);
    }
    currentWorker.updatedAt = new Date();
    await company.save();

    // Apply updates to User model to maintain synchronization
    const user = await User.findById(workerUserId);
    if (user) {
      if (!user.companyAccessTerms) {
        user.companyAccessTerms = {};
      }
      user.companyAccessTerms.status = newStatus;
      user.companyAccessTerms.hasAccess = newHasAccess;
      if (terms !== undefined) user.companyAccessTerms.terms = terms.trim();
      if (permissions && Array.isArray(permissions))
        user.companyAccessTerms.permissions = permissions;
      if (assignedJobs && Array.isArray(assignedJobs))
        user.companyAccessTerms.assignedJobs = currentWorker.assignedJobs;
      if (companyRole !== undefined) user.companyRole = companyRole;

      user.companyAccessTerms.updatedAt = new Date();
      if (callerId && isValidObjectId(callerId)) {
        user.companyAccessTerms.updatedBy = new Types.ObjectId(callerId);
      }
      await user.save();
    }

    return {
      message:
        newHasAccess
          ? "Terms updated: Worker has ACTIVE access to company database and job portal."
          : `Terms updated: Worker access to company database is ${newStatus.toUpperCase()}. Access restricted.`,
      workerId: workerUserId,
      companyId: company._id,
      status: newStatus,
      hasAccess: newHasAccess,
      terms: currentWorker.terms,
      permissions: currentWorker.permissions,
      assignedJobs: currentWorker.assignedJobs,
    };
  }

  /**
   * Remove a worker from the company
   */
  async removeWorker(companyId, workerUserId) {
    if (!isValidObjectId(companyId) || !isValidObjectId(workerUserId)) {
      throw new ServiceError(400, "Invalid company or worker ID format");
    }

    const company = await Company.findById(companyId);
    if (!company) {
      throw new ServiceError(404, "Company not found");
    }

    company.workers = company.workers.filter(
      (w) => w.user.toString() !== workerUserId.toString(),
    );
    company.employees = Math.max(1, (company.employees || 1) - 1);
    await company.save();

    // Clear company association and access terms on the user
    const user = await User.findById(workerUserId);
    if (user && user.company?.toString() === company._id.toString()) {
      user.company = undefined;
      user.companyRole = undefined;
      user.companyAccessTerms = {
        hasAccess: false,
        status: "revoked",
        terms: "Employment terminated / removed from company",
        permissions: [],
        assignedJobs: [],
        updatedAt: new Date(),
      };
      await user.save();
    }

    // Remove user from all assigned jobs in this company
    await Job.updateMany(
      { company: company._id },
      { $pull: { assignedRecruiters: workerUserId } },
    );

    return {
      message: "Worker removed from company successfully",
      workerId: workerUserId,
      companyId: company._id,
    };
  }
}

export const companyService = new CompanyService();
