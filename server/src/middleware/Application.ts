import User from "../models/User";
import Company from "../models/Company";
import Job from "../models/Job";
import { application, Request,Response } from "express";
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

//Application Status checking and Applicant Overview

export const my_JobApplications=async(req:Request,res:Response)=>{
    try{
        const { candidateId }=req.body
        const my_applications=await Application.find({candidate:candidateId}).populate("job","title")
        if(my_applications.length===0)
            return res.status(200).json({message:"no applications Found!!"})
        return res.status(200).json({applications:my_applications.map(app=>({
            title:(app.job as unknown as { title: string }).title,
            status:app.status
        }))})
    }
    catch(e){
        console.error("Error",e);
        return res.status(500).json({message:"Error while Fetching my job applications"})
    }
}

export const employee_getJobApplications=async(req:Request,res:Response)=>{
    try{
        const { jobId }=req.body
        const all_applicants=await Application.find({job:jobId}).populate({
            path:"candidate",
            select:"name email skills"
        })
        if(all_applicants.length===0)
            return res.status(200).json({message:"No Current Applicants!!"})
        return res.status(200).json({
            applicants:all_applicants.map(app=>({
                name:(app.candidate as unknown as { name: string }).name,
                email:(app.candidate as unknown as { email: string }).email,
                skills:(app.candidate as unknown as { skills: string[] }).skills,
                status:app.status
            }))
        })
    }
    catch(e){
        console.error("Error",e);
        return res.status(500).json({message:"Error while Emplyee getting all Job Applications"})
    }
}


//Application Status Changing
export const update_ApplicationStatus=async(req:Request,res:Response)=>{
    try{
        const {applicationId}=req.body
        const application=await Application.findOne({_id:applicationId})
        if(!application)
            return res.status(404).json({message:"Application not found!!"})
        const current_status=application.status
        if(current_status=="Applied")
            application.status="Screening"
        else if(current_status=="Screening")
            application.status="Technical"
        else if(current_status=="Technical")
            application.status="HR"
        else if(current_status=="HR")
            application.status="Offer"
        await application.save()
        return res.status(200).json({message:"Application status Updated!!",currentStatus:application.status})
    }
    catch(e){
        console.error("Error",e);
        return res.status(500).json({message:"Error while updating application status!!"})
    }
}

export const final_hiringDecision=async(req:Request,res:Response)=>{
    try{
        const {applicationId,decision}=req.body;
        const application =await Application.findOne({_id:applicationId})
            if(!application)
                return res.status(404).json({message:"Application not found!!"})
        if(decision=="Hired"){
            application.status="Hired"
            await application.save()
            const job=await Job.findOne({_id:application.job})
            const applier=await User.findOne({_id:application.candidate})
            if(!job || !applier)
                return res.status(404).json({message:"Job or applier not found!!"})
            job.applicants--;
            await job.save()
            applier.company=job.company
            await applier.save()
            const company_info=await Company.findOne({_id:job.company})
            if(!company_info)
                return res.status(404).json({message:"Company not found!!"})
            company_info.employees++
            await company_info.save()
            return res.status(200).json({message:`${applier.name} is Hired`})
        }
        else{
            application.status="Rejected"
            await application.save()
            const job=await Job.findOne({_id:application.job})
            const applier=await User.findOne({_id:application.candidate})
            if(!job || !applier)
                return res.status(404).json({message:"Job or applier not found!!"})
            job.applicants--;
            await job.save()
            return res.status(200).json({message:`${applier.name} is Rejected`})
        }
    }
    catch(e){
        console.error("Error",e)
        return res.status(500).json({message:"Hiring Decision error!!"})
    }
}