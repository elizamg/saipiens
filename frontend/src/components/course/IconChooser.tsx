import React from "react";
import { COURSE_ICON_OPTIONS, CourseIcon, COURSE_COLORS } from "../../theme/courseIcons";
import { GRAY_300, GRAY_600 } from "../../theme/colors";

interface IconChooserProps {
  selected: string;
  onChange: (icon: string) => void;
}

export default function IconChooser({ selected, onChange }: IconChooserProps) {
  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
  };

  return (
    <div style={containerStyles}>
      {COURSE_ICON_OPTIONS.map((opt) => {
        const isSelected = selected === opt.key;
        const color = (COURSE_COLORS[opt.key] ?? COURSE_COLORS.general).main;
        const cardStyles: React.CSSProperties = {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: 16,
          borderRadius: 12,
          border: `2px solid ${isSelected ? color : GRAY_300}`,
          background: isSelected ? (COURSE_COLORS[opt.key] ?? COURSE_COLORS.general).light : "transparent",
          cursor: "pointer",
          width: 88,
        };

        return (
          <div key={opt.key} style={cardStyles} onClick={() => onChange(opt.key)}>
            <CourseIcon icon={opt.key} size={32} color={color} />
            <span style={{ fontSize: 13, fontWeight: 500, color: isSelected ? color : GRAY_600, textAlign: "center", lineHeight: 1.3 }}>
              {opt.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
