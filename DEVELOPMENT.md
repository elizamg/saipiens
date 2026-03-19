# Local Development Setup

This guide walks you through setting up Sapiens for local development.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.12 (for running backend pipelines locally)
- **AWS CLI** (optional, for Cognito user management and Lambda deployment)
- **Git**

## Frontend Setup

```bash
git clone https://github.com/elizamg/sapiens.git
cd sapiens/frontend
npm install
```

Create `frontend/.env.local`:

```
VITE_API_BASE_URL=https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=us-west-1_pzs7P5vGg
VITE_COGNITO_CLIENT_ID=34es28m8ocaom5rt55khms7p07
```

Start the dev server:

```bash
npm run dev
# Opens at http://localhost:5173
```

The frontend connects to the live AWS backend — there is no local backend server to run.

## Testing the App

### Student Flow

1. Open http://localhost:5173
2. Click **Get Started**
3. Sign up or log in with email/password
4. Browse courses on the home dashboard
5. Enter a course → select a unit → interact with the chat interface
6. Work through walkthrough and challenge stages, or try knowledge queue items

### Instructor Flow

1. From login, click "I am an instructor" (account must be in the `instructors` Cognito group)
2. View and manage courses from the teacher dashboard
3. Create a new course → add students → upload curriculum documents (PDFs)
4. Review AI-identified learning objectives → select which to generate
5. Edit unit settings: enable/disable objectives, set deadlines

### Promoting a User to Instructor

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-west-1_pzs7P5vGg \
  --username <email> \
  --group-name instructors \
  --region us-west-1
```

## Backend API Testing

The backend supports testing without AWS credentials using dev auth headers. See `backend/TESTING_QUICKSTART.md` for full details.

### Quick Test (curl)

```bash
# Health check
curl https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod/health

# Get student data (dev auth)
curl -H "X-Dev-Student-Id: student_demo_1" \
     -H "X-Dev-Token: dev-secret" \
     https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod/current-student
```

### Automated Test Suites

```bash
cd backend

# Integration tests — 88 tests, all API routes + AI pipelines (~90s)
python test_suite.py

# Edge case & security tests — 37 tests, auth, input validation, cross-student isolation (~5s)
python test_edge_cases.py

# LLM output quality tests — 24 tests, uses Gemini-as-judge (~2 min)
export SAIPIENS_GEMINI_API_KEY=<your-key>
python test_llm_quality.py
```

```bash
# Frontend component + auth tests — 63 tests (<1s)
cd frontend
npx vitest run
```

Full test report: [TEST_REPORT.md](TEST_REPORT.md)

| Suite | File | Tests | Description |
|-------|------|-------|-------------|
| Integration | [backend/test_suite.py](backend/test_suite.py) | 88 | All routes, error handling, AI pipelines |
| Edge cases | [backend/test_edge_cases.py](backend/test_edge_cases.py) | 37 | Auth, validation, path traversal, CORS, concurrency |
| LLM quality | [backend/test_llm_quality.py](backend/test_llm_quality.py) | 24 | Tutoring quality, grading accuracy, safety, prompt injection |
| Components | [frontend/src/test/components.test.tsx](frontend/src/test/components.test.tsx) | 41 | ProgressBar, ProgressCircle, MessageBubble, domain types |
| Auth | [frontend/src/test/auth.test.tsx](frontend/src/test/auth.test.tsx) | 22 | Cognito service, AuthContext, RequireRole guards |

See also:
- [TESTING_QUICKSTART.md](backend/TESTING_QUICKSTART.md) — How to test the API without AWS credentials
- [browser_testing_guide.md](backend/browser_testing_guide.md) — Browser console testing with dev headers
- [test_report.md](backend/test_report.md) — Backend integration test results

## Running AI Pipelines Locally

Each pipeline in `backend/lambdalith/backend_code/` has a `__main__` block for standalone testing:

```bash
cd backend/lambdalith/backend_code

# Set your Gemini API key
export SAIPIENS_GEMINI_API_KEY=<your-key>

# Test curriculum generation (downloads a sample PDF, identifies knowledge, generates questions)
python gen_curriculum_pipeline.py

# Test scaffolded tutoring (interactive CLI conversation)
python scaffolded_question_pipeline.py

# Test knowledge grading (generates a question, asks for your answer, grades it)
python info_question_pipeline.py
```

## Project Structure

```
sapiens/
├── frontend/                    React SPA (see frontend/README.md)
│   ├── src/
│   │   ├── services/api.ts     All backend API calls
│   │   ├── types/domain.ts     Shared TypeScript types
│   │   └── ...
│   └── package.json
├── backend/
│   ├── lambdalith/              Lambda function code
│   │   ├── lambda_handler.py   Main router & handlers (~2980 lines)
│   │   └── backend_code/       AI pipeline modules
│   │       ├── gen_curriculum_pipeline.py
│   │       ├── scaffolded_question_pipeline.py
│   │       ├── info_question_pipeline.py
│   │       ├── challenge_question_pipeline.py
│   │       ├── prompts/        Gemini prompt templates (~20 files)
│   │       └── utils/          Config, prompt rendering
│   ├── sapiens_backend_master_document.md
│   ├── route_schema.md
│   ├── table_schema.md
│   ├── TESTING_QUICKSTART.md
│   ├── test_suite.py            Integration tests (88)
│   ├── test_edge_cases.py       Edge case & security tests (37)
│   └── test_llm_quality.py      LLM output quality tests (24)
├── research_and_design/         Pedagogy research, design artifacts
├── FRONTEND_BACKEND_CONTRACT.md Contract between FE & BE
├── DEPLOYMENT.md                Infrastructure & deployment guide
├── TEST_REPORT.md               Comprehensive test report (all suites)
└── README.md                    Project overview & sprint updates
```

## Key Documentation Index

| Document | Location | Description |
|----------|----------|-------------|
| Project README | `README.md` | Overview, sprint updates, testing instructions |
| FE-BE Contract | `FRONTEND_BACKEND_CONTRACT.md` | API surface agreement, type definitions |
| Frontend README | `frontend/README.md` | Tech stack, setup, routing, API integration |
| Frontend Architecture | `frontend/ARCHITECTURE.md` | Component hierarchy, data flow, design decisions |
| Backend Master Doc | `backend/sapiens_backend_master_document.md` | Architecture, auth model, data models |
| API Routes | `backend/route_schema.md` | Full API endpoint reference |
| DB Schema | `backend/table_schema.md` | DynamoDB table definitions & GSIs |
| AI Pipelines | `backend/AI_PIPELINES.md` | Curriculum generation, tutoring, grading |
| **Test Report** | `TEST_REPORT.md` | Comprehensive results for all 212+ tests |
| Testing Quickstart | `backend/TESTING_QUICKSTART.md` | How to test the API without AWS credentials |
| Browser Testing | `backend/browser_testing_guide.md` | Browser console testing with dev headers |
| Integration Tests | `backend/test_suite.py` | 88 tests — all routes, error handling, AI pipelines |
| Edge Case Tests | `backend/test_edge_cases.py` | 37 tests — auth, validation, security, CORS |
| LLM Quality Tests | `backend/test_llm_quality.py` | 24 tests — tutoring quality, grading, safety |
| Component Tests | `frontend/src/test/components.test.tsx` | 41 tests — UI components, domain types |
| Auth Tests | `frontend/src/test/auth.test.tsx` | 22 tests — Cognito, context, route guards |
| Deployment | `DEPLOYMENT.md` | Infrastructure, deployment procedures |
| Pedagogy Research | `research_and_design/teaching_methods_research.md` | Evidence-based instructional methods |
