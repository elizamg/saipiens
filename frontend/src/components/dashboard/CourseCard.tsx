import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import { CourseIcon, COURSE_COLORS } from "../../theme/courseIcons";
import ProgressBar from "../ui/ProgressBar";
import { GRAY_900, GRAY_500 } from "../../theme/colors";
import type { Course, Instructor } from "../../types/domain";
import type { CourseProgress } from "../../pages/HomePage";

interface CourseCardProps {
  course: Course;
  instructors: Instructor[];
  progress?: CourseProgress;
}

export default function CourseCard({ course, instructors, progress }: CourseCardProps) {
  const navigate = useNavigate();
  const courseColor = COURSE_COLORS[course.icon ?? "general"] ?? COURSE_COLORS.general;

  const headerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: GRAY_900,
  };

  const instructorSectionStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  };

  const instructorTextStyles: React.CSSProperties = {
    fontSize: 14,
    color: GRAY_500,
  };

  const avatarGroupStyles: React.CSSProperties = {
    display: "flex",
  };

  return (
    <Card style={{ borderLeft: `4px solid ${courseColor.main}`, background: courseColor.light }}>
      <div style={headerStyles}>
        <CourseIcon icon={course.icon ?? "general"} size={40} color={courseColor.main} />
        <h3 style={titleStyles}>{course.title}</h3>
      </div>
      <div style={instructorSectionStyles}>
        <div style={avatarGroupStyles}>
          {instructors.slice(0, 3).map((instructor, index) => (
            <Avatar
              key={instructor.id}
              src={instructor.avatarUrl}
              name={instructor.name}
              size={28}
              style={{ marginLeft: index > 0 ? -8 : 0, border: "2px solid white" }}
            />
          ))}
        </div>
        <span style={instructorTextStyles}>
          {instructors.map((i) => i.name).join(", ")}
        </span>
      </div>
      {progress && progress.total > 0 && (
        <div style={{ marginBottom: 16 }}>
          <ProgressBar percent={progress.percent} height={4} />
          <span style={{ fontSize: 12, color: GRAY_500, marginTop: 4, display: "block" }}>
            {progress.completed}/{progress.total} objectives
          </span>
        </div>
      )}
      <Button
        variant="primary"
        onClick={() => navigate(`/course/${course.id}`)}
        style={{ padding: "10px 20px", fontSize: 14, background: courseColor.main }}
      >
        View Course
      </Button>
    </Card>
  );
}
