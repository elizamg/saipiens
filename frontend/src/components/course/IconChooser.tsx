import React from "react";
import TintedImage from "../ui/TintedImage";
import { PRIMARY, GRAY_300 } from "../../theme/colors";
import historyLogo from "../../assets/history-logo.png";
import scienceLogo from "../../assets/science-logo.png";

interface IconChooserProps {
  selected: string;
  onChange: (icon: string) => void;
}

const BookIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke={PRIMARY}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const options = [
  { key: "history", label: "History", image: historyLogo },
  { key: "science", label: "Science", image: scienceLogo },
  { key: "general", label: "General", image: null },
];

export default function IconChooser({ selected, onChange }: IconChooserProps) {
  const containerStyles: React.CSSProperties = {
    display: "flex",
    gap: 16,
  };

  return (
    <div style={containerStyles}>
      {options.map((opt) => {
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
          minWidth: 80,
        };

        return (
          <div key={opt.key} style={cardStyles} onClick={() => onChange(opt.key)}>
            {opt.image ? (
              <TintedImage src={opt.image} color={PRIMARY} width={32} height={32} />
            ) : (
              <BookIcon />
            )}
            <span style={{ fontSize: 13, fontWeight: 500, color: PRIMARY }}>
              {opt.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
