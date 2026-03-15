import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import TeacherCourseCard from "../components/dashboard/TeacherCourseCard";
import { getCurrentInstructor, listTeacherCourses } from "../services/api";
import type { Course, Instructor } from "../types/domain";
import {
  GREEN_GRADIENT_VERTICAL,
  WHITE,
  GRAY_900,
  GRAY_500,
} from "../theme/colors";

export default function TeacherFeedbackPage() {
  const navigate = useNavigate();
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

  const firstName = instructor?.name?.split(" ")[0] ?? "there";

  return (
    <AppShell
      student={instructor ? { ...instructor, yearLabel: "" } : null}
      activePath="/teacher/feedback"
      sidebarCourses={loading ? [] : courses}
      routePrefix="/teacher"
    >
      <div
        style={{
          background: GREEN_GRADIENT_VERTICAL,
          borderRadius: 16,
          padding: "32px 40px",
          marginBottom: 32,
        }}
      >
        <h1 style={{ margin: "0 0 8px 0", fontSize: 32, fontWeight: 700, color: WHITE, textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
          Feedback
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: "rgba(255, 255, 255, 0.9)" }}>
          {loading
            ? "Loading…"
            : `Review Sam's reports and send feedback to your students, ${firstName}.`}
        </p>
      </div>

      <section>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 600, color: GRAY_900 }}>
          Your Courses
        </h2>
        {loading ? (
          <p style={{ fontSize: 14, color: GRAY_500 }}>Loading courses…</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {courses.map((course) => (
              <TeacherCourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                studentCount={course.studentCount ?? 0}
                icon={course.icon ?? ""}
                onNavigate={() => navigate(`/teacher/feedback/course/${course.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
