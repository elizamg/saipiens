# backend_TODO

This is the remaining work before the backend is ready to be “handed off” to the frontend as a stable, production-ready API.

## A) ~~Turn on real auth (Cognito JWT)~~ ✅ DONE
- JWT authorizer is now attached to all API Gateway routes (except `/health`).
- Lambda also decodes JWT from the `Authorization: Bearer` header as a fallback (handles cases where API Gateway claims are empty).
- `cognito:groups` bracket parsing fixed — API Gateway stringifies `["instructors"]` as `[instructors]`; parser now strips brackets.
- `given_name` + `family_name` from JWT claims are used for display names (auto-created records + synced on login).
- Frontend signup form collects first/last name and sends them as required Cognito attributes.
- All frontend pages (student + teacher) use real API calls — zero mock data imports remain.
- Dev auth (`DEV_AUTH_ENABLED`) is still available for testing but should be disabled before production.

## B) CORS tightening
- Replace `Access-Control-Allow-Origin: *` with the actual frontend origin(s) in production.
- Confirm preflight OPTIONS handling is correct for Authorization header.

## C) Data integrity / authorization checks (beyond “current student”)
Currently, the API resolves a current student and enforces studentId path equality on `/students/{studentId}/courses`.
Before production, add (or confirm) authorization rules such as:
- Ensure student is enrolled in the course when accessing:
  - `/courses/{courseId}` (optional)
  - `/courses/{courseId}/units`
  - `/units/{unitId}`, `/units/{unitId}/objectives`, `/units/{unitId}/threads`, `/units/{unitId}/progress*`
  - `/threads/{threadId}*` and `/threads/{threadId}/messages*`
This prevents a student from querying arbitrary IDs.

## D) Consistent error shape
Contract allows flexible error handling, but a stable error schema helps frontend UX.
Suggested:
- `{ "message": string, "code"?: string }`
Currently many errors are `{ "error": "..." }`.

## E) Deterministic data seeding and content completeness
- Ensure every Objective has:
  - `order`
  - exactly 3 ItemStages with correct `stageType` + `order` + `prompt`
- Ensure each objective has a corresponding ChatThread (either pre-seeded or auto-created; decide one approach).

## F) Performance & limits
- Confirm query_all usage is acceptable for expected list sizes.
- If messages can grow large, consider adding:
  - pagination params (limit, cursor) for `/threads/{threadId}/messages`
  - optional time/window querying

## G) Observability
- Add structured logs (request id, route, student id, latency).
- Consider tracing (X-Ray) if needed.

## H) ~~Background tutor replies~~ ✅ DONE
`sendMessage` now invokes the AI tutor synchronously and returns `{ studentMessage, tutorMessage }`.
- `walkthrough` → `scaffolded_question_step` (Gemini 3 Flash)
- `challenge` + `knowledge` → `grade_info`
- `challenge` + `skill`/`capstone` → `grade_skill`
Both messages are persisted to DynamoDB before the response is returned.
Remaining consideration: for very long AI calls, consider async with polling if Lambda timeout becomes an issue.

## I) ~~Teacher/Instructor routes~~ ✅ DONE
All instructor-facing routes are now implemented in `lambda_handler.py`:
- `GET /current-instructor` — auto-creates instructor record on first access
- `GET /instructor/courses` — lists courses owned by the instructor (via `InstructorCoursesIndex`)
- `POST /courses` — creates a new course with title, icon, and initial student roster (body: `{ title, icon?, studentIds? }`) → returns `{ id, title, studentCount, icon }`
- `GET /courses/{courseId}/roster` — returns `{ courseId, studentIds[] }`
- `PUT /courses/{courseId}/roster` — replaces full roster atomically (body: `{ studentIds[] }`)
- `GET /students` — lists all students (for roster assignment UI)
- `POST /students` — creates a new student (body: `{ name, yearLabel? }`)
- `PATCH /units/{unitId}/title` — updates unit title (body: `{ title }`)
- `PATCH /objectives/{objectiveId}/enabled` — toggles objective visibility (body: `{ enabled: bool }`)
- `POST /courses/{courseId}/units/upload` — multipart PDF upload → stages files in S3 → invokes Lambda async → returns `202` with `{ unit, objectives: [] }` immediately. Background Lambda runs `Gen_Curriculum_Pipeline`, persists Objectives + ItemStages + Questions + KnowledgeTopics, and updates Unit `status` to `"ready"` or `"error"`.
- `GET /units/{unitId}/upload-status` — polls upload processing status (`"processing"` → `"ready"` / `"error"`)

**Instructor auth** (production): JWT `sub` + `instructors` Cognito group membership. Dev fallback: `X-Dev-Instructor-Id` + `X-Dev-Token: dev-secret` (controlled by `DEV_AUTH_ENABLED` env var).

Test results: 19/19 instructor route tests passing.

## K-0) ~~Fix duplicate `effective_instructor_id` and instructor auth~~ ✅ DONE
`lambda_handler.py` had two definitions of `effective_instructor_id()`. The first (correct) version checked JWT `sub` + `cognito:groups` for the `instructors` group with dev-header fallback. The second (incorrect) version only supported `DEV_INSTRUCTOR_ENABLED` dev headers and overwrote the first, silently breaking production JWT auth for all instructor routes.

