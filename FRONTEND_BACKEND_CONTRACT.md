# Frontend–Backend Contract

This document describes what the **frontend expects the backend to provide**: API surface, data shapes, and behaviors. Use it when designing backend routes, databases, and responses so the frontend can switch from mock data to live APIs without breaking.

---

## 1. Overview

- **Auth**: The app assumes a **current student** (or teacher, for teacher views). The frontend needs a way to resolve "current user" (e.g. session, JWT) and to fetch that user's profile.
- **Data flow**: The frontend currently uses `src/services/api.ts` and `src/types/domain.ts`. Backend responses should match these types (or be easily mappable).
- **Computed vs raw**: Some types are **computed** on the frontend (e.g. `UnitProgress`, `ThreadWithProgress`). The backend may either:
  - Send the raw entities and let the frontend compute these, or
  - Expose endpoints that return these shapes directly (recommended for consistency and less client logic).

---

## 2. Domain Types (Payloads the Backend Must Be Able to Send)

All IDs are strings. Timestamps are ISO 8601 strings (e.g. `"2024-01-15T10:30:00Z"`).

### 2.1 People

| Type | Fields | Notes |
|------|--------|--------|
| **Student** | `id`, `name`, `yearLabel`, `avatarUrl?` | Current user and possibly others. |
| **Instructor** | `id`, `name`, `avatarUrl?` | Used for course attribution and feedback. |

### 2.2 Courses & Structure

| Type | Fields | Notes |
|------|--------|--------|
| **Course** | `id`, `title`, `icon?`, `instructorIds: string[]`, `enrolledStudentIds: string[]` | |
| **Unit** | `id`, `courseId`, `title`, `status` | `status`: `"active"` \| `"completed"` \| `"locked"` |
| **Objective** | `id`, `unitId`, `kind`, `title`, `order`, `description?`, `enabled?` | `kind`: `"skill"` \| `"capstone"` only (knowledge is now a separate queue system). `order` is a number used for sorting within a unit. |
| **ItemStage** | `id`, `itemId`, `stageType`, `order`, `prompt` | `itemId` is the parent objective's `id`. `stageType`: `"begin"` \| `"walkthrough"` \| `"challenge"`. Each objective has exactly 3 stages. `order` determines display order (1, 2, 3). `prompt` is the stage's question text. |
| **KnowledgeTopic** | `id`, `unitId`, `knowledgeTopic`, `order` | Teacher-visible descriptive name (e.g. "Magnetic Fields Around Wires"). `order` is the display order within the unit. Not shown to students. |
| **KnowledgeQueueItem** | `id`, `unitId`, `studentId`, `knowledgeTopicId`, `labelIndex`, `order`, `status`, `is_correct?`, `questionPrompt`, `suggestedQuestions?`, `createdAt` | Student-facing queue entry. `labelIndex` drives the "Knowledge N" student label. `status`: `"pending"` \| `"active"` \| `"completed_correct"` \| `"completed_incorrect"`. `is_correct` mirrors the `grade_info()` backend output field name. Only items with `status !== "pending"` are visible to students. `suggestedQuestions` are optional pill prompts shown when the student hasn't typed anything yet (active items only). |

### 2.3 Progress

| Type | Fields | Notes |
|------|--------|--------|
| **StudentObjectiveProgress** | `studentId`, `objectiveId`, `progressState`, `currentStageType`, `updatedAt` | `progressState`: `"not_started"` \| `"walkthrough_started"` \| `"walkthrough_complete"` \| `"challenge_started"` \| `"challenge_complete"`. Applies to **skill** and **capstone** objectives only. |
| **UnitProgress** (computed) | `unitId`, `totalObjectives`, `completedObjectives`, `progressPercent` | Covers **skill + capstone** objectives only (knowledge excluded). `completedObjectives` = count with `progressState === "challenge_complete"`. |
| **KnowledgeProgress** (computed) | `unitId`, `totalTopics`, `correctCount`, `incorrectCount`, `correctPercent`, `incorrectPercent` | Counts unique knowledge topics, not queue retries. A topic retried correctly is removed from `incorrectCount`. Displayed as a separate dual-tone progress bar (green = correct, grey = incorrect). |

### 2.4 Awards & Feedback

