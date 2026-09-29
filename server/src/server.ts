import express from "express";
import { connectDatabase } from "./config/database";
import { create_newUser,update_newUser } from "./middleware/User";
import { create_newJob } from "./middleware/Job";
import { create_newApplication,final_hiringDecision,update_ApplicationStatus,my_JobApplications,employee_getJobApplications } from "./middleware/Application";
import { create_company } from "./middleware/Company";

const app=express()
app.use(express.json())

app.post("/create_newUser", create_newUser);
app.post("/update_newUser", update_newUser);
app.post("/create_newJob",create_newJob);
app.post("/create_newApplication",create_newApplication);
app.post("/my_JobApplications",my_JobApplications)
app.post("/get_applications",employee_getJobApplications)
app.post("/update_ApplicationStatus",update_ApplicationStatus)
app.post("/hiring_decision",final_hiringDecision)
app.post("/create_company",create_company);

app.listen(5000, () => {
    connectDatabase();
    console.log("Server running on http://localhost:5000");
});