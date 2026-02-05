import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ThreadList from "../components/chat/ThreadList";
import MessageList from "../components/chat/MessageList";
import ChatComposer from "../components/chat/ChatComposer";
import DifficultyStars from "../components/ui/DifficultyStars";
import RatingStars from "../components/ui/RatingStars";
import {
  getCurrentStudent,
  getCourse,
  getUnit,
  getUnitProgress,
  listChatThreadsForUnit,
  getQuestion,
  listMessages,
  sendMessage,
} from "../services/api";
import { WHITE, GRAY_900, GRAY_500, GRAY_600, MAIN_GREEN } from "../theme/colors";
import type {
  Student,
  Course,
  Unit,
  ThreadWithProgress,
  ChatMessage,
  UnitProgress,
  Question,
} from "../types/domain";

export default function ChatPage() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [student, setStudent] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [threads, setThreads] = useState<ThreadWithProgress[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unitProgress, setUnitProgress] = useState<UnitProgress | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedThreadId = searchParams.get("thread") || undefined;
  const selectedThread = threads.find((t) => t.id === selectedThreadId);

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

        // Default to first thread if none specified
        if (!searchParams.get("thread") && threadsData.length > 0) {
          setSearchParams({ thread: threadsData[0].id }, { replace: true });
        }
      } catch (error) {
        console.error("Error loading chat data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [courseId, unitId]);

  // Load messages and current question when thread changes
  useEffect(() => {
    async function loadThreadData() {
      if (!selectedThreadId) {
        setMessages([]);
        setCurrentQuestion(null);
        return;
      }

      const thread = threads.find((t) => t.id === selectedThreadId);
      if (!thread) return;

      try {
        const [messagesData, questionData] = await Promise.all([
          listMessages(selectedThreadId),
          getQuestion(thread.currentQuestionId),
        ]);
        setMessages(messagesData);
        setCurrentQuestion(questionData || null);
      } catch (error) {
        console.error("Error loading thread data:", error);
      }
    }

    loadThreadData();
  }, [selectedThreadId, threads]);

  const handleSelectThread = useCallback(
    (threadId: string) => {
      setSearchParams({ thread: threadId }, { replace: true });
    },
    [setSearchParams]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedThreadId) return;

      try {
        const newMessage = await sendMessage(selectedThreadId, content);
        setMessages((prev) => [...prev, newMessage]);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [selectedThreadId]
  );

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
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: GRAY_900,
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
            <h1 style={titleStyles}>
              {selectedThread ? selectedThread.title : "Select a thread"}
            </h1>
          </div>
          {selectedThread && (
            <div style={starsRowStyles}>
              <div style={starsGroupStyles}>
                <span style={starsLabelStyles}>Progress:</span>
                <RatingStars rating={selectedThread.earnedStars} size={16} />
              </div>
              <div style={starsGroupStyles}>
                <span style={starsLabelStyles}>Current Question:</span>
                <DifficultyStars difficulty={selectedThread.currentDifficultyStars} size={16} label="" />
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
          <MessageList messages={messages} />
          <ChatComposer
            onSend={handleSendMessage}
            disabled={!selectedThreadId}
          />
        </div>
      </main>
    </div>
  );
}
