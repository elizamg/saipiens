# Sapiens Backend -- Architecture & Implementation Master Document

**Region:** us-west-1\
**Base API URL:**\
https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod

This document consolidates all backend architecture, implementation
details, authentication flow, operational considerations, testing
procedures, migration history, and production readiness guidance into a
single reference document.

> Note: Detailed table schema and full route schema are documented
> separately and intentionally excluded from this document.

------------------------------------------------------------------------

# 1. System Overview

The Sapiens backend is a fully serverless architecture built on AWS.

## High-Level Topology

→ API Gateway (HTTP API v2)\
→ Lambda (`sapiens-api`, Python 3.12)\
→ DynamoDB (multi-table design)

All routes share a single Lambda integration.

------------------------------------------------------------------------

# 2. Infrastructure

## Cloud Stack

-   API Gateway: HTTP API (v2)
-   Lambda Runtime: Python 3.12 (manylinux2014_x86_64 compiled deps required)
-   Database: DynamoDB (multi-table, access-pattern driven)
-   Authentication: Cognito User Pool + JWT Authorizer
-   Object Storage: S3 (`sapiens-upload-staging-681816819209`) for temporary upload staging
-   Billing Mode: On-demand (PAY_PER_REQUEST)

### Async Upload Processing

The curriculum upload endpoint (`POST /courses/{courseId}/units/upload`) uses an async
pattern to work around API Gateway HTTP API v2's hard 30-second integration timeout:

1.  Upload handler parses multipart, stages files in S3, creates Unit with `status: "processing"`
2.  Invokes the same Lambda asynchronously (`InvocationType: Event`) with an internal payload
3.  Returns `202` immediately with the unit record
4.  Background Lambda downloads files from S3, runs `Gen_Curriculum_Pipeline`, persists results
5.  Updates Unit `status` to `"ready"` or `"error"` (with `statusError` message)
6.  Frontend polls `GET /units/{unitId}/upload-status` every 3s until complete

Lambda timeout is set to 300s (5 min) to accommodate large PDFs. S3 staging bucket has a 1-day auto-expiry lifecycle.

------------------------------------------------------------------------

# 3. Authentication Model

## Production Authentication

-   Cognito User Pool
-   JWT Authorizer attached to all API Gateway routes (except `/health`)
-   Lambda also decodes JWT from Authorization header as fallback
-   Student identity resolved from JWT `sub` claim
-   Instructor identity requires `sub` + `instructors` Cognito group membership
-   Display names pulled from JWT `given_name` + `family_name` claims
-   Authorization header format:

```{=html}
<!-- -->
```
    Authorization: Bearer <IdToken>

### Cognito Details

User Pool ID:

    us-west-1_pzs7P5vGg

Issuer:

    https://cognito-idp.us-west-1.amazonaws.com/us-west-1_pzs7P5vGg

Only IdToken is used for API Gateway validation.

------------------------------------------------------------------------

## Development Authentication Mode

Both student and instructor dev auth are controlled by a single flag:

    DEV_AUTH_ENABLED=true

### Student dev auth

Headers used:

    X-Dev-Student-Id: <studentId>
    X-Dev-Token: dev-secret

### Instructor dev auth

Headers used:

    X-Dev-Instructor-Id: <instructorId>
    X-Dev-Token: dev-secret

Dev auth is currently enabled on the live Lambda alongside JWT auth.
This enables browser-based testing using dev headers.

⚠ Dev auth must be disabled before production deployment (`DEV_AUTH_ENABLED=false`).

## Production Instructor Authentication

In production, instructor identity is resolved from the JWT:

1.  The `sub` claim identifies the user.
2.  The `cognito:groups` claim is checked for the `instructors` group.
    - API Gateway stringifies this claim as `[instructors]` (with brackets); the Lambda parser strips brackets before matching.
3.  If the user is not in the `instructors` group, the request returns 401.

This means instructors must be added to the `instructors` Cognito group
(via the Cognito console or a Post-Confirmation Lambda trigger) before
they can access instructor routes.

## Name Resolution from JWT

Both `/current-student` and `/current-instructor` pull the user's display
name from the JWT `given_name` and `family_name` claims:

