import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import ProgressBar from "../ui/ProgressBar";
import { CourseIcon, COURSE_COLORS } from "../../theme/courseIcons";
import { GRAY_900, GRAY_500, PRIMARY } from "../../theme/colors";
import SectionIcon from "../ui/SectionIcon";
import type { Unit, Course, UnitProgress } from "../../types/domain";

interface ContinueLearningProps {
  unit: Unit;
  course: Course;
  progress: UnitProgress;
}

export default function ContinueLearning({ unit, course, progress }: ContinueLearningProps) {
  const navigate = useNavigate();

  const sectionStyles: React.CSSProperties = {
    marginBottom: 32,
  };

  const headingStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: GRAY_900,
    marginBottom: 16,
  };

  const rowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 16,
  };

  const infoStyles: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const unitTitleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: GRAY_900,
  };

  const courseNameStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 13,
    color: GRAY_500,
    marginTop: 2,
  };

  const progressRowStyles: React.CSSProperties = {
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const progressLabelStyles: React.CSSProperties = {
    fontSize: 12,
    color: GRAY_500,
    flexShrink: 0,
  };

  return (
    <section style={sectionStyles}>
      <h2 style={headingStyles}><SectionIcon name="pencil" color={PRIMARY} />Continue Learning</h2>
      <Card>
        <div style={rowStyles}>
          <CourseIcon icon={course.icon ?? "general"} size={40} color={(COURSE_COLORS[course.icon ?? "general"] ?? COURSE_COLORS.general).main} />
          <div style={infoStyles}>
            <h3 style={unitTitleStyles}>{unit.title}</h3>
            <p style={courseNameStyles}>{course.title}</p>
            <div style={progressRowStyles}>
              <div style={{ flex: 1 }}>
                <ProgressBar percent={progress.progressPercent} height={4} />
              </div>
              <span style={progressLabelStyles}>
                {progress.completedObjectives}/{progress.totalObjectives}
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate(`/course/${course.id}/unit/${unit.id}/chat`)}
            style={{ padding: "10px 20px", fontSize: 14, flexShrink: 0, background: (COURSE_COLORS[course.icon ?? "general"] ?? COURSE_COLORS.general).main }}
          >
            Continue
          </Button>
        </div>
      </Card>
    </section>
  );
}
