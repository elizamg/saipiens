/**
 * API client — calls the real backend with a Cognito JWT.
 *
 * Every request attaches `Authorization: Bearer <IdToken>` so API Gateway's
 * JWT Authorizer can validate the caller and the Lambda can read `sub`.
 */

import { getAuthToken } from "../contexts/AuthContext";
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
  KnowledgeTopic,
  KnowledgeQueueItem,
  KnowledgeProgress,
  Agent,
} from "../types/domain";

// ---------------------------------------------------------------------------
// Base fetch helper
// ---------------------------------------------------------------------------

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function get<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "GET" });
}

function post<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function patch<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// ---------------------------------------------------------------------------
// Agent (static — no backend endpoint yet)
// ---------------------------------------------------------------------------

export async function getAgent(): Promise<Agent> {
  return { id: "sam", name: "Sam", avatarUrl: "/sam-avatar.png" };
}

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

export function getCurrentStudent(): Promise<Student> {
  return get<Student>("/current-student");
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export async function listCoursesForStudent(studentId: string): Promise<Course[]> {
  return get<Course[]>(`/students/${studentId}/courses`);
}

export function getCourse(courseId: string): Promise<Course> {
  return get<Course>(`/courses/${courseId}`);
}

// ---------------------------------------------------------------------------
// Instructors
// ---------------------------------------------------------------------------

export function listInstructors(ids: string[]): Promise<Instructor[]> {
  return post<Instructor[]>("/instructors/batch", { ids });
}

export function getCurrentInstructor(): Promise<Instructor> {
  return get<Instructor>("/current-instructor");
}

export function listTeacherCourses(): Promise<Course[]> {
  return get<Course[]>("/instructor/courses");
}

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export function listUnits(courseId: string): Promise<Unit[]> {
  return get<Unit[]>(`/courses/${courseId}/units`);
}

export function getUnit(unitId: string): Promise<Unit> {
  return get<Unit>(`/units/${unitId}`);
}

// ---------------------------------------------------------------------------
// Objectives
// ---------------------------------------------------------------------------

export function listObjectives(unitId: string): Promise<Objective[]> {
  return get<Objective[]>(`/units/${unitId}/objectives`);
}

export function getObjective(objectiveId: string): Promise<Objective> {
  return get<Objective>(`/objectives/${objectiveId}`);
}

// ---------------------------------------------------------------------------
// Item Stages
// ---------------------------------------------------------------------------

export function listItemStages(itemId: string): Promise<ItemStage[]> {
  return get<ItemStage[]>(`/objectives/${itemId}/stages`);
}

export function getStage(stageId: string): Promise<ItemStage> {
  return get<ItemStage>(`/stages/${stageId}`);
}

// ---------------------------------------------------------------------------
// Student Progress
// ---------------------------------------------------------------------------

export function getStudentObjectiveProgress(
  _studentId: string,
  objectiveId: string
): Promise<ProgressType | undefined> {
  return get<ProgressType>(`/objectives/${objectiveId}/progress`);
}

export function listStudentProgressForUnit(
  _studentId: string,
  unitId: string
): Promise<ProgressType[]> {
  return get<ProgressType[]>(`/units/${unitId}/progress/items`);
}

export function getUnitProgress(
  _studentId: string,
  unitId: string
): Promise<UnitProgress> {
  return get<UnitProgress>(`/units/${unitId}/progress`);
}

export function advanceStage(
  _studentId: string,
  objectiveId: string
): Promise<ProgressType> {
  return post<ProgressType>(`/objectives/${objectiveId}/advance`, {});
}

// ---------------------------------------------------------------------------
// Awards
// ---------------------------------------------------------------------------

export function listAwards(_studentId: string): Promise<Award[]> {
  return get<Award[]>("/awards");
}

export function listAwardsForCourse(_studentId: string, courseId: string): Promise<Award[]> {
  return get<Award[]>(`/courses/${courseId}/awards`);
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export function listFeedback(_studentId: string): Promise<FeedbackItem[]> {
  return get<FeedbackItem[]>("/feedback");
}

export function listFeedbackForCourse(courseId: string): Promise<FeedbackItem[]> {
  return get<FeedbackItem[]>(`/courses/${courseId}/feedback`);
}

// ---------------------------------------------------------------------------
// Chat Threads
// ---------------------------------------------------------------------------

export function listChatThreadsForUnit(params: {
  courseId: string;
  unitId: string;
  studentId: string;
}): Promise<ThreadWithProgress[]> {
  return get<ThreadWithProgress[]>(`/units/${params.unitId}/threads`);
}

export function getThread(threadId: string): Promise<ChatThread> {
  return get<ChatThread>(`/threads/${threadId}`);
}

export function getThreadWithProgress(
  threadId: string,
  _studentId: string
): Promise<ThreadWithProgress> {
  return get<ThreadWithProgress>(`/threads/${threadId}/with-progress`);
}

// ---------------------------------------------------------------------------
// Chat Messages
// ---------------------------------------------------------------------------

export function listMessages(threadId: string, stageId?: string): Promise<ChatMessage[]> {
  const qs = stageId ? `?stageId=${encodeURIComponent(stageId)}` : "";
  return get<ChatMessage[]>(`/threads/${threadId}/messages${qs}`);
}

export function sendMessage(
  threadId: string,
  content: string,
  stageId?: string,
  stageType?: string
): Promise<{ studentMessage: ChatMessage; tutorMessage: ChatMessage | null }> {
  return post<{ studentMessage: ChatMessage; tutorMessage: ChatMessage | null }>(
    `/threads/${threadId}/messages`,
    { content, stageId, stageType }
  );
}

// ---------------------------------------------------------------------------
// Knowledge Topics (teacher-visible)
// ---------------------------------------------------------------------------

export function listKnowledgeTopics(unitId: string): Promise<KnowledgeTopic[]> {
  return get<KnowledgeTopic[]>(`/units/${unitId}/knowledge-topics`);
}

// ---------------------------------------------------------------------------
// Knowledge Queue (student-facing)
// ---------------------------------------------------------------------------

export function listKnowledgeMessages(_queueItemId: string): Promise<ChatMessage[]> {
  // Knowledge queue items don't have a separate message thread — stub for UI compat.
  return Promise.resolve([]);
}

export function sendKnowledgeMessage(
  _queueItemId: string,
  _role: "student" | "tutor",
  _content: string,
  _metadata?: ChatMessage["metadata"]
): Promise<ChatMessage> {
  // Knowledge queue doesn't use a chat interface — stub for UI compat.
  return Promise.reject(new Error("Knowledge queue does not support chat messages"));
}

export function getKnowledgeQueue(
  unitId: string,
  _studentId: string
): Promise<KnowledgeQueueItem[]> {
  return get<KnowledgeQueueItem[]>(`/units/${unitId}/knowledge-queue`);
}

export function completeKnowledgeAttempt(
  _unitId: string,
  _studentId: string,
  queueItemId: string,
  is_correct: boolean
): Promise<{ updatedItem: KnowledgeQueueItem; newQueueItem?: KnowledgeQueueItem }> {
  return post<{ updatedItem: KnowledgeQueueItem; newQueueItem?: KnowledgeQueueItem }>(
    `/knowledge-queue/${queueItemId}/complete`,
    { is_correct }
  );
}

export function getKnowledgeProgress(
  unitId: string,
  _studentId: string
): Promise<KnowledgeProgress> {
  return get<KnowledgeProgress>(`/units/${unitId}/knowledge-progress`);
}

// ---------------------------------------------------------------------------
// Teacher: Objectives
// ---------------------------------------------------------------------------

export function listTeacherObjectives(unitId: string): Promise<Objective[]> {
  return get<Objective[]>(`/units/${unitId}/objectives`);
}

export function updateObjectiveEnabled(
  objectiveId: string,
  enabled: boolean
): Promise<Objective> {
  return patch<Objective>(`/objectives/${objectiveId}/enabled`, { enabled });
}

// ---------------------------------------------------------------------------
// Teacher: Unit upload (multipart/form-data)
// ---------------------------------------------------------------------------

export async function createUnitFromUpload(
  courseId: string,
  files: File[],
  unitTitle?: string
): Promise<{ unit: Unit; objectives: Objective[] }> {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append("unitName", unitTitle ?? "Untitled Unit");
  for (const file of files) {
    formData.append("files", file, file.name);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  // Do NOT set Content-Type — the browser adds it with the multipart boundary.

  const res = await fetch(`${BASE}/courses/${courseId}/units/upload`, {
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

export function updateUnitTitle(unitId: string, title: string): Promise<Unit> {
  return patch<Unit>(`/units/${unitId}/title`, { title });
}

// ---------------------------------------------------------------------------
// Teacher: Students / Roster / Courses
// ---------------------------------------------------------------------------

export function listTeacherStudents(): Promise<Student[]> {
  return get<Student[]>("/students");
}

export function getCourseRoster(courseId: string): Promise<string[]> {
  return get<{ courseId: string; studentIds: string[] }>(`/courses/${courseId}/roster`)
    .then((r) => r.studentIds);
}

export function updateCourseRoster(
  courseId: string,
  studentIds: string[]
): Promise<{ studentIds: string[] }> {
  return apiFetch<{ courseId: string; studentIds: string[] }>(
    `/courses/${courseId}/roster`,
    { method: "PUT", body: JSON.stringify({ studentIds }) }
  ).then((r) => ({ studentIds: r.studentIds }));
}

export function createCourse(params: {
  title: string;
  icon: string;
  studentIds: string[];
}): Promise<{ id: string; title: string; studentCount: number; icon: string }> {
  return post("/courses", params);
}

export async function createNewStudent(
  firstName: string,
  lastName: string,
  _email: string
): Promise<Student> {
  return post<Student>("/students", { name: `${firstName.trim()} ${lastName.trim()}` });
}
