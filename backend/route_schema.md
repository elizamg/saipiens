# API Route Schema (Sapiens API)

Base URL (example): `https://<api-id>.execute-api.us-west-1.amazonaws.com/prod`

All endpoints return JSON and include CORS headers.
Most endpoints are intended to be protected by a JWT authorizer in production; during dev you may use dev-header auth.

---

## 1) Health
- **GET** `/health` → `{ ok: true }`

---

## 2) Current student
- **GET** `/current-student` → `Student`

Identity:
- prod: JWT `sub`
- dev: `X-Dev-Student-Id` (+ optional `X-Dev-Token`)

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

- **POST** `/knowledge-queue/{queueItemId}/complete`
  - Body: `{ "is_correct": boolean }`
  - Returns: `{ "updatedItem": KnowledgeQueueItem, "newQueueItem"?: KnowledgeQueueItem }`
  - Side effects:
    - Sets `status` to `completed_correct` or `completed_incorrect` and sets `is_correct`
    - If `is_correct: false`: creates a new `pending` retry item for the same `knowledgeTopicId` with incremented `labelIndex` and `order`
    - Advances the next `pending` item in the queue to `active`

- **GET** `/units/{unitId}/knowledge-progress` → `KnowledgeProgress`
  - Returns `{ unitId, totalTopics, correctCount, incorrectCount, correctPercent, incorrectPercent }`
  - `correctCount` / `incorrectCount` count unique topics (not retries); a topic retried correctly is removed from incorrectCount

---

## 15) Instructor / Teacher routes

All instructor routes require instructor identity via `effective_instructor_id()`:
- **prod:** JWT `sub` claim + membership in the `instructors` Cognito group. If the JWT is valid but the user is not in the `instructors` group, the request is rejected as unauthorized.
- **dev:** `X-Dev-Instructor-Id: <id>` + `X-Dev-Token: dev-secret` (requires `DEV_AUTH_ENABLED=true`)

### Identity
- **GET** `/current-instructor` → `Instructor`
  - Auto-creates instructor record on first access if not found.

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

### Curriculum generation (AI upload)
- **POST** `/courses/{courseId}/units/upload`
  - Content-Type: `multipart/form-data`
  - Fields: `unitName` (string), `files` (one or more PDFs), `grade` (string, optional)
  - Runs `Gen_Curriculum_Pipeline`:
    1. Uploads PDFs to Gemini Files API
    2. Identifies knowledge items (`type: "information"|"skill"`, `description`)
    3. Generates one question per item
    4. Persists: **Unit** → **Objectives** (one per item, `kind: "knowledge"|"skill"`) → **ItemStages** (3 per objective: `begin`/`walkthrough`/`challenge`) → **Questions** (one per objective)
  - Response: `{ "unit": Unit, "objectives": Objective[] }` (201)
  - Returns 422 if no knowledge items are identified from the content.
  - Note: this call can take 30–120s depending on PDF size and Gemini latency. Lambda timeout is 30s by default — may need increase for large files.
