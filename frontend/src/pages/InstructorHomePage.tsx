import React, { useState, useEffect } from "react";
import AppShell from "../components/layout/AppShell";
import WelcomeBanner from "../components/dashboard/WelcomeBanner";
import TeacherCourseCard from "../components/dashboard/TeacherCourseCard";
import NewCourseCard from "../components/dashboard/NewCourseCard";
import SkeletonBanner from "../components/ui/SkeletonBanner";
import SkeletonCourseCard from "../components/ui/SkeletonCourseCard";
import Skeleton from "../components/ui/Skeleton";
import {
  GRAY_900,
} from "../theme/colors";
import { getCurrentInstructor, listTeacherCourses } from "../services/api";
import type { Course, Instructor } from "../types/domain";

function InstructorHomePageSkeleton() {
  return (
    <>
      <SkeletonBanner />
      <section style={{ marginBottom: 32 }}>
        <Skeleton width={140} height={20} borderRadius={6} style={{ marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          <SkeletonCourseCard />
          <SkeletonCourseCard />
          <SkeletonCourseCard />
        </div>
      </section>
    </>
  );
}

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
    <AppShell
      student={instructor ? { ...instructor, yearLabel: "" } : { id: "", name: "", yearLabel: "" }}
      activePath="/teacher"
      sidebarCourses={loading ? [] : courses}
      routePrefix="/teacher"
      role="teacher"
    >
      {loading ? (
        <InstructorHomePageSkeleton />
      ) : (
        <div style={{ animation: "fadeIn 0.3s ease both" }}>
          {instructor && (
            <WelcomeBanner
              name={instructor.name}
              role="teacher"
              subtitle={`${courses.length} course${courses.length !== 1 ? "s" : ""}`}
            />
          )}
          <section style={{ marginBottom: 32 }}>
            <h2 style={headingStyles}>Your Courses</h2>
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
          </section>
        </div>
      )}
    </AppShell>
  );
}
