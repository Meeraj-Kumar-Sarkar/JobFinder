# JobFinder — Backend Server Documentation

The **JobFinder Backend** is a scalable, RESTful Node.js and Express application connected to MongoDB via Mongoose, with Firebase Admin integration. It provides full user authentication, job lifecycle management, and a complete Applicant Tracking System (ATS) pipeline.

---

## 🏛️ System Architecture

```
                      ┌────────────────────────┐
                      │   Client (React/Vite)  │
                      └───────────┬────────────┘
                                  │ HTTP / JSON
                                  │ Authorization: Bearer <token>
                                  ▼
                      ┌────────────────────────┐
                      │    Express App Engine  │
                      └───────────┬────────────┘
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Auth Routes    │    │    Job Routes    │    │Application Routes│
│  & Controllers   │    │  & Controllers   │    │  & Controllers   │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Service Layer (Business Logic)               │
│  - AuthService        - JobService        - ApplicationService   │
│  - CompanyService     - UserService       - FirebaseService      │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  ▼                             ▼
       ┌────────────────────┐        ┌────────────────────┐
       │   MongoDB Database │        │   Firebase Admin   │
       │ (Mongoose Models)  │        │  (Auth & Firestore)│
       └────────────────────┘        └────────────────────┘
```

---

## 🗄️ Database Models (Mongoose Schemas)

### 1. `User` (`src/models/User.js`)
Stores authentication and profile information for both candidates and employers:
- `name`: Full name (String, required).
- `email`: Normalized email (String, unique, lowercase).
- `password`: Salted and hashed password with bcryptjs (excluded from default queries with `select: false`).
- `role`: User role (`candidate`, `employer`, or `hr`).
- `userType`: Entity type (`worker` or `institution`).
- `firebaseUID`: Associated Firebase UID or auto-generated unique ID.
- **Candidate Data**: `headline`, `bio`, `skills` (Array of Strings), `experience` (Number of years), `education` (Array of objects), `resumeURL`, `portfolioURL`, `expectedSalary`, `preferredJobType`.
- **Company Data**: `company` (ObjectId ref to `Company`), `companyRole` (`owner`, `hr`, `employee`), `companyAccessTerms` (permissions, active/suspended status, assigned jobs).

### 2. `Company` (`src/models/Company.js`)
Represents an employer organization / hiring entity:
- `name`: Organization name (String, required).
- `description`, `industry`, `location`, `website`, `logo`, `registrationNumber`.
- `owner`: ObjectId reference to `User` (the primary employer administrator).
- `employees`: Total count of associated workers.
- `workers`: Sub-document array tracking staff (`user`, `companyRole`, `status`, `permissions`, `assignedJobs`, `joinedAt`).

### 3. `Job` (`src/models/Job.js`)
Stores job postings and hiring requirements:
- `title`: Position title (e.g., "Senior Frontend Engineer").
- `company`: ObjectId ref to `Company` (optional for legacy flexibility).
- `category`: Domain category (`Technology`, `Design`, `Marketing`, `Business`, `Healthcare`, `Finance`).
- `description`: Complete job specifications and responsibilities.
- `requirements`: Array of required skill strings (used by skill evaluation).
- `benefits`: Array of perks and compensation benefits.
- `salaryMin` / `salaryMax`: Numerical annual compensation range.
- `location`: Workplace location or "Remote".
- `jobType`: Work arrangement (`Full Time`, `Part Time`, `Contract`, `Freelance`).
- `experience`: Minimum years of required experience.
- `createdBy`: ObjectId ref to `User`.
- `status`: Lifecycle status (`active` or `closed`).
- `applicants`: Total number of candidates who applied.

### 4. `Application` (`src/models/Application.js`)
Tracks candidate applications through the ATS pipeline:
- `candidate`: ObjectId ref to `User`.
- `job`: ObjectId ref to `Job`.
- `resumeURL`: Direct link to the applicant's resume.
- `coverLetter`: Candidate's personal cover letter or notes.
- `interviewDate`: Scheduled interview timestamp (ISO Date).
- `feedback`: Employer review feedback or notes.
- `status`: Current ATS stage (`Applied`, `Screening`, `Technical`, `HR`, `Offer`, `Hired`, `Rejected`).
- **Compound Index**: `{ candidate: 1, job: 1 }` with `unique: true` to prevent duplicate submissions.

### 5. `Notification` (`src/models/Notification.js`)
Stores in-app notifications generated by system events (new applications, status transitions, interview schedules).

---

## 🔐 Authentication & Security

### Token Management (`src/utils/token.js`)
- Tokens are standard JWTs signed with a secret key and set to expire in 7 days.
- Contains `{ userId, email, role, userType, companyId, companyStatus }`.

### Auth Middleware (`src/middleware/auth.middleware.js`)
1. **`authenticate`**:
   - Inspects `Authorization: Bearer <token>` header.
   - Decodes backend custom JWT. If invalid, attempts Firebase ID Token verification as fallback.
   - Populates `req.user` with the live database record. Rejects with 401 if unauthorized.
2. **`optionalAuth`**:
   - If a valid token is provided, populates `req.user`.
   - If no token is provided, allows the request to proceed (useful for public job listings and flexible application endpoints).
