import { Router } from "express";
import { companyController } from "../controllers/company.controller.js";
import {
  authenticate,
  optionalAuth,
  requireCompanyAccess,
} from "../middleware/auth.middleware.js";

const router = Router();

// Create new company / Institution profile
router.post("/", optionalAuth, (req, res) => companyController.createCompany(req, res));

// View company details
router.get("/:id", (req, res) => companyController.getCompany(req, res));

// View company workers and their complete details
router.get(
  "/:id/workers",
  optionalAuth,
  requireCompanyAccess("view_workers"),
  (req, res) => companyController.getCompanyWorkers(req, res),
);

// View specific worker detail
router.get(
  "/:id/workers/:workerId",
  optionalAuth,
  requireCompanyAccess("view_workers"),
  (req, res) => companyController.getWorkerDetail(req, res),
);

// Hire / Add a worker or HR to the company
router.post(
  "/:id/workers",
  optionalAuth,
  requireCompanyAccess("manage_workers"),
  (req, res) => companyController.addWorker(req, res),
);

// Assign job posts to a worker / HR
router.post(
  "/:id/workers/:workerId/assign-jobs",
  optionalAuth,
  requireCompanyAccess("manage_workers"),
  (req, res) => companyController.assignJobsToWorker(req, res),
);
router.put(
  "/:id/workers/:workerId/assign-jobs",
  optionalAuth,
  requireCompanyAccess("manage_workers"),
  (req, res) => companyController.assignJobsToWorker(req, res),
);

// Change terms for a worker / HR (Grant / Suspend / Revoke database and portal access)
router.patch(
  "/:id/workers/:workerId/terms",
  optionalAuth,
  requireCompanyAccess("manage_workers"),
  (req, res) => companyController.updateWorkerTerms(req, res),
);
router.put(
  "/:id/workers/:workerId/terms",
  optionalAuth,
  requireCompanyAccess("manage_workers"),
  (req, res) => companyController.updateWorkerTerms(req, res),
);

// Remove worker from company
router.delete(
  "/:id/workers/:workerId",
  optionalAuth,
  requireCompanyAccess("manage_workers"),
  (req, res) => companyController.removeWorker(req, res),
);

export default router;
