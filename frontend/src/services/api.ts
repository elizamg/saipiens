import { agent, knowledgeTopics, studentKnowledgeQueues, knowledgeQueueMessages } from "../mock/db";
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
  ProgressState,
  Agent,
  KnowledgeTopic,
  KnowledgeQueueItem,
  KnowledgeProgress,
} from "../types/domain";
import { computeKnowledgeProgress } from "../utils/progress";

// ============ REAL API CLIENT ============

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod";
const DEV_STUDENT_ID = import.meta.env.VITE_DEV_STUDENT_ID ?? "";
const DEV_INSTRUCTOR_ID = import.meta.env.VITE_DEV_INSTRUCTOR_ID ?? "";
const DEV_TOKEN = import.meta.env.VITE_DEV_TOKEN ?? "";

function buildHeaders(role: "student" | "instructor" = "student"): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (role === "instructor") {
    if (DEV_INSTRUCTOR_ID) {
      headers["X-Dev-Instructor-Id"] = DEV_INSTRUCTOR_ID;
    }
  } else {
    if (DEV_STUDENT_ID) {
      headers["X-Dev-Student-Id"] = DEV_STUDENT_ID;
    }
  }
  if (DEV_TOKEN) {
    headers["X-Dev-Token"] = DEV_TOKEN;
  }
  return headers;
}

async function apiFetch<T>(path: string, options?: RequestInit, role: "student" | "instructor" = "student"): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(role),
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  const text = await res.text();
  if (!text) return undefined as unknown as T;
  return JSON.parse(text) as T;
}

// ============ ADAPTER: earnedStars -> progressState ============
//
// The backend tracks progress via earnedStars (0–3):
//   0 = not started (no stages completed)
//   1 = begin stage done, now on walkthrough
//   2 = walkthrough done, now on challenge
//   3 = challenge done (fully complete)
//
// The frontend uses a 5-state ProgressState string. Mapping:
//   earnedStars 0 → "not_started"
//   earnedStars 1 → "walkthrough_started"
//   earnedStars 2 → "challenge_started"
//   earnedStars 3 → "challenge_complete"

function earnedStarsToProgressState(earnedStars: number): ProgressState {
  switch (earnedStars) {
    case 0: return "not_started";
    case 1: return "walkthrough_started";
    case 2: return "challenge_started";
    case 3: return "challenge_complete";
    default: return earnedStars >= 3 ? "challenge_complete" : "not_started";
  }
}

type BackendProgress = {
  studentId: string;
  objectiveId: string;
  earnedStars: number;
  currentStageType: ProgressType["currentStageType"];
  updatedAt: string;
};

function adaptProgress(raw: BackendProgress): ProgressType {
  return {
    studentId: raw.studentId,
    objectiveId: raw.objectiveId,
    progressState: earnedStarsToProgressState(raw.earnedStars ?? 0),
    currentStageType: raw.currentStageType ?? "begin",
    updatedAt: raw.updatedAt,
  };
}

// Mock delay (used only for mock endpoints)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============ AGENT ============

export async function getAgent(): Promise<Agent> {
  return agent;
}

// ============ STUDENT ============

export async function getCurrentStudent(): Promise<Student> {
  return apiFetch<Student>("/current-student");
}

// ============ COURSES ============

export async function listCoursesForStudent(studentId: string): Promise<Course[]> {
  return apiFetch<Course[]>(`/students/${encodeURIComponent(studentId)}/courses`);
}

export async function getCourse(courseId: string): Promise<Course | undefined> {
  try {
    return await apiFetch<Course>(`/courses/${encodeURIComponent(courseId)}`);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith("API 404")) return undefined;
    throw e;
  }
}

// ============ INSTRUCTORS ============

export async function listInstructors(ids: string[]): Promise<Instructor[]> {
  if (ids.length === 0) return [];
  return apiFetch<Instructor[]>("/instructors/batch", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

// ============ UNITS ============

export async function listUnits(courseId: string): Promise<Unit[]> {
  return apiFetch<Unit[]>(`/courses/${encodeURIComponent(courseId)}/units`);
}

export async function getUnit(unitId: string): Promise<Unit | undefined> {
  try {
    return await apiFetch<Unit>(`/units/${encodeURIComponent(unitId)}`);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith("API 404")) return undefined;
    throw e;
  }
}

// ============ OBJECTIVES (SIDEBAR ITEMS) ============

export async function listObjectives(unitId: string): Promise<Objective[]> {
  return apiFetch<Objective[]>(`/units/${encodeURIComponent(unitId)}/objectives`);
}

export async function getObjective(objectiveId: string): Promise<Objective | undefined> {
  try {
    return await apiFetch<Objective>(`/objectives/${encodeURIComponent(objectiveId)}`);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith("API 404")) return undefined;
    throw e;
  }
}

