import React from "react";
import { COURSE_ICON_OPTIONS, CourseIcon } from "../../theme/courseIcons";
import { PRIMARY, GRAY_300 } from "../../theme/colors";

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
        const cardStyles: React.CSSProperties = {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: 16,
          borderRadius: 12,
          border: `2px solid ${isSelected ? PRIMARY : GRAY_300}`,
          cursor: "pointer",
          width: 88,
        };

        return (
          <div key={opt.key} style={cardStyles} onClick={() => onChange(opt.key)}>
            <CourseIcon icon={opt.key} size={32} color={PRIMARY} />
            <span style={{ fontSize: 13, fontWeight: 500, color: PRIMARY, textAlign: "center", lineHeight: 1.3 }}>
              {opt.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
