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
- `POST /courses/{courseId}/units/upload` — multipart PDF upload → runs `Gen_Curriculum_Pipeline` → persists Unit + Objectives + ItemStages (3 per obj) + Questions → returns `{ unit, objectives }`

**Instructor auth** (production): JWT `sub` + `instructors` Cognito group membership. Dev fallback: `X-Dev-Instructor-Id` + `X-Dev-Token: dev-secret` (controlled by `DEV_AUTH_ENABLED` env var).

Test results: 19/19 instructor route tests passing.

## K-0) ~~Fix duplicate `effective_instructor_id` and instructor auth~~ ✅ DONE
`lambda_handler.py` had two definitions of `effective_instructor_id()`. The first (correct) version checked JWT `sub` + `cognito:groups` for the `instructors` group with dev-header fallback. The second (incorrect) version only supported `DEV_INSTRUCTOR_ENABLED` dev headers and overwrote the first, silently breaking production JWT auth for all instructor routes.

Fix:
- Removed the duplicate (dev-header-only) definition.
- Removed unused `DEV_INSTRUCTOR_ENABLED`, `DEV_INSTRUCTOR_HEADER`, `DEV_INSTRUCTOR_TOKEN` env var references.
- The single remaining `effective_instructor_id()` supports both production JWT auth (Cognito groups) and dev-header fallback (under `DEV_AUTH_ENABLED`).

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

## "Ready for frontend integration" checklist ✅ DONE
- [x] JWT auth works end-to-end (API Gateway authorizer + Lambda fallback)
- [x] CORS includes Authorization, PATCH method, x-dev-instructor-id header
- [x] All routes return correct shapes with correct ordering
- [x] 404 semantics are consistent
- [x] All frontend pages (student + teacher) call real API — no mock data
- [x] Signup collects first/last name; names display correctly on dashboards
- [ ] Seeded content is complete for demo course(s) — only needed if demo accounts need pre-populated courses
