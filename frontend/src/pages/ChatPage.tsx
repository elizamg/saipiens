import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
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
  getAgent,
  getKnowledgeQueue,
  getKnowledgeProgress,
  completeKnowledgeAttempt,
  listKnowledgeMessages,
  sendKnowledgeMessage,
  clarifyKnowledgeQuestion,
} from "../services/api";
import { isStageCompleted, stageLabel, stageTypeToProgressState } from "../utils/progress";
import { WHITE, GRAY_900, GRAY_500, GRAY_600, PRIMARY, GRAY_300, SUCCESS_GREEN } from "../theme/colors";
import type {
  Student,
  Course,
  Unit,
  ThreadWithProgress,
  ChatMessage,
  UnitProgress,
  ItemStage,
  ProgressState,
  StageType,
  Agent,
  KnowledgeQueueItem,
  KnowledgeProgress,
} from "../types/domain";

/** Synthetic completion message appended when a stage is completed. */
function makeCompletionMessage(
  stageId: string,
  threadId: string,
  stageType: StageType,
  progressState: ProgressState
): ChatMessage {
  const labels: Record<StageType, string> = {
    begin: "Walkthrough started",
    walkthrough: "Walkthrough complete",
    challenge: "Challenge complete!",
  };
  return {
    id: `completion_${stageId}`,
    threadId,
    stageId,
    role: "tutor",
    content: labels[stageType],
    createdAt: new Date().toISOString(),
    metadata: { isSystemMessage: true, progressState, isCompletionMessage: true },
  };
}

/** Navigable stages are walkthrough and challenge (skip begin). */
const NAVIGABLE_STAGES: StageType[] = ["walkthrough", "challenge"];

