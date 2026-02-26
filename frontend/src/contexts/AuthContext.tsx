import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { setTokenProvider } from "../services/api";

// ============ Cognito pool config ============

// Lazily initialized so a missing env var doesn't crash the app at module load time
let _userPool: CognitoUserPool | null = null;

function getUserPool(): CognitoUserPool {
  if (!_userPool) {
    _userPool = new CognitoUserPool({
      UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "",
      ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
    });
  }
  return _userPool;
}

// ============ Types ============

export type UserRole = "student" | "instructor";

interface AuthContextValue {
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  getToken: () => Promise<string | null>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (params: { email: string; password: string; firstName: string; lastName: string; isInstructor?: boolean }) => Promise<void>;
  logout: () => void;
}

// ============ Helpers ============

function getRoleFromSession(session: CognitoUserSession): UserRole {
  try {
    const payload = session.getIdToken().decodePayload();
    const groups: string[] = payload["cognito:groups"] ?? [];
    return groups.includes("instructors") ? "instructor" : "student";
  } catch {
    return "student";
  }
}

function getCurrentSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = getUserPool().getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return resolve(null);
      resolve(session);
    });
  });
}

// ============ Context ============

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // On mount, restore session if one exists
  useEffect(() => {
    getCurrentSession().then((session) => {
      if (session) {
        setRole(getRoleFromSession(session));
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    });
  }, []);

  // Returns a fresh ID token, refreshing if needed
  const getToken = useCallback(async (): Promise<string | null> => {
    const session = await getCurrentSession();
    if (!session) return null;
    return session.getIdToken().getJwtToken();
  }, []);

  // Register token provider with api.ts so all API calls get fresh JWTs
  useEffect(() => {
    setTokenProvider(getToken);
  }, [getToken]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      const user = new CognitoUser({ Username: email, Pool: getUserPool() });
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });

      user.authenticateUser(authDetails, {
        onSuccess: (session) => {
          setRole(getRoleFromSession(session));
          setIsAuthenticated(true);
          resolve();
        },
        onFailure: (err) => reject(new Error(err.message ?? "Login failed")),
        newPasswordRequired: () => reject(new Error("Password reset required. Please contact your administrator.")),
      });
    });
  }, []);

  const signUp = useCallback(async ({
    email,
    password,
    firstName,
    lastName,
    isInstructor = false,
  }: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isInstructor?: boolean;
  }): Promise<void> => {
    const attributes = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
      new CognitoUserAttribute({ Name: "given_name", Value: firstName }),
      new CognitoUserAttribute({ Name: "family_name", Value: lastName }),
      // Flags the account for manual promotion to the instructors group
      new CognitoUserAttribute({ Name: "custom:role_requested", Value: isInstructor ? "instructor" : "student" }),
    ];

    await new Promise<void>((resolve, reject) => {
      getUserPool().signUp(email, password, attributes, [], (err) => {
        if (err) return reject(new Error(err.message ?? "Sign up failed"));
        resolve();
      });
    });

    // Auto sign-in after signup
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    const user = getUserPool().getCurrentUser();
    user?.signOut();
    setIsAuthenticated(false);
    setRole("student");
  }, []);

  return (
    <AuthContext.Provider value={{ role, isLoading, isAuthenticated, getToken, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
