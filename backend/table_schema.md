# DynamoDB Table Schema (Sapiens API)

**Region:** us-west-1  
**Design:** multi-table (one entity per table), schema-less attributes, keys/GSIs defined for access patterns.  
**ID convention:** primary identifiers are strings.  
**Timestamps:** ISO 8601 strings, e.g. `2026-02-13T08:49:21Z`.

---

## 1) Students
**Table:** `Students`  
**PK:** `id` (String) — Cognito `sub`

Typical attributes:
- `id`, `name`, `yearLabel`, `avatarUrl?`
- `createdAt`, `updatedAt`

Access patterns:
- Get by id

---

## 2) Instructors
**Table:** `Instructors`  
**PK:** `id` (String)

Typical attributes:
- `id`, `name`, `avatarUrl?`

Access patterns:
- Get by id
- Batch get by ids

---

## 3) Courses
**Table:** `Courses`  
**PK:** `id` (String)

Typical attributes:
- `id`, `title`, `icon?`
- `instructorIds: string[]`

Access patterns:
- Get by id

---

## 4) Enrollments
**Table:** `Enrollments`  
**PK:** `studentId` (String)  
**SK:** `courseId` (String)

Access patterns:
- List courses for studentId (query by PK)

---

## 5) Units
**Table:** `Units`  
**PK:** `id` (String)

**GSI:** `CourseUnitsIndex`
- PK: `courseId` (String)
- SK: `id` (String)

Typical attributes:
- `id`, `courseId`, `title`, `status` (`active|completed|locked|processing|ready|error`)
- `statusError?` (String) — error message when `status === "error"` (set by async upload pipeline)

Access patterns:
- Get unit by id
- List units for courseId (GSI)

Notes:
- During async curriculum upload, `status` transitions: `"processing"` → `"ready"` | `"error"`.
- Pre-existing units without `status` default to `"active"` on read.

---

## 6) Objectives
**Table:** `Objectives`  
**PK:** `id` (String)

**GSI:** `UnitObjectivesIndex`
- PK: `unitId` (String)
- SK: `id` (String)  *(note: display ordering uses attribute `order`)*

Typical attributes:
- `id`, `unitId`, `kind` (`knowledge|skill|capstone`), `title`
- `order` (Number) — required by frontend for sorting

Access patterns:
- Get objective by id
- List objectives for unitId (GSI) then sort by `order`

---

## 7) Questions
**Table:** `Questions`  
**PK:** `id` (String)

**GSI:** `ObjectiveQuestionsIndex`
- PK: `objectiveId` (String)
- SK: `difficultyStars` (Number)

Typical attributes:
- `id`, `objectiveId`, `difficultyStars` (1–3), `prompt`

Access patterns:
- Get question by id
- List questions for objectiveId ordered by difficultyStars asc (GSI)

---

## 8) ItemStages
**Table:** `ItemStages`  
**PK:** `id` (String)

**GSI:** `ItemStagesByItemId`
- PK: `itemId` (String)  *(objective id)*
- SK: `order` (Number)  *(1,2,3)*

Typical attributes:
- `id`, `itemId`, `stageType` (`begin|walkthrough|challenge`)
- `order` (1,2,3)
- `prompt`

Access patterns:
- Get stage by id
- List stages for objectiveId ordered by order asc (GSI)

---

## 9) StudentObjectiveProgress
**Table:** `StudentObjectiveProgress`  
**PK:** `studentId` (String)  
**SK:** `objectiveId` (String)

Typical attributes:
- `studentId`, `objectiveId`
- `earnedStars` (0–3)
- `currentStageType` (`begin|walkthrough|challenge`)
- `updatedAt` (ISO timestamp)

Access patterns:
- Get progress for (studentId, objectiveId)
- List all progress for studentId (query by PK)

---

## 10) ChatThreads
**Table:** `ChatThreads`  
**PK:** `id` (String)

**GSI:** `UnitThreadsIndex`
- PK: `unitId` (String)
- SK: `objectiveId` (String)

Typical attributes:
- `id`, `courseId`, `unitId`, `objectiveId`
- `title`, `kind`
- `lastMessageAt`

Access patterns:
- Get thread by id
- List threads for unitId (GSI)

Notes:
- Thread ids are currently deterministic for convenience: `thread-{objectiveId}`
- Backend may auto-create missing threads per objective when listing.

---

## 11) ChatMessages
**Table:** `ChatMessages`  
**PK:** `threadId` (String)  
**SK:** `createdAt` (String ISO timestamp)

Typical attributes:
- `id` (uuid string), `threadId`
- `stageId?`
- `role` (`student|tutor`)
- `content`
- `createdAt`
- `attachments?`, `metadata?`

Access patterns:
- List messages by threadId in chronological order (query by PK)

---

## 12) Awards
**Table:** `Awards`  
**PK:** `studentId` (String)  
**SK:** `id` (String)

Typical attributes:
- `id`, `studentId`, `courseId`
- `title`, `subtitle`, `iconKey`

Access patterns:
- List awards for studentId (query by PK)
- Filter by courseId in application code

---

## 13) FeedbackItems
**Table:** `FeedbackItems`
**PK:** `studentId` (String)
**SK:** `id` (String)

Typical attributes:
- `id`, `studentId`, `courseId`, `unitId`
- `title`, `body`, `ctaLabel?`
- `sourceType` (`teacher|sam`), `instructorId?`

Access patterns:
- List feedback for studentId (query by PK)
- Filter by courseId in application code

---

## 14) KnowledgeTopics
**Table:** `KnowledgeTopics`
**PK:** `id` (String)

**GSI:** `UnitKnowledgeTopicsIndex`
- PK: `unitId` (String)
- SK: `order` (Number)

Typical attributes:
- `id`, `unitId`, `knowledgeTopic` (descriptive teacher-visible name)
- `order` (Number) — sort order within unit

Access patterns:
- Get topic by id
- List topics for unitId ordered by order asc (GSI)

---

## 15) KnowledgeQueueItems
**Table:** `KnowledgeQueueItems`
**PK:** `studentId` (String)
**SK:** `id` (String)

**GSI:** `UnitQueueIndex`
- PK: `unitId` (String)
- SK: `order` (Number)

Typical attributes:
- `id`, `unitId`, `studentId`
- `knowledgeTopicId` (FK → KnowledgeTopics)
- `labelIndex` (Number) — used for student-facing "Knowledge N" label
- `order` (Number) — chronological queue position
- `status` (`pending|active|completed_correct|completed_incorrect`)
- `is_correct` (Boolean, optional) — set when completed; mirrors `grade_info()` output
- `questionPrompt` (String) — LLM-generated question shown to student
- `createdAt` (ISO timestamp)

Access patterns:
- List queue items for (studentId, unitId): query by PK, filter by unitId
- Get single item: query by PK + SK
- Update item status: update by PK + SK
