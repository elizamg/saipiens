import React from "react";

type IconName =
  | "trophy"      // awards
  | "chat"        // feedback
  | "book"        // courses
  | "pencil"      // continue learning
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

export default function SectionIcon({ name, size = 22, color = "#7B68A6" }: SectionIconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color,
    stroke: "none",
    style: {
      flexShrink: 0,
      display: "inline-block",
      verticalAlign: "middle",
      marginRight: 6,
      marginBottom: 2,
    } as React.CSSProperties,
  };

  switch (name) {
    case "trophy":
      return (
        <svg {...props}>
          <path d="M7 3h10v6c0 2.8-2.2 5-5 5s-5-2.2-5-5V3z" />
          <path d="M7 5H5a2 2 0 000 4h2" fill="none" stroke={color} strokeWidth={1.8} />
          <path d="M17 5h2a2 2 0 010 4h-2" fill="none" stroke={color} strokeWidth={1.8} />
          <path d="M12 14v3" fill="none" stroke={color} strokeWidth={2} />
          <path d="M8 19h8" fill="none" stroke={color} strokeWidth={2} />
          <path d="M9 17h6v2H9z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    case "book":
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" fill="none" stroke={color} strokeWidth={2} />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
    case "bookOpen":
      return (
        <svg {...props}>
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" opacity={0.7} />
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...props}>
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
        </svg>
      );
    case "teacher":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" opacity={0.7} />
          <path d="M16 3l2-1v3" fill="none" stroke={color} strokeWidth={1.5} />
        </svg>
      );
    case "robot":
      return (
        <svg {...props}>
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <circle cx="9" cy="14" r="1.5" fill="white" />
          <circle cx="15" cy="14" r="1.5" fill="white" />
          <path d="M12 2v4" fill="none" stroke={color} strokeWidth={2} />
          <circle cx="12" cy="2" r="1" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...props}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case "brain":
      return (
        <svg {...props}>
          <path d="M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.2 6-.5.3-.8.9-.8 1.5V18h-6v-1.5c0-.6-.3-1.2-.8-1.5A7 7 0 0112 2z" />
          <path d="M9 21h6" fill="none" stroke={color} strokeWidth={2} />
          <path d="M10 18v3" fill="none" stroke={color} strokeWidth={2} />
          <path d="M14 18v3" fill="none" stroke={color} strokeWidth={2} />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-5" stroke="white" strokeWidth={2.5} fill="none" />
        </svg>
      );
    case "flame":
      return (
        <svg {...props}>
          <path d="M12 22c4-3 7-6.5 7-10.5C19 6 15 2 12 2c-1 3-2 4-4 5.5C5.5 9.5 5 12 5 13.5 5 17 8 20 12 22z" />
        </svg>
      );
    case "target":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" opacity={0.3} />
          <circle cx="12" cy="12" r="6" opacity={0.6} />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "pencil":
      return (
        <svg {...props}>
          <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      );
    default: // star
      return (
        <svg {...props}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
  }
}
