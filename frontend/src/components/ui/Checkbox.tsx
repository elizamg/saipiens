import React from "react";
import { PRIMARY, GRAY_700 } from "../../theme/colors";

interface CheckboxProps {
  id?: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function Checkbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  style,
}: CheckboxProps) {
  const containerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  const inputStyles: React.CSSProperties = {
    width: 18,
    height: 18,
    accentColor: PRIMARY,
    cursor: disabled ? "not-allowed" : "pointer",
  };

  const labelStyles: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: GRAY_700,
    userSelect: "none",
  };

  return (
    <label style={containerStyles} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={inputStyles}
        aria-checked={checked}
      />
      <span style={labelStyles}>{label}</span>
    </label>
  );
}
