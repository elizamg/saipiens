import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import BackButton from "../components/ui/BackButton";
import {
  getCurrentInstructor,
  listTeacherCourses,
  listTeacherStudents,
  listUnits,
  getUnitGradingReport,
  getUnitFeedbackForStudent,
} from "../services/api";
import type { Course, Instructor, Student, Unit } from "../types/domain";
import { GRAY_600, GRAY_900, GRAY_200, WHITE, SUCCESS_GREEN } from "../theme/colors";

interface UnitRow {
  unit: Unit;
  reportReady: boolean;
  feedbackSent: boolean;
}

export default function TeacherFeedbackStudentPage() {
  const { courseId, studentId } = useParams<{ courseId: string; studentId: string }>();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [unitRows, setUnitRows] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !studentId) return;
    async function load() {
      try {
        const [instr, allCourses, allStudents, units] = await Promise.all([
          getCurrentInstructor(),
          listTeacherCourses(),
          listTeacherStudents(),
          listUnits(courseId!),
        ]);
        setInstructor(instr);
        setCourses(allCourses);
        setStudent(allStudents.find((s) => s.id === studentId) ?? null);

        const [reports, feedbacks] = await Promise.all([
          Promise.all(units.map((u) => getUnitGradingReport(u.id, studentId!).catch(() => null))),
          Promise.all(units.map((u) => getUnitFeedbackForStudent(u.id, studentId!).catch(() => null))),
        ]);
        setUnitRows(
          units.map((unit, i) => ({
            unit,
            reportReady: reports[i] !== null,
            feedbackSent: Array.isArray(feedbacks[i]) ? feedbacks[i].length > 0 : feedbacks[i] !== null,
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, studentId]);

  return (
    <AppShell
      student={instructor ? { ...instructor, yearLabel: "" } : null}
      activePath="/teacher/feedback"
      sidebarCourses={loading ? [] : courses}
      routePrefix="/teacher"
    >
      <div>
        <BackButton onClick={() => navigate(`/teacher/feedback/course/${courseId}`)} style={{ marginBottom: 16 }} />
        <h1 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 600, color: GRAY_900 }}>
          {student?.name ?? "Student"}
        </h1>
        <p style={{ margin: "0 0 24px 0", fontSize: 14, color: GRAY_600 }}>
          Select a unit to view feedback.
        </p>
        {loading ? (
          <p style={{ fontSize: 14, color: GRAY_600 }}>Loading units…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {unitRows.map(({ unit, reportReady, feedbackSent }) => (
              <button
                key={unit.id}
                onClick={() =>
                  navigate(`/teacher/feedback/course/${courseId}/student/${studentId}/unit/${unit.id}`)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
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
                <span>{unit.title}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {feedbackSent && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: SUCCESS_GREEN,
                      background: "rgba(92, 143, 106, 0.12)",
                      padding: "2px 7px",
                      borderRadius: 99,
                    }}>
                      Feedback sent
                    </span>
                  )}
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: reportReady ? SUCCESS_GREEN : GRAY_200,
                    flexShrink: 0,
                    display: "inline-block",
                  }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
