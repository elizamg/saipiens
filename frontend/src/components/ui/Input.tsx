import React, { useState } from "react";
import { PRIMARY, GRAY_300, GRAY_700 } from "../../theme/colors";

interface InputProps {
  id?: string;
  label?: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function Input({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  rightIcon,
  onRightIconClick,
  disabled = false,
  style,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    width: "100%",
  };

  const labelStyles: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: GRAY_700,
  };

  const inputWrapperStyles: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  };

  const inputStyles: React.CSSProperties = {
    width: "100%",
    padding: rightIcon ? "14px 48px 14px 16px" : "14px 16px",
    fontSize: 16,
    border: `2px solid ${isFocused ? PRIMARY : GRAY_300}`,
    borderRadius: 8,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  const iconButtonStyles: React.CSSProperties = {
    position: "absolute",
    right: 12,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={containerStyles}>
      {label && (
        <label style={labelStyles} htmlFor={id}>
          {label}
        </label>
      )}
      <div style={inputWrapperStyles}>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          style={inputStyles}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightIcon && (
          <button
            type="button"
            style={iconButtonStyles}
            onClick={onRightIconClick}
            tabIndex={-1}
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
}

// Eye icons for password fields
export function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#666"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#666"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
