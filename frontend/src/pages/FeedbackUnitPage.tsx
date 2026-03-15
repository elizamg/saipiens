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
import { GRAY_400, GRAY_600, GRAY_900, GRAY_200, GRAY_100, WHITE } from "../theme/colors";

export default function FeedbackUnitPage() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [report, setReport] = useState<GradingReport | null | undefined>(undefined);
  const [teacherFeedback, setTeacherFeedback] = useState<FeedbackItem | null | undefined>(undefined);
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
          getMyUnitFeedback(unitId!).catch(() => null),
          getAgent(),
        ]);
        setStudent(s);
        setUnit(u);
        setReport(r);
        setTeacherFeedback(fb);
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
                <p style={{ margin: 0, fontSize: 14, color: GRAY_600, lineHeight: 1.6 }}>{report.summary}</p>
              ) : (
                <div style={{ background: GRAY_100, borderRadius: 8, padding: "12px 16px" }}>
                  <p style={{ margin: 0, fontSize: 14, color: GRAY_400 }}>Waiting for Sam's feedback…</p>
                </div>
              )}
            </div>

            {/* Teacher Feedback */}
            {teacherFeedback && (
              <div style={cardStyles}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ ...avatarStyles, background: GRAY_200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: GRAY_600 }}>
                    T
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 15, color: GRAY_900 }}>Teacher</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: GRAY_600, lineHeight: 1.6 }}>{teacherFeedback.body}</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
