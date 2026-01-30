import React from "react";
import SidebarNav from "./SidebarNav";
import TopBar from "./TopBar";
import { GRAY_50 } from "../../theme/colors";
import type { Student } from "../../types/domain";

interface AppShellProps {
  children: React.ReactNode;
  student: Student | null;
  activePath?: string;
}

export default function AppShell({ children, student, activePath }: AppShellProps) {
  const containerStyles: React.CSSProperties = {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
  };

  const mainStyles: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: GRAY_50,
    minWidth: 0,
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    padding: 32,
    overflowY: "auto",
  };

  return (
    <div style={containerStyles}>
      <SidebarNav activePath={activePath} />
      <main style={mainStyles}>
        <TopBar student={student} />
        <div style={contentStyles}>{children}</div>
      </main>
    </div>
  );
}
