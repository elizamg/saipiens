import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import AuthCard from "../components/auth/AuthCard";
import Input, { EyeIcon, EyeOffIcon } from "../components/ui/Input";
import Button from "../components/ui/Button";
import Checkbox from "../components/ui/Checkbox";
import GoogleButton from "../components/auth/GoogleButton";
import { PRIMARY, GRAY_600, RED_500 } from "../theme/colors";
import { useAuth } from "../contexts/AuthContext";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, role } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSignUp = async () => {
    setError("");
    if (!firstName || !lastName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    try {
      await signUp({ email, password, firstName, lastName, isInstructor });
      navigate(role === "instructor" ? "/teacher" : "/home");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          id="firstName"
          label="First name"
          type="text"
          placeholder="Enter your first name"
          value={firstName}
          onChange={setFirstName}
        />
        <Input
          id="lastName"
          label="Last name"
          type="text"
          placeholder="Enter your last name"
          value={lastName}
          onChange={setLastName}
        />
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
          placeholder="Enter your password (min. 8 characters)"
          value={password}
          onChange={setPassword}
          rightIcon={showPassword ? <EyeOffIcon /> : <EyeIcon />}
          onRightIconClick={() => setShowPassword(!showPassword)}
        />
        <Checkbox
          id="signup-instructor"
          label="I am an instructor"
          checked={isInstructor}
          onChange={setIsInstructor}
        />
        {error && <p style={errorStyles}>{error}</p>}
        <Button
          variant="primary"
          fullWidth
          style={{ marginTop: 8 }}
          onClick={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? "Creating account…" : "Create Account"}
        </Button>
        <GoogleButton />
      </AuthCard>
    </AuthLayout>
  );
}
