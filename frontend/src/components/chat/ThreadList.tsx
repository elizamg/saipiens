import { useState } from "react";
import ProgressCircle from "../ui/ProgressCircle";
import ProgressBar from "../ui/ProgressBar";
import { GRAY_900, GRAY_500, PRIMARY, TRANSPARENT_PRIMARY, WHITE } from "../../theme/colors";
import type {
  ThreadWithProgress,
  UnitProgress,
  ObjectiveKind,
} from "../../types/domain";

interface ThreadListProps {
  threads: ThreadWithProgress[];
  selectedThreadId?: string;
  onSelectThread: (threadId: string) => void;
  unitProgress?: UnitProgress;
}

const SECTION_ORDER: ObjectiveKind[] = ["knowledge", "skill", "capstone"];

const SECTION_LABELS: Record<ObjectiveKind, string> = {
  knowledge: "Knowledge",
  skill: "Skills",
  capstone: "Capstone",
};

export default function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  unitProgress,
}: ThreadListProps) {
  const [collapsed, setCollapsed] = useState<Record<ObjectiveKind, boolean>>({
    knowledge: false,
    skill: false,
    capstone: false,
  });

  const toggleSection = (kind: ObjectiveKind) => {
    setCollapsed((prev) => ({ ...prev, [kind]: !prev[kind] }));
  };

  const threadsByKind = (kind: ObjectiveKind) =>
    threads
      .filter((t) => t.kind === kind)
      .sort((a, b) => a.order - b.order);

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
        {SECTION_ORDER.map((kind) => {
          const sectionThreads = threadsByKind(kind);
          if (sectionThreads.length === 0) return null;
          return (
            <SectionGroup
              key={kind}
              kind={kind}
              label={SECTION_LABELS[kind]}
              threads={sectionThreads}
              isCollapsed={collapsed[kind]}
              onToggle={() => toggleSection(kind)}
              selectedThreadId={selectedThreadId}
              onSelectThread={onSelectThread}
            />
          );
        })}
      </div>
    </div>
  );
}

interface SectionGroupProps {
  kind: ObjectiveKind;
  label: string;
  threads: ThreadWithProgress[];
  isCollapsed: boolean;
  onToggle: () => void;
  selectedThreadId?: string;
  onSelectThread: (threadId: string) => void;
}

function SectionGroup({
  label,
  threads,
  isCollapsed,
  onToggle,
  selectedThreadId,
  onSelectThread,
}: SectionGroupProps) {
  const sectionHeaderStyles: React.CSSProperties = {
    padding: "12px 16px 8px",
    fontSize: 12,
    fontWeight: 600,
    color: GRAY_500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    userSelect: "none",
  };

  const chevronStyles: React.CSSProperties = {
    transition: "transform 0.15s ease",
    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
  };

  return (
    <div>
      <div style={sectionHeaderStyles} onClick={onToggle}>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={chevronStyles}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {label}
      </div>
      {!isCollapsed &&
        threads.map((thread) => (
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
    backgroundColor: isThreadSelected ? TRANSPARENT_PRIMARY : "transparent",
    borderLeft: isThreadSelected ? `3px solid ${PRIMARY}` : "3px solid transparent",
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
      <ProgressCircle state={thread.progressState} size={21} />
    </div>
  );
}
