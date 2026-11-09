# JobFinder — Frontend Client Documentation

The **JobFinder Frontend** is a modern Single Page Application (SPA) built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. It delivers a fast, responsive interface for job seekers and employers with live backend API synchronization.

---

## 🏛️ Frontend Architecture

```
src/
├── components/          # Reusable UI Components
│   ├── Navbar.tsx       # Dynamic navigation bar with live auth badges & role links
│   └── ProtectedRoute.tsx # Route guard for candidate & employer dashboards
├── context/
│   └── AuthContext.tsx  # Global authentication context & custom hook (`useAuth`)
├── pages/
│   ├── Home.tsx         # Landing page with hero search, categories & featured jobs
│   ├── Jobs.tsx         # Search & filter jobs with live query params
│   ├── JobDetails.tsx   # Detailed job view & application status verification
│   ├── Apply.tsx        # Pre-filled job application submission form
│   ├── Login.tsx        # Authentication page with one-click demo logins
│   ├── Signup.tsx       # Dual-role registration for candidates and employers
│   ├── CandidateDashboard.tsx # Applications tracker, interview schedules & profile editor
│   └── EmployerDashboard.tsx  # Job management, ATS applicant pipeline & interview scheduler
├── services/
│   └── api.ts           # Centralized Axios client with automatic Bearer token interceptor
├── styles/
│   └── globals.css      # Tailwind CSS styling and theme definitions
├── app.tsx              # Root router configuration and AuthProvider wrapper
└── main.tsx             # Application bootstrap
```

---

## 🔐 Global Authentication (`AuthContext.tsx`)

The application state is powered by `AuthContext`, providing seamless session persistence and role management:

### Context Value (`useAuth()`)
- `user`: Authenticated user object (`_id`, `name`, `email`, `role`, `skills`, `resumeURL`, `company`, etc.).
- `token`: Active JWT string stored in `localStorage`.
- `isAuthenticated`: Boolean flag confirming active login.
- `loading`: Loading boolean during session verification.
- `login(credentials)`: Logs in with email/password or ID token and stores tokens.
- `register(data)`: Registers candidate/employer and establishes session.
- `logout()`: Clears credentials and navigates to the login screen.
- `updateUser(partial)`: Updates local user state following profile edits.

### Automatic Session Rehydration
When the application opens, `AuthContext` checks `localStorage` for `jobportal_token`. If present, it executes `GET /api/auth/me` to refresh user details and verify live company access terms. If expired or invalid, the session is cleared safely.

---

## 🛡️ Route Protection (`ProtectedRoute.tsx`)

Protected routes ensure only authorized roles access sensitive dashboards:
```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedRole="candidate">
      <CandidateDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/employer/dashboard"
  element={
    <ProtectedRoute allowedRole="employer">
      <EmployerDashboard />
    </ProtectedRoute>
  }
/>
```
- If an unauthenticated user visits either dashboard, they are redirected to `/login`.
- If an employer visits `/dashboard`, they are automatically routed to `/employer/dashboard` (and vice versa).

---

## 🌐 API Service Layer (`services/api.ts`)

Built with **Axios** to communicate with the backend REST endpoints:

- **Base URL**: Configured via `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`.
- **Request Interceptor**: Automatically attaches `Authorization: Bearer <token>` from `localStorage`.
- **Response Interceptor**: Automatically catches 401 unauthenticated errors and cleans expired tokens.

### Modules:
1. `authApi`: `login()`, `register()`, `getMe()`, `logout()`.
2. `jobsApi`: `getAll(params)`, `getById(id)`, `create(data)`, `update(id, data)`.
3. `applicationsApi`:
   - `apply(data)`: Submits application with `bypassSkillCheck: true`.
   - `getMyApplications(params)`: Retrieves applicant's submitted jobs.
   - `getEmployerApplications(employerId, params)`: Retrieves applicants across all employer jobs.
   - `getJobApplicants(jobId)`: Retrieves applicants for a specific post.
   - `updateStatus(id, status)`: Advances ATS pipeline stages.
   - `scheduleInterview(id, interviewDate)`: Schedules interview date and time.
   - `hiringDecision(id, decision)`: Sets status to `Hired` or `Rejected`.
   - `withdraw(id)`: Withdraws an application.
4. `usersApi`: `getProfile()`, `updateProfile(data)`.

