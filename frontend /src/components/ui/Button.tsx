import React from "react";
import {
  MAIN_GREEN,
  LIGHTER_GREEN,
} from "../../theme/colors";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  style?: React.CSSProperties;
}

export default function Button({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  type = "button",
  fullWidth = false,
  style,
}: ButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const baseStyles: React.CSSProperties = {
    padding: "14px 32px",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? "100%" : "auto",
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "primary":
        return {
          background: MAIN_GREEN,
          color: "#ffffff",
          transform: isHovered && !disabled ? "translateY(-1px)" : "none",
          boxShadow: isHovered && !disabled
            ? "0 4px 12px rgba(141, 211, 74, 0.4)"
            : "none",
        };
      case "secondary":
        return {
          background: LIGHTER_GREEN,
          color: "#1a1a1a",
          transform: isHovered && !disabled ? "translateY(-1px)" : "none",
          boxShadow: isHovered && !disabled
            ? "0 4px 12px rgba(186, 232, 141, 0.4)"
            : "none",
        };
      case "ghost":
        return {
          background: "transparent",
          color: MAIN_GREEN,
          opacity: isHovered && !disabled ? 0.7 : disabled ? 0.6 : 1,
        };
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyles, ...getVariantStyles(), ...style }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
}
