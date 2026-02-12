import React from "react";
import { PRIMARY, WHITE } from "../../theme/colors";
import TintedImage from "./TintedImage";

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  /** When set, the image is shown as a single color (recolorable). Good for logos/icons. */
  tintColor?: string;
  /** Scale the image within the circular container (1 = full size). */
  imageScale?: number;
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
  tintColor,
  imageScale = 1,
  style,
}: AvatarProps) {
  const clampedScale = Math.min(Math.max(imageScale, 0.1), 1);
  const containerStyles: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    color: WHITE,
    fontSize: size * 0.4,
    fontWeight: 600,
    flexShrink: 0,
    ...style,
  };

  if (src) {
    if (tintColor) {
      return (
        <div style={containerStyles}>
          <TintedImage
            src={src}
            color={tintColor}
            alt={name}
            width={size}
            height={size}
            style={{
              width: `${clampedScale * 100}%`,
              height: `${clampedScale * 100}%`,
              objectFit: "contain",
            }}
          />
        </div>
      );
    }
    return (
      <div style={containerStyles}>
        <img
          src={src}
          alt={name}
          style={{
            width: `${clampedScale * 100}%`,
            height: `${clampedScale * 100}%`,
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  return <div style={containerStyles}>{getInitials(name)}</div>;
}
