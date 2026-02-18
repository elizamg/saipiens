import React from "react";
import Card from "../ui/Card";
import { GRAY_300, GRAY_500, PRIMARY } from "../../theme/colors";

export default function NewCourseCard() {
  const cardOverrides: React.CSSProperties = {
    border: `2px dashed ${GRAY_300}`,
    boxShadow: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    cursor: "pointer",
  };

  const plusStyles: React.CSSProperties = {
    marginBottom: 8,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: GRAY_500,
  };

  return (
    <Card
      style={cardOverrides}
      onClick={() => {
        /* placeholder */
      }}
    >
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        style={plusStyles}
      >
        <line
          x1="18"
          y1="6"
          x2="18"
          y2="30"
          stroke={PRIMARY}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="6"
          y1="18"
          x2="30"
          y2="18"
          stroke={PRIMARY}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span style={labelStyles}>New Course</span>
    </Card>
  );
}
