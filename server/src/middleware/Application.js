import {
  applicationService,
  ServiceError,
} from "../services/application.service.js";
import Application from "../models/Application.js";

export const create_newApplication = async (req, res) => {
  try {
    const candidateId = req.body.candidate || req.body.candidateId;
    const jobId = req.body.job || req.body.jobId;
    const { resumeURL, coverLetter, bypassSkillCheck } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({ message: "Candidate or job not found" });
    }

    const result = await applicationService.applyForJob({
      candidateId,
      jobId,
      resumeURL,
      coverLetter,
      bypassSkillCheck: Boolean(bypassSkillCheck),
    });

    return res.status(200).json({
      message: "Applied Successfully!!",
      ApplicationId: result.application._id,
      applicationId: result.application._id,
      application: result.application,
      matchSummary: result.matchSummary,
    });
  } catch (e) {
    if (e instanceof ServiceError) {
      return res.status(e.statusCode).json({ message: e.message });
    }
    if (e?.code === 11000) {
      return res
        .status(409)
        .json({ message: "You have already applied for this job" });
    }
    console.error("Error ", e);
    return res.status(500).json({ message: e?.message || "Failed to apply!!" });
  }
};

// Application Status checking and Applicant Overview for Candidates
export const my_JobApplications = async (req, res) => {
  try {
    const candidateId =
      req.body.candidateId || req.body.candidate || req.query.candidateId;

    if (!candidateId) {
      return res.status(400).json({ message: "Candidate ID is required" });
    }

    const result = await applicationService.getCandidateApplications(
      candidateId.toString(),
    );

    if (result.applications.length === 0) {
      return res.status(200).json({
        message: "no applications Found!!",
        applications: [],
      });
    }

    return res.status(200).json({
      applications: result.applications.map((app) => ({
        _id: app._id,
        applicationId: app._id,
        title: app.job?.title || "Unknown Job",
        company: app.job?.company?.name || "",
        location: app.job?.location || "",
        status: app.status,
        resumeURL: app.resumeURL,
        feedback: app.feedback,
        interviewDate: app.interviewDate,
        createdAt: app.createdAt,
        job: app.job,
      })),
      total: result.pagination.total,
    });
  } catch (e) {
    console.error("Error", e);
    return res
      .status(500)
      .json({ message: e?.message || "Error while Fetching my job applications" });
  }
};

// Recruiter/Employer getting all Job Applications for a Job
export const employee_getJobApplications = async (req, res) => {
  try {
    const jobId = req.body.jobId || req.body.job || req.query.jobId;

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    const result = await applicationService.getJobApplications(jobId.toString());

    if (result.applicants.length === 0) {
      return res.status(200).json({
        message: "No Current Applicants!!",
        applicants: [],
      });
    }

    return res.status(200).json({
      job: result.job,
      applicants: result.applicants.map((app) => ({
        _id: app._id,
        applicationId: app._id,
        name: app.candidate?.name || "Unknown",
        email: app.candidate?.email || "",
        phone: app.candidate?.phone || "",
        skills: app.candidate?.skills || [],
        experience: app.candidate?.experience || 0,
        headline: app.candidate?.headline || "",
        resumeURL: app.resumeURL,
        coverLetter: app.coverLetter,
        status: app.status,
        feedback: app.feedback,
        interviewDate: app.interviewDate,
        createdAt: app.createdAt,
      })),
      total: result.pagination.total,
    });
  } catch (e) {
    console.error("Error", e);
    return res.status(500).json({
      message: e?.message || "Error while Emplyee getting all Job Applications",
    });
  }
};

// Application Status Changing (sequential or target status)
export const update_ApplicationStatus = async (req, res) => {
  try {
    const applicationId =
      req.body.applicationId || req.body.id || req.params.applicationId;
    const { status, feedback } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "applicationId is required" });
    }

    const updated = await applicationService.updateApplicationStatus(
      applicationId,
      status,
      feedback,
    );

    return res.status(200).json({
      message: "Application status Updated!!",
      currentStatus: updated.status,
      applicationId: updated._id,
      feedback: updated.feedback,
    });
  } catch (e) {
    if (e instanceof ServiceError) {
      return res.status(e.statusCode).json({ message: e.message });
    }
    console.error("Error", e);
    return res
      .status(500)
      .json({ message: e?.message || "Error while updating application status!!" });
  }
};

// Final Hiring Decision
export const final_hiringDecision = async (req, res) => {
  try {
    const applicationId =
      req.body.applicationId || req.body.id || req.params.applicationId;
    const { decision, feedback } = req.body;

    if (!applicationId || !decision) {
      return res.status(400).json({
        message: "applicationId and decision (Hired or Rejected) are required",
      });
    }

    const result = await applicationService.finalHiringDecision(
      applicationId,
      decision,
      feedback,
    );

    return res.status(200).json({
      message: `${result.candidateName} is ${result.decision}`,
      application: result.application,
    });
  } catch (e) {
    if (e instanceof ServiceError) {
      return res.status(e.statusCode).json({ message: e.message });
    }
    console.error("Error", e);
    return res
      .status(500)
      .json({ message: e?.message || "Hiring Decision error!!" });
  }
};

// Schedule Interview
export const schedule_interview = async (req, res) => {
  try {
    const applicationId = req.body.applicationId || req.params.applicationId;
    const { interviewDate, feedback, stage } = req.body;

    if (!applicationId || !interviewDate) {
      return res.status(400).json({
        message: "applicationId and interviewDate are required",
      });
    }

    const updated = await applicationService.scheduleInterview(
      applicationId,
      interviewDate,
      feedback,
      stage,
    );

    return res.status(200).json({
      message: "Interview scheduled successfully!!",
      applicationId: updated._id,
      interviewDate: updated.interviewDate,
      currentStatus: updated.status,
    });
  } catch (e) {
    if (e instanceof ServiceError) {
      return res.status(e.statusCode).json({ message: e.message });
    }
    console.error("Error", e);
    return res.status(500).json({ message: e?.message || "Error scheduling interview" });
  }
};

// Withdraw Application
export const withdraw_application = async (req, res) => {
  try {
    const applicationId = req.body.applicationId || req.params.applicationId;
    const candidateId = req.body.candidateId;

    if (!applicationId) {
      return res.status(400).json({ message: "applicationId is required" });
    }

    const result = await applicationService.withdrawApplication(
      applicationId,
      candidateId,
    );

    return res.status(200).json(result);
  } catch (e) {
    if (e instanceof ServiceError) {
      return res.status(e.statusCode).json({ message: e.message });
    }
    console.error("Error", e);
    return res.status(500).json({ message: e?.message || "Error withdrawing application" });
  }
};
