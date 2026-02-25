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
- **POST** `/threads/{threadId}/messages` body: `{ "content": string, "stageId"?: string }` → created `ChatMessage`

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
