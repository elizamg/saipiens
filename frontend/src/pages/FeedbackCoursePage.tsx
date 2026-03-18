import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import {
  getCurrentStudent,
  getCourse,
  listUnits,
  getMyUnitGradingReport,
} from "../services/api";
import type { Student, Course, Unit } from "../types/domain";
import BackButton from "../components/ui/BackButton";
import { GRAY_600, GRAY_900, GRAY_200, WHITE, SUCCESS_GREEN } from "../theme/colors";

export default function FeedbackCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [reportReady, setReportReady] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    async function load() {
      try {
        const [s, c, u] = await Promise.all([
          getCurrentStudent(),
          getCourse(courseId!),
          listUnits(courseId!),
        ]);
        setStudent(s);
        setCourse(c);
        setUnits(u);

        const reports = await Promise.all(u.map((unit) => getMyUnitGradingReport(unit.id).catch(() => null)));
        const ready: Record<string, boolean> = {};
        u.forEach((unit, i) => {
          ready[unit.id] = reports[i] !== null;
        });
        setReportReady(ready);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  return (
    <AppShell student={student} activePath="/feedback">
      <div>
        <BackButton onClick={() => navigate("/feedback")} style={{ marginBottom: 16 }} />
        <h1 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 600, color: GRAY_900 }}>
          {course?.title ?? "Course"}
        </h1>
        <p style={{ margin: "0 0 24px 0", fontSize: 14, color: GRAY_600 }}>
          Select a unit to view feedback.
        </p>
        {loading ? (
          <p style={{ fontSize: 14, color: GRAY_600 }}>Loading units…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {units.map((unit) => (
              <button
                key={unit.id}
                onClick={() => navigate(`/feedback/course/${courseId}/unit/${unit.id}`)}
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
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: reportReady[unit.id] ? SUCCESS_GREEN : GRAY_200,
                    flexShrink: 0,
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
