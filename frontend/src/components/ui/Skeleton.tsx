import React, { useEffect } from "react";
import { GRAY_100, GRAY_200 } from "../../theme/colors";

let injected = false;
function injectKeyframes() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `;
  document.head.appendChild(s);
}

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  style?: React.CSSProperties;
}

export default function Skeleton({ width = "100%", height = 16, borderRadius = 6, style }: SkeletonProps) {
  useEffect(() => { injectKeyframes(); }, []);
  return (
    <div style={{
      width, height, borderRadius, flexShrink: 0,
      background: `linear-gradient(90deg, ${GRAY_200} 25%, ${GRAY_100} 50%, ${GRAY_200} 75%)`,
      backgroundSize: "800px 100%",
      animation: "shimmer 1.4s infinite linear",
      display: "block",
      ...style,
    }} />
  );
}
