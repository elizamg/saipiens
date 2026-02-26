# backend_TODO

This is the remaining work before the backend is ready to be "handed off" to the frontend as a stable, production-ready API.

## ✅ Done

- Lambda handler name mismatch fixed (`lambda_function` → `lambda_handler`)
- Knowledge queue + knowledge topic routes added to `lambda_handler.py`
- Instructor auth routes added (`/current-instructor`, `/instructor/courses`, `/courses/{id}/roster`, etc.)
- `X-Dev-Instructor-Id` header support added to Lambda + CORS
- Frontend `api.ts` fully wired to real AWS API Gateway (all student + teacher + knowledge routes)
- `PATCH` added to allowed CORS methods
- Schema docs added: `route_schema.md`, `table_schema.md`
- Cognito user pool created (`sapiens`, `us-west-1_pzs7P5vGg`) with `instructors` group
- Frontend `AuthContext` fully wired to Cognito (`amazon-cognito-identity-js`)
- Login/signup pages wired to real Cognito auth with loading + error states
- JWT token sent as `Authorization: Bearer <id_token>` on all API requests
- **Lambda JWT verification implemented** — Lambda now verifies RS256 JWT signature from Cognito JWKS
  - JWKS fetched from Cognito and cached in-memory for 1 hour
  - `sub` extracted from verified JWT as user ID
  - `cognito:groups` extracted to determine instructor vs. student role
  - Dev header fallback still active (`DEV_AUTH_ENABLED=true`)
- New student auto-provisioning on first JWT login (creates DynamoDB record with name from JWT)
- Missing `STUDENT_OBJECTIVE_PROGRESS_TABLE` env var fixed (was causing Lambda crash on startup)
- `COGNITO_CLIENT_ID` added to Lambda env vars

---

## A) Turn off dev auth (production readiness) — NEXT
Once JWT is confirmed working end-to-end from the browser:
- Set `DEV_AUTH_ENABLED=false` in Lambda env vars
- Set `DEV_INSTRUCTOR_ENABLED=false` in Lambda env vars
- Remove `VITE_DEV_STUDENT_ID`, `VITE_DEV_TOKEN`, `VITE_DEV_INSTRUCTOR_ID` from frontend `.env.local`

## B) Seed real demo content
Currently `course-demo-001` exists with 2 units but no objectives, stages, or questions.
Before the app is meaningful to test:
- Add objectives to each unit (with `order` attribute)
- Add 3 ItemStages per objective (`begin`, `walkthrough`, `challenge`) with `prompt` content
- Optionally add questions per objective

## C) Auto-create Instructor DynamoDB record on first login
When an instructor logs in for the first time, `/current-instructor` returns 404.
Mirror the student auto-provisioning logic in `handle_current_instructor`.

## D) CORS tightening
- Replace `Access-Control-Allow-Origin: *` with actual frontend origin(s) in production

## E) Data integrity / authorization checks
Currently the API enforces `studentId path == current student` on course listing.
Before production, also check:
- Student is enrolled in the course before accessing course content
- Instructor owns the course before modifying roster / uploading units

## F) Consistent error shape
Many errors return `{ "error": "..." }` but some return `{ "message": "..." }` (API Gateway default).
Standardize to `{ "error": string, "code"?: string }` throughout.

## G) Background tutor replies
`sendMessage` persists student message only — no AI response.
Define the tutor pipeline before production:
- Synchronous (simple) vs async (recommended for long LLM calls)
- How tutor messages are persisted and returned
- Metadata fields (`earnedStars`, completion) when relevant

## H) API Gateway JWT Authorizer (optional hardening)
The Lambda now verifies JWTs itself. Adding a gateway-level JWT Authorizer would:
- Reject invalid tokens before Lambda is invoked (saves cost)
- Standard practice for production APIs
This is optional since Lambda verification is already in place.

## I) Observability
- Add structured logs (request ID, route, student ID, latency)
- Consider X-Ray tracing

---

## "Ready for production" checklist
- [ ] JWT auth works end-to-end from browser (no dev headers needed)
- [ ] `DEV_AUTH_ENABLED=false` and `DEV_INSTRUCTOR_ENABLED=false` set in Lambda
- [ ] CORS restricted to production frontend domain
- [ ] Demo course has complete content (objectives + stages)
- [ ] Instructor auto-provisioning on first login
- [ ] All routes return correct shapes with correct ordering
- [ ] 404 semantics are consistent
