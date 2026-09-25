import User from "../models/User";
import Company from "../models/Company";
import Job from "../models/Job";
import { Request,Response } from "express";
import { error } from "node:console";
import Application from "../models/Application";

export const create_newApplication=async (req:Request,res:Response)=>{
    try{
        const {candidate,
          job,
          resumeURL,
          coverLetter}=req.body
        const candidate_info = await User.findOne({ _id: candidate });
        const job_info = await Job.findOne({ _id: job });

        if (!candidate_info || !job_info) {
            return res.status(404).json({ message: "Candidate or job not found" });
        }

        const setA = new Set(job_info.requirements);
        const commonCount = candidate_info.skills.reduce((count, item) => setA.has(item) ? count + 1 : count, 0);
        if(commonCount>=(job_info.requirements).length/2){
            job_info.applicants++;
            await job_info.save()
            const newApplication=await Application.create({
                candidate,job,resumeURL,coverLetter,status:"Applied"
            })
            return res.status(200).json({message:"Applied Successfully!!",ApplicationId:newApplication._id})
        }
        else{
            return res.status(500).json({message:"Minimum no. odf skill requiremnt not met"})
        }
    }
    catch(e){
        console.error("Error ",e);
        return res.status(500).json({message:"Failed to apply!!"})
    }
}
/*const hiringDecision=(req:Request,res:Response)=>{
    try{
        const {applierId,jobId,companyId,decision}=req.body;
        if(decision=="Accpeted"){

        }
        else if(decision=="Rejected"){}
        else{
            return res.status(300).json({message:"Invalid decision!!"})
        }
    }
    catch(e){
        console.error("Error",e)
        return res.status(500).json({message:"Hiring Decision error!!"})
    }
}*/