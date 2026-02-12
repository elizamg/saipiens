import {
  students,
  instructors,
  courses,
  units,
  awards,
  feedbackItems,
  objectives,
  itemStages,
  studentObjectiveProgress,
  chatThreads,
  chatMessages,
  studentAwards,
} from "../mock/db";
import type {
  Student,
  Instructor,
  Course,
  Unit,
  Award,
  FeedbackItem,
  Objective,
  ItemStage,
  StudentObjectiveProgress as ProgressType,
  ChatThread,
  ChatMessage,
  ThreadWithProgress,
  UnitProgress,
  StageType,
  EarnedStars,
} from "../types/domain";
import { computeUnitProgress, buildProgressMap, getEarnedStars } from "../utils/progress";

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============ STUDENT ============

export async function getCurrentStudent(): Promise<Student> {
  await delay(50);
  const student = students[0];
  if (!student) {
    throw new Error("No student found");
  }
  return student;
}

// ============ COURSES ============

export async function listCoursesForStudent(studentId: string): Promise<Course[]> {
  await delay(50);
  return courses.filter((course) =>
    course.enrolledStudentIds.includes(studentId)
  );
}

export async function getCourse(courseId: string): Promise<Course | undefined> {
  await delay(50);
  return courses.find((course) => course.id === courseId);
}

// ============ INSTRUCTORS ============

export async function listInstructors(ids: string[]): Promise<Instructor[]> {
  await delay(50);
  return instructors.filter((instructor) => ids.includes(instructor.id));
}

// ============ UNITS ============

export async function listUnits(courseId: string): Promise<Unit[]> {
  await delay(50);
  return units.filter((unit) => unit.courseId === courseId);
}

export async function getUnit(unitId: string): Promise<Unit | undefined> {
  await delay(50);
  return units.find((unit) => unit.id === unitId);
}

// ============ OBJECTIVES (SIDEBAR ITEMS) ============

export async function listObjectives(unitId: string): Promise<Objective[]> {
  await delay(50);
  return objectives.filter((obj) => obj.unitId === unitId);
}

export async function getObjective(objectiveId: string): Promise<Objective | undefined> {
  await delay(50);
  return objectives.find((obj) => obj.id === objectiveId);
}

// ============ ITEM STAGES ============

export async function listItemStages(itemId: string): Promise<ItemStage[]> {
  await delay(50);
  return itemStages
    .filter((s) => s.itemId === itemId)
    .sort((a, b) => a.order - b.order);
}

export async function getStage(stageId: string): Promise<ItemStage | undefined> {
  await delay(50);
  return itemStages.find((s) => s.id === stageId);
}

// ============ STUDENT PROGRESS ============

export async function getStudentObjectiveProgress(
  studentId: string,
  objectiveId: string
): Promise<ProgressType | undefined> {
  await delay(50);
  return studentObjectiveProgress.find(
    (p) => p.studentId === studentId && p.objectiveId === objectiveId
  );
}

export async function listStudentProgressForUnit(
  studentId: string,
  unitId: string
): Promise<ProgressType[]> {
  await delay(50);
  const unitObjectiveIds = objectives
    .filter((obj) => obj.unitId === unitId)
    .map((obj) => obj.id);
  return studentObjectiveProgress.filter(
    (p) => p.studentId === studentId && unitObjectiveIds.includes(p.objectiveId)
  );
}

export async function getUnitProgress(
  studentId: string,
  unitId: string
): Promise<UnitProgress> {
  await delay(50);
  const unitObjectives = objectives.filter((obj) => obj.unitId === unitId);
  const progressList = studentObjectiveProgress.filter(
    (p) => p.studentId === studentId && unitObjectives.some((obj) => obj.id === p.objectiveId)
  );
  const progressMap = buildProgressMap(progressList);
  return computeUnitProgress(unitId, unitObjectives, progressMap);
}

/**
 * Advance a student's progress on an objective to the next stage.
 * Increments earnedStars and moves currentStageType forward.
 */
export async function advanceStage(
  studentId: string,
  itemId: string
): Promise<ProgressType> {
  await delay(100);

  const NEXT_STAGE: Record<StageType, StageType | null> = {
    begin: "walkthrough",
    walkthrough: "challenge",
    challenge: null,
  };

  const STAGE_STARS: Record<StageType, EarnedStars> = {
    begin: 1,
    walkthrough: 2,
    challenge: 3,
  };

  const idx = studentObjectiveProgress.findIndex(
    (p) => p.studentId === studentId && p.objectiveId === itemId
  );

  if (idx === -1) {
    // Create initial progress (begin completed)
    const newProgress: ProgressType = {
      studentId,
      objectiveId: itemId,
      earnedStars: 1,
      currentStageType: "walkthrough",
      updatedAt: new Date().toISOString(),
    };
    studentObjectiveProgress.push(newProgress);
    return newProgress;
  }

  const current = studentObjectiveProgress[idx];
  const currentStars = STAGE_STARS[current.currentStageType];
  const next = NEXT_STAGE[current.currentStageType];

  // Award stars for completing current stage
  const updatedStars = Math.max(current.earnedStars, currentStars) as EarnedStars;

  const updated: ProgressType = {
    ...current,
    earnedStars: updatedStars,
    currentStageType: next ?? current.currentStageType,
    updatedAt: new Date().toISOString(),
  };

  studentObjectiveProgress[idx] = updated;
  return updated;
}