| Type | Fields | Notes |
|------|--------|--------|
| **Award** | `id`, `courseId`, `title`, `subtitle`, `iconKey` | `iconKey`: `"early"` \| `"medium"` \| `"owl"`. |
| **FeedbackItem** | `id`, `courseId`, `unitId`, `title`, `body`, `ctaLabel?`, `sourceType`, `instructorId?` | `sourceType`: `"teacher"` \| `"sam"`. `instructorId` set when `sourceType === "teacher"`. Used for legacy feedback list on the student home page. For unit-specific teacher feedback see §3.18. |
| **GradingReport** | `id`, `unitId`, `studentId`, `summary`, `createdAt` | Sam's AI-generated grading report for a student's unit performance. `summary` is role-aware: the **teacher** endpoint returns a detailed/analytical summary; the **student** endpoint returns an encouraging/actionable summary. Same underlying data, different tone. |

### 2.5 Chat

| Type | Fields | Notes |
|------|--------|--------|
| **ChatThread** | `id`, `unitId`, `courseId`, `objectiveId`, `title`, `kind`, `lastMessageAt` | One thread per objective. `kind`: `"skill"` \| `"capstone"` (knowledge items use the queue system, not threads). |
| **ThreadWithProgress** (computed) | ChatThread + `progressState`, `currentStageType`, `currentStageId`, `order` | Used in unit chat view. `progressState`: `"not_started"` \| `"walkthrough_started"` \| `"walkthrough_complete"` \| `"challenge_started"` \| `"challenge_complete"`. `currentStageType`: `"begin"` \| `"walkthrough"` \| `"challenge"`. `currentStageId`: the `id` of the current `ItemStage`. `order`: from the parent objective. |
| **ChatMessage** | `id`, `threadId`, `stageId?`, `role`, `content`, `createdAt`, `attachments?`, `metadata?` | `role`: `"student"` \| `"tutor"`. `stageId` scopes the message to a specific stage. Stage prompts are **not** stored as messages; they come from **ItemStage**. |
| **ChatMessageAttachment** | `type` (`"image"` \| `"file"`), `url`, `name?` | Optional on messages. |
| **ChatMessageMetadata** | `isFeedback?`, `isSystemMessage?`, `progressState?`, `isCompletionMessage?` | All fields optional. `progressState` records the `ProgressState` reached at a completion message. |

---

## 3. Expected API Surface

The frontend currently calls the following. The backend should provide equivalent endpoints (REST or equivalent) and return the shapes above (or a 1:1 mappable format).

### 3.1 Auth / Current User

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `getCurrentStudent()` | Return the **current student** (from session/JWT). Response: **Student**. |

If you support teachers, a similar `getCurrentTeacher()` (or role-aware "current user") may be needed later.

### 3.2 Student

- No additional student list endpoints are required for the current UI; current user is enough.

### 3.3 Courses

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listCoursesForStudent(studentId)` | Return all courses the student is enrolled in. Response: **Course[]**. |
| `getCourse(courseId)` | Return one course by id. Response: **Course** or 404. |

### 3.4 Instructors

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listInstructors(ids: string[])` | Return instructors whose `id` is in `ids`. Response: **Instructor[]**. |

### 3.5 Units

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listUnits(courseId)` | All units for the course. Response: **Unit[]**. |
| `getUnit(unitId)` | One unit by id. Response: **Unit** or 404. |
| `updateUnitTitle(unitId, title)` | Update the title of a unit. Called when a teacher edits the unit name inline on the unit editor page. Response: **Unit** (updated). |

### 3.6 Objectives & Stages

Note: **knowledge** items are no longer part of `Objectives`. They use the separate Knowledge Queue system (§3.16–3.17). `listObjectives` returns only `skill` and `capstone` objectives.

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listObjectives(unitId)` | All **skill + capstone** objectives for the unit. Response: **Objective[]**. |
| `getObjective(objectiveId)` | One objective. Response: **Objective** or 404. |
| `listItemStages(itemId)` | All stages for the objective (identified by `itemId` = objective id), **sorted by `order` ascending**. Response: **ItemStage[]**. |
| `getStage(stageId)` | One stage by id. Response: **ItemStage** or 404. |

### 3.7 Student Progress

`UnitProgress` covers skill + capstone objectives only. Knowledge progress is separate (see §3.17).

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `getStudentObjectiveProgress(studentId, objectiveId)` | Progress for that objective. Response: **StudentObjectiveProgress** or 404/undefined. |
| `listStudentProgressForUnit(studentId, unitId)` | All objective progress for that student in that unit. Response: **StudentObjectiveProgress[]**. |
| `getUnitProgress(studentId, unitId)` | Aggregated skill+capstone progress for the unit. Response: **UnitProgress**. |
| `advanceStage(studentId, itemId)` | Advance the student's progress on the objective. Response: **StudentObjectiveProgress**. |

