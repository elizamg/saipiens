/**
 * auth.test.tsx — Frontend auth unit tests
 *
 * Run: npx vitest run
 *
 * Covers:
 *  - cognitoAuth: roleFromSession group logic, getCurrentSession/getCurrentRole,
 *    signOut
 *  - AuthContext: loading state, session restore, setRole, signOut
 *  - RequireRole: loading spinner, unauthenticated redirect, wrong-role redirect,
 *    correct-role render
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mock amazon-cognito-identity-js before importing anything that uses it.
// ---------------------------------------------------------------------------

vi.mock('amazon-cognito-identity-js', () => {
  type MockSession = {
    isValid: () => boolean;
    getIdToken: () => { getJwtToken: () => string; decodePayload: () => Record<string, unknown> };
  };

  const makeSession = (groups: string[] = []): MockSession => ({
    isValid: () => true,
    getIdToken: () => ({
      getJwtToken: () => 'mock-jwt-token',
      decodePayload: () => ({
        sub: 'mock-sub',
        'cognito:groups': groups,
      }),
    }),
  });

  let _currentUser: { session: MockSession } | null = null;

  // Vitest requires constructor mocks to use the `function` keyword.
  function CognitoUserPool(_config: unknown) {
    return {
      getCurrentUser: () =>
        _currentUser
          ? {
              getSession: (cb: (err: null, s: MockSession) => void) =>
                cb(null, _currentUser!.session),
              signOut: () => { _currentUser = null; },
            }
          : null,
      signUp: (
        _u: string, _p: string, _a: unknown[], _v: unknown[],
        cb: (e: null, r: { userConfirmed: boolean }) => void
      ) => cb(null, { userConfirmed: false }),
    };
  }

  function CognitoUser(_config: unknown) {
    return {
      authenticateUser: (
        details: { Password: string },
        callbacks: {
          onSuccess: (s: MockSession) => void;
          onFailure: (e: Error) => void;
        }
      ) => {
        if (details.Password === 'bad-password') {
          callbacks.onFailure(new Error('Incorrect username or password.'));
        } else {
          callbacks.onSuccess(makeSession(['instructors']));
        }
      },
      confirmRegistration: (_code: string, _b: boolean, cb: (e: null) => void) => cb(null),
    };
  }

  function AuthenticationDetails(opts: unknown) {
    return opts;
  }

  // Helper exposed to tests to seed the current user state.
  (globalThis as Record<string, unknown>).__setCognitoUser = (groups: string[] | null) => {
    _currentUser = groups !== null ? { session: makeSession(groups) } : null;
  };

  return { CognitoUserPool, CognitoUser, AuthenticationDetails };
});

// ---------------------------------------------------------------------------
// Now import modules under test (after mocks are registered).
// ---------------------------------------------------------------------------

import * as cognitoAuth from '../services/cognitoAuth';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import RequireRole from '../components/auth/RequireRole';

// ---------------------------------------------------------------------------
// Helper: seed Cognito user state before each test.
// ---------------------------------------------------------------------------
const setCognitoUser = (groups: string[] | null) =>
  (globalThis as unknown as { __setCognitoUser: (groups: string[] | null) => void }).__setCognitoUser(groups);

beforeEach(() => {
  setCognitoUser(null); // signed out by default
});

// ===========================================================================
// 1. cognitoAuth — getCurrentSession
// ===========================================================================

describe('cognitoAuth.getCurrentSession', () => {
  it('returns null when no user is signed in', async () => {
    setCognitoUser(null);
    const session = await cognitoAuth.getCurrentSession();
    expect(session).toBeNull();
  });

  it('returns a valid session when a user is signed in', async () => {
    setCognitoUser([]);
    const session = await cognitoAuth.getCurrentSession();
    expect(session).not.toBeNull();
    expect(session!.isValid()).toBe(true);
  });
});

// ===========================================================================
// 2. cognitoAuth — getCurrentRole
// ===========================================================================

describe('cognitoAuth.getCurrentRole', () => {
  it('returns null when not signed in', async () => {
    setCognitoUser(null);
    expect(await cognitoAuth.getCurrentRole()).toBeNull();
  });

  it('returns "student" when user has no groups', async () => {
    setCognitoUser([]);
    expect(await cognitoAuth.getCurrentRole()).toBe('student');
  });

  it('returns "instructor" when user is in instructors group', async () => {
    setCognitoUser(['instructors']);
    expect(await cognitoAuth.getCurrentRole()).toBe('instructor');
  });

  it('returns "student" when user is in an unrelated group', async () => {
    setCognitoUser(['admins']);
    expect(await cognitoAuth.getCurrentRole()).toBe('student');
  });

  it('returns "instructor" when in multiple groups including instructors', async () => {
    setCognitoUser(['students', 'instructors']);
    expect(await cognitoAuth.getCurrentRole()).toBe('instructor');
  });
});

// ===========================================================================
// 3. cognitoAuth — getIdToken
// ===========================================================================

describe('cognitoAuth.getIdToken', () => {
  it('returns null when not signed in', async () => {
    setCognitoUser(null);
    expect(await cognitoAuth.getIdToken()).toBeNull();
  });

  it('returns a token string when signed in', async () => {
    setCognitoUser([]);
    const token = await cognitoAuth.getIdToken();
    expect(typeof token).toBe('string');
    expect(token!.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// 4. cognitoAuth — signOut
// ===========================================================================

describe('cognitoAuth.signOut', () => {
  it('clears the session so getCurrentRole returns null afterward', async () => {
    setCognitoUser([]);
    expect(await cognitoAuth.getCurrentRole()).toBe('student');
    cognitoAuth.signOut();
    expect(await cognitoAuth.getCurrentRole()).toBeNull();
  });

  it('does not throw when called while already signed out', () => {
    setCognitoUser(null);
    expect(() => cognitoAuth.signOut()).not.toThrow();
  });
});

// ===========================================================================
// 5. AuthContext — loading state and session restore
// ===========================================================================

function AuthStateDisplay() {
  const { role, loading } = useAuth();
  if (loading) return <div data-testid="loading">loading</div>;
  return <div data-testid="role">{role ?? 'null'}</div>;
}

describe('AuthContext', () => {
  it('shows loading initially then resolves to null when signed out', async () => {
    setCognitoUser(null);
    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>
    );
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('null'));
  });

  it('resolves to "student" when a student session exists', async () => {
    setCognitoUser([]);
    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('student'));
  });

  it('resolves to "instructor" when an instructor session exists', async () => {
    setCognitoUser(['instructors']);
    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('instructor'));
  });

  it('setRole overrides the resolved role', async () => {
    setCognitoUser([]);
    function Setter() {
      const { role, setRole, loading } = useAuth();
      if (loading) return null;
      return (
        <>
          <div data-testid="role">{role}</div>
          <button onClick={() => setRole('instructor')}>promote</button>
        </>
      );
    }
    const { getByRole } = render(
      <AuthProvider>
        <Setter />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('student'));
    getByRole('button', { name: 'promote' }).click();
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('instructor'));
  });

  it('signOut resets role to null', async () => {
    setCognitoUser([]);
    function SignOutButton() {
      const { role, signOut, loading } = useAuth();
      if (loading) return null;
      return (
        <>
          <div data-testid="role">{role ?? 'null'}</div>
          <button onClick={signOut}>sign out</button>
        </>
      );
    }
    const { getByRole } = render(
      <AuthProvider>
        <SignOutButton />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('student'));
    getByRole('button', { name: 'sign out' }).click();
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('null'));
  });
});

// ===========================================================================
// 6. RequireRole — route guard behaviour
// ===========================================================================

function renderWithRouter(
  ui: React.ReactElement,
  { initialEntry = '/' } = {}
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      {ui}
    </MemoryRouter>
  );
}

describe('RequireRole', () => {
  it('renders nothing while loading', () => {
    setCognitoUser(null);
    // AuthProvider starts loading; we render before the session resolves.
    const { container } = renderWithRouter(
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <RequireRole role="student">
                <div data-testid="protected">content</div>
              </RequireRole>
            }
          />
          <Route path="/login" element={<div>login</div>} />
        </Routes>
      </AuthProvider>
    );
    // While loading: nothing visible yet (null return from RequireRole).
    expect(container.querySelector('[data-testid="protected"]')).toBeNull();
  });

  it('redirects to /login when not signed in', async () => {
    setCognitoUser(null);
    renderWithRouter(
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <RequireRole role="student">
                <div data-testid="protected">content</div>
              </RequireRole>
            }
          />
          <Route path="/login" element={<div data-testid="login-page">login</div>} />
        </Routes>
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
  });

  it('renders children for a student accessing a student route', async () => {
    setCognitoUser([]);
    renderWithRouter(
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <RequireRole role="student">
                <div data-testid="student-page">student content</div>
              </RequireRole>
            }
          />
          <Route path="/login" element={<div>login</div>} />
          <Route path="/teacher" element={<div>teacher</div>} />
        </Routes>
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('student-page')).toBeInTheDocument());
  });

  it('renders children for an instructor accessing an instructor route', async () => {
    setCognitoUser(['instructors']);
    renderWithRouter(
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <RequireRole role="instructor">
                <div data-testid="teacher-page">teacher content</div>
              </RequireRole>
            }
          />
          <Route path="/login" element={<div>login</div>} />
          <Route path="/home" element={<div>home</div>} />
        </Routes>
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('teacher-page')).toBeInTheDocument());
  });

  it('redirects student trying to access instructor route to /home', async () => {
    setCognitoUser([]);
    renderWithRouter(
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <RequireRole role="instructor">
                <div data-testid="teacher-page">teacher content</div>
              </RequireRole>
            }
          />
          <Route path="/login" element={<div>login</div>} />
          <Route path="/home" element={<div data-testid="home-page">home</div>} />
        </Routes>
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument());
  });

  it('redirects instructor trying to access student route to /teacher', async () => {
    setCognitoUser(['instructors']);
    renderWithRouter(
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <RequireRole role="student">
                <div data-testid="student-page">student content</div>
              </RequireRole>
            }
          />
          <Route path="/login" element={<div>login</div>} />
          <Route path="/teacher" element={<div data-testid="teacher-page">teacher</div>} />
        </Routes>
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('teacher-page')).toBeInTheDocument());
  });
});
