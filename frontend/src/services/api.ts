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
  GradingReport,
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
// Grading Reports & Per-Unit Feedback
// ---------------------------------------------------------------------------

/** Teacher: Sam's grading report for a specific student's unit (teacher view). */
export function getUnitGradingReport(
  unitId: string,
  studentId: string
): Promise<GradingReport | null> {
  return get<GradingReport | null>(
    `/units/${unitId}/grading-report?studentId=${encodeURIComponent(studentId)}`
  );
}

/** Teacher: Retrieve teacher's written feedback for a student in a unit. */
export function getUnitFeedbackForStudent(
  unitId: string,
  studentId: string
): Promise<FeedbackItem | null> {
  return get<FeedbackItem | null>(
    `/units/${unitId}/feedback?studentId=${encodeURIComponent(studentId)}`
  );
}

/** Teacher: Create new teacher feedback for a student in a unit. */
export function createUnitFeedback(
  unitId: string,
  studentId: string,
  body: string
): Promise<FeedbackItem> {
  return post<FeedbackItem>(`/units/${unitId}/feedback`, { studentId, body });
}

/** Teacher: Update existing teacher feedback by id. */
export function updateFeedback(
  feedbackId: string,
  body: string
): Promise<FeedbackItem> {
  return patch<FeedbackItem>(`/feedback/${feedbackId}`, { body });
}

/** Student: Sam's grading report for the current student's unit (student view). */
export function getMyUnitGradingReport(unitId: string): Promise<GradingReport | null> {
  return get<GradingReport | null>(`/units/${unitId}/my-grading-report`);
}

/** Student: Teacher's feedback message for the current student in a unit. */
export function getMyUnitFeedback(unitId: string): Promise<FeedbackItem | null> {
  return get<FeedbackItem | null>(`/units/${unitId}/my-feedback`);
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
  queueItemId: string,
  role: "student" | "tutor",
  content: string,
  metadata?: ChatMessage["metadata"]
): Promise<ChatMessage> {
  // Knowledge messages are session-only (no backend persistence).
  // Create a local ChatMessage object for the UI.
  const msg: ChatMessage = {
    id: `kqi_msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    threadId: queueItemId,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };
  return Promise.resolve(msg);
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
  answer: string
): Promise<{ updatedItem: KnowledgeQueueItem; newQueueItem?: KnowledgeQueueItem; tutorFeedback?: string }> {
  return post<{ updatedItem: KnowledgeQueueItem; newQueueItem?: KnowledgeQueueItem; tutorFeedback?: string }>(
    `/knowledge-queue/${queueItemId}/complete`,
    { answer }
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
// Teacher: Unit upload (pre-signed S3 URLs)
// ---------------------------------------------------------------------------

/**
 * Upload documents to create a new unit.
 *
 * Uses a 3-step flow to bypass the API Gateway 10 MB payload limit:
 *   1. POST /courses/{courseId}/units/upload — creates Unit, returns pre-signed S3 PUT URLs
 *   2. PUT each file directly to S3 via its pre-signed URL (parallel)
 *   3. POST /units/{unitId}/process — triggers the async curriculum pipeline
 */
export async function createUnitFromUpload(
  courseId: string,
  files: File[],
  unitTitle?: string
): Promise<{ unitId: string }> {
  // Step 1: Create the unit and get pre-signed upload URLs
  const { unitId, uploadUrls } = await post<{
    unitId: string;
    uploadUrls: Record<string, string>;
  }>(`/courses/${courseId}/units/upload`, {
    unitName: unitTitle ?? "Untitled Unit",
    fileNames: files.map((f) => f.name),
  });

  // Step 2: Upload files directly to S3 (parallel)
  const uploadResults = await Promise.all(
    files.map((file) => {
      const url = uploadUrls[file.name];
      if (!url) throw new Error(`No upload URL for file: ${file.name}`);
      return fetch(url, { method: "PUT", body: file });
    })
  );
  for (const res of uploadResults) {
    if (!res.ok) throw new Error(`S3 upload failed: ${res.status} ${res.statusText}`);
  }

  // Step 3: Trigger the processing pipeline
  await post(`/units/${unitId}/process`, {});

  return { unitId };
}

export function processUnit(unitId: string): Promise<{ unitId: string; status: string }> {
  return post(`/units/${unitId}/process`, {});
}

export function getUploadStatus(
  unitId: string
): Promise<{ unitId: string; status: string; statusError?: string }> {
  return get<{ unitId: string; status: string; statusError?: string }>(
    `/units/${unitId}/upload-status`
  );
}

export function getIdentifiedKnowledge(
  unitId: string
): Promise<{ unitId: string; identifiedKnowledge: { type: string; description: string }[] }> {
  return get(`/units/${unitId}/identified-knowledge`);
}

export function generateSelectedObjectives(
  unitId: string,
  selectedObjectives: { type: string; description: string }[]
): Promise<{ unitId: string; status: string }> {
  return post(`/units/${unitId}/generate`, { selectedObjectives });
}

export function updateUnitTitle(unitId: string, title: string): Promise<Unit> {
  return patch<Unit>(`/units/${unitId}/title`, { title });
}

export function updateUnitDeadline(unitId: string, deadline: string | null): Promise<Unit> {
  return patch<Unit>(`/units/${unitId}/deadline`, { deadline });
}

export function updateCourseTitle(courseId: string, title: string): Promise<Course> {
  return patch<Course>(`/courses/${courseId}/title`, { title });
}

export function deleteUnit(unitId: string): Promise<void> {
  return apiFetch(`/units/${unitId}`, { method: "DELETE" });
}

export function deleteCourse(courseId: string): Promise<void> {
  return apiFetch(`/courses/${courseId}`, { method: "DELETE" });
}

export function restoreUnit(unitId: string): Promise<Unit> {
  return patch<Unit>(`/units/${unitId}/restore`, {});
}

export function restoreCourse(courseId: string): Promise<Course> {
  return patch<Course>(`/courses/${courseId}/restore`, {});
}

export function permanentlyDeleteUnit(unitId: string): Promise<void> {
  return apiFetch(`/units/${unitId}/permanent`, { method: "DELETE" });
}

export function permanentlyDeleteCourse(courseId: string): Promise<void> {
  return apiFetch(`/courses/${courseId}/permanent`, { method: "DELETE" });
}

/**
 * Reset a unit back to "review" status so the teacher can re-select objectives.
 * Deletes existing objectives, questions, threads, etc. for the unit.
 */
export function editObjectives(
  unitId: string
): Promise<{ unitId: string; status: string }> {
  return post(`/units/${unitId}/edit-objectives`, {});
}

/**
 * List uploaded files for a unit from S3.
 */
export function listUnitFiles(
  unitId: string
): Promise<{ files: { name: string; size: number; lastModified: string }[] }> {
  return get(`/units/${unitId}/files`);
}

/**
 * Re-upload documents for an existing unit.
 * Returns pre-signed S3 PUT URLs. The caller must upload files to S3,
 * then call POST /units/{unitId}/process to trigger the pipeline.
 */
export async function reuploadUnit(
  unitId: string,
  fileNames: string[]
): Promise<{ uploadUrls: Record<string, string> }> {
  const result = await post<{ unitId: string; uploadUrls: Record<string, string> }>(
    `/units/${unitId}/reupload`,
    { fileNames }
  );
  return { uploadUrls: result.uploadUrls };
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
  subject?: string;
  gradeLevel?: string;
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
