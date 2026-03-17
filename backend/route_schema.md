# API Route Schema (Sapiens API)

Base URL (example): `https://<api-id>.execute-api.us-west-1.amazonaws.com/prod`

All endpoints return JSON and include CORS headers.
All endpoints except `/health` are protected by a JWT authorizer in API Gateway. The Lambda also decodes the JWT from the `Authorization: Bearer` header as a fallback. Dev-header auth (`X-Dev-Student-Id` / `X-Dev-Instructor-Id` + `X-Dev-Token`) still works when `DEV_AUTH_ENABLED=true`.

---

## 1) Health
- **GET** `/health` → `{ ok: true }`

---

## 2) Current student
- **GET** `/current-student` → `Student`

Identity:
- prod: JWT `sub` (from API Gateway authorizer or Lambda-decoded Authorization header)
- dev: `X-Dev-Student-Id` + `X-Dev-Token` (requires `DEV_AUTH_ENABLED=true`)

Auto-creates student record on first access. Name is pulled from JWT `given_name` + `family_name` claims; updated on each login if changed.

---

## 3) Courses
- **GET** `/students/{studentId}/courses` → `Course[]`  
  (server enforces `{studentId} == current student`)
- **GET** `/courses/{courseId}` → `Course` or 404

---

## 4) Instructors
- **POST** `/instructors/batch` body: `{ "ids": string[] }` → `Instructor[]`

---

## 5) Units
- **GET** `/courses/{courseId}/units` → `Unit[]`
- **GET** `/units/{unitId}` → `Unit` or 404

---

## 6) Objectives
- **GET** `/units/{unitId}/objectives` → `Objective[]` (sorted by `order`)
- **GET** `/objectives/{objectiveId}` → `Objective` or 404

---

## 7) Questions
- **GET** `/objectives/{objectiveId}/questions` → `Question[]` (sorted by difficultyStars asc)
- **GET** `/questions/{questionId}` → `Question` or 404

---

## 8) ItemStages
- **GET** `/objectives/{objectiveId}/stages` → `ItemStage[]` (sorted by `order` asc)
- **GET** `/stages/{stageId}` → `ItemStage` or 404

---

## 9) Progress
- **GET** `/objectives/{objectiveId}/progress` → `StudentObjectiveProgress`
- **GET** `/units/{unitId}/progress/items` → `StudentObjectiveProgress[]`
- **GET** `/units/{unitId}/progress` → `UnitProgress`
- **POST** `/objectives/{objectiveId}/advance` → `StudentObjectiveProgress` (advanced/capped at 3 stars)

---

## 10) Awards
- **GET** `/awards` → `Award[]` (for current student)
- **GET** `/courses/{courseId}/awards` → `Award[]` (filtered)

---

## 11) Feedback
- **GET** `/feedback` → `FeedbackItem[]` (for current student)
- **GET** `/courses/{courseId}/feedback` → `FeedbackItem[]` (filtered)

---

## 12) Chat
### Threads
- **GET** `/units/{unitId}/threads` → `ThreadWithProgress[]`
- **GET** `/threads/{threadId}` → `ChatThread` or 404
- **GET** `/threads/{threadId}/with-progress` → `ThreadWithProgress` or 404

### Messages
- **GET** `/threads/{threadId}/messages?stageId=...` → `ChatMessage[]` (sorted by createdAt asc)
- **POST** `/threads/{threadId}/messages`
  - Body: `{ "content": string, "stageId"?: string, "stageType"?: "walkthrough" | "challenge" }`
  - Response: `{ "studentMessage": ChatMessage, "tutorMessage": ChatMessage | null }`
  - `stageType` drives AI pipeline selection: `walkthrough` → scaffolded tutor, `challenge` + objective `kind` → grading pipeline. `tutorMessage` is `null` when no pipeline applies (e.g. `begin` stage or unknown `stageType`).

---

## 13) Knowledge Topics (teacher-visible)
- **GET** `/units/{unitId}/knowledge-topics` → `KnowledgeTopic[]` (sorted by `order` asc)

---

## 14) Knowledge Queue (student-facing)
- **GET** `/units/{unitId}/knowledge-queue` → `KnowledgeQueueItem[]`
  - Returns only visible items (status ≠ `pending`), sorted by `order` asc
  - Server infers `studentId` from JWT
  - Auto-initializes queue on first access: one item per KnowledgeTopic, first is `active`, rest are `pending`
  - Each item's `question` is pulled from the corresponding objective's Question record

