import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "../../contexts/AuthContext";

interface RequireRoleProps {
  role: UserRole;
  children: React.ReactNode;
}

/**
 * Route guard that checks the user's role from AuthContext.
 * - While the initial Cognito session check is in progress, renders nothing.
 * - If not signed in, redirects to /login.
 * - If signed in with the wrong role, redirects to the appropriate home.
 */
export default function RequireRole({ role, children }: RequireRoleProps) {
  const { role: currentRole, loading } = useAuth();

  if (loading) return null;

  if (!currentRole) {
    return <Navigate to="/login" replace />;
  }

  if (currentRole !== role) {
    const redirectTo = currentRole === "instructor" ? "/teacher" : "/home";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
