import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import AuthCard from "../components/auth/AuthCard";
import Input, { EyeIcon, EyeOffIcon } from "../components/ui/Input";
import Button from "../components/ui/Button";
import GoogleButton from "../components/auth/GoogleButton";
import { PRIMARY, GRAY_600 } from "../theme/colors";
import { useAuth } from "../contexts/AuthContext";
import { signIn } from "../services/cognitoAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { role, newPasswordRequired } = await signIn(email, password);
      if (newPasswordRequired) {
        setError("A new password is required. Please contact your administrator.");
        return;
      }
      setRole(role);
      navigate(role === "instructor" ? "/teacher" : "/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <p style={footerStyles}>
      Don't have an account?{" "}
      <button
        type="button"
        style={linkButtonStyles}
        onClick={() => navigate("/signup")}
      >
        Sign up
      </button>
    </p>
  );

  return (
    <AuthLayout>
      <AuthCard title="Sign in" footer={footer}>
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
          onClick={handleLogin}
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Log In"}
        </Button>
        <GoogleButton />
      </AuthCard>
    </AuthLayout>
  );
}
