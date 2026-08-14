import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RootLayout } from "@/components/layout/RootLayout";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import JobDetailPage from "@/pages/JobDetailPage";

import ProfilePage from "@/pages/candidate/ProfilePage";
import MyApplicationsPage from "@/pages/candidate/MyApplicationsPage";

import DashboardPage from "@/pages/employer/DashboardPage";
import ManageJobsPage from "@/pages/employer/ManageJobsPage";
import PostJobPage from "@/pages/employer/PostJobPage";
import ApplicantsPage from "@/pages/employer/ApplicantsPage";
import { useAuth } from "@/hooks/useAuth";

export default function App() {
  // Initialize auth state sync
  useAuth();

  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />

        {/* Candidate Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute role="candidate">
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute role="candidate">
              <MyApplicationsPage />
            </ProtectedRoute>
          }
        />

        {/* Employer Routes */}
        <Route
          path="/employer/dashboard"
          element={
            <ProtectedRoute role="employer">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs"
          element={
            <ProtectedRoute role="employer">
              <ManageJobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs/new"
          element={
            <ProtectedRoute role="employer">
              <PostJobPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs/:id/applicants"
          element={
            <ProtectedRoute role="employer">
              <ApplicantsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