- **POST** `/knowledge-queue/{queueItemId}/complete`
  - Body: `{ "answer": string }` (preferred — triggers AI grading via Gemini)
  - Fallback body: `{ "is_correct": boolean }` (skips AI, sets result directly)
  - Returns: `{ "updatedItem": KnowledgeQueueItem, "newQueueItem"?: KnowledgeQueueItem, "tutorFeedback"?: string }`
  - Side effects:
    - Grades via `grade_info()` AI pipeline when `answer` is provided
    - Sets `status` to `completed_correct` or `completed_incorrect` and sets `is_correct`
    - If `is_correct: false`: creates a new `pending` retry item for the same `knowledgeTopicId` with incremented `labelIndex` and `order`
    - Advances the next `pending` item in the queue to `active`

- **POST** `/knowledge-queue/{queueItemId}/clarify`
  - Body: `{ "question": string }`
  - Returns: `{ "answer": string }`
  - Sends a clarifying question to the AI tutor (does NOT grade). Item must be `active`.

- **GET** `/units/{unitId}/knowledge-progress` → `KnowledgeProgress`
  - Returns `{ unitId, totalTopics, correctCount, incorrectCount, correctPercent, incorrectPercent }`
  - `correctCount` / `incorrectCount` count unique topics (not retries); a topic retried correctly is removed from incorrectCount

---

## 15) Instructor / Teacher routes

