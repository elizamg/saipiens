# backend_TODO

This is the remaining work before the backend is ready to be “handed off” to the frontend as a stable, production-ready API.

## A) ~~Turn on real auth (Cognito JWT)~~ ✅ DONE
- JWT authorizer is now attached to all API Gateway routes (except `/health`).
- Lambda also decodes JWT from the `Authorization: Bearer` header as a fallback (handles cases where API Gateway claims are empty).
- `cognito:groups` bracket parsing fixed — API Gateway stringifies `[“instructors”]` as `[instructors]`; parser now strips brackets.
- `given_name` + `family_name` from JWT claims are used for display names (auto-created records + synced on login).
- Frontend signup form collects first/last name and sends them as required Cognito attributes.
- All frontend pages (student + teacher) use real API calls — zero mock data imports remain.
- **Dev auth has been fully removed** — code paths for `DEV_AUTH_ENABLED`, `X-Dev-Student-Id`, `X-Dev-Instructor-Id`, and `X-Dev-Token` headers have been deleted from `lambda_handler.py`. All five dev auth Lambda env vars have been removed from the production Lambda configuration. Authentication now requires a valid Cognito JWT exclusively.
- **Frontend 401 handling** — `apiFetch()` now intercepts 401 responses, attempts a token refresh via `getCurrentSession()`, retries the request on success, and redirects to `/login` on failure.
- **New password challenge UI** — Login page now handles Cognito's `newPasswordRequired` challenge with a dedicated “Set new password” form instead of showing a dead-end error.

## B) ~~CORS tightening~~ ✅ DONE
- `CORS_ALLOW_ORIGIN` default changed from `*` to `https://sapiens-pp4l.vercel.app` in code.
- Lambda env var updated on production to `https://sapiens-pp4l.vercel.app`.
- Dev auth headers (`X-Dev-Student-Id`, `X-Dev-Instructor-Id`, `X-Dev-Token`) removed from `CORS_ALLOW_HEADERS`.
- Preflight OPTIONS handling confirmed working for `Authorization` header.

## C) ~~Data integrity / authorization checks~~ ✅ DONE
Enrollment validation is now enforced on all student-facing and shared endpoints:
- Helper functions: `_is_enrolled()`, `_check_enrollment_for_unit()`, `_check_enrollment_for_objective()`, `_check_enrollment_for_thread()`
- Shared-route helpers (instructor pass-through, student enrollment check): `_require_enrollment_for_course()`, `_require_enrollment_for_unit()`, `_require_enrollment_for_objective()`
- Returns 403 `”Not enrolled in this course”` when a student tries to access a course/unit/thread they are not enrolled in.
- Endpoints protected: `GET /courses/{courseId}`, `GET /courses/{courseId}/units`, `GET /units/{unitId}`, `GET /units/{unitId}/objectives`, `GET /units/{unitId}/threads`, `GET /units/{unitId}/progress*`, `GET /units/{unitId}/knowledge-*`, `GET /units/{unitId}/my-grading-report`, `GET /units/{unitId}/my-feedback`, `GET /objectives/{objectiveId}/*`, `GET /threads/{threadId}/*`, `POST /threads/{threadId}/*`, `POST /knowledge-queue/{itemId}/*`
- Endpoints that are already scoped by `studentId` partition key (awards, feedback global) get enrollment checks only when course-filtered.

## D) Consistent error shape
Contract allows flexible error handling, but a stable error schema helps frontend UX.
Suggested:
- `{ "message": string, "code"?: string }`
Currently many errors are `{ "error": "..." }`.

## F) Performance & limits
- Confirm query_all usage is acceptable for expected list sizes.
- If messages can grow large, consider adding:
  - pagination params (limit, cursor) for `/threads/{threadId}/messages`
  - optional time/window querying

## G) ~~Observability~~ ✅ DONE (partial)
Structured audit logging added via `_audit_log()` helper (JSON to stdout → CloudWatch):
- `request` — every non-OPTIONS/health request with resolved `sub` (or null if unauthenticated)
- `auth_failure` — 401 on `/current-student`, `/current-instructor`, and enrollment helpers
- `enrollment_denied` — 403 when student accesses unregistered course
- `student_first_login` / `instructor_first_login` — first-time auto-creation of user records
- Remaining: X-Ray tracing, latency metrics (not yet implemented).

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

**Instructor auth**: JWT `sub` + `instructors` Cognito group membership. Dev auth fallback has been removed.

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
- `VITE_API_BASE_URL` = `https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod`

Note: `VITE_DEV_STUDENT_ID` and `VITE_DEV_TOKEN` are no longer used by the frontend and can be removed.

## P) ~~Profile Update Endpoints~~ ✅ DONE
- `PATCH /me` — updates name and/or avatarUrl for the current user (student or instructor). Determines role from JWT, updates the appropriate table. Returns the user record with avatarUrl presigned for GET.
- `POST /me/avatar-upload-url` — returns a pre-signed S3 PUT URL for avatar upload and the S3 key (stored as avatarUrl in DynamoDB). Avatars stored at `avatars/{userId}/{filename}` in the upload staging bucket. The S3 bucket is private; `GET /current-student` and `GET /current-instructor` presign the avatarUrl on read.
- Both routes added to API Gateway with JWT authorization and deployed to the `prod` stage.
- Name changes also update the Cognito `name` attribute from the frontend to keep JWTs in sync.

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

## Comprehensive Test Results (2026-03-18, feature/cognito branch)
See `TEST_RESULTS_COGNITO.md` in repo root for full results.
Automated API test script: `run_tests.sh` (47 endpoint tests with Cognito JWT auth).
