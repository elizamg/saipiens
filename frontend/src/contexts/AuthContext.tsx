import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCurrentSession,
  getCurrentRole,
  signOut as cognitoSignOut,
} from "../services/cognitoAuth";

export type UserRole = "student" | "instructor";

interface AuthContextValue {
  /** Null while the initial session check is in progress or when signed out. */
  role: UserRole | null;
  /** True until the initial Cognito session check completes. */
  loading: boolean;
  /** Call after a successful Cognito sign-in to push the new role into context. */
  setRole: (role: UserRole) => void;
  /** Signs out from Cognito and clears context state. */
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore the Cognito session the SDK persisted in localStorage.
  useEffect(() => {
    getCurrentRole()
      .then((r) => setRoleState(r))
      .catch(() => setRoleState(null))
      .finally(() => setLoading(false));
  }, []);

  const setRole = (newRole: UserRole) => setRoleState(newRole);

  const signOut = () => {
    cognitoSignOut();
    setRoleState(null);
  };

  return (
    <AuthContext.Provider value={{ role, loading, setRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Returns the current JWT IdToken string for attaching to API requests. */
export async function getAuthToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session ? session.getIdToken().getJwtToken() : null;
}
