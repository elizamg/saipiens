import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import AuthCard from "../components/auth/AuthCard";
import Input, { EyeIcon, EyeOffIcon } from "../components/ui/Input";
import Button from "../components/ui/Button";
import GoogleButton from "../components/auth/GoogleButton";
import { PRIMARY, GRAY_600, RED_500 } from "../theme/colors";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const forgotLinkStyles: React.CSSProperties = {
    background: "none",
    border: "none",
    color: PRIMARY,
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    alignSelf: "flex-end",
    marginTop: -8,
  };

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

  const errorStyles: React.CSSProperties = {
    fontSize: 13,
    color: RED_500,
    marginTop: -4,
  };

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(role === "instructor" ? "/teacher" : "/home");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
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
        <button type="button" style={forgotLinkStyles}>
          Forgot password?
        </button>
        {error && <p style={errorStyles}>{error}</p>}
        <Button
          variant="primary"
          fullWidth
          style={{ marginTop: 8 }}
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Signing in…" : "Log In"}
        </Button>
        <GoogleButton />
      </AuthCard>
    </AuthLayout>
  );
}
