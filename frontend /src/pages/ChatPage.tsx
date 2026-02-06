import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ThreadList from "../components/chat/ThreadList";
import MessageList from "../components/chat/MessageList";
import ChatComposer from "../components/chat/ChatComposer";
import DifficultyStars from "../components/ui/DifficultyStars";
import {
  getCurrentStudent,
  getCourse,
  getUnit,
  getUnitProgress,
  listChatThreadsForUnit,
  listQuestionsForObjective,
  getQuestion,
  listMessages,
  sendMessage,
} from "../services/api";
import { isQuestionCompleted } from "../utils/progress";
import { WHITE, GRAY_900, GRAY_500, GRAY_600, MAIN_GREEN, GRAY_300 } from "../theme/colors";
import type {
  Student,
  Course,
  Unit,
  ThreadWithProgress,
  ChatMessage,
  UnitProgress,
  Question,
  StudentObjectiveProgress,
} from "../types/domain";

const COMPLETION_MESSAGE_TEXT = "Excellent — Great work.";

/** Synthetic completion message appended when question is completed and not already in thread. */
function makeCompletionMessage(
  questionId: string,
  threadId: string,
  earnedStars: 1 | 2 | 3
): ChatMessage {
  return {
    id: `completion_${questionId}`,
    threadId,
    questionId,
    role: "tutor",
    content: COMPLETION_MESSAGE_TEXT,
    createdAt: new Date().toISOString(),
    metadata: { isSystemMessage: true, earnedStars, isCompletionMessage: true },
  };
}

