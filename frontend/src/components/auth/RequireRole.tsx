import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "../../contexts/AuthContext";

interface RequireRoleProps {
  role: UserRole;
  children: React.ReactNode;
}

/**
 * Route guard that checks the user's role from AuthContext.
 * Redirects students trying to access teacher pages to /home,
 * and teachers trying to access student pages to /teacher.
 */
export default function RequireRole({ role, children }: RequireRoleProps) {
  const { role: currentRole } = useAuth();

  if (currentRole !== role) {
    const redirectTo = currentRole === "instructor" ? "/teacher" : "/home";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
