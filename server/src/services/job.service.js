import { isValidObjectId } from "mongoose";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import { ServiceError } from "./application.service.js";
import { escapeRegex } from "../middleware/security.middleware.js";
import { call_Genai } from "../ai_models/genai_model.js";

export class JobService {
  /**
   * Create a new job posting for a company.
   * Can be performed by Company Owner or an active HR with create_job permission.
   */
  async createJob(input, callerUser) {
    const {
      title,
      company: companyId,
      category = "Technology",
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

    let effectiveCompanyId = companyId || callerUser?.company;
    let company = null;

    if (effectiveCompanyId && isValidObjectId(effectiveCompanyId)) {
      company = await Company.findById(effectiveCompanyId);
    }

    if (!company && callerUser) {
      // Auto-provision company for employer if not yet created
      company = await Company.findOne({ owner: callerUser._id });
      if (!company && (callerUser.role === "employer" || callerUser.role === "hr")) {
        company = await Company.create({
          name: `${callerUser.name}'s Company`,
          owner: callerUser._id,
          location: location?.trim() || "Remote",
          industry: category?.trim() || "Technology",
          contactEmail: callerUser.email,
        });
        callerUser.company = company._id;
        callerUser.companyRole = "owner";
        await callerUser.save();
      }
    }

    // Access control check if callerUser is provided and company exists
    if (callerUser && company) {
      const isOwner = company.owner.toString() === callerUser._id.toString();
      if (!isOwner) {
        // Must be an active worker of this company with permission
        if (callerUser.company?.toString() !== company._id.toString()) {
          throw new ServiceError(403, "You do not belong to this company");
        }

        const workerRecord = (company.workers || []).find(
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

    const creatorId = callerUser?._id || createdBy || company?.owner;

    const job = await Job.create({
      title: title.trim(),
      company: company ? company._id : undefined,
      category: category?.trim() || "Technology",
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

    if (filter.createdBy && isValidObjectId(filter.createdBy)) {
      if (query.company) {
        query.$or = [{ createdBy: filter.createdBy }, { company: filter.company }];
        delete query.company;
      } else {
        query.createdBy = filter.createdBy;
      }
    }

    if (filter.status === "all" || filter.status === "any") {
      // Do not filter by status
    } else if (filter.status) {
      query.status = filter.status;
    } else {
      query.status = "active";
    }

    if (filter.category && filter.category !== "All") {
      query.category = filter.category;
    }

    if (filter.location && typeof filter.location === "string" && filter.location.trim()) {
      query.location = { $regex: escapeRegex(filter.location.trim()), $options: "i" };
    }

    if (filter.jobType && filter.jobType !== "All") {
      query.jobType = filter.jobType;
    }

    if (filter.search && typeof filter.search === "string" && filter.search.trim()) {
      const term = escapeRegex(filter.search.trim());
      query.$or = [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (filter.sort === "title") {
      sortOption = { title: 1 };
    } else if (filter.sort === "salary") {
      sortOption = { salaryMax: -1, salaryMin: -1 };
    } else if (filter.sort === "newest") {
      sortOption = { createdAt: -1 };
    }

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate("company", "name logo industry location")
        .populate("assignedRecruiters", "name email")
        .sort(sortOption)
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
      const company = job.company ? await Company.findById(job.company) : null;
      const isOwner =
        (company && company.owner.toString() === callerUser._id.toString()) ||
        job.createdBy?.toString() === callerUser._id.toString();
      const isAssigned =
        job.assignedRecruiters?.some((r) => r.toString() === callerUser._id.toString()) ||
        callerUser.companyAccessTerms?.assignedJobs?.some(
          (j) => j.toString() === job._id.toString(),
        );

      if (!isOwner && !isAssigned) {
        throw new ServiceError(403, "You do not have permission to manage this job post");
      }
    }

    const allowed = [
      "title",
      "category",
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

  //Adding Job Recommendation Algorith
  async jobRecommendation_service(candidate_id){

    try{
        const candidate=await User.findById(candidate_id)
        if (!candidate) {
            throw new Error("User profile not found");
        }
        const skills=candidate.skills,preference=candidate.preferredJobType,experience=candidate.experience
        const all_jobs=await Job.find({}).lean()
        const jq= new JobQueue()
        const recommended_jobs=[]
        for (const job of all_jobs){
            const manual_skill_score=job.requirements.length?
                                job.requirements.filter(item=>skills.includes(item)).length/job.requirements.length*100:0
            let skill_score=0
            if(job.requirements.length>0){
                const ai_response=await call_Genai(`
                    You are an expert Applicant Tracking System (ATS) and Job-Skill Importance Evaluator.

                      Your task is to evaluate the importance of each skill required for a particular job and calculate a weighted skill-matching score.

                      INPUT:
                      - Required Skills: ${JSON.stringify(job.requirements)}
                      - Candidate Skills: ${JSON.stringify(skills)}

                      INSTRUCTIONS:

                      1. Identify all unique required skills.

                      2. Assign an importance weight to each required skill based on its relevance to the job:
                        - Critical / Mandatory: Weight 3
                        - Important: Weight 2
                        - Optional / Additional: Weight 1

                      3. Determine whether the candidate possesses each required skill.
                        - Recognize equivalent technologies, abbreviations, and synonyms.
                        - Example: JS = JavaScript, Node = Node.js, Mongo = MongoDB.
                        - Do not treat related but different technologies as equivalent.
                        - Never assume the candidate possesses a skill without evidence.

                      4. Calculate the weighted skill matching percentage:

                        Weighted Score = (Sum of weights of matched skills / Sum of weights of all required skills) * 100

                      5. Ensure:
                        - Every required skill is counted only once.
                        - Missing skills contribute zero to the numerator.
                        - Extra candidate skills do not increase the score.
                        - Importance weights must reflect the actual job requirements.

                      OUTPUT RULES:
                      - Return ONLY one integer between 0 and 100.
                      - Do not return explanations, JSON, labels, or additional text.
                      - If required skills are invalid or empty, return 0.
                `)
                const ai_skill_score = Number(
                        String(ai_response).trim()
                    );
                    console.log(`${job.title}:`,ai_skill_score)
                if (
                    Number.isFinite(ai_skill_score) &&
                    ai_skill_score >= 0 &&
                    ai_skill_score <= 100
                ) {
                    skill_score = Math.max(manual_skill_score, ai_skill_score);
                } else {
                    skill_score = manual_skill_score;
                }
            }
            else{
                skill_score=0
            }
            const preference_score=(preference.toLowerCase()==job.jobType.toLowerCase())?1:0
            const experience_score=(experience>=job.experience)?1:0
            const score =(skill_score*0.5+preference_score*100*0.2+experience_score*100*0.3)
            jq.enqueue({details:job,score:score})
        }

        while(recommended_jobs.length < 10 && jq.jobs.length>0){
            const job=jq.dequeue()
            recommended_jobs.push(job)
        }

        return recommended_jobs
    }
    catch(err){
        console.log("Error",err)
    }
}
}

class JobQueue {
    constructor(){
        this.jobs=[]
    }
    enqueue(job){
        this.jobs.push(job)
        this.jobs.sort((a,b)=>b.score-a.score)
    }
    dequeue(){
        return this.jobs.shift()
    }
}

export const jobService = new JobService();
