import React from "react";
import { WHITE, GRAY_900 } from "../../theme/colors";
import verticleLogo from "../../assets/verticle-logo.png";

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthCard({ title, children, footer }: AuthCardProps) {
  const cardStyles: React.CSSProperties = {
    width: "100%",
    maxWidth: 420,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: "48px 40px",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const logoStyles: React.CSSProperties = {
    width: 100,
    height: "auto",
    marginBottom: 24,
  };

  const headingStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: GRAY_900,
    marginBottom: 32,
  };

  const formStyles: React.CSSProperties = {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  };

  return (
    <div style={cardStyles}>
      <img src={verticleLogo} alt="SAIPIENS logo" style={logoStyles} />
      <h1 style={headingStyles}>{title}</h1>
      <div style={formStyles}>{children}</div>
      {footer}
    </div>
  );
}
