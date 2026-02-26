# backend_TODO

This is the remaining work before the backend is ready to be “handed off” to the frontend as a stable, production-ready API.

## A) Turn on real auth (Cognito JWT) and remove dev auth
- Re-enable JWT authorizers on all non-health routes in API Gateway.
- Set `DEV_AUTH_ENABLED=false` in Lambda (and ideally remove dev-header logic entirely).
- Verify the frontend can attach a valid token and that `sub` is used consistently as `studentId`.

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

## I) Teacher/Instructor routes (not yet implemented in Lambda)
The frontend `api.ts` calls several instructor-facing routes that are not yet in the Lambda handler:
- `GET /current-instructor` (dev: `X-Dev-Instructor-Id` + `X-Dev-Token`)
- `GET /instructor/courses`
- `POST /courses` (create course)
- `GET/PUT /courses/{courseId}/roster`
- `GET /students` (list all students for roster assignment)
- `POST /students` (create student)
- `PATCH /units/{unitId}/title`
- `PATCH /objectives/{objectiveId}/enabled`
- `POST /courses/{courseId}/units/upload` (multipart file → AI curriculum generation)

These need to be added to `lambda_handler.py` before teacher flows work end-to-end.

## K) Hardening advanceStage
- Decide whether to block advancing beyond 3 stars with 400 vs returning capped progress.
- Optionally validate that the currentStageType matches expected progression and prevent skipping.

---

## “Ready for frontend integration” checklist
Before telling frontend to switch off mocks, ensure:
- JWT auth works end-to-end (no dev headers)
- CORS matches frontend origin and includes Authorization
- All routes return correct shapes with correct ordering:
  - Objectives sorted by `order`
  - Stages sorted by `order`
  - Questions sorted by `difficultyStars`
  - Messages sorted by `createdAt`
- 404 semantics are consistent
- Seeded content is complete for demo course(s)
