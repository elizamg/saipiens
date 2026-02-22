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
| **Objective** | `id`, `unitId`, `kind`, `title`, `order`, `description?`, `enabled?` | `kind`: `"knowledge"` \| `"skill"` \| `"capstone"`. `order` is a number used for sorting objectives within a unit. `description` is optional display text. `enabled` indicates whether students see the objective (default `true`). |
| **ItemStage** | `id`, `itemId`, `stageType`, `order`, `prompt` | `itemId` is the parent objective's `id`. `stageType`: `"begin"` \| `"walkthrough"` \| `"challenge"`. Each objective has exactly 3 stages. `order` determines display order (1, 2, 3). `prompt` is the stage's question text. |

### 2.3 Progress

| Type | Fields | Notes |
|------|--------|--------|
| **StudentObjectiveProgress** | `studentId`, `objectiveId`, `earnedStars`, `currentStageType`, `updatedAt` | `earnedStars`: `0` \| `1` \| `2` \| `3`. Stars map to completed stages: 1 = begin done, 2 = walkthrough done, 3 = challenge done. `currentStageType`: `"begin"` \| `"walkthrough"` \| `"challenge"` = the stage currently being worked on. |
| **UnitProgress** (computed) | `unitId`, `totalObjectives`, `completedObjectives`, `progressPercent` | `completedObjectives` = count of objectives with `earnedStars === 3`. |

### 2.4 Awards & Feedback

| Type | Fields | Notes |
|------|--------|--------|
| **Award** | `id`, `courseId`, `title`, `subtitle`, `iconKey` | `iconKey`: `"early"` \| `"medium"` \| `"owl"`. |
| **FeedbackItem** | `id`, `courseId`, `unitId`, `title`, `body`, `ctaLabel?`, `sourceType`, `instructorId?` | `sourceType`: `"teacher"` \| `"sam"`. `instructorId` set when `sourceType === "teacher"`. |

### 2.5 Chat

| Type | Fields | Notes |
|------|--------|--------|
| **ChatThread** | `id`, `unitId`, `courseId`, `objectiveId`, `title`, `kind`, `lastMessageAt` | One thread per objective. `kind`: `"knowledge"` \| `"skill"` \| `"capstone"`. |
| **ThreadWithProgress** (computed) | ChatThread + `earnedStars`, `currentStageType`, `currentStageId`, `order` | Used in unit chat view. `earnedStars`: `0`–`3`. `currentStageType`: `"begin"` \| `"walkthrough"` \| `"challenge"`. `currentStageId`: the `id` of the current `ItemStage`. `order`: from the parent objective. |
| **ChatMessage** | `id`, `threadId`, `stageId?`, `role`, `content`, `createdAt`, `attachments?`, `metadata?` | `role`: `"student"` \| `"tutor"`. `stageId` scopes the message to a specific stage. Stage prompts are **not** stored as messages; they come from **ItemStage**. |
| **ChatMessageAttachment** | `type` (`"image"` \| `"file"`), `url`, `name?` | Optional on messages. |
| **ChatMessageMetadata** | `isFeedback?`, `isSystemMessage?`, `earnedStars?`, `isCompletionMessage?` | All fields optional booleans, except `earnedStars` which is a number. |

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

### 3.6 Objectives & Stages

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listObjectives(unitId)` | All objectives for the unit. Response: **Objective[]**. |
| `getObjective(objectiveId)` | One objective. Response: **Objective** or 404. |
| `listItemStages(itemId)` | All stages for the objective (identified by `itemId` = objective id), **sorted by `order` ascending**. Response: **ItemStage[]**. |
| `getStage(stageId)` | One stage by id. Response: **ItemStage** or 404. |

### 3.7 Student Progress

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `getStudentObjectiveProgress(studentId, objectiveId)` | Progress for that objective. Response: **StudentObjectiveProgress** or 404/undefined. |
| `listStudentProgressForUnit(studentId, unitId)` | All objective progress for that student in that unit. Response: **StudentObjectiveProgress[]**. |
| `getUnitProgress(studentId, unitId)` | Aggregated progress for the unit. Response: **UnitProgress** (can be computed server-side from objectives + progress). |
| `advanceStage(studentId, itemId)` | Advance the student's progress on the objective to the next stage. Increments `earnedStars` and moves `currentStageType` forward (begin → walkthrough → challenge). If no progress exists, creates it with `earnedStars: 1` and `currentStageType: "walkthrough"`. Response: **StudentObjectiveProgress**. |

### 3.8 Awards

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listAwards(studentId)` | All awards earned by the student. Response: **Award[]**. |
| `listAwardsForCourse(studentId, courseId)` | Awards for that student in that course. Response: **Award[]**. |

### 3.9 Feedback

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
| `sendMessage(threadId, content, stageId?)` | Create a student message; backend should persist it and (if applicable) trigger tutor/AI reply. Response: **ChatMessage** (the created message). |

### 3.12 Teacher Objectives

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listTeacherObjectives(unitId)` | Return all objectives for the given unit (teacher view, includes `description` and `enabled` fields). Response: **Objective[]**. |
| `updateObjectiveEnabled(objectiveId, enabled)` | Toggle whether students see the objective. Response: **Objective** (updated). |

### 3.13 Teacher Unit Upload

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `createUnitFromUpload(courseId, files)` | Accepts a `multipart/form-data` request with up to 10 text-based files (`.pdf`, `.txt`, `.docx`, `.doc`, `.md`, `.rtf`). The backend should process/parse the documents (potentially via LLM) and generate learning objectives. This is expected to be a **long-running request** (~seconds). Response: `{ unit: Unit, objectives: Objective[] }`. |

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
| `createNewStudent(firstName, lastName, email)` | Create a new student record. Response: **Student** (with generated `id`). |

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

- Each **Objective** has exactly 3 **ItemStages**: begin (1 star), walkthrough (2 stars), challenge (3 stars).
- Stars represent **progress milestones**, not difficulty. Completing each stage awards stars cumulatively.
- Progression is linear: begin → walkthrough → challenge. A student cannot skip stages.

---

## 5. Summary Checklist for Backend

- [ ] **Auth**: Endpoint or middleware that resolves current user and returns a **Student** (or equivalent) for the frontend.
- [ ] **Courses**: List by student, get by id.
- [ ] **Instructors**: List by ids.
- [ ] **Units**: List by course, get by id.
- [ ] **Objectives**: List by unit, get by id. Include `order` field for sorting.
- [ ] **ItemStages**: List by objective (sorted by order), get by id. Each objective has exactly 3 stages (begin, walkthrough, challenge) with a `prompt`.
- [ ] **Progress**: Per-objective and per-unit progress for a student; support **UnitProgress** (computed or stored). Support **advanceStage** to move a student forward.
- [ ] **Awards**: List by student; optionally by student + course.
- [ ] **Feedback**: List by student; list by course.
- [ ] **Chat**: Threads for unit (with progress); get thread (with optional progress); list messages (optional filter by stage); send message and return created **ChatMessage**.
- [ ] **Teacher Objectives**: List objectives for a unit (with `description` and `enabled`); toggle `enabled` on an objective.
- [ ] **Teacher Unit Upload**: Accept multipart file upload (up to 10 files), process documents, return new `Unit` + generated `Objective[]`.
- [ ] **Teacher Courses**: Create a new course with title, icon, and initial roster.
- [ ] **Teacher Roster**: List all students, get/update course roster, create new student.

Once these are implemented and responses match (or are mapped to) the types in `frontend/src/types/domain.ts`, the frontend can switch from `mock/db` to the real backend with minimal changes to UI code.