export default function ChatPage() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [threads, setThreads] = useState<ThreadWithProgress[]>([]);
  const [stagesByThread, setStagesByThread] = useState<Record<string, ItemStage[]>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unitProgress, setUnitProgress] = useState<UnitProgress | null>(null);
  const [currentStage, setCurrentStage] = useState<ItemStage | null>(null);
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  // Knowledge state
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeQueueItem[]>([]);
  const [knowledgeProgress, setKnowledgeProgress] = useState<KnowledgeProgress | null>(null);
  const [knowledgeMessages, setKnowledgeMessages] = useState<Record<string, ChatMessage[]>>({});
  const [gradingInProgress, setGradingInProgress] = useState(false);
  const [gradedItemIds, setGradedItemIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [pendingClarify, setPendingClarify] = useState(false);
  const [usedClarifyQuestions, setUsedClarifyQuestions] = useState<Set<string>>(new Set());
  // Track which item IDs we've already loaded messages for (avoid double-load)
  const loadedMessageItemIds = useRef<Set<string>>(new Set());

  const selectedThreadId = searchParams.get("thread") || undefined;
  const selectedStageId = searchParams.get("stage") || undefined;
  const selectedKnowledgeItemId = searchParams.get("knowledge") || undefined;

  const selectedThread = threads.find((t) => t.id === selectedThreadId);
  const selectedKnowledgeItem = knowledgeItems.find((item) => item.id === selectedKnowledgeItemId);

  const currentProgressState: ProgressState = selectedThread?.progressState ?? "not_started";
  const currentStageCompleted = currentStage
    ? isStageCompleted(currentStage.stageType, currentProgressState)
    : false;

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

  const canGoPrev = currentNavIndex > 0;
  const canGoNext = currentNavIndex >= 0
    && currentNavIndex < navigableStages.length - 1
    && currentStage != null
    && isStageCompleted(currentStage.stageType, currentProgressState);

  const showStageArrows = currentStage != null
    && NAVIGABLE_STAGES.includes(currentStage.stageType)
    && navigableStages.length > 1;

  // Knowledge item derived state
  const currentKnowledgeMessages = selectedKnowledgeItemId
    ? (knowledgeMessages[selectedKnowledgeItemId] ?? [])
    : [];
  const knowledgeItemIsActive = selectedKnowledgeItem?.status === "active";
  const knowledgeItemIsGraded = selectedKnowledgeItemId
    ? gradedItemIds.has(selectedKnowledgeItemId)
    : false;
  const knowledgeComposerDisabled = !knowledgeItemIsActive || knowledgeItemIsGraded || gradingInProgress;

  // Suggested pills: shown while item is active and not yet graded, minus already-asked ones
  const knowledgeSuggestedQuestions =
    knowledgeItemIsActive && !knowledgeItemIsGraded
      ? (selectedKnowledgeItem?.suggestedQuestions ?? []).filter((q) => !usedClarifyQuestions.has(q))
      : [];

  // Load initial data
  useEffect(() => {
    async function loadData() {
      if (!courseId || !unitId) return;

      try {
        const [studentData, agentResult] = await Promise.all([
          getCurrentStudent(),
          getAgent(),
        ]);
        setStudent(studentData);
        setAgentData(agentResult);

        // Load sequentially to avoid 503 throttling from Lambda
        const courseData = await getCourse(courseId);
        const unitData = await getUnit(unitId);
        const threadsData = await listChatThreadsForUnit({ courseId, unitId, studentId: studentData.id });
        const progressData = await getUnitProgress(studentData.id, unitId);
        const kQueueData = await getKnowledgeQueue(unitId, studentData.id);
        const kProgressData = await getKnowledgeProgress(unitId, studentData.id);

        setCourse(courseData || null);
        setUnit(unitData || null);
        setThreads(threadsData);
        setUnitProgress(progressData);
        setKnowledgeItems(kQueueData);
        setKnowledgeProgress(kProgressData);

        const threadParam = searchParams.get("thread");
        const stageParam = searchParams.get("stage");
        const knowledgeParam = searchParams.get("knowledge");

        if (!threadParam && !knowledgeParam) {
          if (kQueueData.length > 0) {
            setSearchParams({ knowledge: kQueueData[0].id }, { replace: true });
          } else if (threadsData.length > 0) {
            const first = threadsData[0];
            setSearchParams(
              { thread: first.id, ...(first.currentStageId ? { stage: first.currentStageId } : {}) },
              { replace: true }
            );
          }
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
      } catch (error) {
        console.error("Error loading chat data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [courseId, unitId]);

  // Load pre-existing knowledge messages when a knowledge item is selected
  useEffect(() => {
    if (!selectedKnowledgeItemId) return;
    if (loadedMessageItemIds.current.has(selectedKnowledgeItemId)) return;
    loadedMessageItemIds.current.add(selectedKnowledgeItemId);

    listKnowledgeMessages(selectedKnowledgeItemId).then((msgs) => {
      if (msgs.length > 0) {
        setKnowledgeMessages((prev) => ({
          ...prev,
          [selectedKnowledgeItemId]: msgs,
        }));
      }
    });
  }, [selectedKnowledgeItemId]);

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

  const handleSelectKnowledgeItem = useCallback(
    (itemId: string) => {
      setSearchParams({ knowledge: itemId }, { replace: true });
    },
    [setSearchParams]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedThreadId || !selectedStageId || !student || !selectedThread || !currentStage) return;

      setIsSending(true);
      try {
        const { studentMessage, tutorMessage } = await sendMessage(
          selectedThreadId,
          content,
          selectedStageId,
          currentStage.stageType
        );
        setMessages((prev) => {
          const next = [...prev, studentMessage];
          if (tutorMessage) next.push(tutorMessage);
          return next;
        });

        if (currentStage.stageType === "begin" && !isStageCompleted("begin", currentProgressState)) {
          await advanceStage(student.id, selectedThread.objectiveId);

          const completionMsg = makeCompletionMessage(selectedStageId, selectedThreadId, "begin", "walkthrough_started");
          setMessages((prev) => [...prev, completionMsg]);

          if (courseId && unitId) {
            const [updatedThreads, updatedUnitProgress] = await Promise.all([
              listChatThreadsForUnit({ courseId, unitId, studentId: student.id }),
              getUnitProgress(student.id, unitId),
            ]);
            setThreads(updatedThreads);
            setUnitProgress(updatedUnitProgress);
          }
        } else if (tutorMessage?.metadata?.isCompletionMessage && courseId && unitId) {
          // Backend auto-advanced progress — re-fetch threads to pick up new progressState
          const [updatedThreads, updatedUnitProgress] = await Promise.all([
            listChatThreadsForUnit({ courseId, unitId, studentId: student.id }),
            getUnitProgress(student.id, unitId),
          ]);
          setThreads(updatedThreads);
          setUnitProgress(updatedUnitProgress);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsSending(false);
      }
    },
    [selectedThreadId, selectedStageId, student, selectedThread, currentStage, currentProgressState, courseId, unitId]
  );

  const handleSendKnowledgeMessage = useCallback(
    async (content: string) => {
      if (!selectedKnowledgeItemId || !selectedKnowledgeItem || !student || !unitId) return;
      if (!knowledgeItemIsActive || knowledgeItemIsGraded) return;

      // Check if this is a clarifying question (pill click or free-form "Ask a question")
      const isClarifying = pendingClarify;
      setPendingClarify(false);

      // Show the student's message immediately
      const studentMsg = await sendKnowledgeMessage(selectedKnowledgeItemId, "student", content);
      setKnowledgeMessages((prev) => ({
        ...prev,
        [selectedKnowledgeItemId]: [...(prev[selectedKnowledgeItemId] ?? []), studentMsg],
      }));

      if (isClarifying) {
        // Handle clarifying question — get tutor answer, no grading
        setIsSending(true);
        try {
          const { answer } = await clarifyKnowledgeQuestion(selectedKnowledgeItem.id, content);
          const tutorMsg = await sendKnowledgeMessage(selectedKnowledgeItem.id, "tutor", answer);
          setKnowledgeMessages((prev) => ({
            ...prev,
            [selectedKnowledgeItem.id]: [...(prev[selectedKnowledgeItem.id] ?? []), tutorMsg],
          }));
          setUsedClarifyQuestions((prev) => new Set([...prev, content]));
        } catch (error) {
          console.error("Error getting clarifying answer:", error);
        } finally {
          setIsSending(false);
        }
        return;
      }

      // Grade immediately
      setGradingInProgress(true);
      try {
        const { updatedItem, tutorFeedback } = await completeKnowledgeAttempt(
          unitId,
          student.id,
          selectedKnowledgeItem.id,
          content
        );

        setGradedItemIds((prev) => new Set([...prev, selectedKnowledgeItem.id]));

        // Show AI feedback as a tutor chat message
        try {
          const resultContent = tutorFeedback
            ?? (updatedItem.is_correct ? "Correct! Great work on this topic." : "Good try, we'll revisit this.");
          const resultMsg = await sendKnowledgeMessage(
            selectedKnowledgeItem.id,
            "tutor",
            resultContent
          );

          setKnowledgeMessages((prev) => ({
            ...prev,
            [selectedKnowledgeItem.id]: [...(prev[selectedKnowledgeItem.id] ?? []), resultMsg],
          }));
        } catch {
          // Result message display is non-critical
        }

        // Refresh queue + progress
        const [updatedQueue, kProgress] = await Promise.all([
          getKnowledgeQueue(unitId, student.id),
          getKnowledgeProgress(unitId, student.id),
        ]);
        setKnowledgeItems(updatedQueue);
        setKnowledgeProgress(kProgress);

        // Stay on current item — student clicks next in sidebar
      } catch (error) {
        console.error("Error grading knowledge item:", error);
      } finally {
        setGradingInProgress(false);
      }
    },
    [selectedKnowledgeItemId, selectedKnowledgeItem, student, unitId, knowledgeItemIsActive, knowledgeItemIsGraded, pendingClarify, setSearchParams]
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

  const [pillText, setPillText] = useState("");

  const handlePillClick = useCallback((question: string) => {
    setPillText(question);
    setPendingClarify(true);
  }, []);

  const displayMessages = useMemo(() => {
    if (!currentStage || !selectedThreadId) return messages;
    if (!currentStageCompleted) return messages;
    // begin stage handles its own completion message inside handleSendMessage
    if (currentStage.stageType === "begin") return messages;
    // Only deduplicate against system-generated completion banners (not AI tutor responses)
    const hasSystemCompletion = messages.some(
      (m) => m.metadata?.isSystemMessage === true && m.metadata?.isCompletionMessage === true
    );
    if (hasSystemCompletion) return messages;
    const progressState = stageTypeToProgressState(currentStage.stageType);
    return [...messages, makeCompletionMessage(currentStage.id, selectedThreadId, currentStage.stageType, progressState)];
  }, [messages, currentStage, currentStageCompleted, selectedThreadId]);

  const showCurrentQuestion = currentStage?.stageType === "challenge";

  const suggestedQuestions = currentStage?.stageType === "walkthrough" && !currentStageCompleted
    ? currentStage.suggestedQuestions ?? []
    : [];

  // ============ Styles ============

  const containerStyles: React.CSSProperties = {
    display: "flex",
    height: "100vh",
    backgroundColor: WHITE,
  };

  const mainStyles: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
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
    marginBottom: (showCurrentQuestion || selectedKnowledgeItem) ? 12 : 0,
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
    color: SUCCESS_GREEN,
    backgroundColor: "rgba(92, 143, 106, 0.18)",
    padding: "4px 10px",
    borderRadius: 12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const questionPromptStyles: React.CSSProperties = {
    backgroundColor: "rgba(139, 122, 158, 0.12)",
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
    color: PRIMARY,
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
    backgroundColor: PRIMARY,
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

  const pillContainerStyles: React.CSSProperties = {
    padding: "8px 24px",
    display: "flex",
    gap: 8,
    overflowX: "auto",
    flexShrink: 0,
  };

  const pillButtonStyles: React.CSSProperties = {
    padding: "6px 14px",
    borderRadius: 20,
    border: `1px solid ${GRAY_300}`,
    backgroundColor: "#f9fafb",
    color: GRAY_600,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    fontFamily: "inherit",
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

  const isKnowledgeMode = selectedKnowledgeItem != null;

  // Completion label for pre-graded items (already completed_correct/incorrect from mock)
  const preCompletedLabel = selectedKnowledgeItem?.status === "completed_correct"
    ? "Correct ✓"
    : "Good try, we'll revisit this.";

  return (
    <div style={containerStyles}>
      <ThreadList
        threads={threads}
        knowledgeItems={knowledgeItems}
        selectedThreadId={isKnowledgeMode ? undefined : selectedThreadId}
        selectedKnowledgeItemId={selectedKnowledgeItemId}
        onSelectThread={handleSelectThread}
        onSelectKnowledgeItem={handleSelectKnowledgeItem}
        onBack={() => (courseId ? navigate(`/course/${courseId}`) : navigate(-1))}
        unitProgress={unitProgress || undefined}
        knowledgeProgress={knowledgeProgress || undefined}
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
              {!isKnowledgeMode && showStageArrows && (
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
                {isKnowledgeMode
                  ? `Knowledge ${selectedKnowledgeItem.labelIndex}`
                  : (selectedThread ? selectedThread.title : "Select an item")}
              </h1>
              {!isKnowledgeMode && showStageArrows && (
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
              {!isKnowledgeMode && showStageArrows && (
                <span style={stageIndicatorStyles}>
                  {currentNavIndex + 1} / {navigableStages.length}
                </span>
              )}
              <span style={stageBadgeStyles}>
                {isKnowledgeMode ? "Knowledge" : (currentStage ? stageLabel(currentStage.stageType) : "")}
              </span>
            </div>
          </div>
          {isKnowledgeMode ? (
            <div style={questionPromptStyles}>
              <div style={promptHeaderStyles}>
                <span style={promptLabelStyles}>Current Question</span>
              </div>
              <p style={promptTextStyles}>{selectedKnowledgeItem.questionPrompt}</p>
            </div>
          ) : showCurrentQuestion && currentStage ? (
            <div style={questionPromptStyles}>
              <div style={promptHeaderStyles}>
                <span style={promptLabelStyles}>Current Question</span>
              </div>
              <p style={promptTextStyles}>{currentStage.prompt}</p>
            </div>
          ) : null}
        </header>

        {isKnowledgeMode ? (
          // ── Knowledge item chat area ──
          <div style={chatAreaStyles}>
            <MessageList messages={currentKnowledgeMessages} agent={agentData ?? undefined} isSending={gradingInProgress || isSending} />
            {/* Graded status bar */}
            {knowledgeItemIsGraded && (
              <div style={ctaBarStyles}>
                <span style={completedLabelStyles}>
                  {selectedKnowledgeItem.is_correct ? "Correct ✓" : "Good try, we'll revisit this."}
                </span>
              </div>
            )}
            {/* Completion bar: pre-completed items loaded from mock */}
            {!knowledgeItemIsActive && !knowledgeItemIsGraded && (
              <div style={ctaBarStyles}>
                <span style={completedLabelStyles}>{preCompletedLabel}</span>
              </div>
            )}
            {/* Suggested question pills: shown for active empty chats */}
            {knowledgeSuggestedQuestions.length > 0 && (
              <div style={pillContainerStyles}>
                <button
                  type="button"
                  style={{ ...pillButtonStyles, fontStyle: "italic" }}
                  onClick={() => {
                    setPendingClarify(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(139, 122, 158, 0.1)";
                    e.currentTarget.style.borderColor = PRIMARY;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                    e.currentTarget.style.borderColor = GRAY_300;
                  }}
                >
                  Ask a question
                </button>
                {knowledgeSuggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    style={pillButtonStyles}
                    onClick={() => handlePillClick(q)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(139, 122, 158, 0.1)";
                      e.currentTarget.style.borderColor = PRIMARY;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                      e.currentTarget.style.borderColor = GRAY_300;
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <ChatComposer
              onSend={handleSendKnowledgeMessage}
              disabled={knowledgeComposerDisabled}
              placeholder={knowledgeItemIsGraded ? "Graded" : (!knowledgeItemIsActive ? "Completed" : pendingClarify ? "Type your question..." : undefined)}
              externalValue={pillText}
              onExternalValueConsumed={() => setPillText("")}
            />
          </div>
        ) : (
          // ── Thread (skill/capstone) chat area ──
          <div style={chatAreaStyles}>
            <MessageList messages={displayMessages} agent={agentData ?? undefined} isSending={isSending} />
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
            {suggestedQuestions.length > 0 && (
              <div style={pillContainerStyles}>
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    style={pillButtonStyles}
                    onClick={() => handlePillClick(q)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(139, 122, 158, 0.1)";
                      e.currentTarget.style.borderColor = PRIMARY;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                      e.currentTarget.style.borderColor = GRAY_300;
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <ChatComposer
              onSend={handleSendMessage}
              disabled={!selectedThreadId || !selectedStageId || currentStageCompleted || isSending}
              placeholder={currentStageCompleted ? "Stage completed" : undefined}
              externalValue={pillText}
              onExternalValueConsumed={() => setPillText("")}
            />
          </div>
        )}
      </main>
    </div>
  );
}
