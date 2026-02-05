import RatingStars from "../ui/RatingStars";
import ProgressBar from "../ui/ProgressBar";
import { GRAY_900, GRAY_500, MAIN_GREEN, TRANSPARENT_GREEN, WHITE } from "../../theme/colors";
import type { ThreadWithProgress, UnitProgress } from "../../types/domain";

interface ThreadListProps {
  threads: ThreadWithProgress[];
  selectedThreadId?: string;
  onSelectThread: (threadId: string) => void;
  unitProgress?: UnitProgress;
}

export default function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
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

  // Group threads by kind
  const knowledgeThreads = threads.filter((t) => t.kind === "knowledge");
  const skillThreads = threads.filter((t) => t.kind === "skill");

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={headerTopStyles}>
          <h3 style={titleStyles}>Threads</h3>
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
            selectedThreadId={selectedThreadId}
            onSelectThread={onSelectThread}
          />
        )}
        {skillThreads.length > 0 && (
          <ThreadGroup
            label="Skill"
            threads={skillThreads}
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
          isSelected={thread.id === selectedThreadId}
          onClick={() => onSelectThread(thread.id)}
        />
      ))}
    </div>
  );
}

interface ThreadItemProps {
  thread: ThreadWithProgress;
  isSelected: boolean;
  onClick: () => void;
}

function ThreadItem({ thread, isSelected, onClick }: ThreadItemProps) {
  const itemStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    cursor: "pointer",
    backgroundColor: isSelected ? TRANSPARENT_GREEN : "transparent",
    borderLeft: isSelected ? `3px solid ${MAIN_GREEN}` : "3px solid transparent",
    transition: "background-color 0.15s ease",
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    fontWeight: isSelected ? 600 : 400,
    color: GRAY_900,
  };

  return (
    <div
      style={itemStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "#f9fafb";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      <span style={titleStyles}>{thread.title}</span>
      <RatingStars rating={thread.earnedStars} size={14} />
    </div>
  );
}
