import { MAIN_GREEN } from "../../theme/colors";

interface RatingStarsProps {
  rating: 0 | 1 | 2 | 3;
  size?: number;
}

export default function RatingStars({ rating, size = 16 }: RatingStarsProps) {
  const totalStars = 3;

  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: totalStars }, (_, index) => (
        <Star
          key={index}
          filled={index < rating}
          size={size}
        />
      ))}
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
      fill={filled ? MAIN_GREEN : "none"}
      stroke={MAIN_GREEN}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
