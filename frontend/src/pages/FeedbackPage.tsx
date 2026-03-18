import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { CourseIcon } from "../theme/courseIcons";
import { getCurrentStudent, listCoursesForStudent } from "../services/api";
import type { Student, Course } from "../types/domain";
import { GRAY_600, GRAY_900, GRAY_200, WHITE, PRIMARY } from "../theme/colors";

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentStudent()
      .then((s) => {
        setStudent(s);
        return listCoursesForStudent(s.id);
      })
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell student={student} activePath="/feedback">
      <div>
        <h1 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 600, color: GRAY_900 }}>
          Feedback
        </h1>
        <p style={{ margin: "0 0 24px 0", fontSize: 14, color: GRAY_600 }}>
          Select a course to view Sam's reports and teacher feedback.
        </p>
        {loading ? (
          <p style={{ fontSize: 14, color: GRAY_600 }}>Loading courses…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => navigate(`/feedback/course/${course.id}`)}
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
                <CourseIcon icon={course.icon ?? "general"} size={28} color={PRIMARY} />
                {course.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
