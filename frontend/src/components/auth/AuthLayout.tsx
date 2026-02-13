import React from "react";
import { SURFACE } from "../../theme/colors";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const pageStyles: React.CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    background: SURFACE,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px 16px",
    boxSizing: "border-box",
  };

  return <main style={pageStyles}>{children}</main>;
}