Fix:
- Removed the duplicate (dev-header-only) definition.
- Removed unused `DEV_INSTRUCTOR_ENABLED`, `DEV_INSTRUCTOR_HEADER`, `DEV_INSTRUCTOR_TOKEN` env var references.
- The single remaining `effective_instructor_id()` supports both production JWT auth (Cognito groups) and dev-header fallback (under `DEV_AUTH_ENABLED`).

## L) ~~Knowledge Topics & Queue endpoints~~ ✅ DONE
All knowledge-related endpoints are now implemented in `lambda_handler.py`:
- `GET /units/{unitId}/knowledge-topics` — lists teacher-visible knowledge topics for a unit (via `UnitKnowledgeTopicsIndex`)
- `GET /units/{unitId}/knowledge-queue` — lists student's queue items (auto-initializes on first access, filters out `pending`)
- `POST /knowledge-queue/{itemId}/complete` — marks item correct/incorrect, creates retry if wrong, advances next pending item
- `GET /units/{unitId}/knowledge-progress` — computes unique topic correct/incorrect counts and percentages

KnowledgeTopics are now created during curriculum upload (one per objective, with `objectiveId` reference).
KnowledgeQueueItems are auto-initialized per student per unit on first queue access.

DynamoDB tables: `KnowledgeTopics` (GSI: `UnitKnowledgeTopicsIndex`), `KnowledgeQueueItems` (GSI: `UnitQueueIndex`).
Lambda env vars already configured: `KNOWLEDGE_TOPICS_TABLE`, `KNOWLEDGE_QUEUE_ITEMS_TABLE`, `UNIT_KNOWLEDGE_TOPICS_INDEX`, `UNIT_QUEUE_INDEX`.

Frontend stubs in `api.ts` are now wired to real backend endpoints.

## K) Hardening advanceStage
- Decide whether to block advancing beyond 3 stars with 400 vs returning capped progress.
- Optionally validate that the currentStageType matches expected progression and prevent skipping.

---

## J) Vercel environment variables (must be set before frontend auth works)
Add these in Vercel → Project Settings → Environment Variables:
- `VITE_COGNITO_USER_POOL_ID` = `us-west-1_pzs7P5vGg`
- `VITE_COGNITO_CLIENT_ID` = `34es28m8ocaom5rt55khms7p07`

Note: `VITE_DEV_STUDENT_ID` and `VITE_DEV_TOKEN` are no longer used by the frontend and can be removed.

---

## M) ~~Delete & Restore~~ ✅ DONE
All soft-delete, hard-delete, and restore routes are implemented:
- `DELETE /units/{unitId}` — soft delete (sets `deletedAt`)
- `DELETE /courses/{courseId}` — soft delete (sets `deletedAt`)
- `DELETE /units/{unitId}/permanent` — hard delete (cascades to objectives, questions, stages, threads, messages, progress, knowledge topics/queue, S3 uploads)
- `DELETE /courses/{courseId}/permanent` — hard delete (cascades to units and enrollments)
- `PATCH /units/{unitId}/restore` — removes `deletedAt`
- `PATCH /courses/{courseId}/restore` — removes `deletedAt`

## N) ~~Grading Reports & Per-Unit Feedback~~ ✅ DONE
- `GET /units/{unitId}/grading-report?studentId=X` — on-demand AI report generation (teacher view)
- `GET /units/{unitId}/my-grading-report` — student view of AI report
- `POST /units/{unitId}/feedback` — teacher creates feedback
- `PATCH /feedback/{feedbackId}` — teacher updates feedback
- `GET /units/{unitId}/feedback?studentId=X` — teacher reads feedback
- `GET /units/{unitId}/my-feedback` — student reads feedback

⚠ Known issue: Grading report generation can timeout (503) on first request for units with no cached report. Lambda timeout is 60s for regular requests; Gemini AI call may exceed this.

## O) ~~Upload Review Flow (identify → review → generate)~~ ✅ DONE
Multi-step upload pipeline with teacher review:
1. `POST /courses/{courseId}/units/upload` → stages files, invokes pipeline async → identifies knowledge items
2. `GET /units/{unitId}/identified-knowledge` → teacher reviews AI-identified items
3. `POST /units/{unitId}/generate` → teacher selects items → triggers async question generation
4. `POST /units/{unitId}/edit-objectives` → resets to review step if teacher wants to re-select
5. `POST /units/{unitId}/reupload` → generates pre-signed S3 URLs for re-uploading documents
6. `POST /units/{unitId}/process` → triggers pipeline after S3 upload completes

---

## "Ready for frontend integration" checklist ✅ DONE
- [x] JWT auth works end-to-end (API Gateway authorizer + Lambda fallback)
- [x] CORS includes Authorization, PATCH method, x-dev-instructor-id header
- [x] All routes return correct shapes with correct ordering
- [x] 404 semantics are consistent
- [x] All frontend pages (student + teacher) call real API — no mock data
- [x] Signup collects first/last name; names display correctly on dashboards
- [ ] Seeded content is complete for demo course(s) — only needed if demo accounts need pre-populated courses

---

## Comprehensive Test Results (2026-03-16)
94/98 tests passed (95.9%) across API + UI testing. See `TEST_RESULTS.md` and `TEST_PLAN.md` in repo root.
Automated API test script: `run_tests.sh` (47 endpoint tests with Cognito JWT auth).
