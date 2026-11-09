import User from "../models/User.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";

export async function seedDatabase() {
  try {
    // 1. Create or ensure Demo Employer exists
    let employer = await User.findOne({ email: "employer@technova.com" });
    if (!employer) {
      employer = await User.create({
        name: "TechNova Recruiter",
        email: "employer@technova.com",
        password: "Password123!",
        role: "employer",
        userType: "institution",
        phone: "+1-555-0144",
      });
      console.log("Seeded Demo Employer: employer@technova.com");
    }

    // 2. Create or ensure Demo Candidate exists
    let candidate = await User.findOne({ email: "candidate@example.com" });
    if (!candidate) {
      candidate = await User.create({
        name: "Alex Morgan",
        email: "candidate@example.com",
        password: "Password123!",
        role: "candidate",
        userType: "worker",
        headline: "Frontend & Full Stack Developer",
        bio: "Passionate software engineer building responsive, accessible web applications with React, TypeScript, and modern backend architectures.",
        skills: [
          "React",
          "TypeScript",
          "JavaScript",
          "Tailwind CSS",
          "Node.js",
          "Express",
          "MongoDB",
        ],
        experience: 3,
        education: [
          {
            degree: "B.S. in Computer Science",
            institution: "State University",
            year: 2022,
          },
        ],
        resumeURL: "https://example.com/resumes/alex-morgan.pdf",
        portfolioURL: "https://alexmorgan.dev",
        phone: "+1-555-0199",
      });
      console.log("Seeded Demo Candidate: candidate@example.com");
    }

    // 3. Ensure TechNova company exists
    let technova = await Company.findOne({ name: "TechNova" });
    if (!technova) {
      technova = await Company.create({
        name: "TechNova",
        description: "A leading technology company crafting cloud-native web apps and intelligent interfaces.",
        industry: "Technology",
        location: "Remote / San Francisco, CA",
        website: "https://technova.example.com",
        owner: employer._id,
        employees: 85,
      });
    }

    if (!employer.company || employer.company.toString() !== technova._id.toString()) {
      employer.company = technova._id;
      employer.companyRole = "owner";
      await employer.save();
    }

    // Ensure Pixel Studio exists
    let pixelStudio = await Company.findOne({ name: "Pixel Studio" });
    if (!pixelStudio) {
      pixelStudio = await Company.create({
        name: "Pixel Studio",
        description: "Design and software development studio specializing in interactive digital experiences.",
        industry: "Technology",
        location: "Kolkata, India",
        website: "https://pixelstudio.example.com",
        owner: employer._id,
        employees: 30,
      });
    }

    // Ensure Creative Labs exists
    let creativeLabs = await Company.findOne({ name: "Creative Labs" });
    if (!creativeLabs) {
      creativeLabs = await Company.create({
        name: "Creative Labs",
        description: "Creative agency blending user research, visual design, and interactive UI systems.",
        industry: "Design",
        location: "Remote",
        website: "https://creativelabs.example.com",
        owner: employer._id,
        employees: 25,
      });
    }

    // Ensure Digital Stack exists
    let digitalStack = await Company.findOne({ name: "Digital Stack" });
    if (!digitalStack) {
      digitalStack = await Company.create({
        name: "Digital Stack",
        description: "High-scale backend infrastructure and API microservices company.",
        industry: "Technology",
        location: "Bangalore, India",
        website: "https://digitalstack.example.com",
        owner: employer._id,
        employees: 120,
      });
    }

    // Fix any pre-existing jobs that have no company linked
    const unlinkedJobs = await Job.find({ company: null });
    for (const j of unlinkedJobs) {
      j.company = technova._id;
      if (!j.category) j.category = "Technology";
      await j.save();
    }

    // Fix legacy users without passwords so they can log in
    const usersWithoutPassword = await User.find({ password: { $exists: false } }).select("+password");
    for (const u of usersWithoutPassword) {
      u.password = "Password123!";
      await u.save();
    }

    // 4. Seed demo jobs if database has fewer than 5 jobs
    const currentJobsCount = await Job.countDocuments();
    if (currentJobsCount < 5) {
      const demoJobs = [
        {
          title: "Senior Frontend Engineer",
          company: technova._id,
          category: "Technology",
          description:
            "Build modern, responsive, and accessible web applications using React and TypeScript. Collaborate with UX designers and backend engineers to craft engaging user experiences.",
          requirements: ["React", "TypeScript", "Tailwind CSS", "JavaScript"],
          benefits: ["Health insurance", "Remote flexibility", "Annual learning stipend", "401(k) matching"],
          salaryMin: 60000,
          salaryMax: 85000,
          location: "Remote",
          jobType: "Full Time",
          experience: 2,
          createdBy: employer._id,
          status: "active",
        },
        {
          title: "React Developer",
          company: pixelStudio._id,
          category: "Technology",
          description:
            "Develop interactive web interfaces and reusable component libraries. Optimize web performance and implement clean state management architectures.",
          requirements: ["React", "JavaScript", "HTML", "CSS"],
          benefits: ["Flexible working hours", "Performance bonuses", "Gym membership"],
          salaryMin: 50000,
          salaryMax: 75000,
          location: "Kolkata, India",
          jobType: "Full Time",
          experience: 2,
          createdBy: employer._id,
          status: "active",
        },
        {
          title: "UI/UX Designer",
          company: creativeLabs._id,
          category: "Design",
          description:
            "Create user personas, wireframes, high-fidelity prototypes, and design systems for web and mobile platforms. Partner with engineering to ensure seamless UI execution.",
          requirements: ["Figma", "Design Systems", "Prototyping", "User Research"],
          benefits: ["Flexible remote schedule", "Equipment reimbursement", "Wellness stipend"],
          salaryMin: 40000,
          salaryMax: 60000,
          location: "Remote",
          jobType: "Part Time",
          experience: 2,
          createdBy: employer._id,
          status: "active",
        },
        {
          title: "Backend Developer",
          company: digitalStack._id,
          category: "Technology",
          description:
            "Design, build, and deploy reliable RESTful and GraphQL APIs. Optimize database queries, manage microservices, and uphold high availability and data security standards.",
          requirements: ["Node.js", "Express", "MongoDB", "TypeScript"],
          benefits: ["Competitive equity", "Unlimited PTO", "Comprehensive healthcare"],
          salaryMin: 70000,
          salaryMax: 95000,
          location: "Bangalore, India",
          jobType: "Full Time",
          experience: 3,
          createdBy: employer._id,
          status: "active",
        },
      ];

      await Job.insertMany(demoJobs);
      console.log("Seeded additional demo jobs.");
    }

    // Ensure candidate has an active application
    const existingCandidateApp = await Application.findOne({ candidate: candidate._id });
    if (!existingCandidateApp) {
      const anyJob = await Job.findOne({ status: "active" });
      if (anyJob) {
        await Application.create({
          candidate: candidate._id,
          job: anyJob._id,
          resumeURL: candidate.resumeURL,
          coverLetter: "I have 3 years of hands-on experience building clean, responsive interfaces with React and TypeScript.",
          status: "Screening",
        });
        await Job.findByIdAndUpdate(anyJob._id, { $inc: { applicants: 1 } });
      }
    }

    console.log("Database seed & repair verification completed successfully.");
  } catch (error) {
    console.error("Error seeding demo data:", error);
  }
}
