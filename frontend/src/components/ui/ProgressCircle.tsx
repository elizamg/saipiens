import { SUCCESS_GREEN, GRAY_300 } from "../../theme/colors";
import type { ProgressState } from "../../types/domain";

interface ProgressCircleProps {
  state: ProgressState;
  size?: number;
}

/**
 * 5-state progress circle indicator:
 * ○  Not started (empty circle)
 * ●  Walkthrough started (full grey — student attempted but not complete)
 * ◐  Walkthrough complete (1/2 green)
 * ◕  Challenge started (3/4 green)
 * ●  Challenge complete (full green)
 */
export default function ProgressCircle({ state, size = 16 }: ProgressCircleProps) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  const strokeWidth = 1.5;
  const innerR = r - strokeWidth;

  if (state === "not_started") {
    // Empty circle
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill="none"
          stroke={GRAY_300}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  if (state === "challenge_complete") {
    // Full circle
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill={SUCCESS_GREEN}
          stroke={SUCCESS_GREEN}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  if (state === "walkthrough_started") {
    // Full grey circle — student has attempted but not completed walkthrough
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill={GRAY_300}
          stroke={GRAY_300}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // Partial fill: 1/2, 3/4
  const fillFraction =
    state === "walkthrough_complete" ? 0.5
    : 0.75; // challenge_started

  // Create a pie slice using SVG arc
  // Start from the top (12 o'clock), go clockwise
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + 2 * Math.PI * fillFraction;
  const largeArc = fillFraction > 0.5 ? 1 : 0;

  const x1 = cx + innerR * Math.cos(startAngle);
  const y1 = cy + innerR * Math.sin(startAngle);
  const x2 = cx + innerR * Math.cos(endAngle);
  const y2 = cy + innerR * Math.sin(endAngle);

  const pathData = [
    `M ${cx} ${cy}`,
    `L ${x1} ${y1}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${x2} ${y2}`,
    "Z",
  ].join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        fill="none"
        stroke={SUCCESS_GREEN}
        strokeWidth={strokeWidth}
      />
      <path d={pathData} fill={SUCCESS_GREEN} />
    </svg>
  );
}
