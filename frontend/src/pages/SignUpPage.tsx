import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import AuthCard from "../components/auth/AuthCard";
import Input, { EyeIcon, EyeOffIcon } from "../components/ui/Input";
import Button from "../components/ui/Button";
import GoogleButton from "../components/auth/GoogleButton";
import { PRIMARY, GRAY_600 } from "../theme/colors";
import { signUp, confirmSignUp, signIn } from "../services/cognitoAuth";
import { useAuth } from "../contexts/AuthContext";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { setRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const footerStyles: React.CSSProperties = {
    marginTop: 24,
    fontSize: 14,
    color: GRAY_600,
  };

  const linkButtonStyles: React.CSSProperties = {
    background: "none",
    border: "none",
    color: PRIMARY,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    fontSize: 14,
  };

  const footer = (
    <p style={footerStyles}>
      Already have an account?{" "}
      <button
        type="button"
        style={linkButtonStyles}
        onClick={() => navigate("/login")}
      >
        Log in
      </button>
    </p>
  );

  const handleSignUp = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // Role is NOT chosen by the user at sign-up — it is determined by
      // Cognito group membership (set by an admin). All new self-registrations
      // are students by default.
      const { confirmationRequired } = await signUp(email, password, false);
      if (confirmationRequired) {
        setNeedsConfirm(true);
      } else {
        // Auto-confirmed (e.g. admin-created accounts) — sign in immediately.
        const { role } = await signIn(email, password);
        setRole(role);
        navigate(role === "instructor" ? "/teacher" : "/home");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await confirmSignUp(email, confirmCode);
      // After confirming, sign in to get a real session.
      const { role } = await signIn(email, password);
      setRole(role);
      navigate(role === "instructor" ? "/teacher" : "/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Confirmation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (needsConfirm) {
    return (
      <AuthLayout>
        <AuthCard title="Check your email" footer={footer}>
          <p style={{ fontSize: 14, color: GRAY_600, margin: 0 }}>
            We sent a verification code to <strong>{email}</strong>. Enter it
            below to activate your account.
          </p>
          <Input
            id="confirm-code"
            label="Verification code"
            type="text"
            placeholder="123456"
            value={confirmCode}
            onChange={setConfirmCode}
          />
          {error && (
            <p style={{ color: "red", fontSize: 13, margin: 0 }}>{error}</p>
          )}
          <Button
            variant="primary"
            fullWidth
            style={{ marginTop: 8 }}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Verifying…" : "Verify & Sign In"}
          </Button>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard title="Create an account" footer={footer}>
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={setEmail}
        />
        <Input
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          rightIcon={showPassword ? <EyeOffIcon /> : <EyeIcon />}
          onRightIconClick={() => setShowPassword(!showPassword)}
        />
        {error && (
          <p style={{ color: "red", fontSize: 13, margin: 0 }}>{error}</p>
        )}
        <Button
          variant="primary"
          fullWidth
          style={{ marginTop: 8 }}
          onClick={handleSignUp}
          disabled={submitting}
        >
          {submitting ? "Creating account…" : "Create Account"}
        </Button>
        <GoogleButton />
      </AuthCard>
    </AuthLayout>
  );
}
