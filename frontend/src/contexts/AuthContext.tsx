import React, { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "sapiens_user_role";

export type UserRole = "student" | "instructor";

interface AuthContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredRole(): UserRole {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "instructor" || stored === "student") return stored;
  } catch {
    // ignore
  }
  return "student";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(loadStoredRole);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, role);
    } catch {
      // ignore
    }
  }, [role]);

  const setRole = (newRole: UserRole) => setRoleState(newRole);

  return (
    <AuthContext.Provider value={{ role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
