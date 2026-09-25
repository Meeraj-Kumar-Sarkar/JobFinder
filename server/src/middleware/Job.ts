import { firebaseAuth,firestore,firebaseDB } from "../config/firebase";
import { Request,Response } from "express";

import Job from "../models/Job";

export const create_newJob = async (req: Request, res: Response) => {
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

