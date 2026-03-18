import React from "react";
import { GRAY_300, GRAY_900, WHITE } from "../../theme/colors";

interface BackButtonProps {
  onClick: () => void;
  style?: React.CSSProperties;
}

export default function BackButton({ onClick, style }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      style={{
        width: 36,
        height: 36,
        flexShrink: 0,
        border: `1px solid ${GRAY_300}`,
        borderRadius: 8,
        backgroundColor: WHITE,
        color: GRAY_900,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        ...style,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}