All instructor routes require instructor identity via `effective_instructor_id()`:
- **prod:** JWT `sub` claim + membership in the `instructors` Cognito group (parsed from `cognito:groups` claim; handles API Gateway's bracket-stringified format `[instructors]`). If the JWT is valid but the user is not in the `instructors` group, the request is rejected as unauthorized.
- **dev:** `X-Dev-Instructor-Id: <id>` + `X-Dev-Token: dev-secret` (requires `DEV_AUTH_ENABLED=true`)

### Identity
- **GET** `/current-instructor` → `Instructor`
  - Auto-creates instructor record on first access if not found. Name is pulled from JWT `given_name` + `family_name` claims; synced on each login.

### Course management
- **GET** `/instructor/courses` → `Course[]`
  - Returns all courses owned by the current instructor.
- **POST** `/courses` body: `{ "title": string, "icon"?: string, "studentIds"?: string[] }` → `{ id, title, studentCount, icon }` (201)
  - Creates a new course owned by the instructor. `instructorId` is set server-side.
  - `icon` defaults to `"general"` if omitted. Valid values: `"general"`, `"history"`, `"science"`.
  - If `studentIds` is provided, enrollment records are created for each student in the initial roster.

### Roster management
- **GET** `/courses/{courseId}/roster` → `{ courseId: string, studentIds: string[] }`
- **PUT** `/courses/{courseId}/roster` body: `{ "studentIds": string[] }` → `{ courseId, studentIds }`
  - Replaces the entire enrollment list atomically (deletes old, writes new).

### Student management
- **GET** `/students` → `Student[]`
  - Returns all students in the system (for roster assignment UI).
- **POST** `/students` body: `{ "name": string, "yearLabel"?: string }` → `Student` (201)
  - Creates a new student. `yearLabel` defaults to `"Year 1"`.

### Unit management
- **PATCH** `/units/{unitId}/title` body: `{ "title": string }` → `Unit`
  - Updates the unit's title. Returns the full updated unit.

### Objective management
- **PATCH** `/objectives/{objectiveId}/enabled` body: `{ "enabled": boolean }` → `Objective`
  - Toggles whether the objective is visible to students.

### Curriculum generation (AI upload — async)
- **POST** `/courses/{courseId}/units/upload`
  - Content-Type: `multipart/form-data`
  - Fields: `unitName` (string), `files` (one or more PDFs), `grade` (string, optional)
  - **Async pattern** (avoids API Gateway's 30s timeout):
    1. Parses multipart upload and stages files in S3 (`sapiens-upload-staging-681816819209`)
    2. Creates Unit immediately with `status: "processing"`
    3. Invokes Lambda async to run `Gen_Curriculum_Pipeline` in the background
    4. Returns `202` with `{ "unit": Unit, "objectives": [] }` immediately
  - The background Lambda:
    1. Downloads files from S3, runs the pipeline (Gemini → identify knowledge → generate questions)
    2. Persists: **Objectives** → **ItemStages** (3 per objective) → **Questions** → **KnowledgeTopics**
    3. Updates Unit `status` to `"ready"` (or `"error"` with `statusError` message)
    4. Cleans up S3 staging files
  - Lambda timeout: 300s (5 minutes) to accommodate large PDFs.

### Upload status polling
- **GET** `/units/{unitId}/upload-status` → `{ unitId, status, statusError? }`
  - `status` is one of: `"processing"`, `"review"`, `"ready"`, `"error"`
  - `statusError` is present only when `status === "error"`
  - Frontend polls this every 3s after upload returns, then navigates to the unit page when `"ready"`

### Unit files
- **GET** `/units/{unitId}/files` → `{ unitId, files: [{ name, size?, lastModified? }] }`
  - Lists uploaded files for a unit. Tries S3 first; falls back to `uploadedFileNames` stored on the Unit record.

### Identified knowledge (review step)
- **GET** `/units/{unitId}/identified-knowledge` → `{ unitId, identifiedKnowledge: [{ type, description }] }`
  - Returns AI-identified knowledge/skill items for teacher review (stored on Unit record after initial processing).

### Objective generation (after teacher review)
- **POST** `/units/{unitId}/generate`
  - Body: `{ "selectedObjectives": [{ "type": string, "description": string }, ...] }`
  - Triggers async question generation for teacher-selected items only. Sets unit status to `"processing"`.
  - Returns: `202` with `{ unitId, status: "processing" }`

### Edit objectives (re-review)
- **POST** `/units/{unitId}/edit-objectives` → `{ unitId, status: "review" }`
  - Resets unit to `"review"` status so the teacher can re-select objectives. Deletes existing objectives and related records.

### Reupload documents
- **POST** `/units/{unitId}/reupload`
  - Body: `{ "fileNames": string[] }`
  - Returns: `{ unitId, uploadUrls: { [filename]: presignedUrl } }`
  - Generates pre-signed S3 PUT URLs for re-uploading documents to an existing unit. Caller must upload files then call `POST /units/{unitId}/process`.

### Process unit (trigger pipeline after S3 upload)
- **POST** `/units/{unitId}/process` → `202` with `{ unitId, status: "processing" }`
  - Triggers the async curriculum pipeline after files have been uploaded to S3. Lists staged S3 files, cleans up existing objectives, and invokes Lambda async.

### Deadline management
- **PATCH** `/units/{unitId}/deadline` → `Unit`
  - Body: `{ "deadline": string }` (ISO 8601 timestamp) to set, or `{ "deadline": null }` to clear.
  - Returns the full updated unit record.

### Course title update
- **PATCH** `/courses/{courseId}/title` → `Course`
  - Body: `{ "title": string }`
  - Returns the full updated course record.

---

## 16) Delete & Restore (instructor auth required)

### Soft delete
- **DELETE** `/units/{unitId}` → `{ unitId, deletedAt }`
  - Sets `deletedAt` timestamp. Unit is excluded from listings but not permanently removed.
- **DELETE** `/courses/{courseId}` → `{ courseId, deletedAt }`
  - Sets `deletedAt` timestamp. Course is excluded from listings but not permanently removed.

### Hard delete (permanent)
- **DELETE** `/units/{unitId}/permanent` → `{ unitId, deleted: true }`
  - Permanently deletes the unit and all child records (objectives, questions, stages, threads, messages, progress, knowledge topics, knowledge queue items). Also cleans up S3 uploads.
- **DELETE** `/courses/{courseId}/permanent` → `{ courseId, deleted: true }`
  - Permanently deletes the course, all its units (and their children), and all enrollments.

### Restore
- **PATCH** `/units/{unitId}/restore` → `Unit`
  - Removes `deletedAt`, restoring the unit to active listings.
- **PATCH** `/courses/{courseId}/restore` → `Course`
  - Removes `deletedAt`, restoring the course to active listings.

---

## 17) Grading Reports & Per-Unit Feedback

### Teacher endpoints (require instructor auth)

- **GET** `/units/{unitId}/grading-report?studentId={studentId}` → `GradingReport | null`
  - Returns Sam's AI-generated grading report (teacher summary).
  - If no report exists, generates one on-demand (calls Gemini to summarize student performance).
  - Returns HTTP 200 with `null` body when no data is available yet (null-not-404).

- **GET** `/units/{unitId}/feedback?studentId={studentId}` → `FeedbackItem | null`
  - Returns teacher's written feedback for a student on a unit.
  - Returns HTTP 200 with `null` body if no feedback written yet.

- **POST** `/units/{unitId}/feedback` → `FeedbackItem`
  - Body: `{ studentId: string, body: string }`
  - Creates a new teacher feedback item (`sourceType: "teacher"`).

- **PATCH** `/feedback/{feedbackId}` → `FeedbackItem`
  - Body: `{ body: string }`
  - Updates an existing teacher feedback item's body text.

### Student endpoints (require student auth)

- **GET** `/units/{unitId}/my-grading-report` → `GradingReport | null`
  - Returns Sam's AI-generated grading report (student summary).
  - Students cannot trigger generation — returns `null` if report hasn't been generated yet.

- **GET** `/units/{unitId}/my-feedback` → `FeedbackItem | null`
  - Returns teacher's feedback for the current student on a unit.
  - Returns `null` if no feedback has been written.
