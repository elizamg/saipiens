import { SUCCESS_GREEN, GRAY_400, GRAY_300 } from "../../theme/colors";
import type { KnowledgeItemStatus } from "../../types/domain";

interface KnowledgeCircleProps {
  status: KnowledgeItemStatus;
  size?: number;
}

/**
 * Circle indicator for knowledge queue items:
 * - active: empty circle (in progress)
 * - completed_correct: full green circle
 * - completed_incorrect: full grey circle
 * - pending: not rendered (caller should not pass pending items)
 */
export default function KnowledgeCircle({ status, size = 21 }: KnowledgeCircleProps) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  const strokeWidth = 1.5;
  const innerR = r - strokeWidth;

  if (status === "active") {
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

  if (status === "completed_correct") {
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

  if (status === "completed_incorrect") {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill={GRAY_400}
          stroke={GRAY_400}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // pending — not rendered
  return null;
}