export default function ChatPage() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [student, setStudent] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [threads, setThreads] = useState<ThreadWithProgress[]>([]);
  const [questionsByThread, setQuestionsByThread] = useState<Record<string, Question[]>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unitProgress, setUnitProgress] = useState<UnitProgress | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedThreadId = searchParams.get("thread") || undefined;
  const selectedQuestionId = searchParams.get("question") || undefined;
  const selectedThread = threads.find((t) => t.id === selectedThreadId);
  const questionsForThread = selectedThreadId ? questionsByThread[selectedThreadId] ?? [] : [];

  // Progress map from threads (objectiveId -> progress-like) for per-question earned stars
  const progressMap = useMemo((): Record<string, StudentObjectiveProgress> => {
    const map: Record<string, StudentObjectiveProgress> = {};
    threads.forEach((t) => {
      map[t.objectiveId] = {
        studentId: student?.id ?? "",
        objectiveId: t.objectiveId,
        earnedStars: t.earnedStars,
        currentQuestionId: t.currentQuestionId,
        updatedAt: "",
      };
    });
    return map;
  }, [threads, student?.id]);

  const currentQuestionIndex = useMemo(() => {
    if (!selectedQuestionId || questionsForThread.length === 0) return -1;
    return questionsForThread.findIndex((q) => q.id === selectedQuestionId);
  }, [selectedQuestionId, questionsForThread]);

  const currentQuestionCompleted = currentQuestion
    ? isQuestionCompleted(currentQuestion, progressMap)
    : false;
  const canGoNext = currentQuestionCompleted && currentQuestionIndex >= 0 && currentQuestionIndex < questionsForThread.length - 1;
  const canGoPrev = currentQuestionIndex > 0;
  const hasNextQuestion = currentQuestionIndex >= 0 && currentQuestionIndex < questionsForThread.length - 1;

  // Load initial data (threads, unit, course, progress)
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
        const questionParam = searchParams.get("question");
        if (threadsData.length > 0) {
          if (!threadParam) {
            const first = threadsData[0];
            const questions = await listQuestionsForObjective(first.objectiveId);
            const firstQuestionId = (first.currentQuestionId && questions.some((q) => q.id === first.currentQuestionId))
              ? first.currentQuestionId
              : questions[0]?.id;
            setSearchParams(
              { thread: first.id, ...(firstQuestionId ? { question: firstQuestionId } : {}) },
              { replace: true }
            );
          } else if (threadParam && !questionParam) {
            const thread = threadsData.find((t) => t.id === threadParam);
            if (thread) {
              const questions = await listQuestionsForObjective(thread.objectiveId);
              const defaultQuestionId = (thread.currentQuestionId && questions.some((q) => q.id === thread.currentQuestionId))
                ? thread.currentQuestionId
                : questions[0]?.id;
              if (defaultQuestionId) {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("question", defaultQuestionId);
                  return next;
                }, { replace: true });
              }
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

  // Load questions for each thread (so sidebar can show all questions)
  useEffect(() => {
    let cancelled = false;
    async function loadQuestions() {
      const next: Record<string, Question[]> = {};
      for (const thread of threads) {
        const list = await listQuestionsForObjective(thread.objectiveId);
        if (!cancelled) next[thread.id] = list;
      }
      if (!cancelled) setQuestionsByThread(next);
    }
    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, [threads]);

  // When thread changes, default question if missing
  useEffect(() => {
    if (!selectedThreadId || questionsForThread.length === 0) return;
    const questionParam = searchParams.get("question");
    if (questionParam && questionsForThread.some((q) => q.id === questionParam)) return;
    const thread = threads.find((t) => t.id === selectedThreadId);
    const defaultQuestionId = (thread?.currentQuestionId && questionsForThread.some((q) => q.id === thread.currentQuestionId))
      ? thread.currentQuestionId
      : questionsForThread[0]?.id;
    if (defaultQuestionId && defaultQuestionId !== questionParam) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("question", defaultQuestionId);
        return next;
      }, { replace: true });
    }
  }, [selectedThreadId, questionsForThread, threads]);

  // Load messages and current question when thread + question change
  useEffect(() => {
    async function loadThreadData() {
      if (!selectedThreadId) {
        setMessages([]);
        setCurrentQuestion(null);
        return;
      }
      if (!selectedQuestionId) {
        setMessages([]);
        setCurrentQuestion(null);
        return;
      }

      const thread = threads.find((t) => t.id === selectedThreadId);
      if (!thread) return;

      try {
        const [messagesData, questionData] = await Promise.all([
          listMessages(selectedThreadId, selectedQuestionId),
          getQuestion(selectedQuestionId),
        ]);
        setMessages(messagesData);
        setCurrentQuestion(questionData || null);
      } catch (error) {
        console.error("Error loading thread data:", error);
      }
    }

    loadThreadData();
  }, [selectedThreadId, selectedQuestionId, threads]);

  const handleSelectQuestion = useCallback(
    (threadId: string, questionId: string) => {
      setSearchParams({ thread: threadId, question: questionId }, { replace: true });
    },
    [setSearchParams]
  );

  const handleSelectThread = useCallback(
    (threadId: string) => {
      const qList = questionsByThread[threadId];
      const thread = threads.find((t) => t.id === threadId);
      const defaultQuestionId =
        thread?.currentQuestionId && qList?.some((q) => q.id === thread.currentQuestionId)
          ? thread.currentQuestionId
          : qList?.[0]?.id;
      if (defaultQuestionId) {
        setSearchParams({ thread: threadId, question: defaultQuestionId }, { replace: true });
      } else {
        setSearchParams({ thread: threadId }, { replace: true });
      }
    },
    [threads, questionsByThread, setSearchParams]
  );

  const handlePrevQuestion = useCallback(() => {
    if (!canGoPrev || questionsForThread.length === 0) return;
    const prevQuestion = questionsForThread[currentQuestionIndex - 1];
    setSearchParams({ thread: selectedThreadId!, question: prevQuestion.id }, { replace: true });
  }, [canGoPrev, currentQuestionIndex, questionsForThread, selectedThreadId, setSearchParams]);

  const handleNextQuestion = useCallback(() => {
    if (!canGoNext || questionsForThread.length === 0) return;
    const nextQuestion = questionsForThread[currentQuestionIndex + 1];
    setSearchParams({ thread: selectedThreadId!, question: nextQuestion.id }, { replace: true });
  }, [canGoNext, currentQuestionIndex, questionsForThread, selectedThreadId, setSearchParams]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedThreadId || !selectedQuestionId) return;

      try {
        const newMessage = await sendMessage(selectedThreadId, content, selectedQuestionId);
        setMessages((prev) => [...prev, newMessage]);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [selectedThreadId, selectedQuestionId]
  );

  // Messages to display: real messages + optional synthetic completion (only for 3-star; 1/2-star use mock tutor message)
  const displayMessages = useMemo(() => {
    if (!currentQuestion || !selectedThreadId) return messages;
    if (!currentQuestionCompleted) return messages;
    if (currentQuestion.difficultyStars !== 3) return messages;
    const hasCompletion = messages.some((m) => m.metadata?.isCompletionMessage === true);
    if (hasCompletion) return messages;
    return [...messages, makeCompletionMessage(currentQuestion.id, selectedThreadId, 3)];
  }, [messages, currentQuestion, currentQuestionCompleted, selectedThreadId]);

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

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: GRAY_900,
  };

  const navStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
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

  const questionIndicatorStyles: React.CSSProperties = {
    fontSize: 13,
    color: GRAY_500,
    fontWeight: 500,
  };

  const starsRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 24,
  };

  const starsGroupStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const starsLabelStyles: React.CSSProperties = {
    fontSize: 12,
    color: GRAY_500,
    fontWeight: 500,
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

  const nextQuestionCtaStyles: React.CSSProperties = {
    padding: "16px 24px",
    borderTop: `1px solid ${GRAY_300}`,
    backgroundColor: WHITE,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  };

  const nextQuestionButtonStyles: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    backgroundColor: MAIN_GREEN,
    color: WHITE,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  };

  const objectiveCompleteStyles: React.CSSProperties = {
    fontSize: 14,
    color: GRAY_500,
    fontWeight: 500,
  };

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <ThreadList
        threads={threads}
        questionsByThread={questionsByThread}
        progressMap={progressMap}
        selectedThreadId={selectedThreadId}
        selectedQuestionId={selectedQuestionId}
        onSelectThread={handleSelectThread}
        onSelectQuestion={handleSelectQuestion}
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
            <div style={navStyles}>
              <button
                type="button"
                style={navButtonStyles(!canGoPrev)}
                onClick={handlePrevQuestion}
                disabled={!canGoPrev}
                aria-label="Previous question"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <h1 style={titleStyles}>
                {selectedThread ? selectedThread.title : "Select a thread"}
              </h1>
              <button
                type="button"
                style={navButtonStyles(!canGoNext)}
                onClick={handleNextQuestion}
                disabled={!canGoNext}
                aria-label="Next question"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            {questionsForThread.length > 0 && selectedQuestionId && (
              <span style={questionIndicatorStyles}>
                Question {currentQuestionIndex + 1} / {questionsForThread.length}
              </span>
            )}
          </div>
          {selectedThread && currentQuestion && (
            <div style={starsRowStyles}>
              <div style={starsGroupStyles}>
                <span style={starsLabelStyles}>Difficulty:</span>
                <DifficultyStars difficulty={currentQuestion.difficultyStars} size={16} label="" />
              </div>
            </div>
          )}
          {currentQuestion && (
            <div style={questionPromptStyles}>
              <div style={promptHeaderStyles}>
                <span style={promptLabelStyles}>Current Question ({currentQuestion.difficultyStars}-star)</span>
              </div>
              <p style={promptTextStyles}>{currentQuestion.prompt}</p>
            </div>
          )}
        </header>
        <div style={chatAreaStyles}>
          <MessageList messages={displayMessages} />
          {currentQuestionCompleted && (
            <div style={nextQuestionCtaStyles}>
              {hasNextQuestion ? (
                <button
                  type="button"
                  style={nextQuestionButtonStyles}
                  onClick={handleNextQuestion}
                >
                  Next Question →
                </button>
              ) : (
                <span style={objectiveCompleteStyles}>Objective complete</span>
              )}
            </div>
          )}
          <ChatComposer
            onSend={handleSendMessage}
            disabled={!selectedThreadId || !selectedQuestionId || currentQuestionCompleted}
            placeholder={currentQuestionCompleted ? "Completed" : undefined}
          />
        </div>
      </main>
    </div>
  );
}
