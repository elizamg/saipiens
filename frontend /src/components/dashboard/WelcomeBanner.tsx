import React from "react";
import { WHITE_GREEN_GRADIENT, GRAY_900, GRAY_600 } from "../../theme/colors";
import type { Student } from "../../types/domain";

interface WelcomeBannerProps {
  student: Student;
}

export default function WelcomeBanner({ student }: WelcomeBannerProps) {
  const firstName = student.name.split(" ")[0];

  const bannerStyles: React.CSSProperties = {
    background: WHITE_GREEN_GRADIENT,
    borderRadius: 16,
    padding: "32px 40px",
    marginBottom: 32,
  };

  const greetingStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: GRAY_900,
    marginBottom: 8,
  };

  const subtitleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    color: GRAY_600,
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
