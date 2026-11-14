import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import Apply from "./pages/Apply";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CandidateDashboard from "./pages/CandidateDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "14px",
              background: "#0f172a",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              padding: "12px 16px",
            },
          }}
        />
        <BrowserRouter>
          <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/job-details" element={<Navigate to="/jobs" replace />} />
          <Route path="/job-details/:id" element={<JobDetails />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/apply/:id" element={<Apply />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Notifications & Messages Center */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Protected Candidate Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="candidate">
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Employer Dashboard */}
          <Route
            path="/employer/dashboard"
            element={
              <ProtectedRoute allowedRole="employer">
                <EmployerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
