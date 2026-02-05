import RatingStars from "../ui/RatingStars";
import ProgressBar from "../ui/ProgressBar";
import { getQuestionEarnedStars } from "../../utils/progress";
import { GRAY_900, GRAY_500, MAIN_GREEN, TRANSPARENT_GREEN, WHITE } from "../../theme/colors";
import type {
  ThreadWithProgress,
  UnitProgress,
  Question,
  StudentObjectiveProgress,
  EarnedStars,
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

  const knowledgeThreads = threads.filter((t) => t.kind === "knowledge");
  const skillThreads = threads.filter((t) => t.kind === "skill");

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
        {knowledgeThreads.length > 0 && (
          <ThreadGroup
            label="Knowledge"
            threads={knowledgeThreads}
            questionsByThread={questionsByThread}
            progressMap={progressMap}
            selectedThreadId={selectedThreadId}
            selectedQuestionId={selectedQuestionId}
            onSelectThread={onSelectThread}
            onSelectQuestion={onSelectQuestion}
          />
        )}
        {skillThreads.length > 0 && (
          <ThreadGroup
            label="Skill"
            threads={skillThreads}
            questionsByThread={questionsByThread}
            progressMap={progressMap}
            selectedThreadId={selectedThreadId}
            selectedQuestionId={selectedQuestionId}
            onSelectThread={onSelectThread}
            onSelectQuestion={onSelectQuestion}
          />
        )}
      </div>
    </div>
  );
}

interface ThreadGroupProps {
  label: string;
  threads: ThreadWithProgress[];
  questionsByThread: Record<string, Question[]>;
  progressMap: Record<string, StudentObjectiveProgress>;
  selectedThreadId?: string;
  selectedQuestionId?: string;
  onSelectThread: (threadId: string) => void;
  onSelectQuestion: (threadId: string, questionId: string) => void;
}

function ThreadGroup({
  label,
  threads,
  questionsByThread,
  progressMap,
  selectedThreadId,
  selectedQuestionId,
  onSelectThread,
  onSelectQuestion,
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
      {threads.map((thread) => {
        const questions = questionsByThread[thread.id] ?? [];
        return (
          <ThreadItem
            key={thread.id}
            thread={thread}
            questions={questions}
            progressMap={progressMap}
            isThreadSelected={thread.id === selectedThreadId}
            selectedQuestionId={selectedQuestionId}
            onSelectThread={() => onSelectThread(thread.id)}
            onSelectQuestion={(questionId) => onSelectQuestion(thread.id, questionId)}
          />
        );
      })}
    </div>
  );
}

interface ThreadItemProps {
  thread: ThreadWithProgress;
  questions: Question[];
  progressMap: Record<string, StudentObjectiveProgress>;
  isThreadSelected: boolean;
  selectedQuestionId?: string;
  onSelectThread: () => void;
  onSelectQuestion: (questionId: string) => void;
}

function ThreadItem({
  thread,
  questions,
  progressMap,
  isThreadSelected,
  selectedQuestionId,
  onSelectThread,
  onSelectQuestion,
}: ThreadItemProps) {
  const threadRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px 6px",
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

  const questionListStyles: React.CSSProperties = {
    paddingLeft: 12,
    paddingBottom: 4,
  };

  return (
    <div>
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
      <div style={questionListStyles}>
        {questions.map((q) => (
          <QuestionItem
            key={q.id}
            question={q}
            earnedStars={getQuestionEarnedStars(q, progressMap)}
            isSelected={q.id === selectedQuestionId}
            onClick={() => onSelectQuestion(q.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface QuestionItemProps {
  question: Question;
  earnedStars: EarnedStars;
  isSelected: boolean;
  onClick: () => void;
}

function QuestionItem({ question, earnedStars, isSelected, onClick }: QuestionItemProps) {
  const itemStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 12px 6px 16px",
    cursor: "pointer",
    backgroundColor: isSelected ? TRANSPARENT_GREEN : "transparent",
    borderRadius: 6,
    marginLeft: 4,
    borderLeft: isSelected ? `2px solid ${MAIN_GREEN}` : "2px solid transparent",
  };

  const labelStyles: React.CSSProperties = {
    fontSize: 13,
    fontWeight: isSelected ? 600 : 400,
    color: GRAY_900,
  };

  return (
    <div
      style={itemStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "#f9fafb";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span style={labelStyles}>{question.difficultyStars}-star</span>
      <RatingStars rating={earnedStars} size={12} />
    </div>
  );
}
