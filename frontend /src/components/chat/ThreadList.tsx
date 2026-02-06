import RatingStars from "../ui/RatingStars";
import ProgressBar from "../ui/ProgressBar";
import { GRAY_900, GRAY_500, MAIN_GREEN, TRANSPARENT_GREEN, WHITE } from "../../theme/colors";
import type {
  ThreadWithProgress,
  UnitProgress,
  Question,
  StudentObjectiveProgress,
} from "../../types/domain";

interface ThreadListProps {
  threads: ThreadWithProgress[];
  questionsByThread: Record<string, Question[]>;
  progressMap: Record<string, StudentObjectiveProgress>;
  selectedThreadId?: string;
  selectedQuestionId?: string;
  onSelectThread: (threadId: string) => void;
  onSelectQuestion: (threadId: string, questionId: string) => void;
  unitProgress?: UnitProgress;
}

export default function ThreadList({
  threads,
  questionsByThread,
  progressMap,
  selectedThreadId,
  selectedQuestionId,
  onSelectThread,
  onSelectQuestion,
  unitProgress,
}: ThreadListProps) {
  const containerStyles: React.CSSProperties = {
    width: 280,
    backgroundColor: WHITE,
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  };

  const headerStyles: React.CSSProperties = {
    padding: "20px 16px",
    borderBottom: "1px solid #e5e7eb",
  };

  const headerTopStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: unitProgress ? 12 : 0,
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: GRAY_900,
  };

  const progressLabelStyles: React.CSSProperties = {
    fontSize: 12,
    color: GRAY_500,
  };

  const listStyles: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "8px 0",
  };

  const inProgressThreads = threads.filter((t) => t.earnedStars > 0 && t.earnedStars < 3);
  const todoThreads = threads.filter((t) => t.earnedStars === 0);
  const completedThreads = threads.filter((t) => t.earnedStars === 3);

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={headerTopStyles}>
          <h3 style={titleStyles}>Questions</h3>
          {unitProgress && (
            <span style={progressLabelStyles}>
              {unitProgress.completedObjectives}/{unitProgress.totalObjectives}
            </span>
          )}
        </div>
        {unitProgress && (
          <ProgressBar percent={unitProgress.progressPercent} height={4} />
        )}
      </div>
      <div style={listStyles}>
        {inProgressThreads.length > 0 && (
          <ThreadGroup
            label="In progress"
            threads={inProgressThreads}
            selectedThreadId={selectedThreadId}
            onSelectThread={onSelectThread}
          />
        )}
        {todoThreads.length > 0 && (
          <ThreadGroup
            label="Todo"
            threads={todoThreads}
            selectedThreadId={selectedThreadId}
            onSelectThread={onSelectThread}
          />
        )}
        {completedThreads.length > 0 && (
          <ThreadGroup
            label="Completed"
            threads={completedThreads}
            selectedThreadId={selectedThreadId}
            onSelectThread={onSelectThread}
          />
        )}
      </div>
    </div>
  );
}

interface ThreadGroupProps {
  label: string;
  threads: ThreadWithProgress[];
  selectedThreadId?: string;
  onSelectThread: (threadId: string) => void;
}

function ThreadGroup({
  label,
  threads,
  selectedThreadId,
  onSelectThread,
}: ThreadGroupProps) {
  const groupLabelStyles: React.CSSProperties = {
    padding: "12px 16px 8px",
    fontSize: 12,
    fontWeight: 600,
    color: GRAY_500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  return (
    <div>
      <div style={groupLabelStyles}>{label}</div>
      {threads.map((thread) => (
        <ThreadItem
          key={thread.id}
          thread={thread}
          isThreadSelected={thread.id === selectedThreadId}
          onSelectThread={() => onSelectThread(thread.id)}
        />
      ))}
    </div>
  );
}

interface ThreadItemProps {
  thread: ThreadWithProgress;
  isThreadSelected: boolean;
  onSelectThread: () => void;
}

function ThreadItem({
  thread,
  isThreadSelected,
  onSelectThread,
}: ThreadItemProps) {
  const threadRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    cursor: "pointer",
    backgroundColor: isThreadSelected ? TRANSPARENT_GREEN : "transparent",
    borderLeft: isThreadSelected ? `3px solid ${MAIN_GREEN}` : "3px solid transparent",
  };

  const threadTitleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    fontWeight: isThreadSelected ? 600 : 500,
    color: GRAY_900,
  };

  return (
    <div
      style={threadRowStyles}
      onClick={onSelectThread}
      onMouseEnter={(e) => {
        if (!isThreadSelected) e.currentTarget.style.backgroundColor = "#f9fafb";
      }}
      onMouseLeave={(e) => {
        if (!isThreadSelected) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span style={threadTitleStyles}>{thread.title}</span>
      <RatingStars rating={thread.earnedStars} size={14} />
    </div>
  );
}
