import React from "react";
import { GREEN_GRADIENT_VERTICAL, WHITE } from "../../theme/colors";
import type { Student } from "../../types/domain";

interface WelcomeBannerProps {
  student: Student;
}

export default function WelcomeBanner({ student }: WelcomeBannerProps) {
  const firstName = student.name.split(" ")[0];

  const bannerStyles: React.CSSProperties = {
    background: GREEN_GRADIENT_VERTICAL,
    borderRadius: 16,
    padding: "32px 40px",
    marginBottom: 32,
  };

  const greetingStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: WHITE,
    marginBottom: 8,
    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
  };

  const subtitleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  };

  return (
    <div style={bannerStyles}>
      <h1 style={greetingStyles}>Welcome back, {firstName}!</h1>
      <p style={subtitleStyles}>
        {student.yearLabel} • Keep up the great work!
      </p>
    </div>
  );
}