### 3.8 Awards

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listAwards(studentId)` | All awards earned by the student. Response: **Award[]**. |
| `listAwardsForCourse(studentId, courseId)` | Awards for that student in that course. Response: **Award[]**. |

### 3.9 Feedback (Legacy List)

These are used on the student home/dashboard page to show a summary feed of past feedback.

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listFeedback(studentId)` | All feedback items for the student (across their courses). Response: **FeedbackItem[]**. |
| `listFeedbackForCourse(courseId)` | Feedback for that course. Response: **FeedbackItem[]**. |

### 3.10 Chat Threads

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listChatThreadsForUnit({ courseId, unitId, studentId })` | All threads for that unit, with progress for that student. Response: **ThreadWithProgress[]**. |
| `getThread(threadId)` | One thread. Response: **ChatThread** or 404. |
| `getThreadWithProgress(threadId, studentId)` | One thread plus earned stars, current stage type, current stage id, and order. Response: **ThreadWithProgress** or 404. |

### 3.11 Chat Messages

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listMessages(threadId, stageId?)` | Messages in the thread; if `stageId` is provided, filter to that stage. **Sorted by `createdAt` ascending.** Response: **ChatMessage[]**. |
| `sendMessage(threadId, content, stageId?, stageType?)` | Create a student message and trigger the AI tutor pipeline. `stageType` (`"walkthrough"` \| `"challenge"`) tells the backend which pipeline to run. Response: `{ studentMessage: ChatMessage, tutorMessage: ChatMessage \| null }`. `tutorMessage` is `null` only when no pipeline applies (e.g. `begin` stage). |

### 3.12 Teacher Objectives

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listTeacherObjectives(unitId)` | Return all objectives for the given unit (teacher view, includes `description` and `enabled` fields). Response: **Objective[]**. |
| `updateObjectiveEnabled(objectiveId, enabled)` | Toggle whether students see the objective. Response: **Objective** (updated). |

### 3.13 Teacher Unit Upload

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `createUnitFromUpload(courseId, files, unitTitle?)` | Accepts a `multipart/form-data` request with up to 10 text-based files (`.pdf`, `.txt`, `.docx`, `.doc`, `.md`, `.rtf`) and an optional `unitTitle` string. The teacher names the unit before uploading; this name should be used as the unit's `title`. The backend should process/parse the documents (potentially via LLM) and generate learning objectives. This is expected to be a **long-running request** (~seconds). Response: `{ unit: Unit, objectives: Objective[] }`. |

### 3.14 Teacher Courses

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `createCourse({ title, icon, studentIds })` | Create a new course with the given title, icon key (`"history"` \| `"science"` \| `"general"`), and initial student roster. Response: `{ id, title, studentCount, icon }` (TeacherCourse shape). |

### 3.15 Teacher Roster

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listTeacherStudents()` | Return all students available for roster assignment. Response: **Student[]**. |
| `getCourseRoster(courseId)` | Return the list of student IDs enrolled in the course. Response: **string[]**. |
| `updateCourseRoster(courseId, studentIds)` | Replace the course roster with the given student IDs. Response: `{ studentIds: string[] }`. |
| `createNewStudent(firstName, lastName, email)` | Create a new student record. `email` is **required** and must be a valid email address (validated on the frontend before submission; backend should also validate). Response: **Student** (with generated `id`). |

