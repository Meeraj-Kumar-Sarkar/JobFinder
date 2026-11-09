# JobFinder — Full-Stack Job Portal & Applicant Tracking System (ATS)

**JobFinder** is a complete, production-grade Full-Stack Job Portal and Applicant Tracking System (ATS) connecting job seekers (Candidates) and hiring organizations (Employers).

---

## 🏗️ System Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │            Frontend Client             │
                      │   (React 19, TypeScript, Vite, Tailwind)│
                      └───────────────────┬────────────────────┘
                                          │
                                          │ Axios HTTP Requests
                                          │ Authorization: Bearer <JWT>
                                          ▼
                      ┌────────────────────────────────────────┐
                      │             Backend Server             │
                      │          (Node.js 22+, Express 5)      │
                      └───────────────────┬────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
         ┌─────────────────────┐                     ┌─────────────────────┐
         │   MongoDB Database  │                     │   Firebase Admin    │
         │ (Users, Jobs, Apps) │                     │ (Optional Fallback) │
         └─────────────────────┘                     └─────────────────────┘
```

---

## 🔄 How the System Works (End-to-End Workflow)

### 1. Onboarding & User Roles
Users create an account on `/signup` or log in on `/login`:
- **Job Seeker (Candidate)**:
  - Registers personal details, headline, skills, years of experience, and a resume URL.
  - Profile is saved in MongoDB (`role: "candidate"`).
  - Can browse jobs, search by keywords/location/category, apply with one click, and track ATS status in `/dashboard`.
- **Employer / Company**:
  - Registers organization details (Company name, industry, location, website).
  - Employer user (`role: "employer"`) and a new `Company` document are linked together in MongoDB.
  - Can publish new job posts, review incoming applicants, advance ATS stages, and schedule interviews in `/employer/dashboard`.

### 2. Job Discovery & Filtering
- Candidates visit `/jobs` or search from the `/` home hero section.
- **Search & Filters**:
  - Full-text search across titles and descriptions.
  - Location filtering (e.g. "Remote", "Bangalore", "San Francisco").
  - Domain categories (`Technology`, `Design`, `Marketing`, `Business`, `Healthcare`, `Finance`).
  - Job types (`Full Time`, `Part Time`, `Contract`, `Freelance`).
  - Salary sorting (`Highest Salary First`, `Alphabetical`, `Newest First`).
- Each listing displays salary range, location, job type, and required qualifications.

### 3. Application Process
- The candidate clicks **"View Details & Apply"** to inspect the job on `/jobs/:id`.
- The system automatically checks whether the candidate has already applied:
  - **Already applied**: The button transforms into a green **"Application Submitted ✓"** badge with a link to their dashboard.
  - **Not applied yet**: The candidate clicks **"Apply for this Job"** to open `/apply/:id`.
- On `/apply/:id`:
  - Full Name, Email, Phone, Experience, and Resume Link are pre-filled from their profile.
  - Candidate provides an optional Cover Letter and submits.
  - Backend creates an `Application` record with status `Applied`, increments the job's applicant counter, and notifies the employer.

### 4. Applicant Tracking System (ATS) Pipeline
Employers manage candidates on `/employer/dashboard` across multiple hiring stages:

```
[Applied] ──► [Screening] ──► [Technical] ──► [HR Interview] ──► [Offer] ──► [Hired / Rejected]
```

- **Screening**: Employer reviews candidate profile, skills, and clicks the resume URL.
- **Schedule Interview**: Employer clicks **"📅 Interview"** to choose a date and time. This automatically moves the application to `Technical` stage and records the `interviewDate`.
- **Status Advancement**: Employer advances the candidate through `HR Interview` and `Offer`.
- **Final Decision**: Employer selects `Hired` or `Rejected`. Selecting `Hired` automatically updates company employee records.

### 5. Candidate Real-Time Tracking
- Candidates visit `/dashboard` to view:
  - Live color-coded status badges for all submissions.
  - Scheduled interview dates and times.
  - Live summary statistics (Applied, In Review, Interviewing, Hired).
  - An option to **Withdraw** pending applications.
  - Profile editor to update headline, bio, skills, experience, and resume URL.

---

## 📁 Repository Structure

```
.
├── client/                     # Frontend Application (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── components/         # Navbar, ProtectedRoute
│   │   ├── context/            # AuthContext (login, register, logout, persistent user)
│   │   ├── pages/              # Home, Jobs, JobDetails, Apply, Dashboards, Auth
│   │   ├── services/           # api.ts (Centralized Axios client & type definitions)
│   │   ├── app.tsx             # Root router with role-based route guards
│   │   └── main.tsx            # Application entry
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md               # Detailed Frontend Documentation
│
├── server/                     # Backend Application (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/             # database.js, env.js, firebase.js, seed.js (Auto-seeder)
│   │   ├── controllers/        # auth, job, application, company, user controllers
│   │   ├── middleware/         # auth.middleware.js (JWT & Firebase token verification)
│   │   ├── models/             # Mongoose schemas: User, Company, Job, Application, Notification
│   │   ├── routes/             # RESTful API route definitions
│   │   ├── services/           # Business logic: auth, job, application, company, user
│   │   ├── utils/              # JWT generator, ApiError, ApiResponse, constants
│   │   ├── app.js              # Express app setup and middleware configuration
│   │   └── server.js           # Server entry point (starts server on port 5000)
│   ├── package.json
│   ├── .env                    # Server environment variables
│   └── README.md               # Detailed Backend Documentation
│
├── package.json                # Root package.json with unified execution scripts
└── README.md                   # Master System Documentation (this file)
```

---

## ⚡ Quick Demo Accounts

Pre-seeded accounts are ready for instant testing:

| Role | Email | Password | Pre-seeded Features |
|------|-------|----------|---------------------|
| **Candidate** | `candidate@example.com` | `Password123!` | Alex Morgan • 3 yrs exp • Full-Stack developer profile • Active application |
| **Employer** | `employer@technova.com` | `Password123!` | TechNova Recruiter • Company profile • Multiple active job postings |

*(You can also use the one-click demo buttons directly on the `/login` page).*

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** (v18 or higher; Node 20+ recommended).
2. **MongoDB** running locally on port `27017` (e.g. `mongodb://localhost:27017/jobportal`).

