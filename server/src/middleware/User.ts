import { firebaseAuth,firestore } from "../config/firebase";
import {Request,Response} from "express"
import User from "../models/User";

export const create_newUser=async(req:Request,res:Response)=>{
    try{
        const {name,email,password,role}=req.body
        if(role!="employer" && role!="candidate")
            res.status(500).json({message:"Invalid role"})
        else{
        const user=await firebaseAuth.createUser({
            displayName:name,
            email,
            password
        })
        console.log(user)
        await firestore.collection(`${role}`).doc(user.uid).set({
            name,
            email,
            role
        })
        await User.create({
            firebaseUID:user.uid,
            name,
            email,
            role
        })
        console.log(role," created successfully!!");
        res.status(200).json({
            message:`${role} created successfully!!`,
            uid:user.uid,
            name:user.displayName
        })}
    }
    catch(e){
        console.error("Error Message:",e);
        res.status(500).json({
            message:"Error while creating a user!!"
        })
    }
}


export const update_newUser=async(req:Request,res:Response)=>{
    try{
        const {id, phone,
          profileImage,resumeURL,
          headline,
          bio,
          skills,
          experience,
          company,
          savedJobs,}=req.body
        let update :any ={}
        const user=await User.findOne({_id:id})
        if(!user){
            return res.status(404).json({message:"User not found"})
        }
        if (phone && phone !== "") {
            update.phone = phone;
        }

        if (profileImage && profileImage !== "") {
            update.profileImage = profileImage;
        }

        if (resumeURL && resumeURL !== "") {
            update.resumeURL = resumeURL;
        }

        if (headline && headline !== "") {
            update.headline = headline;
        }

        if (bio && bio !== "") {
            update.bio = bio;
        }

        if (skills && skills.length > 0) {
            update.skills = skills;
        }

        if (experience && experience !== "" && experience!== 0) {
            update.experience = experience;
        }

        if (company && company !== "") {
            update.company = company;
        }

        if (savedJobs && savedJobs !== "") {
            update.savedJobs = savedJobs;
        }

        await firestore.collection(user.role).doc(user.firebaseUID).set({
            update
        })

        const change=await User.updateOne({_id:id},{$set:update},{runValidators:true})
        if(change.matchedCount>=0){
            res.status(200).json({message:"Upadted Successfully!!"})
        }
        else{
            res.status(200).json({message:"Nothing updated!!"})
        }
    }
    catch(e){
        console.error("Error message",e)
        res.status(500).json({
            message:"Error while updating user"
        })
    }
}