-   On first access: the auto-created DynamoDB record uses the JWT name.
-   On subsequent logins: the name is synced if it differs from the stored value.
-   Signup form collects first and last name as required Cognito attributes.

------------------------------------------------------------------------

# 4. Lambda Architecture

## Core Characteristics

-   Single Lambda handler with manual router
-   Stage prefix stripped from path (`/prod/...` → `/...`)
-   Method + normalized path dispatch
-   Decimal-safe JSON serialization
-   Strict 404 handling for missing entities
-   Consistent CORS headers
-   Pagination-safe DynamoDB queries
-   BatchGet retry handling

## Lambda Proxy Response Format

    {
      "statusCode": 200,
      "headers": {...},
      "body": JSON.stringify(...)
    }

------------------------------------------------------------------------

# 5. DynamoDB Design Philosophy

-   One entity per table
-   No single-table complexity
-   GSIs added only for required access patterns
-   Deterministic ordering via sort keys
-   All timestamps stored as ISO 8601 strings
-   All IDs stored as strings

------------------------------------------------------------------------

# 6. Data Model Concepts

## Stage Model

Each Objective has exactly three stages:

1.  begin\
2.  walkthrough\
3.  challenge

Stages are ordered via a numeric `order` field.

## Progress Model

Student progress is tracked per objective:

-   `earnedStars` (0--3)
-   `currentStageType`
-   `updatedAt`

Unit-level progress is computed server-side.

## Chat Model

-   One ChatThread per Objective
-   Messages partitioned by threadId
-   Messages sorted by createdAt ascending
-   ThreadWithProgress computed server-side

## Awards & Feedback

-   Partitioned by studentId
-   Filterable by courseId
-   Returned as simple lists (frontend does not paginate)

## Knowledge Topics & Queue

-   `KnowledgeTopics` table — teacher-visible descriptive names for each knowledge area in a unit
    -   Created during curriculum upload (one per objective)
    -   Queried via `UnitKnowledgeTopicsIndex` (unitId HASH, order RANGE)
-   `KnowledgeQueueItems` table — student-facing queue tracking progress through knowledge items
    -   Composite key: `studentId` (HASH) + `id` (RANGE)
    -   GSI `UnitQueueIndex` on `unitId` + `order`
    -   Auto-initialized on first access per student per unit
    -   Statuses: `pending` → `active` → `completed_correct` / `completed_incorrect`
    -   Incorrect answers create retry items at end of queue
-   `KnowledgeProgress` computed server-side from queue items (unique topic counts)

------------------------------------------------------------------------

# 7. Ordering Guarantees

Backend guarantees deterministic ordering for:

-   Objectives (sorted by `order`)
-   Stages (sorted by `order`)
-   Questions (sorted by `difficultyStars`)
-   Threads (sorted by Objective `order`)
-   Messages (sorted by `createdAt` ascending)
-   KnowledgeTopics (sorted by `order`)
-   KnowledgeQueueItems (visible items sorted by `order`)

------------------------------------------------------------------------

# 8. Pagination & Batch Safety

All DynamoDB queries use a `query_all()` helper that:

-   Iterates through `LastEvaluatedKey`
-   Returns complete result sets
-   Prevents silent 1MB truncation

All BatchGet operations use `batch_get_all()`:

-   Retries `UnprocessedKeys`
-   Ensures reliability under scale

------------------------------------------------------------------------

# 9. Testing Strategy

## AWS CLI Testing (Historical)

Used during development for:

-   Token generation
-   Direct endpoint validation
-   Seeding data

## Browser-Based Testing (No AWS Credentials)

The backend supports full browser testing using dev-header auth.

Testing includes:

-   Stage progression validation
-   UnitProgress aggregation
-   Chat message ordering
-   Award and feedback retrieval
-   404 validation for missing entities

------------------------------------------------------------------------

# 10. Migration History

Originally implemented in Node.js 24.

Migration to Python involved:

1.  Creating Python Lambda
2.  Correctly configuring handler
3.  Copying environment variables
4.  Switching API Gateway integration
5.  Verifying `/health`
6.  Rebuilding router logic
7.  Reimplementing contract-complete endpoints

