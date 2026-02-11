import React from "react";
import Avatar from "../ui/Avatar";
import { WHITE, GRAY_400 } from "../../theme/colors";
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

  const bellButtonStyles: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 8,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <header style={topBarStyles}>
      <button style={bellButtonStyles}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={GRAY_400}
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>
      {student && <Avatar src={student.avatarUrl} name={student.name} size={40} />}
    </header>
  );
}
