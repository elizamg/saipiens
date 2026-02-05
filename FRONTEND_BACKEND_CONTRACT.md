# Frontend–Backend Contract

This document describes what the **frontend expects the backend to provide**: API surface, data shapes, and behaviors. Use it when designing backend routes, databases, and responses so the frontend can switch from mock data to live APIs without breaking.

---

## 1. Overview

- **Auth**: The app assumes a **current student** (or teacher, for teacher views). The frontend needs a way to resolve “current user” (e.g. session, JWT) and to fetch that user’s profile.
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
| **Objective** | `id`, `unitId`, `kind`, `title` | `kind`: `"knowledge"` \| `"skill"`. One per Knowledge/Skill section. |
| **Question** | `id`, `objectiveId`, `difficultyStars`, `prompt` | `difficultyStars`: `1` \| `2` \| `3`. Sorted by difficulty in UI. |

### 2.3 Progress

| Type | Fields | Notes |
|------|--------|--------|
| **StudentObjectiveProgress** | `studentId`, `objectiveId`, `earnedStars`, `currentQuestionId`, `updatedAt` | `earnedStars`: `0` \| `1` \| `2` \| `3` = highest difficulty completed. |
| **UnitProgress** (computed) | `unitId`, `totalObjectives`, `completedObjectives`, `progressPercent` | `completedObjectives` = count of objectives with `earnedStars === 3`. |

### 2.4 Awards & Feedback

| Type | Fields | Notes |
|------|--------|--------|
| **Award** | `id`, `courseId`, `title`, `subtitle`, `iconKey` | `iconKey`: `"early"` \| `"medium"` \| `"owl"`. |
| **FeedbackItem** | `id`, `courseId`, `unitId`, `title`, `body`, `ctaLabel?`, `sourceType`, `instructorId?` | `sourceType`: `"teacher"` \| `"sam"`. `instructorId` set when `sourceType === "teacher"`. |

### 2.5 Chat

| Type | Fields | Notes |
|------|--------|--------|
| **ChatThread** | `id`, `unitId`, `courseId`, `objectiveId`, `title`, `kind`, `lastMessageAt` | One thread per objective. `kind`: `"knowledge"` \| `"skill"`. |
| **ThreadWithProgress** (computed) | ChatThread + `earnedStars`, `currentDifficultyStars`, `currentQuestionId` | Used in unit chat view. |
| **ChatMessage** | `id`, `threadId`, `questionId?`, `role`, `content`, `createdAt`, `attachments?`, `metadata?` | `role`: `"student"` \| `"tutor"`. `metadata`: `{ isFeedback?: boolean; isSystemMessage?: boolean }`. Question prompts are **not** stored as messages; they come from **Question**. |
| **ChatMessageAttachment** | `type` (`"image"` \| `"file"`), `url`, `name?` | Optional on messages. |

---

## 3. Expected API Surface

The frontend currently calls the following. The backend should provide equivalent endpoints (REST or equivalent) and return the shapes above (or a 1:1 mappable format).

### 3.1 Auth / Current User

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `getCurrentStudent()` | Return the **current student** (from session/JWT). Response: **Student**. |

If you support teachers, a similar `getCurrentTeacher()` (or role-aware “current user”) may be needed later.

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

### 3.6 Objectives & Questions

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listObjectives(unitId)` | All objectives for the unit. Response: **Objective[]**. |
| `getObjective(objectiveId)` | One objective. Response: **Objective** or 404. |
| `listQuestionsForObjective(objectiveId)` | All questions for the objective, **sorted by difficultyStars ascending**. Response: **Question[]**. |
| `getQuestion(questionId)` | One question. Response: **Question** or 404. |

### 3.7 Student Progress

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `getStudentObjectiveProgress(studentId, objectiveId)` | Progress for that objective. Response: **StudentObjectiveProgress** or 404/undefined. |
| `listStudentProgressForUnit(studentId, unitId)` | All objective progress for that student in that unit. Response: **StudentObjectiveProgress[]**. |
| `getUnitProgress(studentId, unitId)` | Aggregated progress for the unit. Response: **UnitProgress** (can be computed server-side from objectives + progress). |

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
| `getThreadWithProgress(threadId, studentId)` | One thread plus earned stars and current question. Response: **ThreadWithProgress** or 404. |

### 3.11 Chat Messages

| Frontend call | Expected backend behavior |
|---------------|---------------------------|
| `listMessages(threadId, questionId?)` | Messages in the thread; if `questionId` is provided, filter to that question. **Sorted by `createdAt` ascending.** Response: **ChatMessage[]**. |
| `sendMessage(threadId, content, questionId?)` | Create a student message; backend should persist it and (if applicable) trigger tutor/AI reply. Response: **ChatMessage** (the created message). |

---

## 4. Conventions and Behaviors

### 4.1 Errors

- Use appropriate HTTP status codes (e.g. 401 for unauthenticated, 403 for forbidden, 404 for not found).
- The frontend can display a generic error or message from the response body; a consistent error shape (e.g. `{ message: string; code?: string }`) is helpful.

### 4.2 Pagination

- Current frontend does not paginate lists (courses, units, messages in a thread, etc.). For very large lists (e.g. messages), the backend may later add cursor- or page-based params; the frontend would then be updated to request pages.

### 4.3 Real-time (Chat)

- The UI does not yet assume WebSockets or SSE. Polling or “load messages after send” is acceptable. If the backend adds real-time delivery of new tutor messages, the frontend can be extended to subscribe.

### 4.4 Question prompts vs chat messages

- **Question text** is stored only on **Question** (e.g. `prompt`). It is shown in the chat header as the “current question,” not as a chat message.
- **Chat messages** are student answers, tutor replies, and optional system messages (e.g. “3 stars earned”). The backend should not store the question prompt as a message.

### 4.5 Thread–objective relationship

- One **ChatThread** per **Objective** (per unit/course). Threads are tied to `objectiveId`; listing threads for a unit is effectively listing threads for that unit’s objectives (with progress).

---

## 5. Summary Checklist for Backend

- [ ] **Auth**: Endpoint or middleware that resolves current user and returns a **Student** (or equivalent) for the frontend.
- [ ] **Courses**: List by student, get by id.
- [ ] **Instructors**: List by ids.
- [ ] **Units**: List by course, get by id.
- [ ] **Objectives**: List by unit, get by id.
- [ ] **Questions**: List by objective (sorted by difficulty), get by id.
- [ ] **Progress**: Per-objective and per-unit progress for a student; support **UnitProgress** (computed or stored).
- [ ] **Awards**: List by student; optionally by student + course.
- [ ] **Feedback**: List by student; list by course.
- [ ] **Chat**: Threads for unit (with progress); get thread (with optional progress); list messages (optional filter by question); send message and return created **ChatMessage**.

Once these are implemented and responses match (or are mapped to) the types in `frontend/src/types/domain.ts`, the frontend can switch from `mock/db` to the real backend with minimal changes to UI code.
