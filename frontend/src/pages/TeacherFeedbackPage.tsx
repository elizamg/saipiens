import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { CourseIcon, COURSE_COLORS } from "../theme/courseIcons";
import Skeleton from "../components/ui/Skeleton";
import { getCurrentInstructor, listTeacherCourses } from "../services/api";
import type { Course, Instructor } from "../types/domain";
import { GRAY_600, GRAY_900, GRAY_200, WHITE } from "../theme/colors";

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

  return (
    <AppShell
      student={instructor ? { ...instructor, yearLabel: "" } : null}
      activePath="/teacher/feedback"
      sidebarCourses={loading ? [] : courses}
      routePrefix="/teacher"
    >
      <div>
        <h1 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 600, color: GRAY_900 }}>
          Feedback
        </h1>
        <p style={{ margin: "0 0 24px 0", fontSize: 14, color: GRAY_600 }}>
          Select a course to review student feedback.
        </p>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[55, 70, 45].map((w, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 12 }}>
                <Skeleton width={28} height={28} borderRadius={6} style={{ flexShrink: 0 }} />
                <Skeleton width={`${w}%`} height={15} borderRadius={6} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => navigate(`/teacher/feedback/course/${course.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  background: WHITE,
                  border: `1px solid ${GRAY_200}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 15,
                  fontWeight: 500,
                  color: GRAY_900,
                }}
              >
                <CourseIcon icon={course.icon ?? "general"} size={28} color={(COURSE_COLORS[course.icon ?? "general"] ?? COURSE_COLORS.general).main} />
                {course.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
