import React from "react";
import CourseCard from "./CourseCard";
import { GRAY_900 } from "../../theme/colors";
import type { Course, Instructor } from "../../types/domain";

interface EnrolledCoursesProps {
  courses: Course[];
  instructorsMap: Record<string, Instructor>;
}

export default function EnrolledCourses({ courses, instructorsMap }: EnrolledCoursesProps) {
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

  const gridStyles: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 20,
  };

  return (
    <section style={sectionStyles}>
      <h2 style={headingStyles}>Your Courses</h2>
      <div style={gridStyles}>
        {courses.map((course) => {
          const courseInstructors = (course.instructorIds ?? [])
            .map((id) => instructorsMap[id])
            .filter(Boolean) as Instructor[];
          return (
            <CourseCard
              key={course.id}
              course={course}
              instructors={courseInstructors}
            />
          );
        })}
      </div>
    </section>
  );
}
