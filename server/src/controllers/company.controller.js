import { companyService } from "../services/company.service.js";
import { ServiceError } from "../services/application.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const handleCompanyError = (res, error, defaultMessage) => {
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

export class CompanyController {
  async createCompany(req, res) {
    try {
      const ownerId = (req.user?._id || req.body.owner)?.toString();
      const company = await companyService.createCompany(req.body, ownerId);
      return res
        .status(201)
        .json(new ApiResponse(201, company, "Company registered successfully"));
    } catch (error) {
      return handleCompanyError(res, error, "Failed to create company");
    }
  }

  async getCompany(req, res) {
    try {
      const companyId = req.params.id?.toString();
      const company = await companyService.getCompanyById(companyId);
      return res
        .status(200)
        .json(new ApiResponse(200, company, "Company retrieved successfully"));
    } catch (error) {
      return handleCompanyError(res, error, "Failed to retrieve company");
    }
  }

  async getCompanyWorkers(req, res) {
    try {
      const companyId = (req.params.id || req.user?.company)?.toString();
      const callerId = req.user?._id?.toString();
      const workers = await companyService.getCompanyWorkers(companyId, callerId);
      return res
        .status(200)
        .json(new ApiResponse(200, workers, "Company workers retrieved successfully"));
    } catch (error) {
      return handleCompanyError(res, error, "Failed to retrieve company workers");
    }
  }

  async getWorkerDetail(req, res) {
    try {
      const companyId = (req.params.id || req.user?.company)?.toString();
      const workerId = req.params.workerId?.toString();
      const callerId = req.user?._id?.toString();
      const worker = await companyService.getWorkerDetail(companyId, workerId, callerId);
      return res
        .status(200)
        .json(new ApiResponse(200, worker, "Worker details retrieved successfully"));
    } catch (error) {
      return handleCompanyError(res, error, "Failed to retrieve worker detail");
    }
  }

  async addWorker(req, res) {
    try {
      const companyId = (req.params.id || req.user?.company)?.toString();
      const callerId = req.user?._id?.toString();
      const result = await companyService.addWorker(companyId, req.body, callerId);
      return res
        .status(201)
        .json(new ApiResponse(201, result, "Worker added to company successfully"));
    } catch (error) {
      return handleCompanyError(res, error, "Failed to add worker to company");
    }
  }

  async assignJobsToWorker(req, res) {
    try {
      const companyId = (req.params.id || req.user?.company)?.toString();
      const workerId = req.params.workerId?.toString();
      const jobIds = req.body.jobIds || req.body.assignedJobs || [];
      const callerId = req.user?._id?.toString();
      const result = await companyService.assignJobsToWorker(
        companyId,
        workerId,
        jobIds,
        callerId,
      );
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Jobs assigned to worker successfully"));
    } catch (error) {
      return handleCompanyError(res, error, "Failed to assign jobs to worker");
    }
  }

  async updateWorkerTerms(req, res) {
    try {
      const companyId = (req.params.id || req.user?.company)?.toString();
      const workerId = req.params.workerId?.toString();
      const callerId = req.user?._id?.toString();
      const result = await companyService.updateWorkerTerms(
        companyId,
        workerId,
        req.body,
        callerId,
      );
      return res
        .status(200)
        .json(new ApiResponse(200, result, result.message));
    } catch (error) {
      return handleCompanyError(res, error, "Failed to update worker terms");
    }
  }

  async removeWorker(req, res) {
    try {
      const companyId = (req.params.id || req.user?.company)?.toString();
      const workerId = req.params.workerId?.toString();
      const result = await companyService.removeWorker(companyId, workerId);
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Worker removed from company"));
    } catch (error) {
      return handleCompanyError(res, error, "Failed to remove worker");
    }
  }
}

export const companyController = new CompanyController();