Lessons learned:

-   Handler configuration is critical
-   JWT audience must match App Client
-   AccessToken cannot be used --- must use IdToken
-   GSI attribute types must match exactly
-   API Gateway integration must reference correct Lambda

------------------------------------------------------------------------

# 11. Known Pitfalls Encountered

-   GSI sort key type mismatch (String vs Number)
-   Incorrect JWT audience configuration
-   API Gateway still pointing to old Lambda
-   Missing imports during migration
-   Using AccessToken instead of IdToken
-   CORS preflight not handled at API Gateway layer

All issues have been resolved.

------------------------------------------------------------------------

# 12. Current System State

The backend is:

-   Fully contract-complete
-   Serverless
-   Deterministically ordered
-   Pagination-safe
-   Batch-safe
-   JWT auth active (API Gateway authorizer + Lambda fallback decoder)
-   Frontend fully integrated (all pages use real API, no mock data)

All major domain surfaces are implemented:

-   Courses (student read + instructor create)
-   Units (student read + instructor create via upload + title edit)
-   Objectives (student read + instructor toggle enabled)
-   Stages (student read)
-   Progress (student read + advance)
-   Chat (with synchronous AI tutor pipeline)
-   Awards
-   Feedback
-   Instructor/Teacher flows (current-instructor, course management, roster, student management, curriculum upload)
-   Knowledge Topics (teacher-visible, created during upload)
-   Knowledge Queue (student-facing, auto-initialized, retry on incorrect, progress tracking)

## AI Tutor Pipeline

`POST /threads/{threadId}/messages` now invokes the AI tutor synchronously:

-   `walkthrough` stage → `scaffolded_question_step` (Gemini 3 Flash) walks the student through the problem step by step
-   `challenge` stage + `knowledge` objective → `grade_info` grades a factual recall answer
-   `challenge` stage + `skill`/`capstone` objective → `grade_skill` grades an applied skill answer

Response shape: `{ "studentMessage": ChatMessage, "tutorMessage": ChatMessage | null }`

Pipeline parameters:
-   `subject` = course title (`Courses.title`)
-   `grade` = student year label (`Students.yearLabel`)
-   `information`/`skill`/`question` = objective title (`Objectives.title`)

Model: `gemini-3-flash-preview` via Google GenAI SDK (`SAIPIENS_GEMINI_API_KEY` Lambda env var).

Lambda timeout is 60s; memory is 512MB.

## AI Curriculum Generation Pipeline

`POST /courses/{courseId}/units/upload` accepts multipart PDF upload and runs the full `Gen_Curriculum_Pipeline`:

1. Uploads PDF(s) to Gemini Files API
2. Calls `identify_knowledge` → returns list of `{ type, description }` items
3. Generates one question per item in parallel (concurrency=5)
4. Persists to DynamoDB:
   - `Units` — one new unit
   - `Objectives` — one per knowledge item (`kind: "knowledge"|"skill"`)
   - `ItemStages` — 3 per objective (`begin`/`walkthrough`/`challenge`)
   - `Questions` — one per objective

Returns `{ unit: Unit, objectives: Objective[] }`.

⚠ This call can take 30–120s for large PDFs. The Lambda timeout may need to be increased (currently 60s) for production use.

------------------------------------------------------------------------

# 13. Production Hardening Checklist

Before production launch:

1.  Disable dev authentication

        DEV_AUTH_ENABLED=false

2.  ~~Re-enable JWT authorizers in API Gateway~~ ✅ DONE — attached to all routes except `/health`

3.  Restrict CORS origin to production frontend domain (currently `*`)

4.  Add structured logging

5.  Enforce enrollment-based authorization checks

6.  Optionally:

    -   Block advancing beyond 3 stars explicitly
    -   Add pagination parameters for large message lists

------------------------------------------------------------------------

# Conclusion

The Sapiens backend is architecturally sound, contract-aligned, and
production-ready in structure. It supports secure authentication,
deterministic data traversal, scalable DynamoDB access patterns, and a
fully implemented progression and chat model.

This document represents the consolidated architectural reference for
the backend implementation.

End of document.
