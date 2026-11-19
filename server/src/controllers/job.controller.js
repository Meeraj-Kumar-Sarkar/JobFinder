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
      const isSignedIn = Boolean(req.user?._id);
      const isEmployerFilter = Boolean(req.query.company || req.query.createdBy);
      const requestedSort = req.query.sort;
      const useRecommendationAlgo =
        isSignedIn &&
        !isEmployerFilter &&
        (!requestedSort ||
          requestedSort === "default" ||
          requestedSort === "recommended");

      if (useRecommendationAlgo) {
        const recommended_jobs = await jobService.jobRecommendation_service(
          req.user._id,
          req.query,
        );
        const jobs = (recommended_jobs || []).map((item) => ({
          ...item.details,
          recommendationScore: Math.round(item.score),
        }));
        const result = {
          jobs,
          recommended_jobs,
          isRecommended: true,
          pagination: {
            total: jobs.length,
            page: 1,
            limit: jobs.length || 20,
            totalPages: 1,
          },
        };
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              result,
              "Personalized job recommendations retrieved successfully",
            ),
          );
      }

      // Not signed in (or explicit standard sort): use previous normal job listing
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

  //job recommendation controller (Only for signed-in users)
  async recommendJob(req, res) {
    try {
      const candidateId =
        req.user?._id ||
        req.body?.candidate_id ||
        req.query?.candidate_id ||
        req.params?.candidateId;

      if (!candidateId) {
        return res.status(401).json({
          success: false,
          message: "Please sign in to access personalized job recommendations.",
        });
      }

      const recommended_jobs = await jobService.jobRecommendation_service(
        candidateId,
        req.query,
      );
      const jobs = (recommended_jobs || []).map((item) => ({
        ...item.details,
        recommendationScore: Math.round(item.score),
      }));

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Here are your Job recommendations:",
        recommended_jobs,
        data: {
          recommended_jobs,
          jobs,
          pagination: {
            total: jobs.length,
            page: 1,
            limit: jobs.length || 10,
            totalPages: 1,
          },
        },
      });
    } catch (error) {
      return handleJobError(res, error, "Failed to recommend job");
    }
  }
}

export const jobController = new JobController();
