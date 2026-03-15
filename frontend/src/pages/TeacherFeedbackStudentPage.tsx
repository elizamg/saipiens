import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import UnitCard from "../components/course/UnitCard";
import {
  getCurrentInstructor,
  listTeacherCourses,
  listTeacherStudents,
  listUnits,
  getUnitGradingReport,
  getUnitFeedbackForStudent,
} from "../services/api";
import type { Course, Instructor, Student, Unit } from "../types/domain";
import { GRAY_500, GRAY_600, GRAY_900, SUCCESS_GREEN } from "../theme/colors";

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
            feedbackSent: feedbacks[i] !== null,
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
        <button
          onClick={() => navigate(`/teacher/feedback/course/${courseId}`)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: GRAY_600,
            fontSize: 14,
            padding: "0 0 16px 0",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← Back
        </button>
        <h1 style={{ margin: "0 0 4px 0", fontSize: 28, fontWeight: 700, color: GRAY_900 }}>
          {student?.name ?? "Student"}
        </h1>
        <p style={{ margin: "0 0 28px 0", fontSize: 14, color: GRAY_500 }}>
          Select a unit to view Sam's report and add feedback.
        </p>

        {loading ? (
          <p style={{ fontSize: 14, color: GRAY_500 }}>Loading units…</p>
        ) : (
          <section>
            <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 600, color: GRAY_900 }}>
              Units
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {unitRows.map(({ unit, reportReady, feedbackSent }) => (
                <div key={unit.id}>
                  <UnitCard
                    unit={unit}
                    courseId={courseId!}
                    routePrefix="/teacher"
                    onView={() =>
                      navigate(
                        `/teacher/feedback/course/${courseId}/student/${studentId}/unit/${unit.id}`
                      )
                    }
                  />
                  {/* Status badges shown below each card */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "6px 16px 0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: reportReady ? SUCCESS_GREEN : GRAY_500,
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontSize: 12, color: GRAY_500 }}>
                        {reportReady ? "Report ready" : "Awaiting report"}
                      </span>
                    </div>
                    {feedbackSent && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: SUCCESS_GREEN,
                          background: "rgba(92, 143, 106, 0.12)",
                          padding: "2px 8px",
                          borderRadius: 99,
                        }}
                      >
                        Feedback sent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
