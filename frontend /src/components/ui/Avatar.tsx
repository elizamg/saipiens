import React from "react";
import { MAIN_GREEN, WHITE } from "../../theme/colors";

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  style?: React.CSSProperties;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function Avatar({
  src,
  name,
  size = 40,
  style,
}: AvatarProps) {
  const containerStyles: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MAIN_GREEN,
    color: WHITE,
    fontSize: size * 0.4,
    fontWeight: 600,
    flexShrink: 0,
    ...style,
  };

  if (src) {
    return (
      <div style={containerStyles}>
        <img
          src={src}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    );
  }

  return <div style={containerStyles}>{getInitials(name)}</div>;
}