// ============ AWARDS ============

export async function listAwards(studentId: string): Promise<Award[]> {
  await delay(50);
  const awardIds = studentAwards[studentId] ?? [];
  return awards.filter((award) => awardIds.includes(award.id));
}

export async function listAwardsForCourse(studentId: string, courseId: string): Promise<Award[]> {
  await delay(50);
  const awardIds = studentAwards[studentId] ?? [];
  return awards.filter((award) => awardIds.includes(award.id) && award.courseId === courseId);
}

// ============ FEEDBACK ============

export async function listFeedback(studentId: string): Promise<FeedbackItem[]> {
  await delay(50);
  const studentCourses = courses.filter((course) =>
    course.enrolledStudentIds.includes(studentId)
  );
  const courseIds = studentCourses.map((c) => c.id);
  return feedbackItems.filter((fb) => courseIds.includes(fb.courseId));
}

export async function listFeedbackForCourse(courseId: string): Promise<FeedbackItem[]> {
  await delay(50);
  return feedbackItems.filter((fb) => fb.courseId === courseId);
}

// ============ CHAT THREADS ============

export async function listChatThreadsForUnit(params: {
  courseId: string;
  unitId: string;
  studentId: string;
}): Promise<ThreadWithProgress[]> {
  await delay(50);
  const unitThreads = chatThreads.filter(
    (thread) => thread.courseId === params.courseId && thread.unitId === params.unitId
  );

  const progressList = studentObjectiveProgress.filter(
    (p) => p.studentId === params.studentId
  );
  const progressMap = buildProgressMap(progressList);

  // Build objective order map
  const objectiveMap: Record<string, Objective> = {};
  objectives.forEach((obj) => {
    objectiveMap[obj.id] = obj;
  });

  // Build stage map for looking up current stage IDs
  const stagesByItem: Record<string, ItemStage[]> = {};
  itemStages.forEach((s) => {
    if (!stagesByItem[s.itemId]) stagesByItem[s.itemId] = [];
    stagesByItem[s.itemId].push(s);
  });

  const hasStudentMessages = (threadId: string) =>
    chatMessages.some((m) => m.threadId === threadId && m.role === "student");

  return unitThreads.map((thread) => {
    const progress = progressMap[thread.objectiveId];
    const objective = objectiveMap[thread.objectiveId];
    const rawStars = getEarnedStars(thread.objectiveId, progressMap);
    const earnedStars = hasStudentMessages(thread.id) ? rawStars : 0;

    const currentStageType: StageType = progress?.currentStageType ?? "begin";
    const stages = stagesByItem[thread.objectiveId] ?? [];
    const currentStage = stages.find((s) => s.stageType === currentStageType);

    return {
      ...thread,
      earnedStars,
      currentStageType,
      currentStageId: currentStage?.id ?? "",
      order: objective?.order ?? 0,
    };
  });
}

export async function getThread(threadId: string): Promise<ChatThread | undefined> {
  await delay(50);
  return chatThreads.find((thread) => thread.id === threadId);
}

export async function getThreadWithProgress(
  threadId: string,
  studentId: string
): Promise<ThreadWithProgress | undefined> {
  await delay(50);
  const thread = chatThreads.find((t) => t.id === threadId);
  if (!thread) return undefined;

  const progress = studentObjectiveProgress.find(
    (p) => p.studentId === studentId && p.objectiveId === thread.objectiveId
  );

  const objective = objectives.find((obj) => obj.id === thread.objectiveId);
  const rawStars = progress?.earnedStars ?? 0;
  const hasStudent = chatMessages.some(
    (m) => m.threadId === threadId && m.role === "student"
  );
  const earnedStars = hasStudent ? rawStars : 0;

  const currentStageType: StageType = progress?.currentStageType ?? "begin";
  const stages = itemStages.filter((s) => s.itemId === thread.objectiveId);
  const currentStage = stages.find((s) => s.stageType === currentStageType);

  return {
    ...thread,
    earnedStars,
    currentStageType,
    currentStageId: currentStage?.id ?? "",
    order: objective?.order ?? 0,
  };
}

// ============ CHAT MESSAGES ============

export async function listMessages(
  threadId: string,
  stageId?: string
): Promise<ChatMessage[]> {
  await delay(50);
  return chatMessages
    .filter(
      (msg) =>
        msg.threadId === threadId &&
        (stageId == null || msg.stageId === stageId)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function sendMessage(
  threadId: string,
  content: string,
  stageId?: string
): Promise<ChatMessage> {
  await delay(100);
  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    threadId,
    stageId,
    role: "student",
    content,
    createdAt: new Date().toISOString(),
  };
  chatMessages.push(newMessage);
  return newMessage;
}
