# Frontend Architecture

This document describes the frontend architecture of Sapiens, covering the component hierarchy, data flow, and key design decisions.

## Overview

Sapiens is a dual-interface application:
- **Students** enroll in courses, work through learning objectives via an AI-tutored chat interface, and complete a knowledge review queue
- **Instructors** create courses, upload curriculum documents (PDFs), manage student rosters, and review AI-generated objectives

The frontend is a React 19 SPA using React Router 7 for navigation, Cognito for authentication, and a REST API backend on AWS Lambda.

## Component Hierarchy

```
App (AuthProvider)
└── AppRoutes
    ├── [Public] LandingPage / LoginPage / SignUpPage
    │
    ├── [Student] RequireRole("student")
    │   └── AppShell (SidebarNav + TopBar)
    │       ├── HomePage
    │       │   ├── WelcomeBanner
    │       │   ├── EnrolledCourses → CourseCard[]
    │       │   ├── AwardsGrid → AwardCard[]
    │       │   └── TeacherFeedbackPanel
    │       ├── CoursePage
    │       │   └── ActiveUnits → UnitCard[]
    │       ├── ChatPage
    │       │   ├── ThreadList (skills + knowledge sections)
    │       │   ├── MessageList → MessageBubble[]
    │       │   └── ChatComposer
    │       ├── ProgressPage (placeholder)
    │       └── SettingsPage (placeholder)
    │
    └── [Instructor] RequireRole("instructor")
        └── AppShell (SidebarNav + TopBar)
            ├── InstructorHomePage
            │   ├── WelcomeBanner
            │   └── TeacherCourseCard[] + NewCourseCard
            ├── TeacherCoursePage
            │   └── ActiveUnits → UnitCard[] + NewUnitCard
            ├── CourseCreationPage
            │   ├── IconChooser
            │   └── StudentRosterEditor
            ├── CourseEditorPage
            │   └── ObjectiveRow[] (enable/disable toggles)
            ├── UnitUploadPage (multi-step wizard)
            └── EditRosterPage
                └── StudentRosterEditor
```

## Data Flow

### Authentication

```
cognitoAuth.ts          AuthContext.tsx           api.ts
─────────────          ───────────────          ──────
signIn(email, pw)  →   setRole("student")       apiFetch() reads
getCurrentSession()←   role, loading, signOut    getAuthToken()
signOut()          →   setRoleState(null)        attaches Bearer JWT
```

- Cognito SDK stores tokens in `localStorage`
- `AuthProvider` checks for existing session on mount
- `getAuthToken()` is exported from `AuthContext.tsx` (not a hook — callable from `api.ts`)

### Page Data Loading

Each page loads its data independently on mount:

```tsx
useEffect(() => {
  let cancelled = false;
  async function load() {
    const data = await api.listCourses(studentId);
    if (!cancelled) setData(data);
  }
  load();
  return () => { cancelled = true; };
}, [studentId]);
```

Pages use `Promise.all` for parallel loads where safe (e.g., courses + awards + feedback on HomePage).

### Chat Page Data Flow

The ChatPage is the most complex page. It manages two modes:

**Thread Mode** (skills/capstone):
```
1. Load threads for unit:  GET /units/{unitId}/threads
2. Select thread → load messages: GET /threads/{threadId}/messages?stageId=X
3. Student sends message: POST /threads/{threadId}/messages
   → Backend returns { studentMessage, tutorMessage }
   → Both appended to local state
4. Stage advance: POST /objectives/{objectiveId}/advance
   → Synthetic completion message injected locally
```

**Knowledge Mode** (knowledge queue):
```
1. Load queue: GET /units/{unitId}/knowledge-queue
   → Auto-initialized on first access (backend creates items)
2. Active item shown as chat prompt
3. Student submits answer: POST /knowledge-queue/{id}/complete
   → Returns grading + optional retry item
   → Queue refreshed from server
```

URL search params (`?thread=X&stage=Y` or `?knowledge=Z`) drive which item is selected, enabling deep linking and browser history navigation.

## Key Architectural Decisions

### No State Management Library

We use React Context for auth (global) and `useState` for everything else (local). This keeps the codebase simple since:
- Pages are independent — no shared mutable state between routes
- Data is always fresh from the API on navigation
- The only cross-cutting concern is authentication

### Inline Styles Over CSS Modules

Components use `React.CSSProperties` objects with shared color tokens from `theme/colors.ts`. This avoids CSS module naming conflicts and keeps styling colocated with components. Tailwind is available for utility classes where convenient.

### No Component Library

All UI components (Button, Input, Avatar, Card, ProgressBar, etc.) are built from scratch. This gives full control over the design language and avoids bundle size overhead from unused library features.

### S3 Direct Upload

File uploads bypass the API Gateway 10MB payload limit by uploading directly to S3:
1. Frontend requests presigned PUT URLs from the API
2. Frontend uploads files to S3 in parallel using `fetch(url, { method: "PUT", body: file })`
3. Frontend triggers the processing pipeline via a separate API call

### Async Curriculum Processing

The curriculum generation pipeline can take 30–120 seconds. To avoid blocking:
1. `POST /courses/{courseId}/units/upload` returns immediately with a `"processing"` status
2. Frontend polls `GET /units/{unitId}/upload-status` every 3 seconds
3. When status is `"ready"`, the UnitUploadPage transitions to the objective review step

## Type System

All domain types are defined in `src/types/domain.ts` and shared across the frontend. Key types:

- **Student, Instructor, Course, Unit** — core entities
- **Objective** (kind: knowledge | skill | capstone) — learning items within a unit
- **ItemStage** (stageType: begin | walkthrough | challenge) — sub-stages of an objective
- **ProgressState** — 5-state enum tracking student advancement
- **KnowledgeQueueItem** — student-facing queue entry for knowledge review
- **ChatThread, ChatMessage** — conversation data with metadata for system messages

## Progress Model

Student progress follows a 5-state model per objective:

```
not_started → walkthrough_started → walkthrough_complete → challenge_started → challenge_complete
```

This maps to the `ProgressCircle` UI component which renders a visual indicator:
- Empty circle (not started)
- Quarter fill (walkthrough started)
- Half fill (walkthrough complete)
- Three-quarter fill (challenge started)
- Full fill with checkmark (challenge complete)

Knowledge progress is separate: a `DualProgressBar` shows correct vs. incorrect percentages across the unit's knowledge topics.