### 3.16 Knowledge Topics (teacher-visible)

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listKnowledgeTopics(unitId)` | All knowledge topics for the unit, sorted by `order` asc. Response: **KnowledgeTopic[]**. Used in teacher views; not exposed to students. |

### 3.17 Knowledge Queue (student-facing)

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `getKnowledgeQueue(unitId, studentId)` | Visible queue items (status ≠ `"pending"`), sorted by `order` asc. Response: **KnowledgeQueueItem[]**. The backend should infer `studentId` from JWT in production. |
| `listKnowledgeMessages(queueItemId)` | All chat messages for a knowledge queue item, sorted by `createdAt` asc. Response: **ChatMessage[]**. The `threadId` field on each message equals `queueItemId`. |
| `sendKnowledgeMessage(queueItemId, role, content, metadata?)` | Persist a single message for a knowledge queue item. `role`: `"student"` \| `"tutor"`. In production this is called by the frontend for student messages; tutor replies are generated by the backend. Response: **ChatMessage**. |
| `completeKnowledgeAttempt(unitId, studentId, queueItemId, is_correct)` | Grade a queue item. Sets `status` to `completed_correct` or `completed_incorrect` and `is_correct`. If `is_correct: false`, creates a new `pending` retry item appended to the queue with a new `labelIndex`. Advances the next `pending` item to `active`. Response: `{ updatedItem: KnowledgeQueueItem, newQueueItem?: KnowledgeQueueItem }`. The `is_correct` field name mirrors the `grade_info()` backend function output. |
| `getKnowledgeProgress(unitId, studentId)` | Knowledge progress summary. Response: **KnowledgeProgress**. Counts unique topics (not retries); a topic with a correct retry is removed from `incorrectCount`. |

### 3.18 Grading Reports & Per-Unit Feedback (Feedback Tab)

These endpoints power the new **Feedback tab** — a dedicated section where teachers can review Sam's grading reports and write per-student feedback, and students can read both.

#### Key behaviors

1. **Null-not-404**: All four GET endpoints below return **HTTP 200 with `null`** as the body when the resource doesn't exist yet (report not generated, feedback not written). Do **not** return 404 — the frontend uses `null` to show a "Waiting" placeholder.
2. **Role-aware report summary**: `GET /units/{unitId}/grading-report` (teacher) and `GET /units/{unitId}/my-grading-report` (student) can point to the same underlying record, but the `summary` text should differ in tone:
   - **Teacher**: detailed, analytical (e.g. "The student showed strong understanding of X but struggled with Y...")
   - **Student**: encouraging and actionable (e.g. "Great effort! You've shown real understanding of X. To keep growing, try reviewing Y...")
   - Simplest implementation: store both summaries on the same record (`teacherSummary`, `studentSummary`) and return the appropriate one based on JWT role.
3. **Create vs Update flow**: The frontend calls `POST /units/{unitId}/feedback` the first time a teacher writes feedback, and `PATCH /feedback/{feedbackId}` on edits. The frontend tracks whether feedback exists and picks the right call automatically.

#### Teacher endpoints

| Frontend call | Method + Path | Auth | Request body | Response |
|---|---|---|---|---|
| `getUnitGradingReport(unitId, studentId)` | `GET /units/{unitId}/grading-report?studentId={studentId}` | instructor | — | **GradingReport** or `null` |
| `getUnitFeedbackForStudent(unitId, studentId)` | `GET /units/{unitId}/feedback?studentId={studentId}` | instructor | — | **FeedbackItem** or `null` |
| `createUnitFeedback(unitId, studentId, body)` | `POST /units/{unitId}/feedback` | instructor | `{ studentId: string, body: string }` | **FeedbackItem** (created) |
| `updateFeedback(feedbackId, body)` | `PATCH /feedback/{feedbackId}` | instructor | `{ body: string }` | **FeedbackItem** (updated) |

#### Student endpoints

| Frontend call | Method + Path | Auth | Request body | Response |
|---|---|---|---|---|
| `getMyUnitGradingReport(unitId)` | `GET /units/{unitId}/my-grading-report` | student | — | **GradingReport** or `null` |
| `getMyUnitFeedback(unitId)` | `GET /units/{unitId}/my-feedback` | student | — | **FeedbackItem** or `null` |

#### FeedbackItem fields for unit-specific teacher feedback

When created via `POST /units/{unitId}/feedback`, the returned **FeedbackItem** should include:

| Field | Value |
|-------|-------|
| `id` | Generated UUID |
| `courseId` | Resolved from the unit's `courseId` |
| `unitId` | From URL param |
| `title` | Unit title (or empty string — not displayed in the new Feedback tab UI) |
| `body` | From request `body` field |
| `sourceType` | `"teacher"` |
| `instructorId` | From JWT (the authenticated instructor's id) |
| `ctaLabel` | Optional; not used by the Feedback tab |

---

## 4. Conventions and Behaviors

### 4.1 Errors

- Use appropriate HTTP status codes (e.g. 401 for unauthenticated, 403 for forbidden, 404 for not found).
- The frontend can display a generic error or message from the response body; a consistent error shape (e.g. `{ message: string; code?: string }`) is helpful.

### 4.2 Pagination

- Current frontend does not paginate lists (courses, units, messages in a thread, etc.). For very large lists (e.g. messages), the backend may later add cursor- or page-based params; the frontend would then be updated to request pages.

### 4.3 Real-time (Chat)

- The UI does not yet assume WebSockets or SSE. Polling or "load messages after send" is acceptable. If the backend adds real-time delivery of new tutor messages, the frontend can be extended to subscribe.

### 4.4 Stage prompts vs chat messages

- **Stage prompt text** is stored only on **ItemStage** (the `prompt` field). It is shown in the chat as the "current stage prompt," not as a chat message.
- **Chat messages** are student answers, tutor replies, and optional system messages (e.g. "3 stars earned"). The backend should not store the stage prompt as a message.

### 4.5 Thread–objective relationship

- One **ChatThread** per **Objective** (per unit/course). Threads are tied to `objectiveId`; listing threads for a unit is effectively listing threads for that unit's objectives (with progress).

### 4.6 Stage progression model

- Each **Objective** (skill or capstone) has exactly 3 **ItemStages**: `begin`, `walkthrough`, `challenge`.
- Progress is tracked as a 5-state `ProgressState`: `not_started` → `walkthrough_started` → `walkthrough_complete` → `challenge_started` → `challenge_complete`.
- Progression is linear: begin → walkthrough → challenge. A student cannot skip stages.
- Knowledge items do not use stages or `ProgressState`; they use the `KnowledgeItemStatus` queue model instead.

---

## 5. Summary Checklist for Backend

- [ ] **Auth**: Endpoint or middleware that resolves current user and returns a **Student** (or equivalent) for the frontend.
- [ ] **Courses**: List by student, get by id.
- [ ] **Instructors**: List by ids.
- [ ] **Units**: List by course, get by id. Update unit title (PATCH title field).
- [ ] **Objectives**: List by unit (skill + capstone only — knowledge is separate), get by id. Include `order` field for sorting.
- [ ] **ItemStages**: List by objective (sorted by order), get by id. Each objective has exactly 3 stages (begin, walkthrough, challenge) with a `prompt`.
- [ ] **Progress (skills)**: Per-objective and per-unit progress for a student; support **UnitProgress** (skill+capstone only). Support **advanceStage** to move a student forward.
- [ ] **Awards**: List by student; optionally by student + course.
- [ ] **Feedback**: List by student; list by course.
- [x] **Chat**: Threads for unit (with progress); get thread (with optional progress); list messages (optional filter by stage); send message returns `{ studentMessage, tutorMessage | null }` with synchronous AI tutor reply.
- [ ] **Teacher Objectives**: List objectives for a unit (with `description` and `enabled`); toggle `enabled` on an objective.
- [ ] **Teacher Unit Upload**: Accept multipart file upload (up to 10 files) plus a `unitTitle` string field, process documents, return new `Unit` (with the provided title) + generated `Objective[]`.
- [ ] **Teacher Courses**: Create a new course with title, icon, and initial roster.
- [ ] **Teacher Roster**: List all students, get/update course roster, create new student (email required and validated).
- [ ] **Knowledge Topics**: Store and retrieve **KnowledgeTopic** records per unit (teacher-visible descriptive names).
- [ ] **Knowledge Queue**: Store **KnowledgeQueueItem** records per student per unit. Support `getKnowledgeQueue` (visible items only), `completeKnowledgeAttempt` (grade + retry logic + advance next item), and `getKnowledgeProgress` (unique-topic aggregation). `is_correct` field name must match `grade_info()` backend output.
- [ ] **Grading Reports**: Generate and store **GradingReport** records per student per unit. Expose teacher-view (`GET /units/{id}/grading-report?studentId=`) and student-view (`GET /units/{id}/my-grading-report`) endpoints. Both return `null` (HTTP 200) when no report exists yet. Store or generate role-appropriate `summary` text (detailed for teacher, encouraging for student). See §3.18.
- [ ] **Per-unit teacher feedback**: CRUD for teacher-written feedback on a per-student, per-unit basis. `GET` endpoints return `null` (HTTP 200) when no feedback exists — not 404. `POST` creates, `PATCH` updates by `feedbackId`. See §3.18 for exact paths, request/response shapes, and FeedbackItem field values.

Once these are implemented and responses match (or are mapped to) the types in `frontend/src/types/domain.ts`, the frontend can switch from `mock/db` to the real backend with minimal changes to UI code.
