export interface Student {
  id: string;
  name: string;
  yearLabel: string;
  avatarUrl?: string;
}

export interface Instructor {
  id: string;
  name: string;
  avatarUrl?: string;
}

/** The AI tutor agent identity. */
export interface Agent {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Course {
  id: string;
  title: string;
  icon?: string;
  instructorIds: string[];
  enrolledStudentIds: string[];
}

export type UnitStatus = "active" | "completed" | "locked";

export interface Unit {
  id: string;
  courseId: string;
  title: string;
  status: UnitStatus;
}

export type AwardIconKey = "early" | "medium" | "owl";

export interface Award {
  id: string;
  courseId: string;
  title: string;
  subtitle: string;
  iconKey: AwardIconKey;
}

export type FeedbackSourceType = "teacher" | "sam";

export interface FeedbackItem {
  id: string;
  courseId: string;
  unitId: string;
  /** Display title for the feedback (e.g. unit name or short label). */
  title: string;
  body: string;
  ctaLabel?: string;
  /** Who gave the feedback: a teacher (with instructorId) or Sam (AI). */
  sourceType: FeedbackSourceType;
  /** Set when sourceType is "teacher". */
  instructorId?: string;
}

// ============ Objective (Sidebar Item) & Stage Types ============

export type ObjectiveKind = "knowledge" | "skill" | "capstone";

/**
 * An Objective represents a Knowledge, Skill, or Capstone item within a Unit.
 * Each objective has 3 stages: begin, walkthrough, challenge.
 */
export interface Objective {
  id: string;
  unitId: string;
  kind: ObjectiveKind;
  title: string;
  order: number;
  description?: string;
  enabled?: boolean;
}

export type StageType = "begin" | "walkthrough" | "challenge";

/**
 * 5-state progress model replacing the old 0-3 star system.
 */
export type ProgressState =
  | "not_started"
  | "walkthrough_started"
  | "walkthrough_complete"
  | "challenge_started"
  | "challenge_complete";

/**
 * An ItemStage is a sub-question within an Objective.
 * Each objective has exactly 3 stages: begin (1), walkthrough (2), challenge (3).
 * `suggestedQuestions` is only populated for walkthrough stages.
 */
export interface ItemStage {
  id: string;
  itemId: string;
  stageType: StageType;
  order: number;
  prompt: string;
  /** Backend-driven pill suggestions; only present on walkthrough stages. */
  suggestedQuestions?: string[];
}

/**
 * Tracks a student's progress on an Objective.
 * progressState maps to the 5-state circle indicator.
 * currentStageType: the stage currently being worked on.
 */
export interface StudentObjectiveProgress {
  studentId: string;
  objectiveId: string;
  progressState: ProgressState;
  currentStageType: StageType;
  updatedAt: string;
}

// ============ Chat Types ============

/**
 * A ChatThread corresponds to one Objective (Knowledge/Skill/Capstone item).
 */
export interface ChatThread {
  id: string;
  unitId: string;
  courseId: string;
  objectiveId: string;
  title: string;
  kind: ObjectiveKind;
  lastMessageAt: string;
}

export type MessageRole = "student" | "tutor";

export interface ChatMessageAttachment {
  type: "image" | "file";
  url: string;
  name?: string;
}

export interface ChatMessageMetadata {
  isFeedback?: boolean;
  isSystemMessage?: boolean;
  /** Progress state reached at this message. */
  progressState?: ProgressState;
  isCompletionMessage?: boolean;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  /** When set, message belongs to this stage's scoped chat. */
  stageId?: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  attachments?: ChatMessageAttachment[];
  metadata?: ChatMessageMetadata;
}

// ============ Computed/Helper Types ============

export interface UnitProgress {
  unitId: string;
  totalObjectives: number;
  completedObjectives: number;
  progressPercent: number;
}

export interface ThreadWithProgress extends ChatThread {
  progressState: ProgressState;
  currentStageType: StageType;
  currentStageId: string;
  order: number;
}
