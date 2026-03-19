import React from "react";

type IconName =
  | "trophy"      // awards
  | "chat"        // feedback
  | "book"        // continue learning / courses
  | "sparkle"     // highlights
  | "teacher"     // from your teacher
  | "robot"       // sam's summary
  | "bolt"        // skills
  | "brain"       // knowledge
  | "check"       // units completed
  | "flame"       // streak
  | "bookOpen"    // walkthrough
  | "target"      // challenge
  | "star";       // general

interface SectionIconProps {
  name: IconName;
  size?: number;
  color?: string;
}

let _siGradId = 0;

export default function SectionIcon({ name, size = 22, color = "#7B68A6" }: SectionIconProps) {
  const gid = `si-g-${++_siGradId}`;

  const lighten = (hex: string, amount: number) => {
    if (!hex.startsWith("#")) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const m = (c: number) => Math.min(255, c + Math.round((255 - c) * amount));
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  };

  const hex = color.startsWith("#") ? color : "#7B68A6";

  const gradientDef = (
    <defs>
      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={lighten(hex, 0.65)} />
        <stop offset="40%" stopColor={lighten(hex, 0.3)} />
        <stop offset="50%" stopColor={hex} />
        <stop offset="85%" stopColor={lighten(hex, -0.05)} />
        <stop offset="100%" stopColor={lighten(hex, 0.15)} />
      </linearGradient>
    </defs>
  );

  const fillUrl = `url(#${gid})`;

  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: {
      flexShrink: 0,
      display: "inline-block",
      verticalAlign: "middle",
      marginRight: 6,
      marginBottom: 2,
      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.2))",
    } as React.CSSProperties,
  };

  switch (name) {
    case "trophy":
      return (
        <svg {...props}>
          {gradientDef}
          {/* Cup body */}
          <path d="M7 3h10v6c0 2.8-2.2 5-5 5s-5-2.2-5-5V3z" fill={fillUrl} stroke={fillUrl} />
          {/* Left handle */}
          <path d="M7 5H5a2 2 0 000 4h2" fill="none" stroke={fillUrl} strokeWidth={1.8} />
          {/* Right handle */}
          <path d="M17 5h2a2 2 0 010 4h-2" fill="none" stroke={fillUrl} strokeWidth={1.8} />
          {/* Stem */}
          <path d="M12 14v3" stroke={fillUrl} strokeWidth={2} />
          {/* Base */}
          <path d="M8 19h8" stroke={fillUrl} strokeWidth={2} />
          <path d="M9 17h6v2H9z" fill={fillUrl} stroke="none" />
          {/* Star detail on cup */}
          <path d="M12 6l1 2 2 .3-1.5 1.4.4 2L12 10.5 10.1 11.7l.4-2L9 8.3l2-.3z" fill="white" opacity={0.35} stroke="none" />
        </svg>
      );
    case "chat":
      return (
        <svg {...props}>
          {gradientDef}
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill={fillUrl} stroke={fillUrl} />
        </svg>
      );
    case "book":
      return (
        <svg {...props}>
          {gradientDef}
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={fillUrl} />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" fill={fillUrl} stroke={fillUrl} opacity={0.85} />
        </svg>
      );
    case "bookOpen":
      return (
        <svg {...props}>
          {gradientDef}
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" fill={fillUrl} stroke={fillUrl} opacity={0.7} />
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" fill={fillUrl} stroke={fillUrl} />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...props}>
          {gradientDef}
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" fill={fillUrl} stroke={fillUrl} />
        </svg>
      );
    case "teacher":
      return (
        <svg {...props}>
          {gradientDef}
          <circle cx="12" cy="8" r="4" fill={fillUrl} stroke={fillUrl} />
          <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" fill={fillUrl} stroke={fillUrl} opacity={0.7} />
          <path d="M16 3l2-1v3" stroke={fillUrl} strokeWidth={1.5} />
        </svg>
      );
    case "robot":
      return (
        <svg {...props}>
          {gradientDef}
          <rect x="3" y="8" width="18" height="12" rx="2" fill={fillUrl} stroke={fillUrl} />
          <circle cx="9" cy="14" r="1.5" fill="white" />
          <circle cx="15" cy="14" r="1.5" fill="white" />
          <path d="M12 2v4" stroke={fillUrl} />
          <circle cx="12" cy="2" r="1" fill={fillUrl} stroke="none" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...props}>
          {gradientDef}
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={fillUrl} stroke={fillUrl} />
        </svg>
      );
    case "brain":
      return (
        <svg {...props}>
          {gradientDef}
          <path d="M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.2 6-.5.3-.8.9-.8 1.5V18h-6v-1.5c0-.6-.3-1.2-.8-1.5A7 7 0 0112 2z" fill={fillUrl} stroke={fillUrl} />
          <path d="M9 21h6" stroke={fillUrl} />
          <path d="M10 18v3" stroke={fillUrl} />
          <path d="M14 18v3" stroke={fillUrl} />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          {gradientDef}
          <circle cx="12" cy="12" r="10" fill={fillUrl} stroke={fillUrl} />
          <path d="M8 12l3 3 5-5" stroke="white" strokeWidth={2.5} fill="none" />
        </svg>
      );
    case "flame":
      return (
        <svg {...props}>
          {gradientDef}
          <path d="M12 22c4-3 7-6.5 7-10.5C19 6 15 2 12 2c-1 3-2 4-4 5.5C5.5 9.5 5 12 5 13.5 5 17 8 20 12 22z" fill={fillUrl} stroke={fillUrl} />
          <path d="M12 22c-1.5-1.5-2.5-3-2.5-5 0-2.5 2.5-4 2.5-4s2.5 1.5 2.5 4c0 2-1 3.5-2.5 5z" fill="white" stroke="none" opacity={0.3} />
        </svg>
      );
    case "target":
      return (
        <svg {...props}>
          {gradientDef}
          <circle cx="12" cy="12" r="10" fill={fillUrl} stroke={fillUrl} opacity={0.3} />
          <circle cx="12" cy="12" r="6" fill={fillUrl} stroke={fillUrl} opacity={0.6} />
          <circle cx="12" cy="12" r="2" fill={fillUrl} stroke={fillUrl} />
        </svg>
      );
    default: // star
      return (
        <svg {...props}>
          {gradientDef}
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={fillUrl} stroke={fillUrl} />
        </svg>
      );
  }
}
