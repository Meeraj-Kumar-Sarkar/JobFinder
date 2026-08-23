import { firebaseAuth,firestore } from "../config/firebase";
import {Request,Response} from "express"




export const create_newApplicant=async(req:Request,res:Response)=>{
    try{
        const {name,email,profession,password}=req.body
        const user=await firebaseAuth.createUser({
            displayName:name,
            email,
            password
        })
        console.log(user)
        await firestore.collection("Applicants").doc(user.uid).set({
            name,
            email,
            profession
        })
        res.status(200).json({
            message:"User created Successfully!!",
            uid:user.uid,
            name:user.displayName
        })
    }
    catch(e){
        console.error("Error Message:",e);
        res.status(500).json({
            message:"Error while creating a user!!"
        })
    }
}
