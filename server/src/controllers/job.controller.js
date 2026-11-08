import { jobService } from "../services/job.service.js";
import { ServiceError } from "../services/application.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const handleJobError = (res, error, defaultMessage) => {
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error(`${defaultMessage}:`, error);
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined,
  });
};

export class JobController {
  async createJob(req, res) {
    try {
      const job = await jobService.createJob(req.body, req.user);
      return res
        .status(201)
        .json(new ApiResponse(201, job, "Job created successfully"));
    } catch (error) {
      return handleJobError(res, error, "Failed to create job");
    }
  }

  async getJobs(req, res) {
    try {
      const result = await jobService.getJobs(req.query);
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Jobs retrieved successfully"));
    } catch (error) {
      return handleJobError(res, error, "Failed to retrieve jobs");
    }
  }

  async getJobById(req, res) {
    try {
      const job = await jobService.getJobById(req.params.id);
      return res
        .status(200)
        .json(new ApiResponse(200, job, "Job retrieved successfully"));
    } catch (error) {
      return handleJobError(res, error, "Failed to retrieve job");
    }
  }

  async getAssignedJobs(req, res) {
    try {
      const workerId = req.params.workerId || req.user?._id;
      if (!workerId) {
        return res
          .status(400)
          .json({ success: false, message: "Worker ID is required" });
      }

      const jobs = await jobService.getAssignedJobs(workerId);
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            jobs,
            "Assigned jobs retrieved successfully for worker",
          ),
        );
    } catch (error) {
      return handleJobError(res, error, "Failed to retrieve assigned jobs");
    }
  }

  async updateJob(req, res) {
    try {
      const job = await jobService.updateJob(req.params.id, req.body, req.user);
      return res
        .status(200)
        .json(new ApiResponse(200, job, "Job updated successfully"));
    } catch (error) {
      return handleJobError(res, error, "Failed to update job");
    }
  }
}

export const jobController = new JobController();
