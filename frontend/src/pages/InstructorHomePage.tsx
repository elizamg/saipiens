import React from "react";
import AppShell from "../components/layout/AppShell";
import TeacherCourseCard from "../components/dashboard/TeacherCourseCard";
import NewCourseCard from "../components/dashboard/NewCourseCard";
import {
  GREEN_GRADIENT_VERTICAL,
  WHITE,
  GRAY_900,
} from "../theme/colors";
import {
  mockInstructor,
  teacherCourses,
  sidebarCourses,
} from "../data/teacherMockData";

export default function InstructorHomePage() {
  const bannerStyles: React.CSSProperties = {
    background: GREEN_GRADIENT_VERTICAL,
    borderRadius: 16,
    padding: "32px 40px",
    marginBottom: 32,
  };

  const greetingStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: WHITE,
    marginBottom: 8,
    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
  };

  const subtitleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
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
    <AppShell student={mockInstructor} activePath="/teacher" sidebarCourses={sidebarCourses} routePrefix="/teacher">
      <div style={bannerStyles}>
        <h1 style={greetingStyles}>Welcome back, Ms. Gallagher!</h1>
        <p style={subtitleStyles}>
          {teacherCourses.length} courses &bull; Ready to inspire!
        </p>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={headingStyles}>Your Courses</h2>
        <div style={gridStyles}>
          {teacherCourses.map((course) => (
            <TeacherCourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              studentCount={course.studentCount}
              icon={course.icon}
            />
          ))}
          <NewCourseCard />
        </div>
      </section>
    </AppShell>
  );
}
