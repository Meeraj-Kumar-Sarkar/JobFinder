import { firebaseAuth, firestore, firebaseDB } from "../config/firebase.js";
import Job from "../models/Job.js";

export const create_newJob = async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      requirements,
      benefits,
      salaryMin,
      salaryMax,
      location,
      jobType,
      experience,
      createdBy,
    } = req.body;

    const job = await Job.create({
      title,
      company,
      description,
      requirements,
      benefits,
      salaryMin,
      salaryMax,
      location,
      jobType,
      experience,
      createdBy,
    });

    console.log("Successfully Added a Job!!");

    return res.status(201).json({
      message: "success",
      job,
    });
  } catch (e) {
    console.log("Error:", e);

    return res.status(500).json({
      message: "unsuccess",
    });
  }
};
