import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import { GRAY_900, GRAY_500 } from "../../theme/colors";
import type { Course, Instructor } from "../../types/domain";

interface CourseCardProps {
  course: Course;
  instructors: Instructor[];
}

export default function CourseCard({ course, instructors }: CourseCardProps) {
  const navigate = useNavigate();

  const headerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  };

  const iconStyles: React.CSSProperties = {
    fontSize: 32,
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
    <Card>
      <div style={headerStyles}>
        {course.icon && <span style={iconStyles}>{course.icon}</span>}
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
      <Button
        variant="primary"
        onClick={() => navigate(`/course/${course.id}`)}
        style={{ padding: "10px 20px", fontSize: 14 }}
      >
        View Course
      </Button>
    </Card>
  );
}