// ============ ITEM STAGES ============

export async function listItemStages(itemId: string): Promise<ItemStage[]> {
  return apiFetch<ItemStage[]>(`/objectives/${encodeURIComponent(itemId)}/stages`);
}

export async function getStage(stageId: string): Promise<ItemStage | undefined> {
  try {
    return await apiFetch<ItemStage>(`/stages/${encodeURIComponent(stageId)}`);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith("API 404")) return undefined;
    throw e;
  }
}

// ============ STUDENT PROGRESS ============

export async function getStudentObjectiveProgress(
  _studentId: string,
  objectiveId: string
): Promise<ProgressType | undefined> {
  try {
    const raw = await apiFetch<BackendProgress>(`/objectives/${encodeURIComponent(objectiveId)}/progress`);
    return adaptProgress(raw);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith("API 404")) return undefined;
    throw e;
  }
}

export async function listStudentProgressForUnit(
  _studentId: string,
  unitId: string
): Promise<ProgressType[]> {
  const raw = await apiFetch<BackendProgress[]>(`/units/${encodeURIComponent(unitId)}/progress/items`);
  return raw.map(adaptProgress);
}

export async function getUnitProgress(
  _studentId: string,
  unitId: string
): Promise<UnitProgress> {
  return apiFetch<UnitProgress>(`/units/${encodeURIComponent(unitId)}/progress`);
}

export async function advanceStage(
  _studentId: string,
  itemId: string
): Promise<ProgressType> {
  const raw = await apiFetch<BackendProgress>(`/objectives/${encodeURIComponent(itemId)}/advance`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return adaptProgress(raw);
}

// ============ AWARDS ============

export async function listAwards(_studentId: string): Promise<Award[]> {
  return apiFetch<Award[]>("/awards");
}

export async function listAwardsForCourse(_studentId: string, courseId: string): Promise<Award[]> {
  return apiFetch<Award[]>(`/courses/${encodeURIComponent(courseId)}/awards`);
}

// ============ FEEDBACK ============

export async function listFeedback(_studentId: string): Promise<FeedbackItem[]> {
  return apiFetch<FeedbackItem[]>("/feedback");
}

export async function listFeedbackForCourse(courseId: string): Promise<FeedbackItem[]> {
  return apiFetch<FeedbackItem[]>(`/courses/${encodeURIComponent(courseId)}/feedback`);
}

// ============ CHAT THREADS ============

export async function listChatThreadsForUnit(params: {
  courseId: string;
  unitId: string;
  studentId: string;
}): Promise<ThreadWithProgress[]> {
  return apiFetch<ThreadWithProgress[]>(`/units/${encodeURIComponent(params.unitId)}/threads`);
}

export async function getThread(threadId: string): Promise<ChatThread | undefined> {
  try {
    return await apiFetch<ChatThread>(`/threads/${encodeURIComponent(threadId)}`);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith("API 404")) return undefined;
    throw e;
  }
}

export async function getThreadWithProgress(
  threadId: string,
  _studentId: string
): Promise<ThreadWithProgress | undefined> {
  try {
    return await apiFetch<ThreadWithProgress>(`/threads/${encodeURIComponent(threadId)}/with-progress`);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith("API 404")) return undefined;
    throw e;
  }
}

// ============ CHAT MESSAGES ============

export async function listMessages(
  threadId: string,
  stageId?: string
): Promise<ChatMessage[]> {
  const qs = stageId ? `?stageId=${encodeURIComponent(stageId)}` : "";
  return apiFetch<ChatMessage[]>(`/threads/${encodeURIComponent(threadId)}/messages${qs}`);
}

