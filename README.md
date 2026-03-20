<p align="center">
  <img src="frontend/src/assets/white-tree.png" alt="Alt text" width="300">
</p>

<h1 align="center">SAIPIENS</h1>

<p align="center"><i>"SAIPIENS aims to improve education outcomes<br>
using research-backed pedagogy<br>
while reducing teacher and student workloads<br>
through an AI-enabled homework system."</i></p>

<br>

---

# TA Instructions

**Live App:** [https://saipiens-chi.vercel.app/](https://saipiens-chi.vercel.app/)

This section walks through the full teacher and student experience end-to-end using pre-configured test accounts.

---

## Step 1 — Teacher Flow (Ms. Gallagher)

**Login credentials:**
| Field | Value |
|-------|-------|
| Email | `ms.gallagher@sapiens.dev` |
| Password | `Gallagher#2026` |
| Role | Instructor |

1. Go to the app and click **Get Started**
2. Click **Log In** and enter the credentials above
3. You'll land on Ms. Gallagher's instructor dashboard

### Create a Course

1. Click **New Course**
2. Name it anything (e.g. "AP Chemistry")
3. Choose a subject icon and color
4. Add students — search for **Emma Thompson** and add her (along with any others you'd like)
5. Click **Create Course**

### Upload Curriculum & Generate a Unit

1. From the course page, click **New Unit**
2. When prompted, give the unit a name (e.g. "Chapter 2")
3. Upload using this PDF:

   [https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/756/Jenkins_Independent_Schools/6a69020c-cc47-4f66-9c0e-01061564cf20/chap_02.pdf?disposition=inline](https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/756/Jenkins_Independent_Schools/6a69020c-cc47-4f66-9c0e-01061564cf20/chap_02.pdf?disposition=inline)

4. The system will process the PDF and extract learning objectives — this takes ~1–2 minutes
5. Once processing is complete, you'll see a list of AI-identified **knowledge topics** and **skill objectives**
6. Check or uncheck the objectives you want to include, then click **Generate**
7. The unit is now live for enrolled students

---

## Step 2 — Student Flow (Emma Thompson)

**Login credentials:**
| Field | Value |
|-------|-------|
| Email | `emma.thompson@sapiens.dev` |
| Password | `Student#2026` |
| Role | Student |

1. Go to the app and click **Get Started**
2. Click **Log In** and enter Emma's credentials
3. You'll see the course Ms. Gallagher just created on the homepage

### Explore the Unit

1. Click into the course → select the unit you uploaded
2. **Knowledge questions** — these are factual recall items. Submit an answer, see AI grading, and observe the retry queue if you answer incorrectly
3. **Skills (Walkthrough)** — the AI tutor walks through the problem step-by-step with you. Use the "Ask a question" button to enter clarify mode and ask follow-ups
4. **Skills (Challenge)** — attempt the problem independently. You'll receive graded feedback on a 4-category rubric
5. **Capstone** — unlocks after completing all skill walkthroughs and challenges. The AI asks you to explain the concept back in your own words
6. Watch for confetti on correct answers and a celebration banner when the full unit is complete

---

## Step 3 — Test Feedback

### Student Side
1. Still logged in as Emma, navigate to **Feedback** in the sidebar
2. Select the course → select the unit
3. You'll see Sam's AI-generated summary of Emma's performance and any teacher comments

### Teacher Side
1. Log back in as Ms. Gallagher
2. Navigate to **Feedback** in the sidebar
3. Select the course → select a student → select the unit
4. You'll see the same AI-generated grading report from the teacher's perspective, including per-objective breakdowns and deadline status

---

# App Overview

Sapiens is a process-first, AI-driven learning platform built for K-12 classrooms. It transforms teacher-provided curriculum documents into adaptive, AI-tutored homework assignments that prioritize student reasoning over answer production.

## How It Works

**For Teachers:**
1. Create a course and enroll students
2. Upload curriculum materials (PDFs, textbooks, worksheets)
3. AI identifies learning objectives — knowledge topics and skills — from the uploaded content
4. Review and select which objectives to include
5. Students receive auto-generated, adaptive assignments

**For Students:**
1. Enroll in courses and view assigned units
2. Work through objectives in a chat-based interface with an AI tutor ("Sam")
3. Each objective has three stages: **Begin** (read the question), **Walkthrough** (guided step-by-step tutoring), and **Challenge** (independent attempt with grading)
4. Knowledge review: a queue of factual recall questions with retry on incorrect answers
5. Earn progress indicators and awards as objectives are completed

## Technical Architecture

| Layer       | Technology                                                |
|-------------|-----------------------------------------------------------|
| Frontend    | React 19, TypeScript, Vite, Tailwind CSS                  |
| Hosting     | Vercel                                                    |
| API         | AWS API Gateway (HTTP API v2) + Lambda (Python 3.12)      |
| Database    | DynamoDB (15 tables, on-demand billing)                   |
| Auth        | AWS Cognito (JWT-based, role via group membership)        |
| AI Model    | Google Gemini 3 Flash (curriculum generation, tutoring, grading) |
| File Storage| S3 (presigned upload for curriculum documents)            |

## Documentation

| Document | Description |
|----------|-------------|
| [Frontend README](frontend/README.md) | Setup, tech stack, routing, API integration |
| [Frontend Architecture](frontend/ARCHITECTURE.md) | Component hierarchy, data flow, design decisions |
| [FE-BE Contract](FRONTEND_BACKEND_CONTRACT.md) | API surface agreement and type definitions |
| [Backend Master Doc](backend/sapiens_backend_master_document.md) | Architecture, auth model, data models |
| [API Routes](backend/route_schema.md) | Full API endpoint reference (52+ routes) |
| [DB Schema](backend/table_schema.md) | DynamoDB table definitions and GSIs |
| [AI Pipelines](backend/AI_PIPELINES.md) | Curriculum generation, tutoring, grading pipelines |
| [Deployment Guide](DEPLOYMENT.md) | Infrastructure, environment config, deploy procedures |
| [Development Guide](DEVELOPMENT.md) | Local setup, testing, project structure |
| [Pedagogy Research](research_and_design/teaching_methods_research.md) | Evidence-based instructional methods |

### Testing

| Document | Description |
|----------|-------------|
| [Test Report](TEST_REPORT.md) | Comprehensive results for all 212+ tests |
| [Testing Quickstart](backend/TESTING_QUICKSTART.md) | How to test the API without AWS credentials |
| [Browser Testing Guide](backend/browser_testing_guide.md) | Browser console testing with dev auth headers |
| [Integration Tests](backend/test_suite.py) | 88 tests — all API routes, error handling, AI pipelines |
| [Edge Case Tests](backend/test_edge_cases.py) | 37 tests — auth, input validation, path traversal, CORS |
| [LLM Quality Tests](backend/test_llm_quality.py) | 24 tests — tutoring quality, grading accuracy, prompt injection |
| [Component Tests](frontend/src/test/components.test.tsx) | 41 tests — ProgressBar, MessageBubble, domain types |
| [Auth Tests](frontend/src/test/auth.test.tsx) | 22 tests — Cognito, AuthContext, RequireRole guards |

---

# Sprint 4 Progress

## Live App

**App Link:**
[https://sapiens-pp4l.vercel.app/](https://sapiens-pp4l.vercel.app/)

Or run locally:

```bash
git clone https://github.com/elizamg/sapiens.git
cd sapiens/frontend
npm install
npm run dev
````

## Testing Instructions

### Testing The Student Flow

1. Click **Get Started**
2. Sign up or log in (real Cognito accounts — no more mock data)
3. Enter a course → select a unit
4. Try a **Knowledge** question — submit an answer, see AI grading + feedback, then watch the retry queue if you answer incorrectly
5. Try a **Skill** walkthrough — the AI tutor walks you through the problem step-by-step
6. Complete the **Challenge** stage — get graded on a 4-category rubric
7. Watch for confetti on correct answers and celebration banners on unit completion
8. Check the progress stats on your homepage

### Testing The Teacher Flow

1. Log in as an instructor (account must be in the `instructors` Cognito group)
2. Create a new course → add students → upload a PDF
3. Review AI-identified learning objectives → select which to generate
4. Watch the processing status poll until curriculum is ready
5. Edit unit: enable/disable objectives, set deadlines
6. View grading reports per unit — see AI-generated summaries of student progress

### Running The Test Suites

```bash
# Backend integration tests (88 tests, ~90s)
cd backend && python test_suite.py

# Backend edge case & security tests (37 tests)
python test_edge_cases.py

# LLM output quality tests (24 tests, uses Gemini-as-judge)
export SAIPIENS_GEMINI_API_KEY=<your-key>
python test_llm_quality.py

# Frontend component tests
cd frontend && npx vitest run
```

Full test results: [TEST_REPORT.md](TEST_REPORT.md) (243 tests across all suites)

## Team Updates

### Brooke — Backend Integration, Performance, Testing, Security, and Documentation

This sprint I shipped the full end-to-end pipeline, hardened security, built out gamification and performance features, wrote comprehensive test suites, and documented the entire system. Here's a summary:

#### 1. End-to-End Curriculum Pipeline

Connected the unit ingestion pipeline from upload to question generation:

- Pre-signed S3 uploads bypass the API Gateway 10MB limit
- Async Lambda self-invocation handles long-running AI processing (up to 5 min)
- Frontend polls `GET /units/{unitId}/upload-status` until ready
- Added file conversion support and stored file metadata on Unit records
- Created ChatThreads and KnowledgeQueueItems automatically during curriculum generation

Commits: `bd43a6c`, `e955c06`, `81ca042`, `16cfe92`, `f59013b`, `cf0ace0`, `30f69a4`

#### 2. Student Features (Capstone, optimizations, and integration)

Wired, designed, and created different parts of the student-facing AI experience:

| Feature | What it does |
|---------|--------------|
| Knowledge questions | AI grades answers, generates retry questions on incorrect, manages the queue |
| Multi-attempt knowledge chat | Students get 2 answer attempts with clarifying questions before final grading |
| Clarifying questions | AI generates "Ask a question" pills — now generated eagerly with zero extra latency |
| Capstone section | Created capstone section (frontend, infra, backend) for students to learn by explaining it back based on existing sections |

Commits: `bc7ada4`, `08955b7`, `eac5368`, `dc4e687`, `fd15ddf`, `b0a4d25`

#### 3. Teacher Features

- **Grading reports**: Per-unit feedback with AI-generated summaries for both teachers and students (`1541d18`, `7eebe34`, `cb9bcc7`)
- **Deadline management**: Unit deadlines with on-time/late tracking in grading reports (`4f458a3`, `bf0d12a`, `bfea01f`, `4be9c51`)
- **Course management**: Soft/hard delete for courses and units, roster filtering, title editing (`4f458a3`)
- **Objective editing**: Show ungenerated objectives with checkboxes in edit mode, fix section header counts (`6693451`, `e71e381`, `4464246`)
- **Knowledge topic management**: Enable/disable individual topics, persist knowledge chat messages (`a5d3fb6`)

#### 4. Gamification & UX Polish

- Progress stats on homepage: skills mastered, knowledge correct, units completed, streak counter
- Confetti animation on correct answers and challenge completions
- Celebration banners on unit completion
- Custom SVG icons replacing emojis throughout the UI
- Course color-coding with 9 subject-specific colors
- Animated number counters on stat cards, progress circle glow animations

Commits: `a1210f5`, `be2a1ca`, `a10a602`

#### 5. Performance Optimizations

- **Parallel DB calls** via `ThreadPoolExecutor` — saves 200–600ms per request in chat, knowledge grading, and clarify handlers
- **Async retry question generation** — incorrect knowledge answers return immediately instead of blocking on a second AI call
- **Eager clarifying question generation** — pills generated in parallel with grading, ready on arrival
- **Async grading report generation** — frontend polls instead of blocking

Commits: `65c26b6`, `fd15ddf`, `b0a4d25`

#### 6. Security Hardening

- Removed dev auth headers from production (`DEV_AUTH_ENABLED=false`)
- Added enrollment-based validation — students can only access courses they're enrolled in
- Frontend 401 handling with automatic redirect to login
- Profile/settings endpoints for account management

Commit: `b8e8a9c`

#### 7. Comprehensive Test Suites

| Suite | Tests | What it covers |
|-------|-------|---------------|
| Backend integration ([test_suite.py](backend/test_suite.py)) | 88 | All API routes, error handling, AI pipelines |
| Edge cases & security ([test_edge_cases.py](backend/test_edge_cases.py)) | 37 | Auth, input validation, path traversal, cross-student isolation, CORS |
| LLM output quality ([test_llm_quality.py](backend/test_llm_quality.py)) | 24 | Walkthrough tutoring quality, grading accuracy, safety boundaries, prompt injection resistance |
| Frontend components ([components.test.tsx](frontend/src/test/components.test.tsx)) | 41 | ProgressBar, DualProgressBar, ProgressCircle, MessageBubble, domain types |
| Auth unit tests | 22 | Cognito service, AuthContext, RequireRole guards |
| **Total** | **212+** | |

LLM tests use **Gemini-as-judge**: a separate Gemini call evaluates whether the tutor's response meets quality criteria (pedagogical tone, no answer leakage, format compliance).

Full report: [TEST_REPORT.md](TEST_REPORT.md)

#### 8. Documentation

Wrote comprehensive documentation covering the full system:

| Document | Description |
|----------|-------------|
| [Frontend README](frontend/README.md) | Tech stack, setup, routing, API integration, design system |
| [Frontend Architecture](frontend/ARCHITECTURE.md) | Component hierarchy, data flow, state management decisions |
| [AI Pipelines](backend/AI_PIPELINES.md) | Curriculum generation, tutoring, grading — flow diagrams, prompts, design rationale |
| [Deployment Guide](DEPLOYMENT.md) | AWS infrastructure, env vars, Lambda deploy, Cognito setup, production checklist |
| [Development Guide](DEVELOPMENT.md) | Local setup, testing workflows, project structure, documentation index |
| [Backend Master Doc](backend/sapiens_backend_master_document.md) | Architecture overview, auth model, data models (updated) |
| [API Routes](backend/route_schema.md) | Full 52+ endpoint reference (updated) |

### Eliza — feedback and grading report, course icons and color theming, skeletons, dashboard, ask a question                                                                
  1. Feedback & Grading Report System                                               
                                                                                    
  Built the entire student and teacher feedback experience from scratch across 17   
  files:                                                                            
                                                                                    
  - Created FeedbackPage, FeedbackCoursePage, and FeedbackUnitPage — the full       
  student-side drill-down from course → unit → grading report                       
  - Created the parallel teacher-side: TeacherFeedbackPage,                         
  TeacherFeedbackCoursePage, TeacherFeedbackStudentPage, TeacherFeedbackUnitPage
  - Added supporting API calls to api.ts and extended domain types for
  feedback/grading data
  - Updated FRONTEND_BACKEND_CONTRACT.md with the new feedback endpoints
  - Built full SettingsPage and TeacherSettingsPage from scratch (292 and 280 lines
  respectively)
  - Removed the old ProgressPage and unused components (RatingStars, Landing, etc.)
  - Cleaned up TeacherFeedbackPanel, fixed Sam's profile picture display, and made
  feedback + settings pages full-screen

  Commits: 3c29152, d9cb3ce, af81eeb

  ---
  2. Course Icons & Subject Color Theming

  Designed and implemented the per-subject visual identity system:

  - Created courseIcons.tsx — SVG icon components for each subject and a
  COURSE_COLORS map (main + light tint per subject)
  - Applied subject colors to CourseCard, TeacherCourseCard, CoursePage,
  FeedbackPage, TeacherCoursePage, TeacherFeedbackPage, and IconChooser
  - Stripped all gradients and drop shadows from SectionIcon and CourseIcon — flat
  solid fill throughout
  - Updated IconChooser to render each icon in its own subject color with a colored
  border/tint on selection
  - Added purple pencil icon to ContinueLearning section header and wired "Continue"
   button color to course subject

  Commits: d5a8a15, 9d31f3b

  ---
  3. Loading Skeletons Across the App

  Replaced every "Loading..." spinner/text with shimmer skeleton screens:

  - Created Skeleton.tsx (shimmer primitive with injected @keyframes),
  SkeletonBanner.tsx, and SkeletonCourseCard.tsx
  - Rolled out skeletons to 15 pages: ChatPage, CoursePage, CourseEditorPage,
  EditRosterPage, FeedbackPage, FeedbackUnitPage, HomePage, InstructorHomePage,
  TeacherCoursePage, TeacherFeedbackPage, TeacherFeedbackCoursePage,
  TeacherFeedbackStudentPage, TeacherFeedbackUnitPage, UnitUploadPage,
  FeedbackCoursePage
  - Added fadeIn 0.3s ease animation on content reveal to eliminate layout shift

  Commits: b500f39

  ---
  4. Dashboard & Welcome Banner

  Overhauled the dashboard header and app chrome:

  - Rewrote WelcomeBanner with time-of-day phrase banks (morning/afternoon/evening)
  for both student and teacher roles — 123 lines of copy
  - Updated AppShell, SidebarNav, and TopBar for layout consistency
  - Rebuilt the teacher InstructorHomePage header and cleaned up its structure
  - Updated colors.ts with revised palette values

  Commits: 3ee9988, 8036da7

  ---
  5. Chat Page: Thread Types & "Ask a Question"

  Extended the chat page to support multiple content types and an interactive
  clarify mode:

  - Updated ThreadList to correctly display and handle knowledge, skill, and
  capstone thread types (+82 lines)
  - Added a backend debug script (query_thread_kinds.py) to inspect thread data
  during development
  - Converted the "Ask a question" pill into a toggle button — ghost (outline) when
  inactive, filled when active — with the composer placeholder switching between
  "Type your answer..." and "Type your clarifying question..."

  Commits: a9ddeb4, 86ab0d7

  ---
  6. Build & Stability Fixes

  Kept the Vercel deployment green through active development:

  - Removed unused variables and imports across CourseCreationPage,
  CourseEditorPage, EditRosterPage, and UnitUploadPage that were breaking TypeScript
   builds
  - Fixed a WelcomeBanner Vercel-specific error

  Commits: 4eb9a8d, 8f8312e


   7. Deck and Poster
    Spearheaded deck and poster
   8. Creating test accounts and courses for demo



### Ben — Challenege and Walkthrough Questions Integrations and Finalizing

For this sprint, I:
- Integrated clairifying questions for challenge questions based on code for the knowledge questions 
- Designed and created the UI for and integrated in the backend+infrastructure having multiple challenge or walkthrough attempts for a single skill question
- Made the UI for challenge and walkthrough questions based on the UI for knowledge questions
- Made the "skip walkthrough" and "try walkthrough" features (backend, infra, and frontend)
- Integrated and did some design work (having a second grey progress bar for partial progress) for the progress bars and circle indicators for skill questions
- Integrated challenge question and walkthrough question functionality (grading, completion status, messaging, responses, etc)


---

# Sprint 3 Progress
## Live App

**App Link:**  
[https://sapiens-pp4l.vercel.app/](https://sapiens-pp4l.vercel.app/)

Or run locally:

```bash
git clone https://github.com/elizamg/sapiens.git
cd sapiens/frontend
npm install
npm run dev
````

## Testing Instructions

### Testing The Student Flow

1. Click **Get Started**
2. Log in
3. Explore courses
4. Enter a unit
5. Look through questions at different stages of progress


### Testing The Teacher Flow
1. From login/ sign in click "i am an instructor"
2. Click on any courses to view them
3. Click new course
4. Name the course
5. Click students to add them to course
6. Click create course
7. Click new unit
8. Upload unit materials
9. Click or unclick learning objectives depending on what you want the students to see

### Testing The Backend

Running the individual `*\pipeline.py` files in `backend/lambdalith/backend_code/` runs a small test/demo for each of the pipelines. You can also see pre-generated results of some of these tests in the `example_\.md` files.

## Team Updates

### Ben - Backend Pipelines

This sprint, I implemented the backend code for grading and giving feedback on skill answers (challenge_question_pipeline.py); coming up with clarifying questions and answering clarifying questions for skills (gen_clarifying_questions_pipeline.py); grading and creating feedback for info questions (info_question_pipeline.py); a scaffolded question walkthrough agent (scaffolded_question_pipeline.py); and creating info and skill questions (gen_curriculum_pipeline.py). I also wrote the MVP prompts for these pipelines (besides the one for identify knowledge, which is Brooke’s).

I also added basic retrying with tenacity to our LLM calls, made generating a curriculum’s questions faster by generating a number of questions in parallel, and added test/example code to each of the pipeline files.

### Eliza - Frontend

1. iterated on frontend lesson design based on group meeting conversation regarding the structure of knowledge objectives. Implemented a queue system that dynamically displays knowledge questions based on if it was answered right or wrong. Additionally, I took in feedback from teammates to get rid of the walkthrough component of the knowledge questions, only leaving that component for skills.
2. Implemented the teacher frontend. Worked on teacher flow based on group discussions. Implemented flows for creating and editing courses and units. Iterated based on testing and feedback from the team.

### Brooke - Infrastructure and Backend-Frontend Connecting

I completed the full backend integration, end-to-end authentication, and a comprehensive test suite. Here's a summary of what was shipped:

 1. Frontend → Real Backend 

All ~50 functions in `api.ts` now call the live AWS API Gateway instead of returning hardcoded mock data. The client automatically attaches a Cognito JWT (`Authorization: Bearer <IdToken>`) on every request, with a dev-header fallback for local testing.

 2. AI Tutor Pipeline — Live in Chat

`sendMessage` now invokes real AI models synchronously and returns both the student message and a tutor reply in a single response:

| Stage | Pipeline | Model |
|-------|----------|-------|
| `walkthrough` | Scaffolded question step | Gemini Flash |
| `challenge` (knowledge) | Info grading | Gemini Flash |
| `challenge` (skill/capstone) | Skill grading | Gemini Flash |
 
Both messages are persisted to DynamoDB before the response is returned. The chat UI shows a live typing indicator while the AI is thinking.

 3. Cognito JWT Authentication (students & instructors)
**Cognito User Pool:** `us-west-1_pzs7P5vGg`
**App Client:** `sapiens-public` (`34es28m8ocaom5rt55khms7p07`)
**Student auth:** any valid JWT. Identity comes from the `sub` claim.
**Instructor auth:** JWT + membership in the `instructors` Cognito Group. The `cognito:groups` claim is checked on every instructor route.
The Lambda verifies RS256 JWT signatures directly (fetches and caches JWKS from Cognito), so no API Gateway JWT Authorizer is required.
New users are auto-provisioned in DynamoDB on first request to `/current-student`, using `given_name`/`family_name` from the JWT.

To promote a user to instructor:
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-west-1_pzs7P5vGg \
  --username <email> \
  --group-name instructors \
  --region us-west-1
```
 4. Instructor/Teacher API Routes (19 new endpoints)

All teacher-facing routes are now live in the Lambda:
 
| Route | Description |
|-------|-------------|
| `GET /current-instructor` | Auto-creates instructor record on first login |
| `GET /instructor/courses` | Lists courses owned by the instructor |
| `POST /courses` | Creates a new course |
| `GET /courses/{id}/roster` | Returns enrolled student IDs |
| `PUT /courses/{id}/roster` | Replaces roster atomically |
| `GET /students` | Lists all students (for roster UI) |
| `POST /students` | Creates a new student |
| `PATCH /units/{id}/title` | Renames a unit |
| `PATCH /objectives/{id}/enabled` | Toggles objective visibility |
| `POST /courses/{id}/units/upload` | Async PDF upload → S3 staging → AI curriculum pipeline → persists Unit + Objectives + Stages |
| `GET /units/{id}/upload-status` | Polls async upload progress (`processing` → `ready` / `error`) |

 5. Test Suite — 150 tests total

| Suite | Tests | What it covers |
|-------|-------|---------------|
| Auth unit tests (pytest) | 42 | JWT parsing, student/instructor identity resolution, dev-header fallback, CORS |
| Frontend auth tests (vitest) | 22 | Cognito service, AuthContext, RequireRole routing guards |
| API integration tests (live) | 88 | Every route including AI pipeline, error handling, edge cases |
| **Total** | **152** | |

 6. Knowledge Topics, Queue, and Progress Endpoints

Four new endpoints for the knowledge review system:

| Route | Description |
|-------|-------------|
| `GET /units/{unitId}/knowledge-topics` | Returns teacher-visible topic names for a unit (sorted by order) |
| `GET /units/{unitId}/knowledge-queue` | Returns student-facing queue items (auto-initialized on first access) |
| `GET /units/{unitId}/knowledge-progress` | Returns aggregate progress stats (correct/incorrect counts and percentages) |
| `POST /units/{unitId}/knowledge-queue/{itemId}/answer` | Submits an answer; incorrect answers create retry items at end of queue |

 7. Async Upload Pipeline

The curriculum upload (`POST /courses/{courseId}/units/upload`) now uses an async pattern to work around API Gateway's hard 30-second timeout:

1. Upload handler parses multipart, stages files in S3 (`sapiens-upload-staging-681816819209`), creates Unit with `status: "processing"`
2. Invokes the same Lambda asynchronously (`InvocationType: Event`)
3. Returns `202 Accepted` immediately
4. Background Lambda downloads files from S3, runs `Gen_Curriculum_Pipeline`, persists results
5. Updates Unit `status` to `"ready"` or `"error"` (with `statusError` message)
6. Frontend polls `GET /units/{unitId}/upload-status` every 3s until complete

Lambda timeout increased to 300s (5 min). S3 staging bucket has a 1-day auto-expiry lifecycle.

 8. Lambda Invoke Test Results (2026-02-27)

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | `GET /units/nonexistent-id/upload-status` | 404 `Unit not found` | PASS |
| 2 | `GET /health` | 200 `{ ok: true }` | PASS |
| 3 | `GET /units/unit_demo_1/upload-status` | 200 with status field | PASS |
| 4 | Internal async handler with empty `s3Keys` | Unit status → `"error"` | PASS |
| 5 | `GET /units/unit_demo_1/knowledge-topics` (regression) | 200 | PASS |


Backend Documentation
 
All backend docs live in [`/backend`](backend/):
 
| Document | Description |
|----------|-------------|
| [sapiens_backend_master_document.md](backend/sapiens_backend_master_document.md) | Architecture overview, auth model, design philosophy |
| [route_schema.md](backend/route_schema.md) | Full API route reference (student + instructor routes) |
| [table_schema.md](backend/table_schema.md) | DynamoDB table design |
| [cognito_setup.md](backend/cognito_setup.md) | Cognito pool, app client, groups, dev accounts, auth flow |
| [test_report.md](backend/test_report.md) | Auth test suite documentation (64 unit tests) |
| [TESTING_QUICKSTART.md](backend/TESTING_QUICKSTART.md) | How to test the live API — no AWS credentials required |
| [browser_testing_guide.md](backend/browser_testing_guide.md) | Browser console testing guide (includes Lambda invoke test results) |
| [backend_TODO.md](backend/backend_TODO.md) | Production hardening checklist |
 


---
<br>

## Sprint 2 Progress

## Live App

**App Link:**  
[https://sapiens-pp4l.vercel.app/](https://sapiens-f402hfs6b-lizzyg2003-1130s-projects.vercel.app)

Or run locally:

```bash
git clone https://github.com/elizamg/sapiens.git
cd sapiens/frontend
npm install
npm run dev
````

## Current User Flow

1. Click **Get Started**
2. Log in
3. Explore courses
4. Enter a unit
5. Look through questions at different stages of progress

## Backend

We weren't able to finish the backend this sprint, so our backend code doesn't run. Our endpoints are planned in the [FRONTEND_BACKEND_CONTRACT.md](FRONTEND_BACKEND_CONTRACT.md), with our specific pipelines planned in [agent_diagram.svg](https://github.com/elizamg/sapiens/blob/main/research_and_design/agent_diagram.svg). Our prompts can be found in [prompts](https://github.com/elizamg/sapiens/tree/main/backend/lambdalith/backend_code/prompts) (excluding our scaffolded question pipeline prompts and info feedback prompt, which haven't been finished).

---

## Team Updates

### Ben - Research and Backend

For this sprint, I started by researching best education and teaching practices ([teaching_methods_research.md](https://github.com/elizamg/sapiens/blob/main/research_and_design/teaching_methods_research.md)), to inform the "why" behind our usage of AI for homework, differentiate our product, and to clarify core design decisions before implimenting our project.

Based on this, I created a mock "assignments" page ([concept_assignment_page.pdf
](https://github.com/elizamg/sapiens/blob/main/research_and_design/concept_assignment_page.pdf)) to make our concept more concrete and allow my group and I to discuss and decide specifically what our system will do and how it will work. In addition, I created a specification for how our different LLM-based features will work ([agent_diagram.svg](https://github.com/elizamg/sapiens/blob/main/research_and_design/agent_diagram.svg)).

Some specific insights that came from this design work were:
- Moving from "easy-medium-hard" skill questions to scaffolded verses independent skill questions
- Prioritizing immediate feedback as a selling point of our product
- Splitting information questions and skills, since information needs to be delivered in a certain order (i.e. can't give the answer then allow the student to try the question again right after)
- Decide how feedback should be given for skills
- Removing the names from skills so the student needs to identify what tools they've learned to apply to the problem
- Using spaced repetition through a review section with adapative problems based on the student's past experience
- Having a capstone section where the student answers "explain-it-back-to-me" questions

The design decisions were discussed with my group, and Eliza had great ideas about what feedback to give for information questions and how to structure the UI.

After this, I worked on writing and testing the prompts for the different parts of the pipelines ([prompts](https://github.com/elizamg/sapiens/tree/main/backend/lambdalith/backend_code/prompts)); and writing and structuring the backend code. I also worked on fixing some git history issues our group ran into.

### Eliza — Frontend and Vercel Hosting

I built a few initial versions of the frontend and iterated by taking them back to the team. I implemented frontend changes that we discussed as a team and with our mentor.

We talked a lot about how we wanted the structure of questions to look and landed on having **Walkthrough** and **Challenge** subparts instead of difficulty-based questions. We also spent time thinking about how to display questions in the sidebar so it wouldn’t feel cluttered but would still give students the opportunity to explore.

With our mentor, we discussed how to indicate progress (we changed from stars to a progress circle), how green is typically reserved for success semantically (so we updated our color scheme), and how to make critical components stand out clearly to the user.

We also thought a lot about how to invite the user to engage and ask questions — by making walkthroughs feel like a conversation and adding suggested question pills.

All of these design decisions were made iteratively and are reflected in our current frontend.

---

### Brooke - AWS Infrastructure and Backend 

First, I worked on setting up the necessary AWS Infrastructure for our project.

Specifically, I've configured Congito for authentification (and worked with Eliza to include this in the frontend); created the DynamoDB tables for the different information our application needs to store and communicated with other teammembers to design our tables; and got our Lambda function set up (we're using one big Lambda function (a Lambdaith) for simplicity and fewer cold starts). Cognito is currently disabled for testing purposes.

Next, I started work on fufilling the frontend-backend contract through Lambda router code that registers incoming requests and sends back formatted information from the databases [febe-contract branch](https://github.com/elizamg/sapiens/tree/febe-contract). More recent changes can be seen in [backend-setup branch](https://github.com/elizamg/sapiens/tree/backend-setup). 

The backend is fully contract-complete and implemented using:

- AWS Lambda (Python 3.12)
- API Gateway (HTTP API v2)
- DynamoDB (multi-table design)
- Cognito JWT (production auth)
- Dev-header auth fallback (for browser testing)

All backend documentation lives in `/backend`:

- **Architecture Overview**  
  [backend/sapiens_backend_master_document.md](backend/sapiens_backend_master_document.md)

- **DynamoDB Table Schema**  
  [backend/table_schema.md](backend/table_schema.md)

- **API Route Schema**  
  [backend/route_schema.md](backend/route_schema.md)

- **Browser Testing Guide (No AWS Credentials Required)**  
  [backend/browser_testing_guide.md](backend/browser_testing_guide.md)

- **Production TODO & Hardening Checklist**  
  [backend/backend_TODO.md](backend/backend_TODO.md)

---


<br>


## Sprint 1 Progress

[Figma Demo](https://www.figma.com/proto/GtyuApL5TlYQUJhwWFYQNR/SAIPIENS?node-id=13007-15&t=kIJol6aDAmDJwseV-1&scaling=scale-down&content-scaling=fixed&page-id=3%3A2&starting-point-node-id=13007%3A15)


Running the Project

1. Clone the repo  
   git clone https://github.com/elizamg/sapiens.git

2. Navigate to the frontend  
   cd sapiens/frontend

3. Install dependencies  
   npm install

4. Start the dev server  
   npm run dev

5. Open the app  
   Visit http://localhost:5173 in your browser


Viewing Prompts and the Prompt Testing:

- Prompt testing can be viewed in the document Initial Prompt Testing.txt
- Initial prompts can be viewed in the document Initial_Prompts.rtf


sApIens is a process-first, AI-driven learning system that redefines how homework, feedback, and assessment work in schools.

Rather than producing answers or explanations, sApIens structures learning around student reasoning, adapting questions, feedback, and pacing based on how a student thinks, not just whether they are correct.

sApIens is not a tutor.
It is an instructional system designed to make thinking visible.

## Motivation

The American education system is facing a systemic mismatch:
- Teachers are overstretched and under-resourced
- Students receive limited individualized feedback
- Homework is graded on outcomes, not understanding
- AI is increasingly present—but institutionally restricted

Current policies attempt to limit AI usage in schools. sApIens explores a different approach:
What if AI were used to reshape learning workflows instead of bypassing them?

sApIens is built on the premise that AI can:
- Reduce repetitive grading and explanation work
- Surface student misconceptions in real time
- Preserve teacher authority and curriculum control
- Encourage genuine critical thinking at scale

## What sApIens Does

sApIens is a process-centric homework and assessment system built on teacher-provided materials.

At a high level:
1. Teachers upload curriculum artifacts (textbooks, worksheets, calendars)
2. Content is structured into units, skills, and knowledge components
3. AI generates adaptive, process-aware homework
4. Students work through assignments while the system responds to their reasoning
5. Teachers receive structured reports that reflect understanding, not just completion

The system emphasizes learning dynamics, not answer production.

## Core Principles
- Process over product
  
Reasoning, explanation, and reflection are primary signals.

- Adaptive instructional flow
  
Problem difficulty and sequencing change based on student input.

- Misconception detection
  
Errors trigger targeted feedback and reframed questions.

- Teacher-defined instruction
  
Curriculum originates from educators, not the model.

- Safety and focus by desig
  
Instructional agents are constrained, on-task, and privacy-preserving.

## Goal
To transform homework and assessment into a process-first learning system that makes student reasoning visible while reducing teacher workload. To not fear AI in schools, but utilize it to better the experience of learning.
