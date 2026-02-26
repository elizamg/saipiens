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
  // Not yet implemented in backend — return empty until added.
  void unitId;
  return Promise.resolve([]);
}

// ---------------------------------------------------------------------------
// Knowledge Queue (student-facing)
// Not yet implemented in backend — stubs return empty data.
// ---------------------------------------------------------------------------

export function listKnowledgeMessages(_queueItemId: string): Promise<ChatMessage[]> {
  return Promise.resolve([]);
}

export function sendKnowledgeMessage(
  _queueItemId: string,
  _role: "student" | "tutor",
  _content: string,
  _metadata?: ChatMessage["metadata"]
): Promise<ChatMessage> {
  return Promise.reject(new Error("Knowledge queue not yet implemented on backend"));
}

export function getKnowledgeQueue(
  _unitId: string,
  _studentId: string
): Promise<KnowledgeQueueItem[]> {
  return Promise.resolve([]);
}

export function completeKnowledgeAttempt(
  _unitId: string,
  _studentId: string,
  _queueItemId: string,
  _is_correct: boolean
): Promise<{ updatedItem: KnowledgeQueueItem; newQueueItem?: KnowledgeQueueItem }> {
  return Promise.reject(new Error("Knowledge queue not yet implemented on backend"));
}

export function getKnowledgeProgress(
  _unitId: string,
  _studentId: string
): Promise<KnowledgeProgress> {
  return Promise.resolve({
    unitId: _unitId,
    totalTopics: 0,
    correctCount: 0,
    incorrectCount: 0,
    correctPercent: 0,
    incorrectPercent: 0,
  });
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
  return post<Objective>(`/objectives/${objectiveId}/enabled`, { enabled });
}

// ---------------------------------------------------------------------------
// Teacher: Unit upload
// Not yet implemented in backend — stub.
// ---------------------------------------------------------------------------

export async function createUnitFromUpload(
  _courseId: string,
  _files: File[],
  _unitTitle?: string
): Promise<{ unit: Unit; objectives: Objective[] }> {
  return Promise.reject(new Error("Unit upload not yet implemented on backend"));
}

export function updateUnitTitle(unitId: string, title: string): Promise<Unit> {
  return post<Unit>(`/units/${unitId}/title`, { title });
}

// ---------------------------------------------------------------------------
// Teacher: Students / Roster / Courses
// Not yet implemented in backend — stubs return empty data.
// ---------------------------------------------------------------------------

export function listTeacherStudents(): Promise<Student[]> {
  return Promise.resolve([]);
}

export function getCourseRoster(_courseId: string): Promise<string[]> {
  return Promise.resolve([]);
}

export function updateCourseRoster(
  _courseId: string,
  _studentIds: string[]
): Promise<{ studentIds: string[] }> {
  return Promise.reject(new Error("Roster update not yet implemented on backend"));
}

export async function createCourse(_params: {
  title: string;
  icon: string;
  studentIds: string[];
}): Promise<unknown> {
  return Promise.reject(new Error("Course creation not yet implemented on backend"));
}

export async function createNewStudent(
  _firstName: string,
  _lastName: string,
  _email: string
): Promise<Student> {
  return Promise.reject(new Error("Student creation not yet implemented on backend"));
}
