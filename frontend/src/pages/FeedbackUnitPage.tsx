import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import {
  getCurrentStudent,
  getUnit,
  getMyUnitGradingReport,
  getMyUnitFeedback,
  getAgent,
} from "../services/api";
import type { Student, Unit, GradingReport, FeedbackItem, Agent } from "../types/domain";
import { GRAY_400, GRAY_600, GRAY_900, GRAY_200, GRAY_100, WHITE, PRIMARY, SUCCESS_GREEN } from "../theme/colors";

export default function FeedbackUnitPage() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [report, setReport] = useState<GradingReport | null | undefined>(undefined);
  const [teacherMessages, setTeacherMessages] = useState<FeedbackItem[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitId) return;
    async function load() {
      try {
        const [s, u, r, fb, ag] = await Promise.all([
          getCurrentStudent(),
          getUnit(unitId!),
          getMyUnitGradingReport(unitId!).catch(() => null),
          getMyUnitFeedback(unitId!).catch(() => []),
          getAgent(),
        ]);
        setStudent(s);
        setUnit(u);
        setReport(r);
        setTeacherMessages(fb);
        setAgent(ag);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unitId]);

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
    <AppShell student={student} activePath="/feedback">
      <div style={{ maxWidth: 680 }}>
        <button
          onClick={() => navigate(`/feedback/course/${courseId}`)}
          style={{ background: "none", border: "none", cursor: "pointer", color: GRAY_600, fontSize: 14, padding: "0 0 16px 0", display: "flex", alignItems: "center", gap: 4 }}
        >
          ← Back
        </button>
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

            {/* Teacher Messages */}
            {teacherMessages.length > 0 && (
              <>
                {teacherMessages.map((fb) => (
                  <div key={fb.id} style={cardStyles}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ ...avatarStyles, background: GRAY_200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: GRAY_600 }}>
                        {(fb.instructorName ?? "T").charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 15, color: GRAY_900 }}>{fb.instructorName ?? "Teacher"}</span>
                      {fb.createdAt && (
                        <span style={{ fontSize: 12, color: GRAY_400, marginLeft: "auto" }}>
                          {new Date(fb.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: GRAY_600, lineHeight: 1.6 }}>{fb.body}</p>
                  </div>
                ))}
              </>
            )}
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
