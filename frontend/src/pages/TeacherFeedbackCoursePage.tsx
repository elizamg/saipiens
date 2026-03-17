import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Avatar from "../components/ui/Avatar";
import {
  getCurrentInstructor,
  getCourse,
  listTeacherCourses,
  getCourseRoster,
  listTeacherStudents,
} from "../services/api";
import type { Course, Instructor, Student } from "../types/domain";
import { GRAY_400, GRAY_600, GRAY_900, GRAY_200, WHITE } from "../theme/colors";

export default function TeacherFeedbackCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    async function load() {
      try {
        const [instr, c, allCourses, rosterIds, allStudents] = await Promise.all([
          getCurrentInstructor(),
          getCourse(courseId!),
          listTeacherCourses(),
          getCourseRoster(courseId!),
          listTeacherStudents(),
        ]);
        setInstructor(instr);
        setCourse(c);
        setCourses(allCourses);
        const rosterSet = new Set(rosterIds);
        setStudents(allStudents.filter((s) => rosterSet.has(s.id)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  return (
    <AppShell
      student={instructor ? { ...instructor, yearLabel: "" } : null}
      activePath="/teacher/feedback"
      sidebarCourses={loading ? [] : courses}
      routePrefix="/teacher"
    >
      <div>
        <button
          onClick={() => navigate("/teacher/feedback")}
          style={{ background: "none", border: "none", cursor: "pointer", color: GRAY_600, fontSize: 14, padding: "0 0 16px 0", display: "flex", alignItems: "center", gap: 4 }}
        >
          ← Back
        </button>
        <h1 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 600, color: GRAY_900 }}>
          {course?.title ?? "Course"}
        </h1>
        <p style={{ margin: "0 0 24px 0", fontSize: 14, color: GRAY_600 }}>
          Select a student to view their feedback.
        </p>
        {loading ? (
          <p style={{ fontSize: 14, color: GRAY_600 }}>Loading students…</p>
        ) : students.length === 0 ? (
          <p style={{ fontSize: 14, color: GRAY_400 }}>No students enrolled.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => navigate(`/teacher/feedback/course/${courseId}/student/${student.id}`)}
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
                <Avatar src={student.avatarUrl} name={student.name} size={28} />
                {student.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
