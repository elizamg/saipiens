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
  agent,
} from "../mock/db";
import {
  teacherObjectivesMap,
  teacherUnitsMap,
  teacherStudents,
  teacherCourses,
  sidebarCourses,
  courseRosterMap,
  mockInstructor,
} from "../data/teacherMockData";
import type { TeacherCourse } from "../data/teacherMockData";
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
  ProgressState,
  Agent,
} from "../types/domain";
import { computeUnitProgress, buildProgressMap, getProgressState } from "../utils/progress";

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============ AGENT ============

export async function getAgent(): Promise<Agent> {
  await delay(50);
  return agent;
}

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
 * Updates progressState and moves currentStageType forward.
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

  const STAGE_PROGRESS: Record<StageType, ProgressState> = {
    begin: "not_started",
    walkthrough: "walkthrough_complete",
    challenge: "challenge_complete",
  };

  const idx = studentObjectiveProgress.findIndex(
    (p) => p.studentId === studentId && p.objectiveId === itemId
  );

  if (idx === -1) {
    // Create initial progress (begin completed → move to walkthrough, but progress stays not_started
    // until student sends their first walkthrough message)
    const newProgress: ProgressType = {
      studentId,
      objectiveId: itemId,
      progressState: "not_started",
      currentStageType: "walkthrough",
      updatedAt: new Date().toISOString(),
    };
    studentObjectiveProgress.push(newProgress);
    return newProgress;
  }

  const current = studentObjectiveProgress[idx];
  const nextProgressState = STAGE_PROGRESS[current.currentStageType];
  const next = NEXT_STAGE[current.currentStageType];

  const updated: ProgressType = {
    ...current,
    progressState: nextProgressState,
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
    const objective = objectiveMap[thread.objectiveId];
    const rawProgressState = getProgressState(thread.objectiveId, progressMap);
    const progressState: ProgressState = hasStudentMessages(thread.id) ? rawProgressState : "not_started";

    const currentStageType: StageType = progressMap[thread.objectiveId]?.currentStageType ?? "begin";
    const stages = stagesByItem[thread.objectiveId] ?? [];
    const currentStage = stages.find((s) => s.stageType === currentStageType);

    return {
      ...thread,
      progressState,
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
  const rawProgressState = progress?.progressState ?? "not_started";
  const hasStudent = chatMessages.some(
    (m) => m.threadId === threadId && m.role === "student"
  );
  const progressState: ProgressState = hasStudent ? rawProgressState : "not_started";

  const currentStageType: StageType = progress?.currentStageType ?? "begin";
  const stages = itemStages.filter((s) => s.itemId === thread.objectiveId);
  const currentStage = stages.find((s) => s.stageType === currentStageType);

  return {
    ...thread,
    progressState,
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

  // Update progress when student sends first message in a new stage
  if (stageId) {
    const stage = itemStages.find((s) => s.id === stageId);
    const thread = chatThreads.find((t) => t.id === threadId);
    if (stage && thread) {
      const progressIdx = studentObjectiveProgress.findIndex(
        (p) => p.objectiveId === thread.objectiveId
      );
      if (progressIdx !== -1) {
        const progress = studentObjectiveProgress[progressIdx];
        if (stage.stageType === "walkthrough" && progress.progressState === "not_started") {
          studentObjectiveProgress[progressIdx] = {
            ...progress,
            progressState: "walkthrough_started",
            updatedAt: new Date().toISOString(),
          };
        } else if (stage.stageType === "challenge" && progress.progressState === "walkthrough_complete") {
          studentObjectiveProgress[progressIdx] = {
            ...progress,
            progressState: "challenge_started",
            updatedAt: new Date().toISOString(),
          };
        }
      }
    }
  }

  return newMessage;
}

// ============ TEACHER: OBJECTIVES ============

export async function listTeacherObjectives(unitId: string): Promise<Objective[]> {
  await delay(100);
  return teacherObjectivesMap[unitId] ?? [];
}

export async function updateObjectiveEnabled(
  objectiveId: string,
  enabled: boolean
): Promise<Objective> {
  await delay(100);
  for (const objs of Object.values(teacherObjectivesMap)) {
    const obj = objs.find((o) => o.id === objectiveId);
    if (obj) {
      obj.enabled = enabled;
      return { ...obj };
    }
  }
  throw new Error(`Objective ${objectiveId} not found`);
}

// ============ TEACHER: UNIT UPLOAD ============

export async function createUnitFromUpload(
  courseId: string,
  _files: File[]
): Promise<{ unit: Unit; objectives: Objective[] }> {
  // Simulate long-running LLM processing
  await delay(2500);

  const existingUnits = teacherUnitsMap[courseId] ?? [];
  const newUnitNum = existingUnits.length + 1;
  const newUnitId = `u${courseId}-${newUnitNum}`;

  const unit: Unit = {
    id: newUnitId,
    courseId,
    title: `Unit ${newUnitNum}: Uploaded Content`,
    status: "active",
  };

  const generatedObjectives: Objective[] = [
    { id: `${newUnitId}-o1`, unitId: newUnitId, kind: "knowledge", title: "Key Concepts Overview", description: "Identify and define the core concepts from the uploaded materials.", order: 1, enabled: true },
    { id: `${newUnitId}-o2`, unitId: newUnitId, kind: "knowledge", title: "Terminology and Definitions", description: "Master the essential vocabulary introduced in the documents.", order: 2, enabled: true },
    { id: `${newUnitId}-o3`, unitId: newUnitId, kind: "knowledge", title: "Historical Context", description: "Understand the background and context of the material.", order: 3, enabled: true },
    { id: `${newUnitId}-o4`, unitId: newUnitId, kind: "skill", title: "Critical Analysis", description: "Analyze arguments and evidence presented in the source materials.", order: 4, enabled: true },
    { id: `${newUnitId}-o5`, unitId: newUnitId, kind: "skill", title: "Synthesis and Connection", description: "Connect ideas across multiple documents to build understanding.", order: 5, enabled: true },
    { id: `${newUnitId}-o6`, unitId: newUnitId, kind: "capstone", title: "Comprehensive Assessment", description: "Demonstrate mastery by applying concepts to a novel scenario.", order: 6, enabled: true },
  ];

  if (!teacherUnitsMap[courseId]) {
    teacherUnitsMap[courseId] = [];
  }
  teacherUnitsMap[courseId].push(unit);
  teacherObjectivesMap[newUnitId] = generatedObjectives;

  return { unit, objectives: generatedObjectives };
}

// ============ TEACHER: STUDENTS ============

export async function listTeacherStudents(): Promise<Student[]> {
  await delay(100);
  return [...teacherStudents];
}

// ============ TEACHER: ROSTER ============

export async function getCourseRoster(courseId: string): Promise<string[]> {
  await delay(100);
  return courseRosterMap[courseId] ?? [];
}

export async function updateCourseRoster(
  courseId: string,
  studentIds: string[]
): Promise<{ studentIds: string[] }> {
  await delay(150);
  courseRosterMap[courseId] = [...studentIds];
  const tc = teacherCourses.find((c) => c.id === courseId);
  if (tc) tc.studentCount = studentIds.length;
  return { studentIds };
}

// ============ TEACHER: COURSES ============

export async function createCourse(params: {
  title: string;
  icon: string;
  studentIds: string[];
}): Promise<TeacherCourse> {
  await delay(200);
  const newId = `course-${Date.now()}`;
  const newCourse: TeacherCourse = {
    id: newId,
    title: params.title,
    studentCount: params.studentIds.length,
    icon: params.icon,
  };
  teacherCourses.push(newCourse);
  sidebarCourses.push({
    id: newId,
    title: params.title,
    icon: params.icon,
    instructorIds: [mockInstructor.id],
    enrolledStudentIds: [],
  });
  courseRosterMap[newId] = [...params.studentIds];
  teacherUnitsMap[newId] = [];
  return newCourse;
}

// ============ TEACHER: NEW STUDENT ============

export async function createNewStudent(
  firstName: string,
  lastName: string,
  email: string
): Promise<Student> {
  await delay(100);
  const student: Student = {
    id: `ts-new-${Date.now()}`,
    name: `${firstName} ${lastName}`,
    yearLabel: "New",
  };
  teacherStudents.push(student);
  void email; // will be used by backend
  return student;
}
