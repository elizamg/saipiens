import { SUCCESS_GREEN, GRAY_400, GRAY_200 } from "../../theme/colors";

interface DualProgressBarProps {
  /** Percentage filled with grey (incorrect) */
  greyPercent: number;
  /** Percentage filled with green (correct) */
  greenPercent: number;
  height?: number;
}

/**
 * Two-tone progress bar: green segment (correct) followed by grey segment (incorrect).
 * Both segments are rendered on a light grey track.
 */
export default function DualProgressBar({
  greyPercent,
  greenPercent,
  height = 4,
}: DualProgressBarProps) {
  const clampedGreen = Math.max(0, Math.min(100, greenPercent));
  const clampedGrey = Math.max(0, Math.min(100 - clampedGreen, greyPercent));

  const trackStyles: React.CSSProperties = {
    width: "100%",
    height,
    backgroundColor: GRAY_200,
    borderRadius: height / 2,
    overflow: "hidden",
    display: "flex",
  };

  const greenStyles: React.CSSProperties = {
    width: `${clampedGreen}%`,
    height: "100%",
    backgroundColor: SUCCESS_GREEN,
    transition: "width 0.3s ease",
    flexShrink: 0,
  };

  const greyStyles: React.CSSProperties = {
    width: `${clampedGrey}%`,
    height: "100%",
    backgroundColor: GRAY_400,
    transition: "width 0.3s ease",
    flexShrink: 0,
  };

  return (
    <div style={trackStyles}>
      <div style={greenStyles} />
      <div style={greyStyles} />
    </div>
  );
}
