import {
  applicationService,
  ServiceError,
} from "../services/application.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const handleControllerError = (res, error, defaultMessage) => {
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "You have already applied for this job",
    });
  }

  console.error(`${defaultMessage}:`, error);
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined,
  });
};

export class ApplicationController {
  /**
   * Apply for a job
   * POST /api/applications
   */
  async createApplication(req, res) {
    try {
      const candidateId =
        req.body.candidateId || req.body.candidate || req.user?._id;
      const jobId = req.body.jobId || req.body.job;
      const { resumeURL, coverLetter, phone, experience, skills, bypassSkillCheck } = req.body;

      if (!candidateId || !jobId) {
        return res.status(400).json({
          success: false,
          message: "Please sign in as a candidate to submit an application",
        });
      }

      const result = await applicationService.applyForJob({
        candidateId,
        jobId,
        resumeURL,
        coverLetter,
        phone,
        experience,
        skills,
        bypassSkillCheck: bypassSkillCheck !== undefined ? Boolean(bypassSkillCheck) : true,
      });

      return res.status(201).json(
        new ApiResponse(
          201,
          {
            applicationId: result.application._id,
            application: result.application,
            matchSummary: result.matchSummary,
          },
          "Applied successfully!",
        ),
      );
    } catch (error) {
      return handleControllerError(res, error, "Failed to submit application");
    }
  }

