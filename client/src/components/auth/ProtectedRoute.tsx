import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: UserRole;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
