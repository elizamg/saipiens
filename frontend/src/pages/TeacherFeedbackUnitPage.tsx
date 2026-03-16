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
  getAgent,
} from "../services/api";
import type { Course, Instructor, Student, Unit, GradingReport, FeedbackItem, Agent } from "../types/domain";
import { GRAY_400, GRAY_600, GRAY_900, GRAY_200, GRAY_100, WHITE, SUCCESS_GREEN, PRIMARY } from "../theme/colors";

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
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackItem[]>([]);
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
          getUnitFeedbackForStudent(unitId!, studentId!).catch(() => []),
          getAgent(),
        ]);
        setInstructor(instr);
        setCourses(allCourses);
        setStudent(allStudents.find((s) => s.id === studentId) ?? null);
        setUnit(u);
        setReport(r);
        setFeedbackMessages(fb);
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
      const created = await createUnitFeedback(unitId, studentId, feedbackBody.trim());
      setFeedbackMessages((prev) => [...prev, created]);
      setFeedbackBody("");
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

  const skillPct = report && report.skillTotal ? Math.round((report.skillCompleted! / report.skillTotal) * 100) : 0;
  const knowledgePct = report && report.knowledgeTotal ? Math.round((report.knowledgeCorrect! / report.knowledgeTotal) * 100) : 0;

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
            {/* Structured Stats */}
            {report && (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <StatCard label="Skills Completed" value={`${report.skillCompleted ?? 0}/${report.skillTotal ?? 0}`} pct={skillPct} />
                  <StatCard label="Knowledge Correct" value={`${report.knowledgeCorrect ?? 0}/${report.knowledgeTotal ?? 0}`} pct={knowledgePct} />
                </div>
                {report.deadline && (
                  <div style={{
                    background: WHITE,
                    border: `1px solid ${GRAY_200}`,
                    borderRadius: 12,
                    padding: "12px 20px",
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: GRAY_400, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Deadline
                      </p>
                      <p style={{ margin: "2px 0 0 0", fontSize: 15, fontWeight: 600, color: GRAY_900 }}>
                        {new Date(report.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {report.completedBeforeDeadline != null && (
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: report.completedBeforeDeadline ? SUCCESS_GREEN : "#c45a3c",
                        background: report.completedBeforeDeadline ? "rgba(92,143,106,0.1)" : "rgba(196,90,60,0.1)",
                        padding: "4px 10px",
                        borderRadius: 6,
                      }}>
                        {report.completedBeforeDeadline ? "Completed on time" : "Completed late"}
                      </span>
                    )}
                    {report.completedBeforeDeadline == null && skillPct < 100 && (
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: GRAY_400,
                        background: GRAY_100,
                        padding: "4px 10px",
                        borderRadius: 6,
                      }}>
                        In progress
                      </span>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Sam's Report */}
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
                <div style={{ margin: 0, fontSize: 14, color: GRAY_600, lineHeight: 1.6 }}>
                  {report.summary.split("\n").map((para, i) => (
                    <p key={i} style={{ margin: i === 0 ? 0 : "12px 0 0 0" }}>{para}</p>
                  ))}
                </div>
              ) : (
                <div style={{ background: GRAY_100, borderRadius: 8, padding: "12px 16px" }}>
                  <p style={{ margin: 0, fontSize: 14, color: GRAY_400 }}>Waiting for Sam's feedback…</p>
                </div>
              )}
            </div>

            {/* Past Teacher Messages */}
            {feedbackMessages.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: GRAY_600, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Your Messages
                </p>
                {feedbackMessages.map((fb) => (
                  <div key={fb.id} style={{ ...cardStyles, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ ...avatarStyles, width: 28, height: 28, background: GRAY_200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: GRAY_600 }}>
                        {(instructor?.name ?? "T").charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: GRAY_900 }}>{instructor?.name ?? "Teacher"}</span>
                      {fb.createdAt && (
                        <span style={{ fontSize: 12, color: GRAY_400, marginLeft: "auto" }}>
                          {new Date(fb.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: GRAY_600, lineHeight: 1.6 }}>{fb.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* New Feedback Input */}
            <div style={cardStyles}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ ...avatarStyles, background: GRAY_200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: GRAY_600 }}>
                  {(instructor?.name ?? "T").charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: 15, color: GRAY_900 }}>
                  {feedbackMessages.length > 0 ? "Add Another Message" : "Write Feedback"}
                </span>
              </div>
              <textarea
                value={feedbackBody}
                onChange={(e) => { setFeedbackBody(e.target.value); setSaved(false); }}
                placeholder="Write your feedback for this student…"
                rows={4}
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
                  {saving ? "Sending…" : "Send"}
                </Button>
                {saved && (
                  <span style={{ fontSize: 13, color: SUCCESS_GREEN, fontWeight: 500 }}>
                    ✓ Sent
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

function StatCard({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div style={{
      flex: 1,
      background: WHITE,
      border: `1px solid ${GRAY_200}`,
      borderRadius: 12,
      padding: "16px 20px",
    }}>
      <p style={{ margin: "0 0 4px 0", fontSize: 12, color: GRAY_400, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <p style={{ margin: "0 0 8px 0", fontSize: 22, fontWeight: 700, color: GRAY_900 }}>
        {value}
      </p>
      <div style={{ height: 6, background: GRAY_100, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: PRIMARY, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}
