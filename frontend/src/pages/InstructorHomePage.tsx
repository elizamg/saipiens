import React, { useState, useEffect } from "react";
import AppShell from "../components/layout/AppShell";
import TeacherCourseCard from "../components/dashboard/TeacherCourseCard";
import NewCourseCard from "../components/dashboard/NewCourseCard";
import {
  GREEN_GRADIENT_VERTICAL,
  WHITE,
  GRAY_900,
  GRAY_500,
} from "../theme/colors";
import { getCurrentInstructor, listTeacherCourses } from "../services/api";
import type { Course, Instructor } from "../types/domain";

export default function InstructorHomePage() {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCurrentInstructor(), listTeacherCourses()])
      .then(([instr, c]) => {
        setInstructor(instr);
        setCourses(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  const firstName = instructor?.name?.split(" ")[0] ?? "there";

  return (
    <AppShell
      student={instructor ? { ...instructor, yearLabel: "" } : { id: "", name: "", yearLabel: "" }}
      activePath="/teacher"
      sidebarCourses={loading ? [] : courses}
      routePrefix="/teacher"
    >
      <div style={bannerStyles}>
        <h1 style={greetingStyles}>Welcome back, {firstName}!</h1>
        <p style={subtitleStyles}>
          {loading ? "Loading…" : `${courses.length} course${courses.length !== 1 ? "s" : ""} • Ready to inspire!`}
        </p>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={headingStyles}>Your Courses</h2>
        {loading ? (
          <p style={{ fontSize: 14, color: GRAY_500 }}>Loading courses…</p>
        ) : (
          <div style={gridStyles}>
            {courses.map((course) => (
              <TeacherCourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                studentCount={course.studentCount ?? 0}
                icon={course.icon ?? ""}
              />
            ))}
            <NewCourseCard />
          </div>
        )}
      </section>
    </AppShell>
  );
}