3. **`requireCompanyAccess(permission)`**:
   - Validates that an employer or HR representative is active and holds the necessary permission to view workers, post jobs, or modify records.

### Resilient Password Migration
If a user document in MongoDB was created through Firebase or OAuth and does not yet have a hashed password, logging in with email and password will safely initialize their bcrypt password so they are never locked out.

---

## 🚦 Applicant Tracking System (ATS) Pipeline

```
  [Candidate Applies]
          │
          ▼
     ┌─────────┐
     │ Applied │ ──► Initial application received; employer notified
     └────┬────┘
          │ (Employer reviews profile & resume)
          ▼
    ┌───────────┐
    │ Screening │ ──► Initial screening passed
    └─────┬─────┘
          │ (Technical interview scheduled)
          ▼
    ┌───────────┐
    │ Technical │ ──► Code assessment or technical discussion
    └─────┬─────┘
          │ (HR cultural alignment)
          ▼
    ┌───────────┐
    │    HR     │ ──► Compensation & culture discussion
    └─────┬─────┘
          │ (Offer extended)
          ▼
    ┌───────────┐
    │   Offer   │ ──► Employment package presented
    └─────┬─────┘
          │
     ┌────┴────────┐
     ▼             ▼
┌─────────┐   ┌──────────┐
│  Hired  │   │ Rejected │
└─────────┘   └──────────┘
```

1. **Qualification Assessment**:
   - Compares candidate skills against job requirements.
   - Supports `bypassSkillCheck: true` so applicants are not blocked by string mismatch.
2. **Stage Progression**:
   - Endpoint: `PATCH /api/applications/:id/status` (updates status and adds feedback).
   - Endpoint: `POST /api/applications/:id/schedule-interview` (sets interview date & advances to `Technical`).
   - Endpoint: `POST /api/applications/:id/decision` (sets final decision to `Hired` or `Rejected`).
3. **Withdrawal**:
   - Candidates can withdraw their application at any time prior to the offer stage via `DELETE /api/applications/:id`.

---

## 📡 REST API Reference

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register Candidate or Employer | No |
| `POST` | `/api/auth/login` | Login with email & password or ID token | No |
| `GET`  | `/api/auth/me` | Fetch authenticated user profile & company | Yes |
| `POST` | `/api/auth/logout` | Invalidate session | No |

### Job Routes (`/api/jobs`)
| Method | Endpoint | Query / Body Params | Description |
|--------|----------|---------------------|-------------|
| `GET`  | `/api/jobs` | `search`, `category`, `location`, `jobType`, `sort`, `company`, `status`, `page`, `limit` | Query and filter active jobs |
| `GET`  | `/api/jobs/:id` | `id` (Job ID) | Get single job details |
| `POST` | `/api/jobs` | Job object payload | Create a new job opening |
| `PATCH`| `/api/jobs/:id` | Updated fields (e.g. `{ status: "closed" }`) | Update job details or toggle status |
| `GET`  | `/api/jobs/assigned` | None | Get jobs assigned to current recruiter |

### Application Routes (`/api/applications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/applications` | Apply for a job (`jobId`, `resumeURL`, `coverLetter`) |
| `GET`  | `/api/applications/my-applications` | Fetch all applications submitted by candidate |
| `GET`  | `/api/applications/employer/:employerId` | Fetch all applications across an employer's jobs |
| `GET`  | `/api/applications/job/:jobId` | Fetch all applicants for a specific job |
| `PATCH`| `/api/applications/:id/status` | Advance applicant status in ATS pipeline |
| `POST` | `/api/applications/:id/schedule-interview`| Schedule an interview timestamp |
| `POST` | `/api/applications/:id/decision` | Record final decision (`hire` / `reject`) |
| `DELETE`| `/api/applications/:id` | Withdraw application |

### User Routes (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/users/profile` | Get current user profile |
| `PUT`  | `/api/users/profile` | Update user profile (skills, resumeURL, headline, bio) |
| `GET`  | `/api/users/:id` | Get public profile by ID |

---

## 🌱 Automatic Database Seeder (`src/config/seed.js`)

When the server starts and connects to MongoDB:
1. Verifies that the **Demo Employer** (`employer@technova.com`) exists. If missing, creates the account with password `Password123!`.
2. Verifies that the **Demo Candidate** (`candidate@example.com`) exists. If missing, creates the account with skills, experience, and password `Password123!`.
3. Verifies default companies exist (`TechNova`, `Pixel Studio`, `Creative Labs`, `Digital Stack`).
4. Repairs any pre-existing unlinked jobs by assigning them to a verified company.
5. Populates diverse demo job openings across `Technology`, `Design`, `Marketing`, and `Business`.

---

## ⚙️ Environment Configuration (`.env`)

```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/jobportal

# Firebase Service Account Credentials (Optional for local fallback)
FIREBASE_PROJECT_ID=jobportal-55e77
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@jobportal-55e77.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=jobportal-55e77.firebasestorage.app
```

---

## 🏃‍♂️ Running the Server

```bash
# Install dependencies
npm install

# Run in production mode
npm start

# Run in development mode with nodemon
npm run dev

# Run automated backend test suites
npm test
```
The server will start listening on `http://localhost:5000`.
