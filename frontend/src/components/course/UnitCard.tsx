import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import ProgressBar from "../ui/ProgressBar";
import { GRAY_900, GRAY_500, SUCCESS_GREEN, GRAY_300 } from "../../theme/colors";
import type { Unit, UnitProgress } from "../../types/domain";

interface UnitCardProps {
  unit: Unit;
  courseId: string;
  progress?: UnitProgress;
  routePrefix?: string;
}

export default function UnitCard({ unit, courseId, progress, routePrefix }: UnitCardProps) {
  const navigate = useNavigate();
  const isActive = unit.status === "active";
  const isCompleted = unit.status === "completed";
  const isLocked = unit.status === "locked";

  const contentStyles: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const leftStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
  };

  const iconContainerStyles: React.CSSProperties = {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const textContainerStyles: React.CSSProperties = {
    flex: 1,
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    fontWeight: 500,
    color: isLocked ? GRAY_500 : GRAY_900,
    marginBottom: progress && !isLocked ? 8 : 0,
  };

  const progressContainerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const progressTextStyles: React.CSSProperties = {
    fontSize: 12,
    color: GRAY_500,
    minWidth: 40,
  };

  const handleView = () => {
    if (routePrefix === "/teacher") {
      navigate(`/teacher/course/${courseId}/unit/${unit.id}`);
    } else {
      navigate(`/course/${courseId}/unit/${unit.id}/chat`);
    }
  };

  const renderIcon = () => {
    if (isCompleted) {
      // Trophy icon for completed units
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={SUCCESS_GREEN}
          stroke="none"
        >
          <path d="M12 2C13.1 2 14 2.9 14 4V5H19C19.55 5 20 5.45 20 6V8C20 10.21 18.21 12 16 12H14.27C13.8 13.54 12.54 14.73 11 15.08V18H14C14.55 18 15 18.45 15 19V21C15 21.55 14.55 22 14 22H10C9.45 22 9 21.55 9 21V19C9 18.45 9.45 18 10 18H11V15.08C9.46 14.73 8.2 13.54 7.73 12H6C3.79 12 2 10.21 2 8V6C2 5.45 2.45 5 3 5H8V4C8 2.9 8.9 2 10 2H12ZM4 7V8C4 9.1 4.9 10 6 10H7.17C7.06 9.54 7 9.05 7 8.5V7H4ZM18 7H15V8.5C15 9.05 14.94 9.54 14.83 10H16C17.1 10 18 9.1 18 8V7Z" />
        </svg>
      );
    }
    if (isLocked) {
      // Lock icon for locked units
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={GRAY_300}
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    }
    // Active status dot
    return (
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: SUCCESS_GREEN,
        }}
      />
    );
  };

  return (
    <Card padding={16}>
      <div style={contentStyles}>
        <div style={leftStyles}>
          <div style={iconContainerStyles}>{renderIcon()}</div>
          <div style={textContainerStyles}>
            <h4 style={titleStyles}>{unit.title}</h4>
            {progress && !isLocked && (
              <div style={progressContainerStyles}>
                <div style={{ flex: 1, maxWidth: 120 }}>
                  <ProgressBar percent={progress.progressPercent} height={4} />
                </div>
                <span style={progressTextStyles}>
                  {progress.completedObjectives}/{progress.totalObjectives}
                </span>
              </div>
            )}
          </div>
        </div>
        {(isActive || isCompleted) && (
          <Button
            variant="primary"
            onClick={handleView}
            style={{ padding: "8px 16px", fontSize: 14 }}
          >
            View
          </Button>
        )}
      </div>
    </Card>
  );
}
