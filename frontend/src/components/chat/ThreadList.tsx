import { useState } from "react";
import ProgressCircle from "../ui/ProgressCircle";
import ProgressBar from "../ui/ProgressBar";
import DualProgressBar from "../ui/DualProgressBar";
import KnowledgeCircle from "../ui/KnowledgeCircle";
import { GRAY_900, GRAY_700, GRAY_500, PRIMARY, TRANSPARENT_PRIMARY, WHITE } from "../../theme/colors";
import type {
  ThreadWithProgress,
  UnitProgress,
  ObjectiveKind,
  KnowledgeQueueItem,
  KnowledgeProgress,
} from "../../types/domain";

const SKILL_SECTION_ORDER: ObjectiveKind[] = ["skill", "capstone"];

const SECTION_LABELS: Record<ObjectiveKind, string> = {
  knowledge: "Knowledge",
  skill: "Skills",
  capstone: "Capstone",
};

interface ThreadListProps {
  threads: ThreadWithProgress[];
  knowledgeItems?: KnowledgeQueueItem[];
  selectedThreadId?: string;
  selectedKnowledgeItemId?: string;
  onSelectThread: (threadId: string) => void;
  onSelectKnowledgeItem?: (itemId: string) => void;
  unitProgress?: UnitProgress;
  knowledgeProgress?: KnowledgeProgress;
}

export default function ThreadList({
  threads,
  knowledgeItems = [],
  selectedThreadId,
  selectedKnowledgeItemId,
  onSelectThread,
  onSelectKnowledgeItem,
  unitProgress,
  knowledgeProgress,
}: ThreadListProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    knowledge: false,
    skill: false,
    capstone: false,
  });

  const toggleSection = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const threadsByKind = (kind: ObjectiveKind) =>
    threads
      .filter((t) => t.kind === kind)
      .sort((a, b) => a.order - b.order);

  const hasKnowledge = knowledgeItems.length > 0;

  const containerStyles: React.CSSProperties = {
    width: 280,
    minWidth: 280,
    flexShrink: 0,
    backgroundColor: WHITE,
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  };

  const headerStyles: React.CSSProperties = {
    padding: "20px 16px 16px",
    borderBottom: "1px solid #e5e7eb",
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: GRAY_900,
  };

  const listStyles: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "8px 0",
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h3 style={titleStyles}>Questions</h3>
      </div>
      <div style={listStyles}>
        {hasKnowledge && (
          <KnowledgeSectionGroup
            items={knowledgeItems}
            isCollapsed={collapsed.knowledge}
            onToggle={() => toggleSection("knowledge")}
            selectedItemId={selectedKnowledgeItemId}
            onSelectItem={onSelectKnowledgeItem}
            knowledgeProgress={knowledgeProgress}
          />
        )}
        {SKILL_SECTION_ORDER.map((kind) => {
          const sectionThreads = threadsByKind(kind);
          if (sectionThreads.length === 0) return null;
          return (
            <SectionGroup
              key={kind}
              kind={kind}
              label={SECTION_LABELS[kind]}
              threads={sectionThreads}
              isCollapsed={collapsed[kind] ?? false}
              onToggle={() => toggleSection(kind)}
              selectedThreadId={selectedThreadId}
              onSelectThread={onSelectThread}
              unitProgress={kind === "skill" ? unitProgress : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============ Knowledge Section ============

interface KnowledgeSectionGroupProps {
  items: KnowledgeQueueItem[];
  isCollapsed: boolean;
  onToggle: () => void;
  selectedItemId?: string;
  onSelectItem?: (itemId: string) => void;
  knowledgeProgress?: KnowledgeProgress;
}

function KnowledgeSectionGroup({
  items,
  isCollapsed,
  onToggle,
  selectedItemId,
  onSelectItem,
  knowledgeProgress,
}: KnowledgeSectionGroupProps) {
  const sorted = [...items].sort((a, b) => a.order - b.order);

  const sectionHeaderStyles: React.CSSProperties = {
    padding: "12px 16px 0",
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

  const progressRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px 8px",
  };

  const progressCountStyles: React.CSSProperties = {
    fontSize: 11,
    color: GRAY_500,
    flexShrink: 0,
    minWidth: 28,
    textAlign: "right",
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
        Knowledge
      </div>
      {knowledgeProgress && (
        <div style={progressRowStyles}>
          <div style={{ flex: 1 }}>
            <DualProgressBar
              greenPercent={knowledgeProgress.correctPercent}
              greyPercent={knowledgeProgress.incorrectPercent}
              height={4}
            />
          </div>
          <span style={progressCountStyles}>
            {knowledgeProgress.correctCount}/{knowledgeProgress.totalTopics}
          </span>
        </div>
      )}
      {!isCollapsed &&
        sorted.map((item) => (
          <KnowledgeItem
            key={item.id}
            item={item}
            isSelected={item.id === selectedItemId}
            onSelect={() => onSelectItem?.(item.id)}
          />
        ))}
    </div>
  );
}

interface KnowledgeItemProps {
  item: KnowledgeQueueItem;
  isSelected: boolean;
  onSelect: () => void;
}

function KnowledgeItem({ item, isSelected, onSelect }: KnowledgeItemProps) {
  const rowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    cursor: "pointer",
    backgroundColor: isSelected ? TRANSPARENT_PRIMARY : "transparent",
    borderLeft: isSelected ? `3px solid ${PRIMARY}` : "3px solid transparent",
  };

  const labelStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    fontWeight: isSelected ? 600 : 500,
    color: GRAY_700,
  };

  return (
    <div
      style={rowStyles}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "#f9fafb";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span style={labelStyles}>Knowledge {item.labelIndex}</span>
      <KnowledgeCircle status={item.status} size={21} />
    </div>
  );
}

// ============ Skill / Capstone Sections ============

interface SectionGroupProps {
  kind: ObjectiveKind;
  label: string;
  threads: ThreadWithProgress[];
  isCollapsed: boolean;
  onToggle: () => void;
  selectedThreadId?: string;
  onSelectThread: (threadId: string) => void;
  unitProgress?: UnitProgress;
}

function SectionGroup({
  label,
  threads,
  isCollapsed,
  onToggle,
  selectedThreadId,
  onSelectThread,
  unitProgress,
}: SectionGroupProps) {
  const sectionHeaderStyles: React.CSSProperties = {
    padding: "12px 16px 0",
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

  const progressRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px 8px",
  };

  const progressCountStyles: React.CSSProperties = {
    fontSize: 11,
    color: GRAY_500,
    flexShrink: 0,
    minWidth: 28,
    textAlign: "right",
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
      {unitProgress && (
        <div style={progressRowStyles}>
          <div style={{ flex: 1 }}>
            <ProgressBar percent={unitProgress.progressPercent} height={4} />
          </div>
          <span style={progressCountStyles}>
            {unitProgress.completedObjectives}/{unitProgress.totalObjectives}
          </span>
        </div>
      )}
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