export async function sendMessage(
  threadId: string,
  content: string,
  stageId?: string
): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(`/threads/${encodeURIComponent(threadId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, ...(stageId ? { stageId } : {}) }),
  });
}

// ============ KNOWLEDGE TOPICS ============

export async function listKnowledgeTopics(unitId: string): Promise<KnowledgeTopic[]> {
  try {
    return await apiFetch<KnowledgeTopic[]>(`/units/${encodeURIComponent(unitId)}/knowledge-topics`);
  } catch {
    // fall back to mock if not yet seeded
    await delay(50);
    return knowledgeTopics
      .filter((t) => t.unitId === unitId)
      .sort((a, b) => a.order - b.order);
  }
}

// ============ KNOWLEDGE QUEUE (student-facing) ============

type BackendKnowledgeQueueItem = {
  id: string;
  unitId: string;
  studentId: string;
  knowledgeTopicId: string;
  labelIndex: number;
  order: number;
  status: "pending" | "active" | "completed_correct" | "completed_incorrect";
  is_correct?: boolean;
  questionPrompt: string;
  createdAt: string;
};

type BackendCompleteResult = {
  updatedItem: BackendKnowledgeQueueItem;
  newQueueItem?: BackendKnowledgeQueueItem;
};

/** Returns pre-existing + session messages for a knowledge queue item. */
export async function listKnowledgeMessages(queueItemId: string): Promise<ChatMessage[]> {
  await delay(50);
  return (knowledgeQueueMessages[queueItemId] ?? []).slice();
}

/** Persist a new message to the knowledge queue item's message list. */
export async function sendKnowledgeMessage(
  queueItemId: string,
  role: "student" | "tutor",
  content: string,
  metadata?: ChatMessage["metadata"]
): Promise<ChatMessage> {
  await delay(50);
  const msg: ChatMessage = {
    id: `kqi_msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    threadId: queueItemId,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };
  if (!knowledgeQueueMessages[queueItemId]) {
    knowledgeQueueMessages[queueItemId] = [];
  }
  knowledgeQueueMessages[queueItemId].push(msg);
  return msg;
}

/** Returns visible (non-pending) queue items for the student, sorted by order. */
export async function getKnowledgeQueue(
  unitId: string,
  _studentId: string
): Promise<KnowledgeQueueItem[]> {
  try {
    const items = await apiFetch<BackendKnowledgeQueueItem[]>(
      `/units/${encodeURIComponent(unitId)}/knowledge-queue`
    );
    return items.sort((a, b) => a.order - b.order);
  } catch {
    // fall back to mock if not yet seeded
    await delay(50);
    const key = `${unitId}_${_studentId}`;
    const queue = studentKnowledgeQueues[key] ?? [];
    return queue
      .filter((item) => item.status !== "pending")
      .sort((a, b) => a.order - b.order);
  }
}

/**
 * Grade a knowledge queue item.
 * - Updates item status to completed_correct or completed_incorrect.
 * - If incorrect: backend creates a retry item.
 * - Advances the next pending item to "active".
 */
export async function completeKnowledgeAttempt(
  unitId: string,
  studentId: string,
  queueItemId: string,
  is_correct: boolean
): Promise<{ updatedItem: KnowledgeQueueItem; newQueueItem?: KnowledgeQueueItem }> {
  try {
    const result = await apiFetch<BackendCompleteResult>(
      `/knowledge-queue/${encodeURIComponent(queueItemId)}/complete`,
      {
        method: "POST",
        body: JSON.stringify({ is_correct }),
      }
    );
    return result;
  } catch {
    // fall back to mock
    await delay(100);
    const key = `${unitId}_${studentId}`;
    if (!studentKnowledgeQueues[key]) {
      throw new Error(`No queue found for ${key}`);
    }
    const queue = studentKnowledgeQueues[key];
    const idx = queue.findIndex((item) => item.id === queueItemId);
    if (idx === -1) throw new Error(`Queue item ${queueItemId} not found`);

    queue[idx] = {
      ...queue[idx],
      status: is_correct ? "completed_correct" : "completed_incorrect",
      is_correct,
    };
    const updatedItem = queue[idx];
    let newQueueItem: KnowledgeQueueItem | undefined;

    if (!is_correct) {
      const maxLabelIndex = Math.max(...queue.map((i) => i.labelIndex));
      const maxOrder = Math.max(...queue.map((i) => i.order));
      newQueueItem = {
        id: `kqi_retry_${Date.now()}`,
        unitId,
        studentId,
        knowledgeTopicId: queue[idx].knowledgeTopicId,
        labelIndex: maxLabelIndex + 1,
        order: maxOrder + 1,
        status: "pending",
        is_correct: undefined,
        questionPrompt: queue[idx].questionPrompt,
        createdAt: new Date().toISOString(),
      };
      queue.push(newQueueItem);
    }

    const nextPending = queue.find((item) => item.status === "pending");
    if (nextPending) {
      const nextIdx = queue.findIndex((item) => item.id === nextPending.id);
      queue[nextIdx] = { ...queue[nextIdx], status: "active" };
    }

    return { updatedItem, newQueueItem };
  }
}

