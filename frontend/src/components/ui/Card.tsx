import React from "react";
import { WHITE } from "../../theme/colors";

interface CardProps {
  children: React.ReactNode;
  padding?: number | string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function Card({
  children,
  padding = 24,
  style,
  onClick,
}: CardProps) {
  const cardStyles: React.CSSProperties = {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding,
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
    cursor: onClick ? "pointer" : "default",
    transition: "box-shadow 0.2s ease, transform 0.2s ease",
    ...style,
  };

  return (
    <div
      style={cardStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.12)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.08)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      {children}
    </div>
  );
}
