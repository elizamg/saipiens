import { GRAY_400 } from "../../theme/colors";
import type { DifficultyStars as DifficultyStarsType } from "../../types/domain";

interface DifficultyStarsProps {
  difficulty: DifficultyStarsType;
  size?: number;
  label?: string;
}

export default function DifficultyStars({
  difficulty,
  size = 14,
  label = "Difficulty",
}: DifficultyStarsProps) {
  const containerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: 12,
    color: GRAY_400,
    fontWeight: 500,
  };

  const starsContainerStyles: React.CSSProperties = {
    display: "flex",
    gap: 2,
  };

  return (
    <div style={containerStyles}>
      <span style={labelStyles}>{label}:</span>
      <div style={starsContainerStyles}>
        {[1, 2, 3].map((level) => (
          <Star key={level} filled={level <= difficulty} size={size} />
        ))}
      </div>
    </div>
  );
}

interface StarProps {
  filled: boolean;
  size: number;
}

function Star({ filled, size }: StarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "#f59e0b" : "none"}
      stroke={filled ? "#f59e0b" : GRAY_400}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