---

## 📄 Key Pages & Features

### 1. Home Page (`src/pages/Home.tsx`)
- **Hero Search Bar**: Inputs for keywords and location; submitting navigates to `/jobs?search=...&location=...`.
- **Category Grid**: Instant links to filter jobs by domain (`Technology`, `Design`, `Marketing`, `Business`).
- **Live Featured Openings**: Fetches active jobs directly from `GET /api/jobs?limit=6`.
- **Day / Night Theme Toggle**: Smooth transition between light mode and dark mode.

### 2. Job Search & Filtering (`src/pages/Jobs.tsx`)
- **Full-Text Keyword Search**: Matches position titles, requirements, and company names.
- **Location Filter**: Searches workplace locations (e.g., "Remote", "Bangalore", "San Francisco").
- **Category & Type Filters**: Filters by category and commitment (`Full Time`, `Part Time`, `Contract`, `Freelance`).
- **Salary Sorting**: Sorts by newest postings, alphabetical title, or highest compensation.
- **Direct Application Link**: Each card links to `/jobs/:id`.

### 3. Job Details (`src/pages/JobDetails.tsx`)
- **Full Specifications**: Displays requirements, perks, company description, website link, and compensation.
- **Duplicate Prevention**: If the candidate has already applied, the button displays a green **"Application Submitted ✓"** badge with a direct link to track it in their dashboard.

### 4. Job Application (`src/pages/Apply.tsx`)
- **Autofill Profile Data**: If logged in, automatically pre-fills Full Name, Email, Phone, Experience, and Resume link.
- **Cover Letter Submission**: Space to write personal notes for the hiring team.
- **Submission Confirmation**: Shows a clean confirmation screen upon submission with next steps.

### 5. Candidate Dashboard (`src/pages/CandidateDashboard.tsx`)
- **Live Pipeline Badges**: Displays current status color-coded:
  - `Applied` (Blue)
  - `Screening` (Amber)
  - `Technical` / `HR` (Purple)
  - `Offer` (Indigo)
  - `Hired` (Green)
  - `Rejected` (Rose)
- **Interview Notifications**: Shows scheduled interview date/time banner.
- **Withdrawal**: Candidates can withdraw their application at any time.
- **Profile Management Tab**: Update headline, bio, skills, years of experience, resume link, and portfolio link with immediate database persistence.

### 6. Employer Dashboard (`src/pages/EmployerDashboard.tsx`)
- **Manage Jobs Tab**: View active job posts, applicants count, and toggle job status (`Active` / `Closed`).
- **Post a Job Tab**: Full job creation form (Title, Category, Location, Job Type, Salary range, Requirements, Benefits, Description) with immediate refresh.
- **ATS Applicant Pipeline Tab**:
  - Filter applicants by specific job or view all.
  - Review applicant profile, skills, and clickable resume link.
  - Open candidate cover letter in a modal.
  - Advance ATS stages with dropdown selector (`Screening`, `Technical`, `HR`, `Offer`, `Hired`, `Rejected`).
  - **Interview Scheduler Modal**: Pick date and time to schedule candidate interviews.

---

## ⚡ One-Click Demo Access (`src/pages/Login.tsx`)

On the Login screen, click either of the quick demo buttons to log in immediately:
- **Candidate Demo**: Signs in as `candidate@example.com` (Alex Morgan).
- **Employer Demo**: Signs in as `employer@technova.com` (TechNova Recruiter).

---

## ⚙️ Environment Configuration (`.env`)

```ini
VITE_API_URL=http://localhost:5000/api

# Firebase Web App Config (Optional for client-side Auth fallback)
VITE_FIREBASE_API_KEY=AIzaSyAtrVHyMYO3dBitMmHS1dQT6KMnLBQQu1I
VITE_FIREBASE_AUTH_DOMAIN=jobportal-55e77.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=jobportal-55e77
VITE_FIREBASE_STORAGE_BUCKET=jobportal-55e77.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=296607390123
VITE_FIREBASE_APP_ID=1:296607390123:web:6138e3f2bdb7e5f1251aee
```

---

## 🏃‍♂️ Running the Frontend

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run TypeScript type check and production build
npm run build

# Preview production build locally
npm run preview
```
The client will start listening on `http://localhost:5173`.
