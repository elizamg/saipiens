import { useEffect, useState, useRef, useCallback } from "react";
import Avatar from "../components/ui/Avatar";
import SectionIcon from "../components/ui/SectionIcon";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import BackButton from "../components/ui/BackButton";
import {
  getCurrentStudent,
  getUnit,
  getMyUnitGradingReport,
  getMyUnitFeedback,
  getAgent,
} from "../services/api";
import type { Student, Unit, GradingReport, FeedbackItem, Agent } from "../types/domain";
import Skeleton from "../components/ui/Skeleton";
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
  const [reportGenerating, setReportGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollForReport = useCallback(() => {
    if (!unitId || pollRef.current) return;
    setReportGenerating(true);
    pollRef.current = setInterval(async () => {
      try {
        const r = await getMyUnitGradingReport(unitId);
        if (r && (r as any).status !== "generating") {
          setReport(r);
          setReportGenerating(false);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch {
        // Keep polling
      }
    }, 3000);
  }, [unitId]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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
        setTeacherMessages(fb);
        setAgent(ag);
        // Handle "generating" status from async report generation
        if (r && (r as any).status === "generating") {
          setReport(null);
          pollForReport();
        } else {
          setReport(r);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unitId, pollForReport]);

  // Auto-refresh report stats when page becomes visible (e.g. switching back from chat)
  useEffect(() => {
    if (!unitId) return;
    const handleVisibility = async () => {
      if (document.visibilityState === "visible") {
        try {
          const r = await getMyUnitGradingReport(unitId);
          if (r && (r as any).status !== "generating") {
            setReport(r);
          }
        } catch {
          // ignore
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [unitId]);

  // Also refresh report on a 30-second interval while the page is open
  useEffect(() => {
    if (!unitId || report === undefined) return;
    const interval = setInterval(async () => {
      try {
        const r = await getMyUnitGradingReport(unitId);
        if (r && (r as any).status !== "generating") {
          setReport(r);
        }
      } catch {
        // ignore
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [unitId, report]);

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
  // Use unit deadline as fallback if report was cached before deadline field was added
  const deadline = report?.deadline || unit?.deadline;

  return (
    <AppShell student={student} activePath="/feedback">
      <div>
        <BackButton onClick={() => navigate(`/feedback/course/${courseId}`)} style={{ marginBottom: 16 }} />
        <h1 style={{ margin: "0 0 24px 0", fontSize: 24, fontWeight: 600, color: GRAY_900 }}>
          {unit?.title ?? "Unit"}
        </h1>

        {loading ? (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              {[0, 1].map((i) => (
                <div key={i} style={{ flex: 1, background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 12, padding: "16px 20px" }}>
                  <Skeleton width="60%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                  <Skeleton width="40%" height={22} borderRadius={6} style={{ marginBottom: 8 }} />
                  <Skeleton width="100%" height={6} borderRadius={3} />
                </div>
              ))}
            </div>
            <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Skeleton width={36} height={36} borderRadius="50%" style={{ flexShrink: 0 }} />
                <Skeleton width={60} height={15} borderRadius={6} />
              </div>
              <Skeleton width="100%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
              <Skeleton width="85%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
              <Skeleton width="70%" height={14} borderRadius={6} />
            </div>
          </>
        ) : (
          <>
            {/* Structured Stats */}
            {report && (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <StatCard label="Skills Completed" value={`${report.skillCompleted ?? 0}/${report.skillTotal ?? 0}`} pct={skillPct} />
                  <StatCard label="Knowledge Correct" value={`${report.knowledgeCorrect ?? 0}/${report.knowledgeTotal ?? 0}`} pct={knowledgePct} />
                </div>
                {/* Additional metrics row */}
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  {deadline && report.onTimePct != null && (
                    <StatCard label="Completed On Time" value={`${report.onTimePct}%`} pct={report.onTimePct} />
                  )}
                  {report.completionDate && (
                    <InfoCard label="Completion Date" value={new Date(report.completionDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} />
                  )}
                  {!report.completionDate && skillPct < 100 && (
                    <InfoCard label="Completion Date" value="In progress" muted />
                  )}
                </div>
                {deadline && (
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
                        {new Date(deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {report.completedBeforeDeadline === true && (
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: SUCCESS_GREEN,
                        background: "rgba(92,143,106,0.1)",
                        padding: "4px 10px",
                        borderRadius: 6,
                      }}>
                        Completed on time
                      </span>
                    )}
                    {report.completedBeforeDeadline === false && (
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#c45a3c",
                        background: "rgba(196,90,60,0.1)",
                        padding: "4px 10px",
                        borderRadius: 6,
                      }}>
                        Completed late
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

            {/* Sam's Report — highlighted */}
            <div style={{
              ...cardStyles,
              background: "linear-gradient(135deg, rgba(139,122,158,0.06) 0%, rgba(154,152,181,0.08) 100%)",
              borderColor: "rgba(139,122,158,0.2)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Avatar src={agent?.avatarUrl} name={agent?.name ?? "Sam"} size={40} imageScale={0.8} tintColor={agent?.tintColor} />
                <div>
                  <span style={{ fontWeight: 600, fontSize: 15, color: GRAY_900, display: "block" }}><><SectionIcon name="robot" color="#7B68A6" size={16} />Sam's Learning Summary</></span>
                  <span style={{ fontSize: 12, color: GRAY_400 }}>AI-generated feedback based on your work</span>
                </div>
              </div>
              {report ? (
                <div style={{
                  margin: 0,
                  fontSize: 15,
                  color: GRAY_600,
                  lineHeight: 1.7,
                  borderLeft: `3px solid ${PRIMARY}`,
                  paddingLeft: 16,
                }}>
                  {report.summary.split("\n").map((para, i) => (
                    <p key={i} style={{ margin: i === 0 ? 0 : "12px 0 0 0" }}>{para}</p>
                  ))}
                </div>
              ) : (
                <div style={{ background: GRAY_100, borderRadius: 8, padding: "12px 16px" }}>
                  <p style={{ margin: 0, fontSize: 14, color: GRAY_400 }}>
                    {reportGenerating ? "Sam is preparing your feedback..." : "Waiting for Sam's feedback\u2026"}
                  </p>
                </div>
              )}
            </div>

            {/* Teacher Messages — prominent section */}
            {teacherMessages.length > 0 && (
              <>
                <h2 style={{ margin: "8px 0 16px 0", fontSize: 18, fontWeight: 600, color: GRAY_900 }}>
                  <><SectionIcon name="teacher" color="#5c8f6a" size={18} />From Your Teacher</>
                </h2>
                {teacherMessages.map((fb) => (
                  <div key={fb.id} style={{
                    ...cardStyles,
                    background: "rgba(92,143,106,0.04)",
                    borderColor: "rgba(92,143,106,0.15)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ ...avatarStyles, background: "rgba(92,143,106,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: SUCCESS_GREEN }}>
                        {(fb.instructorName ?? "T").charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 15, color: GRAY_900 }}>{fb.instructorName ?? "Teacher"}</span>
                      {fb.createdAt && (
                        <span style={{ fontSize: 12, color: GRAY_400, marginLeft: "auto" }}>
                          {new Date(fb.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: 15,
                      color: GRAY_600,
                      lineHeight: 1.7,
                      borderLeft: `3px solid ${SUCCESS_GREEN}`,
                      paddingLeft: 16,
                    }}>{fb.body}</p>
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

function InfoCard({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
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
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: muted ? GRAY_400 : GRAY_900 }}>
        {value}
      </p>
    </div>
  );
}
