import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ThreadList from "../components/chat/ThreadList";
import MessageList from "../components/chat/MessageList";
import ChatComposer from "../components/chat/ChatComposer";
import {
  getCurrentStudent,
  getCourse,
  getUnit,
  getUnitProgress,
  listChatThreadsForUnit,
  listItemStages,
  getStage,
  listMessages,
  sendMessage,
  advanceStage,
} from "../services/api";
import { isStageCompleted, stageLabel } from "../utils/progress";
import { WHITE, GRAY_900, GRAY_500, GRAY_600, MAIN_GREEN, GRAY_300 } from "../theme/colors";
import type {
  Student,
  Course,
  Unit,
  ThreadWithProgress,
  ChatMessage,
  UnitProgress,
  ItemStage,
  EarnedStars,
  StageType,
} from "../types/domain";

/** Synthetic completion message appended when a stage is completed. */
function makeCompletionMessage(
  stageId: string,
  threadId: string,
  stageType: StageType,
  earnedStars: 1 | 2 | 3
): ChatMessage {
  const labels: Record<StageType, string> = {
    begin: "\u2b50 Begin complete",
    walkthrough: "\u2b50\u2b50 Walkthrough complete",
    challenge: "\u2b50\u2b50\u2b50 Challenge complete!",
  };
  return {
    id: `completion_${stageId}`,
    threadId,
    stageId,
    role: "tutor",
    content: labels[stageType],
    createdAt: new Date().toISOString(),
    metadata: { isSystemMessage: true, earnedStars, isCompletionMessage: true },
  };
}

/** Navigable stages are walkthrough and challenge (skip begin). */
const NAVIGABLE_STAGES: StageType[] = ["walkthrough", "challenge"];