---

### Step 1: Start the Backend Server
Open a terminal in the project root:

```bash
# Run server from root
npm start

# OR navigate to server directory
cd server
npm start
```

**Expected output**:
```
MongoDB Connected Successfully
Database seed & repair verification completed successfully.
Server running on http://localhost:5000
```

---

### Step 2: Start the Frontend Client
Open a second terminal in the project root:

```bash
# Run client from root
npm run client

# OR navigate to client directory
cd client
npm run dev
```

**Expected output**:
```
  VITE v8.2.0  ready in 200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Step 3: Open in Browser
Visit **`http://localhost:5173`** in your browser.

---

## 🛠️ Unified NPM Scripts (Root `package.json`)

| Command | Action |
|---------|--------|
| `npm start` | Starts the Express backend server (`http://localhost:5000`) |
| `npm run dev` | Starts the backend server with `nodemon` auto-reload |
| `npm run client` | Starts the Vite React frontend (`http://localhost:5173`) |
| `npm run client:build`| Runs TypeScript typecheck & creates production build in `client/dist` |
| `npm run test:server` | Runs backend API & ATS integration test suites |

---

## 📖 Sub-Module Documentation

For in-depth explanations of individual subsystems, refer to:
- **[Backend Detailed Guide (server/README.md)](server/README.md)**: Database schemas, REST endpoints, ATS logic, service layer, security.
- **[Frontend Detailed Guide (client/README.md)](client/README.md)**: React components, AuthContext, route guards, API interceptors, page flows.
