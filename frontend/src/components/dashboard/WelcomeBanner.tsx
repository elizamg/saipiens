import React from "react";
import { PRIMARY, WHITE } from "../../theme/colors";
import type { Student } from "../../types/domain";

interface WelcomeBannerProps {
  student: Student;
}

export default function WelcomeBanner({ student }: WelcomeBannerProps) {
  const firstName = student.name.split(" ")[0];

  const bannerStyles: React.CSSProperties = {
    background: PRIMARY,
    borderRadius: 12,
    padding: "14px 24px",
    marginBottom: 32,
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const greetingStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: WHITE,
  };

  const dividerStyles: React.CSSProperties = {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  };

  const subtitleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  };

  return (
    <div style={bannerStyles}>
      <h1 style={greetingStyles}>Welcome back, {firstName}!</h1>
      <span style={dividerStyles}>·</span>
      <p style={subtitleStyles}>{student.yearLabel}</p>
    </div>
  );
}