export default function ChatPage() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [student, setStudent] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [threads, setThreads] = useState<ThreadWithProgress[]>([]);
  const [stagesByThread, setStagesByThread] = useState<Record<string, ItemStage[]>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unitProgress, setUnitProgress] = useState<UnitProgress | null>(null);
  const [currentStage, setCurrentStage] = useState<ItemStage | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedThreadId = searchParams.get("thread") || undefined;
  const selectedStageId = searchParams.get("stage") || undefined;
  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  const currentEarnedStars: EarnedStars = selectedThread?.earnedStars ?? 0;
  const currentStageCompleted = currentStage
    ? isStageCompleted(currentStage.stageType, currentEarnedStars)
    : false;

  // Determine what CTA to show after completion
  const nextStageTypeMap: Record<StageType, StageType | null> = {
    begin: "walkthrough",
    walkthrough: "challenge",
    challenge: null,
  };

  const hasNextStage = currentStage
    ? nextStageTypeMap[currentStage.stageType] !== null
    : false;

  // Navigation between walkthrough <-> challenge
  const navigableStages = useMemo(() => {
    if (!selectedThreadId) return [];
    const allStages = stagesByThread[selectedThreadId] ?? [];
    return allStages.filter((s) => NAVIGABLE_STAGES.includes(s.stageType));
  }, [selectedThreadId, stagesByThread]);

  const currentNavIndex = useMemo(() => {
    if (!currentStage) return -1;
    return navigableStages.findIndex((s) => s.id === currentStage.id);
  }, [currentStage, navigableStages]);

  // Can navigate back (challenge -> walkthrough) to review
  const canGoPrev = currentNavIndex > 0;
  // Can navigate forward (walkthrough -> challenge) only if walkthrough is completed
  const canGoNext = currentNavIndex >= 0
    && currentNavIndex < navigableStages.length - 1
    && currentStage != null
    && isStageCompleted(currentStage.stageType, currentEarnedStars);

  // Show arrows only when on walkthrough or challenge stages
  const showStageArrows = currentStage != null
    && NAVIGABLE_STAGES.includes(currentStage.stageType)
    && navigableStages.length > 1;

  // Load initial data
  useEffect(() => {
    async function loadData() {
      if (!courseId || !unitId) return;

      try {
        const studentData = await getCurrentStudent();
        setStudent(studentData);

        const [courseData, unitData, threadsData, progressData] = await Promise.all([
          getCourse(courseId),
          getUnit(unitId),
          listChatThreadsForUnit({ courseId, unitId, studentId: studentData.id }),
          getUnitProgress(studentData.id, unitId),
        ]);

        setCourse(courseData || null);
        setUnit(unitData || null);
        setThreads(threadsData);
        setUnitProgress(progressData);

        const threadParam = searchParams.get("thread");
        const stageParam = searchParams.get("stage");
        if (threadsData.length > 0) {
          if (!threadParam) {
            const first = threadsData[0];
            setSearchParams(
              { thread: first.id, ...(first.currentStageId ? { stage: first.currentStageId } : {}) },
              { replace: true }
            );
          } else if (threadParam && !stageParam) {
            const thread = threadsData.find((t) => t.id === threadParam);
            if (thread?.currentStageId) {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set("stage", thread.currentStageId);
                return next;
              }, { replace: true });
            }
          }
        }
      } catch (error) {
        console.error("Error loading chat data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [courseId, unitId]);

  // Load stages for each thread
  useEffect(() => {
    let cancelled = false;
    async function loadStages() {
      const next: Record<string, ItemStage[]> = {};
      for (const thread of threads) {
        const list = await listItemStages(thread.objectiveId);
        if (!cancelled) next[thread.id] = list;
      }
      if (!cancelled) setStagesByThread(next);
    }
    loadStages();
    return () => {
      cancelled = true;
    };
  }, [threads]);

  // Default stage when thread changes
  useEffect(() => {
    if (!selectedThreadId) return;
    const stageParam = searchParams.get("stage");
    const thread = threads.find((t) => t.id === selectedThreadId);
    if (!thread) return;

    const threadStages = stagesByThread[selectedThreadId] ?? [];
    if (stageParam && threadStages.some((s) => s.id === stageParam)) return;

    if (thread.currentStageId && thread.currentStageId !== stageParam) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("stage", thread.currentStageId);
        return next;
      }, { replace: true });
    }
  }, [selectedThreadId, stagesByThread, threads]);

  // Load messages and current stage when thread + stage change
  useEffect(() => {
    async function loadThreadData() {
      if (!selectedThreadId) {
        setMessages([]);
        setCurrentStage(null);
        return;
      }
      if (!selectedStageId) {
        setMessages([]);
        setCurrentStage(null);
        return;
      }

      try {
        const [messagesData, stageData] = await Promise.all([
          listMessages(selectedThreadId, selectedStageId),
          getStage(selectedStageId),
        ]);
        setMessages(messagesData);
        setCurrentStage(stageData || null);
      } catch (error) {
        console.error("Error loading thread data:", error);
      }
    }

    loadThreadData();
  }, [selectedThreadId, selectedStageId, threads]);

  const handleSelectThread = useCallback(
    (threadId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      const defaultStageId = thread?.currentStageId;
      if (defaultStageId) {
        setSearchParams({ thread: threadId, stage: defaultStageId }, { replace: true });
      } else {
        setSearchParams({ thread: threadId }, { replace: true });
      }
    },
    [threads, setSearchParams]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedThreadId || !selectedStageId || !student || !selectedThread || !currentStage) return;

      try {
        const newMessage = await sendMessage(selectedThreadId, content, selectedStageId);
        setMessages((prev) => [...prev, newMessage]);

        // Auto-advance for begin stage: first student message completes it
        if (currentStage.stageType === "begin" && !isStageCompleted("begin", currentEarnedStars)) {
          await advanceStage(student.id, selectedThread.objectiveId);

          const completionMsg = makeCompletionMessage(selectedStageId, selectedThreadId, "begin", 1);
          setMessages((prev) => [...prev, completionMsg]);

          if (courseId && unitId) {
            const [updatedThreads, updatedUnitProgress] = await Promise.all([
              listChatThreadsForUnit({ courseId, unitId, studentId: student.id }),
              getUnitProgress(student.id, unitId),
            ]);
            setThreads(updatedThreads);
            setUnitProgress(updatedUnitProgress);
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [selectedThreadId, selectedStageId, student, selectedThread, currentStage, currentEarnedStars, courseId, unitId]
  );

  const handleAdvanceToNextStage = useCallback(async () => {
    if (!selectedThread || !currentStage) return;

    const nextType = nextStageTypeMap[currentStage.stageType];
    if (!nextType) return;

    const threadStages = stagesByThread[selectedThread.id] ?? [];
    const nextStage = threadStages.find((s) => s.stageType === nextType);
    if (!nextStage) return;

    setSearchParams({ thread: selectedThread.id, stage: nextStage.id }, { replace: true });
  }, [selectedThread, currentStage, stagesByThread, setSearchParams]);

  const handlePrevStage = useCallback(() => {
    if (!canGoPrev || !selectedThreadId) return;
    const prevStage = navigableStages[currentNavIndex - 1];
    setSearchParams({ thread: selectedThreadId, stage: prevStage.id }, { replace: true });
  }, [canGoPrev, currentNavIndex, navigableStages, selectedThreadId, setSearchParams]);

  const handleNextStage = useCallback(() => {
    if (!canGoNext || !selectedThreadId) return;
    const nextStage = navigableStages[currentNavIndex + 1];
    setSearchParams({ thread: selectedThreadId, stage: nextStage.id }, { replace: true });
  }, [canGoNext, currentNavIndex, navigableStages, selectedThreadId, setSearchParams]);

  // Messages to display: real messages + optional synthetic completion for challenge
  const displayMessages = useMemo(() => {
    if (!currentStage || !selectedThreadId) return messages;
    if (!currentStageCompleted) return messages;
    if (currentStage.stageType !== "challenge") return messages;
    const hasCompletion = messages.some((m) => m.metadata?.isCompletionMessage === true);
    if (hasCompletion) return messages;
    return [...messages, makeCompletionMessage(currentStage.id, selectedThreadId, "challenge", 3)];
  }, [messages, currentStage, currentStageCompleted, selectedThreadId]);

  // ============ Styles ============

  const containerStyles: React.CSSProperties = {
    display: "flex",
    height: "100vh",
    backgroundColor: WHITE,
  };

  const mainStyles: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  };

  const headerStyles: React.CSSProperties = {
    padding: "16px 24px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: WHITE,
  };

  const breadcrumbRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    marginBottom: 8,
  };

  const breadcrumbStyles: React.CSSProperties = {
    fontSize: 13,
    color: GRAY_500,
  };

  const titleRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 16,
  };

  const titleWithNavStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: GRAY_900,
  };

  const navButtonStyles = (disabled: boolean): React.CSSProperties => ({
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${disabled ? GRAY_300 : GRAY_500}`,
    borderRadius: 8,
    backgroundColor: WHITE,
    color: disabled ? GRAY_300 : GRAY_900,
    cursor: disabled ? "not-allowed" : "pointer",
  });

  const stageIndicatorStyles: React.CSSProperties = {
    fontSize: 13,
    color: GRAY_500,
    fontWeight: 500,
  };

  const stageBadgeStyles: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: MAIN_GREEN,
    backgroundColor: "rgba(125, 186, 132, 0.15)",
    padding: "4px 10px",
    borderRadius: 12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const questionPromptStyles: React.CSSProperties = {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: "12px 16px",
    marginTop: 12,
  };

  const promptHeaderStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  };

  const promptLabelStyles: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: MAIN_GREEN,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const promptTextStyles: React.CSSProperties = {
    fontSize: 14,
    color: GRAY_600,
    lineHeight: 1.5,
    margin: 0,
  };

  const chatAreaStyles: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  };

  const ctaBarStyles: React.CSSProperties = {
    padding: "16px 24px",
    borderTop: `1px solid ${GRAY_300}`,
    backgroundColor: WHITE,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  };

  const ctaButtonStyles: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    backgroundColor: MAIN_GREEN,
    color: WHITE,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  };

  const completedLabelStyles: React.CSSProperties = {
    fontSize: 14,
    color: GRAY_500,
    fontWeight: 500,
  };

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <ThreadList
        threads={threads}
        selectedThreadId={selectedThreadId}
        onSelectThread={handleSelectThread}
        unitProgress={unitProgress || undefined}
      />
      <main style={mainStyles}>
        <header style={headerStyles}>
          <div style={breadcrumbRowStyles}>
            <span style={breadcrumbStyles}>
              {course?.title ?? ""}
              {course && unit ? " / " : ""}
              {unit?.title ?? ""}
            </span>
          </div>
          <div style={titleRowStyles}>
            <div style={titleWithNavStyles}>
              {showStageArrows && (
                <button
                  type="button"
                  style={navButtonStyles(!canGoPrev)}
                  onClick={handlePrevStage}
                  disabled={!canGoPrev}
                  aria-label="Previous stage"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}
              <h1 style={titleStyles}>
                {selectedThread ? selectedThread.title : "Select an item"}
              </h1>
              {showStageArrows && (
                <button
                  type="button"
                  style={navButtonStyles(!canGoNext)}
                  onClick={handleNextStage}
                  disabled={!canGoNext}
                  aria-label="Next stage"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {showStageArrows && (
                <span style={stageIndicatorStyles}>
                  {currentNavIndex + 1} / {navigableStages.length}
                </span>
              )}
              {currentStage && (
                <span style={stageBadgeStyles}>
                  {stageLabel(currentStage.stageType)}
                </span>
              )}
            </div>
          </div>
          {currentStage && (
            <div style={questionPromptStyles}>
              <div style={promptHeaderStyles}>
                <span style={promptLabelStyles}>
                  Current Question
                </span>
              </div>
              <p style={promptTextStyles}>{currentStage.prompt}</p>
            </div>
          )}
        </header>
        <div style={chatAreaStyles}>
          <MessageList messages={displayMessages} />
          {currentStageCompleted && (
            <div style={ctaBarStyles}>
              {hasNextStage ? (
                <button
                  type="button"
                  style={ctaButtonStyles}
                  onClick={handleAdvanceToNextStage}
                >
                  {currentStage?.stageType === "begin"
                    ? "Start Walkthrough \u2192"
                    : "Start Challenge \u2192"}
                </button>
              ) : (
                <span style={completedLabelStyles}>Completed</span>
              )}
            </div>
          )}
          <ChatComposer
            onSend={handleSendMessage}
            disabled={!selectedThreadId || !selectedStageId || currentStageCompleted}
            placeholder={currentStageCompleted ? "Stage completed" : undefined}
          />
        </div>
      </main>
    </div>
  );
}
