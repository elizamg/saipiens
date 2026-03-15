import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import {
  getCurrentInstructor,
  listTeacherCourses,
  listTeacherStudents,
  getUnit,
  getUnitGradingReport,
  getUnitFeedbackForStudent,
  createUnitFeedback,
  updateFeedback,
  getAgent,
} from "../services/api";
import type { Course, Instructor, Student, Unit, GradingReport, FeedbackItem, Agent } from "../types/domain";
import { GRAY_400, GRAY_600, GRAY_900, GRAY_200, GRAY_100, WHITE, SUCCESS_GREEN } from "../theme/colors";

export default function TeacherFeedbackUnitPage() {
  const { courseId, studentId, unitId } = useParams<{
    courseId: string;
    studentId: string;
    unitId: string;
  }>();
  const navigate = useNavigate();

  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [report, setReport] = useState<GradingReport | null>(null);
  const [existingFeedback, setExistingFeedback] = useState<FeedbackItem | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [feedbackBody, setFeedbackBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !studentId || !unitId) return;
    async function load() {
      try {
        const [instr, allCourses, allStudents, u, r, fb, ag] = await Promise.all([
          getCurrentInstructor(),
          listTeacherCourses(),
          listTeacherStudents(),
          getUnit(unitId!),
          getUnitGradingReport(unitId!, studentId!).catch(() => null),
          getUnitFeedbackForStudent(unitId!, studentId!).catch(() => null),
          getAgent(),
        ]);
        setInstructor(instr);
        setCourses(allCourses);
        setStudent(allStudents.find((s) => s.id === studentId) ?? null);
        setUnit(u);
        setReport(r);
        setExistingFeedback(fb);
        setFeedbackBody(fb?.body ?? "");
        setAgent(ag);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, studentId, unitId]);

  async function handleSubmit() {
    if (!unitId || !studentId || !feedbackBody.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      if (existingFeedback) {
        const updated = await updateFeedback(existingFeedback.id, feedbackBody.trim());
        setExistingFeedback(updated);
      } else {
        const created = await createUnitFeedback(unitId, studentId, feedbackBody.trim());
        setExistingFeedback(created);
      }
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const cardStyles: React.CSSProperties = {
    background: WHITE,
    border: `1px solid ${GRAY_200}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  };

  const avatarStyles: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  };

  return (
    <AppShell
      student={instructor ? { ...instructor, yearLabel: "" } : null}
      activePath="/teacher/feedback"
      sidebarCourses={loading ? [] : courses}
      routePrefix="/teacher"
    >
      <div style={{ maxWidth: 680 }}>
        <button
          onClick={() => navigate(`/teacher/feedback/course/${courseId}/student/${studentId}`)}
          style={{ background: "none", border: "none", cursor: "pointer", color: GRAY_600, fontSize: 14, padding: "0 0 16px 0", display: "flex", alignItems: "center", gap: 4 }}
        >
          ← Back
        </button>
        <p style={{ margin: "0 0 4px 0", fontSize: 13, color: GRAY_600 }}>{student?.name}</p>
        <h1 style={{ margin: "0 0 24px 0", fontSize: 24, fontWeight: 600, color: GRAY_900 }}>
          {unit?.title ?? "Unit"}
        </h1>

        {loading ? (
          <p style={{ fontSize: 14, color: GRAY_600 }}>Loading…</p>
        ) : (
          <>
            {/* Sam's Report — identical to student view */}
            <div style={cardStyles}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                {agent?.avatarUrl ? (
                  <img src={agent.avatarUrl} alt="Sam" style={avatarStyles} />
                ) : (
                  <div style={{ ...avatarStyles, background: GRAY_200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: GRAY_600 }}>S</div>
                )}
                <span style={{ fontWeight: 600, fontSize: 15, color: GRAY_900 }}>Sam</span>
              </div>
              {report ? (
                <p style={{ margin: 0, fontSize: 14, color: GRAY_600, lineHeight: 1.6 }}>{report.summary}</p>
              ) : (
                <div style={{ background: GRAY_100, borderRadius: 8, padding: "12px 16px" }}>
                  <p style={{ margin: 0, fontSize: 14, color: GRAY_400 }}>Waiting for Sam's feedback…</p>
                </div>
              )}
            </div>

            {/* Teacher Feedback — same card structure, body is editable */}
            <div style={cardStyles}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ ...avatarStyles, background: GRAY_200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: GRAY_600 }}>
                  T
                </div>
                <span style={{ fontWeight: 600, fontSize: 15, color: GRAY_900 }}>Your Feedback</span>
              </div>
              <textarea
                value={feedbackBody}
                onChange={(e) => { setFeedbackBody(e.target.value); setSaved(false); }}
                placeholder="Write your feedback for this student…"
                rows={5}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${GRAY_200}`,
                  fontSize: 14,
                  color: GRAY_900,
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={saving || !feedbackBody.trim()}
                  style={{ padding: "10px 20px", fontSize: 14 }}
                >
                  {saving ? "Saving…" : existingFeedback ? "Update Feedback" : "Send Feedback"}
                </Button>
                {saved && (
                  <span style={{ fontSize: 13, color: SUCCESS_GREEN, fontWeight: 500 }}>
                    ✓ Saved
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
