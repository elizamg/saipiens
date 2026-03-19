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
  createNewAttempt,
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

/** Synthetic "NEW ATTEMPT" action message rendered centered in the chat list. */
function makeNewAttemptMessage(stageId: string, threadId: string): ChatMessage {
  return {
    id: `new_attempt_${stageId}`,
    threadId,
    stageId,
    role: "tutor",
    content: "",
    createdAt: new Date().toISOString(),
    metadata: { isNewAttemptButton: true },
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
  const [usedSkillClarifyQuestions, setUsedSkillClarifyQuestions] = useState<Set<string>>(new Set());
  // Track which item IDs we've already loaded messages for (avoid double-load)
  const loadedMessageItemIds = useRef<Set<string>>(new Set());
  // Track skill threads we've already auto-advanced past begin (avoid double-fire)
  const autoAdvancedBeginThreadIds = useRef<Set<string>>(new Set());
  // For skill threads: tracks encountered navigable stage IDs in encounter order
  const [encounteredStageIds, setEncounteredStageIds] = useState<string[]>([]);
  // Tracks which thread's history has already been loaded (prevents duplicate fetches)
  const initializedHistoryForThread = useRef<string | null>(null);

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

  // isSkillThread must be computed early — used in navigation logic below
  const isSkillThread = selectedKnowledgeItemId == null && selectedThread?.kind === "skill";

  // All navigable stages for the selected thread in DB order
  const navigableStages = useMemo(() => {
    if (!selectedThreadId) return [];
    const allStages = stagesByThread[selectedThreadId] ?? [];
    return allStages.filter((s) => NAVIGABLE_STAGES.includes(s.stageType));
  }, [selectedThreadId, stagesByThread]);

  // For skill threads: stages shown in encounter order (challenge first, then whatever the student tries).
  // For other threads: DB order.
  const displayedNavStages = useMemo(() => {
    if (!isSkillThread) return navigableStages;
    return encounteredStageIds
      .map((id) => navigableStages.find((s) => s.id === id))
      .filter((s): s is ItemStage => s != null);
  }, [isSkillThread, encounteredStageIds, navigableStages]);

  const currentNavIndex = useMemo(() => {
    if (!currentStage) return -1;
    return displayedNavStages.findIndex((s) => s.id === currentStage.id);
  }, [currentStage, displayedNavStages]);

  const visibleAttemptCount = displayedNavStages.length;

  const canGoPrev = currentNavIndex > 0;
  // Skills: free navigation among encountered stages; others: gate forward on completion.
  const canGoNext = currentNavIndex >= 0
    && currentNavIndex < visibleAttemptCount - 1
    && (isSkillThread || (currentStage != null && isStageCompleted(currentStage.stageType, currentProgressState)));

  const showStageArrows = currentStage != null
    && NAVIGABLE_STAGES.includes(currentStage.stageType)
    && visibleAttemptCount > 1;

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

  // For skill threads stuck on begin stage, auto-advance to walkthrough silently
  useEffect(() => {
    if (!selectedThreadId || !student || !courseId || !unitId) return;
    const thread = threads.find((t) => t.id === selectedThreadId);
    if (!thread || thread.kind !== "skill" || thread.currentStageType !== "begin") return;
    if (autoAdvancedBeginThreadIds.current.has(selectedThreadId)) return;

    const threadStages = stagesByThread[selectedThreadId] ?? [];
    if (threadStages.length === 0) return; // stages not loaded yet

    const challengeStage = threadStages.find((s) => s.stageType === "challenge");
    if (!challengeStage) return;

    autoAdvancedBeginThreadIds.current.add(selectedThreadId);

    advanceStage(student.id, thread.objectiveId)
      .then(async () => {
        const [updatedThreads, updatedProgress] = await Promise.all([
          listChatThreadsForUnit({ courseId, unitId, studentId: student.id }),
          getUnitProgress(student.id, unitId),
        ]);
        setThreads(updatedThreads);
        setUnitProgress(updatedProgress);
        setSearchParams({ thread: selectedThreadId, stage: challengeStage.id }, { replace: true });
      })
      .catch((err) => console.error("Error auto-advancing begin stage:", err));
  }, [selectedThreadId, stagesByThread, threads, student, courseId, unitId]);

  // Reset encounter history and clarify state when the selected thread changes
  useEffect(() => {
    setEncounteredStageIds([]);
    initializedHistoryForThread.current = null;
  }, [selectedThreadId]);

  // Reset clarify state when the active stage changes
  useEffect(() => {
    setPendingClarify(false);
    setUsedSkillClarifyQuestions(new Set());
  }, [selectedStageId]);

  // Restore encounter history from backend when stages are available for a skill thread
  useEffect(() => {
    if (!isSkillThread || !selectedThreadId || navigableStages.length === 0) return;
    if (initializedHistoryForThread.current === selectedThreadId) return;
    initializedHistoryForThread.current = selectedThreadId;

    listMessages(selectedThreadId).then((allMessages) => {
      // Group messages by stageId, find which navigable stages have history
      const byStage = new Map<string, string>(); // stageId → earliest createdAt
      for (const msg of allMessages) {
        if (!msg.stageId) continue;
        const existing = byStage.get(msg.stageId);
        if (!existing || msg.createdAt < existing) {
          byStage.set(msg.stageId, msg.createdAt);
        }
      }
      const navigableIds = new Set(navigableStages.map((s) => s.id));
      const stagesWithHistory = [...byStage.entries()]
        .filter(([stageId]) => navigableIds.has(stageId))
        .sort((a, b) => a[1].localeCompare(b[1])) // sort by earliest message time
        .map(([stageId]) => stageId);

      if (stagesWithHistory.length > 0) {
        setEncounteredStageIds(stagesWithHistory);
      }
    }).catch(console.error);
  }, [isSkillThread, selectedThreadId, navigableStages]);

  // Add the current stage to encounter history when the student navigates to it
  useEffect(() => {
    if (!isSkillThread || !currentStage) return;
    if (!NAVIGABLE_STAGES.includes(currentStage.stageType)) return;
    setEncounteredStageIds((prev) => {
      if (prev.includes(currentStage.id)) return prev;
      return [...prev, currentStage.id];
    });
  }, [currentStage?.id, isSkillThread]);

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

  // Compute last graded category from raw messages (not displayMessages) to avoid circular dep
  const lastGradedCategory = useMemo(() => {
    if (!isSkillThread || currentStage?.stageType !== "challenge") return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "tutor" && !m.metadata?.isSystemMessage && m.metadata?.gradingCategory) {
        return m.metadata.gradingCategory;
      }
    }
    return null;
  }, [messages, isSkillThread, currentStage?.stageType]);

  // After an incorrect grade and before a new attempt, block graded submissions
  const showNewAttemptButton = lastGradedCategory === "incorrect" && !currentStageCompleted;

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedThreadId || !selectedStageId || !student || !selectedThread || !currentStage) return;

      // Clarify mode: forced when last grade was "incorrect", or when user clicked "Ask a question"
      const isClarifying = pendingClarify || showNewAttemptButton;
      setPendingClarify(false);

      // Show student message immediately, then typing indicator while waiting for Sam
      const tempId = `optimistic_${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        threadId: selectedThreadId,
        stageId: selectedStageId,
        role: "student",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setIsSending(true);
      try {
        const { studentMessage, tutorMessage } = await sendMessage(
          selectedThreadId,
          content,
          selectedStageId,
          currentStage.stageType,
          isClarifying || undefined,
        );
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempId);
          const next = [...filtered, studentMessage];
          if (tutorMessage) next.push(tutorMessage);
          return next;
        });
        // Optimistically mark this thread as having student messages so the
        // sidebar circle and grey bar update without waiting for a full thread refresh.
        setThreads((prev) =>
          prev.map((t) =>
            t.id === selectedThreadId ? { ...t, hasStudentMessages: true } : t
          )
        );
        if (isClarifying) {
          setUsedSkillClarifyQuestions((prev) => new Set([...prev, content]));
          return;
        }

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
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } finally {
        setIsSending(false);
      }
    },
    [selectedThreadId, selectedStageId, student, selectedThread, currentStage, currentProgressState, courseId, unitId, pendingClarify, showNewAttemptButton]
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
    const prevStage = displayedNavStages[currentNavIndex - 1];
    setSearchParams({ thread: selectedThreadId, stage: prevStage.id }, { replace: true });
  }, [canGoPrev, currentNavIndex, displayedNavStages, selectedThreadId, setSearchParams]);

  const handleNextStage = useCallback(() => {
    if (!canGoNext || !selectedThreadId) return;
    const nextStage = displayedNavStages[currentNavIndex + 1];
    setSearchParams({ thread: selectedThreadId, stage: nextStage.id }, { replace: true });
  }, [canGoNext, currentNavIndex, displayedNavStages, selectedThreadId, setSearchParams]);

  const handleNewAttempt = useCallback(async () => {
    if (!selectedThreadId || !selectedThread) return;
    try {
      const newStage = await createNewAttempt(selectedThreadId, "challenge");
      setStagesByThread((prev) => ({
        ...prev,
        [selectedThreadId]: [...(prev[selectedThreadId] ?? []), newStage],
      }));
      setEncounteredStageIds((prev) => [...prev, newStage.id]);
      setSearchParams({ thread: selectedThreadId, stage: newStage.id }, { replace: true });
    } catch (err) {
      console.error("Error creating new attempt:", err);
    }
  }, [selectedThreadId, selectedThread, setSearchParams]);

  const handleTryWalkthrough = useCallback(() => {
    if (!selectedThread) return;
    const threadStages = stagesByThread[selectedThread.id] ?? [];
    const walkthroughStage = threadStages.find((s) => s.stageType === "walkthrough");
    if (walkthroughStage) {
      setSearchParams({ thread: selectedThread.id, stage: walkthroughStage.id }, { replace: true });
    }
  }, [selectedThread, stagesByThread, setSearchParams]);

  const [pillText, setPillText] = useState("");

  const handlePillClick = useCallback((question: string) => {
    setPillText(question);
    setPendingClarify(true);
  }, []);

  const displayMessages = useMemo(() => {
    if (!currentStage || !selectedThreadId) return messages;
    if (currentStageCompleted) {
      // begin stage handles its own completion message inside handleSendMessage
      if (currentStage.stageType === "begin") return messages;
      const hasSystemCompletion = messages.some(
        (m) => m.metadata?.isSystemMessage === true && m.metadata?.isCompletionMessage === true
      );
      if (hasSystemCompletion) return messages;
      const progressState = stageTypeToProgressState(currentStage.stageType);
      return [...messages, makeCompletionMessage(currentStage.id, selectedThreadId, currentStage.stageType, progressState)];
    }
    if (showNewAttemptButton) {
      return [...messages, makeNewAttemptMessage(currentStage.id, selectedThreadId)];
    }
    return messages;
  }, [messages, currentStage, currentStageCompleted, selectedThreadId, showNewAttemptButton]);

  const skillNumber = isSkillThread && selectedThread ? selectedThread.order + 1 : 0;
  const attemptNumber = currentNavIndex >= 0 ? currentNavIndex + 1 : 0;

  const showCurrentQuestion = currentStage?.stageType === "challenge"
    || (isSkillThread && currentStage?.stageType === "walkthrough");

  // Pills for walkthrough AND challenge stages (challenge always shows "Ask a question")
  const suggestedQuestions =
    (currentStage?.stageType === "walkthrough" || currentStage?.stageType === "challenge")
    && !currentStageCompleted
      ? (currentStage.suggestedQuestions ?? []).filter((q) => !usedSkillClarifyQuestions.has(q))
      : [];

  // Show clarify pills for active challenge stages (whether or not there are specific suggestions)
  const showChallengePills = isSkillThread
    && currentStage?.stageType === "challenge"
    && !currentStageCompleted;

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

  const tryWalkthroughButtonStyles: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: 12,
    border: "none",
    backgroundColor: PRIMARY,
    color: WHITE,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
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
                  aria-label="Previous attempt"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}
              {isSkillThread ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <h1 style={titleStyles}>Skill {skillNumber}</h1>
                  {visibleAttemptCount > 0 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {displayedNavStages.map((s, i) => (
                        <div
                          key={s.id}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: i === currentNavIndex ? PRIMARY : "rgba(139, 122, 158, 0.25)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <h1 style={titleStyles}>
                  {isKnowledgeMode
                    ? `Knowledge ${selectedKnowledgeItem.labelIndex}`
                    : (selectedThread ? selectedThread.title : "Select an item")}
                </h1>
              )}
              {!isKnowledgeMode && showStageArrows && (
                <button
                  type="button"
                  style={navButtonStyles(!canGoNext)}
                  onClick={handleNextStage}
                  disabled={!canGoNext}
                  aria-label="Next attempt"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {!isKnowledgeMode && !isSkillThread && showStageArrows && (
                <span style={stageIndicatorStyles}>
                  {currentNavIndex + 1} / {navigableStages.length}
                </span>
              )}
              {isSkillThread && currentStage ? (
                currentStage.stageType === "challenge" ? (
                  <button
                    type="button"
                    style={tryWalkthroughButtonStyles}
                    onClick={handleTryWalkthrough}
                  >
                    TRY WALKTHROUGH
                  </button>
                ) : currentStage.stageType === "walkthrough" ? (
                  <span style={stageBadgeStyles}>WALKTHROUGH</span>
                ) : (
                  <span style={stageBadgeStyles}>{stageLabel(currentStage.stageType)}</span>
                )
              ) : (
                <span style={stageBadgeStyles}>
                  {isKnowledgeMode ? "Knowledge" : (currentStage ? stageLabel(currentStage.stageType) : "")}
                </span>
              )}
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
                <span style={promptLabelStyles}>
                  {isSkillThread && attemptNumber > 0
                    ? `${currentStage.stageType.toUpperCase()} ${skillNumber}.${attemptNumber}`
                    : "Current Question"}
                </span>
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
            <MessageList messages={displayMessages} agent={agentData ?? undefined} isSending={isSending} onNewAttempt={handleNewAttempt} />
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
            {/* Clarify pills: walkthrough has topic-specific suggestions; challenge always shows "Ask a question" */}
            {(showChallengePills || suggestedQuestions.length > 0) && (
              <div style={pillContainerStyles}>
                {showChallengePills && (
                  <button
                    type="button"
                    style={{ ...pillButtonStyles, fontStyle: "italic" }}
                    onClick={() => setPendingClarify(true)}
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
                )}
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
              placeholder={
                currentStageCompleted ? "Stage completed"
                : (pendingClarify || showNewAttemptButton) ? "Type your question..."
                : undefined
              }
              externalValue={pillText}
              onExternalValueConsumed={() => setPillText("")}
            />
          </div>
        )}
      </main>
    </div>
  );
}
