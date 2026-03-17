import React from "react";
import Avatar from "../ui/Avatar";
import { WHITE } from "../../theme/colors";
import type { Student } from "../../types/domain";

interface TopBarProps {
  student: Student | null;
}

export default function TopBar({ student }: TopBarProps) {
  const topBarStyles: React.CSSProperties = {
    height: 64,
    backgroundColor: WHITE,
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 24px",
    gap: 16,
    position: "sticky",
    top: 0,
    zIndex: 10,
  };

  return (
    <header style={topBarStyles}>
      {student && <Avatar src={student.avatarUrl} name={student.name} size={40} />}
    </header>
  );
}
