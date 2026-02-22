import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import ActiveUnits from "../components/course/ActiveUnits";
import NewUnitCard from "../components/course/NewUnitCard";
import TintedImage from "../components/ui/TintedImage";
import Button from "../components/ui/Button";
import { GRAY_900, GRAY_500, PRIMARY } from "../theme/colors";
import {
  mockInstructor,
  teacherCourses,
  sidebarCourses,
  teacherUnitsMap,
} from "../data/teacherMockData";
import historyLogo from "../assets/history-logo.png";
import scienceLogo from "../assets/science-logo.png";

const courseIconMap: Record<string, string> = {
  history: historyLogo,
  science: scienceLogo,
};

export default function TeacherCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const course = teacherCourses.find((c) => c.id === courseId);
  const units = courseId ? teacherUnitsMap[courseId] ?? [] : [];

  const headerStyles: React.CSSProperties = {
    marginBottom: 32,
  };

  const titleRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  };

  const iconStyles: React.CSSProperties = {
    width: 48,
    height: 48,
    objectFit: "contain",
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: GRAY_900,
  };

  const infoRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const infoTextStyles: React.CSSProperties = {
    fontSize: 14,
    color: GRAY_500,
  };

  const iconSrc = course?.icon ? courseIconMap[course.icon] : undefined;

  const bookIcon = (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke={PRIMARY}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyles}
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );

  return (
    <AppShell
      student={mockInstructor}
      activePath="/courses"
      sidebarCourses={sidebarCourses}
      routePrefix="/teacher"
    >
      {!course ? (
        <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>Course not found.</div>
      ) : (
        <>
          <header style={headerStyles}>
            <div style={titleRowStyles}>
              {iconSrc ? (
                <TintedImage
                  src={iconSrc}
                  color={PRIMARY}
                  width={40}
                  height={40}
                  style={iconStyles}
                />
              ) : (
                bookIcon
              )}
              <h1 style={titleStyles}>{course.title}</h1>
            </div>
            <div style={infoRowStyles}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={GRAY_500}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span style={infoTextStyles}>
                {course.studentCount} student{course.studentCount !== 1 ? "s" : ""} enrolled
              </span>
              <Button
                variant="secondary"
                onClick={() => navigate(`/teacher/course/${courseId}/roster`)}
                style={{ padding: "4px 12px", fontSize: 13, marginLeft: 8 }}
              >
                Edit Roster
              </Button>
            </div>
          </header>

          <ActiveUnits units={units} courseId={course.id} routePrefix="/teacher" />
          <NewUnitCard courseId={course.id} />
        </>
      )}
    </AppShell>
  );
}
