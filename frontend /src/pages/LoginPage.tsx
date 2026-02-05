import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import AuthCard from "../components/auth/AuthCard";
import Input, { EyeIcon, EyeOffIcon } from "../components/ui/Input";
import Button from "../components/ui/Button";
import GoogleButton from "../components/auth/GoogleButton";
import { MAIN_GREEN, GRAY_600 } from "../theme/colors";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const forgotLinkStyles: React.CSSProperties = {
    background: "none",
    border: "none",
    color: MAIN_GREEN,
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
    color: MAIN_GREEN,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    fontSize: 14,
  };

  const handleLogin = () => {
    // No auth logic - just navigate to home
    navigate("/home");
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
        <Button
          variant="primary"
          fullWidth
          style={{ marginTop: 8 }}
          onClick={handleLogin}
        >
          Log In
        </Button>
        <GoogleButton />
      </AuthCard>
    </AuthLayout>
  );
}