export async function getKnowledgeProgress(
  unitId: string,
  studentId: string
): Promise<KnowledgeProgress> {
  try {
    return await apiFetch<KnowledgeProgress>(
      `/units/${encodeURIComponent(unitId)}/knowledge-progress`
    );
  } catch {
    // fall back to mock
    await delay(50);
    const key = `${unitId}_${studentId}`;
    const queue = studentKnowledgeQueues[key] ?? [];
    const topics = knowledgeTopics.filter((t) => t.unitId === unitId);
    return computeKnowledgeProgress(unitId, topics, queue);
  }
}

// ============ TEACHER: CURRENT INSTRUCTOR ============

export async function getCurrentInstructor(): Promise<Student> {
  return apiFetch<Student>("/current-instructor", undefined, "instructor");
}

// ============ TEACHER: COURSES ============

export async function listInstructorCourses(): Promise<Course[]> {
  return apiFetch<Course[]>("/instructor/courses", undefined, "instructor");
}

export async function createCourse(params: {
  title: string;
  icon: string;
  studentIds: string[];
}): Promise<TeacherCourse> {
  const course = await apiFetch<Course>("/courses", {
    method: "POST",
    body: JSON.stringify({ title: params.title }),
  }, "instructor");

  // Enroll students if any provided
  if (params.studentIds.length > 0) {
    await apiFetch(`/courses/${encodeURIComponent(course.id)}/roster`, {
      method: "PUT",
      body: JSON.stringify({ studentIds: params.studentIds }),
    }, "instructor");
  }

  return {
    id: course.id,
    title: course.title,
    studentCount: params.studentIds.length,
    icon: params.icon,
  };
}

// ============ TEACHER: ROSTER ============

export async function getCourseRoster(courseId: string): Promise<string[]> {
  const result = await apiFetch<{ courseId: string; studentIds: string[] }>(
    `/courses/${encodeURIComponent(courseId)}/roster`,
    undefined,
    "instructor"
  );
  return result.studentIds;
}

export async function updateCourseRoster(
  courseId: string,
  studentIds: string[]
): Promise<{ studentIds: string[] }> {
  const result = await apiFetch<{ courseId: string; studentIds: string[] }>(
    `/courses/${encodeURIComponent(courseId)}/roster`,
    {
      method: "PUT",
      body: JSON.stringify({ studentIds }),
    },
    "instructor"
  );
  return { studentIds: result.studentIds };
}

// ============ TEACHER: STUDENTS ============

export async function listTeacherStudents(): Promise<Student[]> {
  return apiFetch<Student[]>("/students", undefined, "instructor");
}

export async function createNewStudent(
  firstName: string,
  lastName: string,
  _email: string
): Promise<Student> {
  return apiFetch<Student>("/students", {
    method: "POST",
    body: JSON.stringify({ name: `${firstName} ${lastName}` }),
  }, "instructor");
}

// ============ TEACHER: UNITS ============

export async function createUnitFromUpload(
  courseId: string,
  files: File[],
  unitTitle?: string
): Promise<{ unit: Unit; objectives: Objective[] }> {
  const formData = new FormData();
  formData.append("unitName", unitTitle?.trim() ?? "Untitled Unit");
  for (const file of files) {
    formData.append("files", file);
  }

  // Build instructor headers without Content-Type (browser sets it for multipart)
  const headers: Record<string, string> = {};
  if (DEV_INSTRUCTOR_ID) headers["X-Dev-Instructor-Id"] = DEV_INSTRUCTOR_ID;
  if (DEV_TOKEN) headers["X-Dev-Token"] = DEV_TOKEN;

  const res = await fetch(`${BASE_URL}/courses/${encodeURIComponent(courseId)}/units/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json();
}

export async function updateUnitTitle(
  unitId: string,
  title: string
): Promise<Unit> {
  return apiFetch<Unit>(`/units/${encodeURIComponent(unitId)}/title`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  }, "instructor");
}

// ============ TEACHER: OBJECTIVES ============

export async function listTeacherObjectives(unitId: string): Promise<Objective[]> {
  return apiFetch<Objective[]>(`/units/${encodeURIComponent(unitId)}/objectives`, undefined, "instructor");
}

export async function updateObjectiveEnabled(
  objectiveId: string,
  enabled: boolean
): Promise<Objective> {
  return apiFetch<Objective>(`/objectives/${encodeURIComponent(objectiveId)}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  }, "instructor");
}
