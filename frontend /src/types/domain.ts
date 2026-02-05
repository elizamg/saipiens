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

// ============ Objective & Question Types ============

export type ObjectiveKind = "knowledge" | "skill";

/**
 * An Objective represents a Knowledge or Skill section within a Unit.
 * Each objective can have multiple questions at different difficulty levels.
 */
export interface Objective {
  id: string;
  unitId: string;
  kind: ObjectiveKind;
  title: string; // e.g., "Knowledge 1", "Skill 2"
}

export type DifficultyStars = 1 | 2 | 3;
export type EarnedStars = 0 | 1 | 2 | 3;

/**
 * A Question belongs to an Objective and has a specific difficulty.
 * Students progress through questions of increasing difficulty.
 */
export interface Question {
  id: string;
  objectiveId: string;
  difficultyStars: DifficultyStars;
  prompt: string;
}

/**
 * Tracks a student's progress on an Objective.
 * earnedStars = highest difficulty question answered correctly (0-3)
 * currentQuestionId = the question currently being worked on
 */
export interface StudentObjectiveProgress {
  studentId: string;
  objectiveId: string;
  earnedStars: EarnedStars;
  currentQuestionId: string;
  updatedAt: string;
}

// ============ Chat Types ============

/**
 * A ChatThread corresponds to one Objective (Knowledge/Skill section).
 * Contains conversation about the current question being worked on.
 */
export interface ChatThread {
  id: string;
  unitId: string;
  courseId: string;
  objectiveId: string;
  title: string; // mirrors objective.title
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
  isSystemMessage?: boolean; // e.g. "⭐⭐⭐ Excellent — 3 stars! Great work."
}

export interface ChatMessage {
  id: string;
  threadId: string;
  /** When set, message belongs to this question's scoped chat (1:1 per question). */
  questionId?: string;
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
  completedObjectives: number; // objectives with earnedStars === 3
  progressPercent: number;
}

export interface ThreadWithProgress extends ChatThread {
  earnedStars: EarnedStars;
  currentDifficultyStars: DifficultyStars;
  currentQuestionId: string;
}
