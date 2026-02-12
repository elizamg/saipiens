import { MAIN_GREEN, GRAY_200 } from "../../theme/colors";

interface ProgressBarProps {
  percent: number;
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({
  percent,
  height = 6,
  showLabel = false,
}: ProgressBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));

  const containerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const trackStyles: React.CSSProperties = {
    flex: 1,
    height,
    backgroundColor: GRAY_200,
    borderRadius: height / 2,
    overflow: "hidden",
  };

  const fillStyles: React.CSSProperties = {
    width: `${clampedPercent}%`,
    height: "100%",
    backgroundColor: MAIN_GREEN,
    borderRadius: height / 2,
    transition: "width 0.3s ease",
  };

  const labelStyles: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: MAIN_GREEN,
    minWidth: 36,
    textAlign: "right",
  };

  return (
    <div style={containerStyles}>
      <div style={trackStyles}>
        <div style={fillStyles} />
      </div>
      {showLabel && <span style={labelStyles}>{clampedPercent}%</span>}
    </div>
  );
}
