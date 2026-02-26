import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "../../contexts/AuthContext";

interface RequireRoleProps {
  role: UserRole;
  children: React.ReactNode;
}

/**
 * Route guard that checks the user's role from AuthContext.
 * - While auth is loading (session restore in progress), renders nothing.
 * - If not authenticated, redirects to /login.
 * - If wrong role, redirects to the correct home for their role.
 */
export default function RequireRole({ role, children }: RequireRoleProps) {
  const { role: currentRole, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (currentRole !== role) {
    const redirectTo = currentRole === "instructor" ? "/teacher" : "/home";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
