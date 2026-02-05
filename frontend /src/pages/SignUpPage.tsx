import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import AuthCard from "../components/auth/AuthCard";
import Input, { EyeIcon, EyeOffIcon } from "../components/ui/Input";
import Button from "../components/ui/Button";
import GoogleButton from "../components/auth/GoogleButton";
import { MAIN_GREEN, GRAY_600 } from "../theme/colors";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
        <Button variant="primary" fullWidth style={{ marginTop: 8 }}>
          Create Account
        </Button>
        <GoogleButton />
      </AuthCard>
    </AuthLayout>
  );
}
