/**
 * Thin wrapper around amazon-cognito-identity-js.
 *
 * Reads pool configuration from Vite environment variables:
 *   VITE_COGNITO_USER_POOL_ID   – e.g. us-west-1_YCOEOrnke
 *   VITE_COGNITO_CLIENT_ID      – App Client ID (no secret) from the Cognito console
 *
 * Role is encoded as a Cognito Group membership.
 * After sign-in the IdToken is stored by the SDK in localStorage automatically.
 */

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import type { UserRole } from "../contexts/AuthContext";

// ---------------------------------------------------------------------------
// Pool singleton
// ---------------------------------------------------------------------------

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID as string;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string;

if (!USER_POOL_ID || !CLIENT_ID) {
  console.error(
    "[cognitoAuth] Missing VITE_COGNITO_USER_POOL_ID or VITE_COGNITO_CLIENT_ID. " +
      "Copy .env.example → .env.local and fill in your values."
  );
}

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID ?? "",
  ClientId: CLIENT_ID ?? "",
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(email: string): CognitoUser {
  return new CognitoUser({ Username: email, Pool: userPool });
}

/**
 * Extract the role from the IdToken's `cognito:groups` claim.
 * If the user belongs to the "instructor" group they are an instructor,
 * otherwise they are treated as a student.
 */
function roleFromSession(session: CognitoUserSession): UserRole {
  const payload = session.getIdToken().decodePayload();
  const groups: string[] = payload["cognito:groups"] ?? [];
  return groups.includes("instructors") ? "instructor" : "student";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SignInResult {
  session: CognitoUserSession;
  role: UserRole;
  /** True when Cognito requires a new password before the session is valid. */
  newPasswordRequired: boolean;
}

// Holds the CognitoUser during a newPasswordRequired challenge so
// completeNewPassword() can finish the flow.
let _pendingUser: CognitoUser | null = null;

/** Sign in with email + password. Returns session + derived role. */
export function signIn(email: string, password: string): Promise<SignInResult> {
  return new Promise((resolve, reject) => {
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = makeUser(email);

    cognitoUser.authenticateUser(authDetails, {
      onSuccess(session) {
        _pendingUser = null;
        resolve({ session, role: roleFromSession(session), newPasswordRequired: false });
      },
      onFailure(err) {
        _pendingUser = null;
        reject(err);
      },
      newPasswordRequired(_userAttributes, _requiredAttributes) {
        _pendingUser = cognitoUser;
        resolve({
          session: null as unknown as CognitoUserSession,
          role: "student",
          newPasswordRequired: true,
        });
      },
    });
  });
}

/** Complete the new-password challenge after signIn returned newPasswordRequired. */
export function completeNewPassword(newPassword: string): Promise<SignInResult> {
  return new Promise((resolve, reject) => {
    if (!_pendingUser) {
      reject(new Error("No pending new-password challenge"));
      return;
    }
    const user = _pendingUser;
    user.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess(session) {
        _pendingUser = null;
        resolve({ session, role: roleFromSession(session), newPasswordRequired: false });
      },
      onFailure(err) {
        reject(err);
      },
    });
  });
}

export interface SignUpResult {
  /** True when Cognito sent a verification code (email confirm required). */
  confirmationRequired: boolean;
}

/** Register a new user. Group assignment (instructor vs student) happens
 *  server-side via the Cognito console or a Post-Confirmation Lambda trigger.
 *  All self-registrations default to student; admins promote to instructor
 *  by adding the user to the "instructors" Cognito group.
 */
export function signUp(
  email: string,
  password: string,
  givenName: string,
  familyName: string
): Promise<SignUpResult> {
  const attributes = [
    new CognitoUserAttribute({ Name: "given_name", Value: givenName }),
    new CognitoUserAttribute({ Name: "family_name", Value: familyName }),
  ];
  return new Promise((resolve, reject) => {
    userPool.signUp(
      email,
      password,
      attributes,
      [],
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ confirmationRequired: !(result?.userConfirmed ?? false) });
      }
    );
  });
}

/** Confirm sign-up with the verification code sent to the user's email. */
export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    makeUser(email).confirmRegistration(code, true, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/** Sign out the currently authenticated user (clears localStorage tokens). */
export function signOut(): void {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
}

/** Retrieve the current valid session (refreshes tokens if needed). */
export function getCurrentSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      resolve(null);
      return;
    }
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        resolve(null);
      } else {
        resolve(session);
      }
    });
  });
}

/** Get the IdToken JWT string for attaching to API requests, or null. */
export async function getIdToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session ? session.getIdToken().getJwtToken() : null;
}

/** Get the role of the currently signed-in user, or null if not signed in. */
export async function getCurrentRole(): Promise<UserRole | null> {
  const session = await getCurrentSession();
  return session ? roleFromSession(session) : null;
}

/** Change the current user's password via Cognito. */
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const user = userPool.getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await new Promise<void>((resolve, reject) => {
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) return reject(err ?? new Error("No session"));
      user.changePassword(oldPassword, newPassword, (e) => (e ? reject(e) : resolve()));
    });
  });
}

/** Decode email from the current user's ID token JWT claims. */
export async function getCurrentUserEmail(): Promise<string | null> {
  const token = await getIdToken();
  if (!token) return null;
  const payload = JSON.parse(atob(token.split(".")[1]));
  return (payload.email as string) ?? null;
}