  /**
   * Get candidate's applications
   * GET /api/applications/my-applications
   */
  async getCandidateApplications(req, res) {
    try {
      const candidateId =
        req.query.candidateId?.toString() ||
        req.params.candidateId ||
        req.body.candidateId ||
        req.body.candidate ||
        req.user?._id;

      if (!candidateId) {
        return res.status(400).json({
          success: false,
          message: "Candidate ID is required",
        });
      }

      const { status, page, limit } = req.query;
      const result = await applicationService.getCandidateApplications(
        candidateId,
        {
          status: status?.toString(),
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        },
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          result,
          result.applications.length > 0
            ? "Applications retrieved successfully"
            : "No applications found",
        ),
      );
    } catch (error) {
      return handleControllerError(res, error, "Error fetching candidate applications");
    }
  }

  /**
   * Get all applications for a specific job
   * GET /api/applications/job/:jobId
   */
  async getJobApplications(req, res) {
    try {
      const jobId =
        req.params.jobId || req.query.jobId?.toString() || req.body.jobId;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "Job ID is required",
        });
      }

      const { status, page, limit } = req.query;
      const result = await applicationService.getJobApplications(jobId, {
        status: status?.toString(),
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          result,
          result.applicants.length > 0
            ? "Job applicants retrieved successfully"
            : "No current applicants found",
        ),
      );
    } catch (error) {
      return handleControllerError(res, error, "Error fetching job applicants");
    }
  }

  /**
   * Get all applications across all jobs for an employer
   * GET /api/applications/employer/:employerId
   */
  async getEmployerApplications(req, res) {
    try {
      const employerId =
        req.params.employerId ||
        req.query.employerId?.toString() ||
        req.body.employerId ||
        req.user?._id;

      if (!employerId) {
        return res.status(400).json({
          success: false,
          message: "Employer ID is required",
        });
      }

      const { status, page, limit } = req.query;
      const result = await applicationService.getEmployerAllApplications(
        employerId,
        {
          status: status?.toString(),
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        },
      );

      return res.status(200).json(
        new ApiResponse(200, result, "Employer applications retrieved successfully"),
      );
    } catch (error) {
      return handleControllerError(res, error, "Error fetching employer applications");
    }
  }

  /**
   * Get single application by ID
   * GET /api/applications/:id
   */
  async getApplicationById(req, res) {
    try {
      const applicationId = (
        req.params.id ||
        req.params.applicationId ||
        req.query.applicationId ||
        req.body.applicationId
      )?.toString();

      if (!applicationId) {
        return res.status(400).json({
          success: false,
          message: "Application ID is required",
        });
      }

      const application = await applicationService.getApplicationById(applicationId);
      return res.status(200).json(
        new ApiResponse(200, application, "Application details retrieved successfully"),
      );
    } catch (error) {
      return handleControllerError(res, error, "Error fetching application details");
    }
  }

  /**
   * Update application status (pipeline progression)
   * PATCH /api/applications/:id/status
   */
  async updateApplicationStatus(req, res) {
    try {
      const applicationId = (
        req.params.id ||
        req.body.applicationId ||
        req.body.id
      )?.toString();
      const { status, feedback } = req.body;

      if (!applicationId) {
        return res.status(400).json({
          success: false,
          message: "Application ID is required",
        });
      }

      const updated = await applicationService.updateApplicationStatus(
        applicationId,
        status,
        feedback,
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            applicationId: updated._id,
            currentStatus: updated.status,
            feedback: updated.feedback,
          },
          "Application status updated successfully!",
        ),
      );
    } catch (error) {
      return handleControllerError(res, error, "Error updating application status");
    }
  }

  /**
   * Schedule interview
   * POST /api/applications/:id/schedule-interview
   */
  async scheduleInterview(req, res) {
    try {
      const applicationId = (
        req.params.id || req.body.applicationId
      )?.toString();
      const { interviewDate, feedback, stage } = req.body;

      if (!applicationId || !interviewDate) {
        return res.status(400).json({
          success: false,
          message: "Application ID and interviewDate are required",
        });
      }

      const updated = await applicationService.scheduleInterview(
        applicationId,
        interviewDate,
        feedback,
        stage,
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            applicationId: updated._id,
            interviewDate: updated.interviewDate,
            currentStatus: updated.status,
            feedback: updated.feedback,
          },
          "Interview scheduled successfully!",
        ),
      );
    } catch (error) {
      return handleControllerError(res, error, "Error scheduling interview");
    }
  }

  /**
   * Final hiring decision
   * POST /api/applications/:id/decision
   */
  async hiringDecision(req, res) {
    try {
      const applicationId = (
        req.params.id || req.body.applicationId
      )?.toString();
      const { decision, feedback } = req.body;

      if (!applicationId || !decision) {
        return res.status(400).json({
          success: false,
          message: "Application ID and decision (Hired or Rejected) are required",
        });
      }

      const result = await applicationService.finalHiringDecision(
        applicationId,
        decision,
        feedback,
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          result,
          `${result.candidateName} is ${result.decision}`,
        ),
      );
    } catch (error) {
      return handleControllerError(res, error, "Error recording hiring decision");
    }
  }

  /**
   * Withdraw application
   * DELETE /api/applications/:id
   */
  async withdrawApplication(req, res) {
    try {
      const applicationId = (
        req.params.id || req.body.applicationId
      )?.toString();
      const candidateId = req.body.candidateId || req.user?._id;

      if (!applicationId) {
        return res.status(400).json({
          success: false,
          message: "Application ID is required",
        });
      }

      const result = await applicationService.withdrawApplication(
        applicationId,
        candidateId,
      );

      return res.status(200).json(
        new ApiResponse(200, result, "Application withdrawn successfully"),
      );
    } catch (error) {
      return handleControllerError(res, error, "Error withdrawing application");
    }
  }

  /**
   * Get application stats for a job
   * GET /api/applications/stats/:jobId
   */
  async getApplicationStats(req, res) {
    try {
      const jobId = (req.params.jobId || req.query.jobId)?.toString();

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "Job ID is required",
        });
      }

      const stats = await applicationService.getJobApplicationStats(jobId);
      return res.status(200).json(
        new ApiResponse(200, stats, "Application statistics retrieved successfully"),
      );
    } catch (error) {
      return handleControllerError(res, error, "Error fetching application statistics");
    }
  }
}

export const applicationController = new ApplicationController();
