# Sapiens Frontend

The Sapiens frontend is a React single-page application that provides two role-based interfaces: a **student learning environment** and an **instructor course management dashboard**.

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Framework      | React 19 + TypeScript 5.9           |
| Routing        | React Router DOM 7                  |
| Build          | Vite 7                              |
| Styling        | Tailwind CSS 4 + inline styles      |
| Auth           | Amazon Cognito Identity JS          |
| Testing        | Vitest + Testing Library + jsdom    |
| Linting        | ESLint 9 + TypeScript ESLint        |

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
cd frontend
npm install
cp .env.example .env.local   # then fill in values (see below)
npm run dev                  # starts at http://localhost:5173
```

### Environment Variables

Create a `.env.local` file with:

```
VITE_API_BASE_URL=https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=us-west-1_pzs7P5vGg
VITE_COGNITO_CLIENT_ID=34es28m8ocaom5rt55khms7p07
```

### Available Scripts

| Command         | Description                          |
|-----------------|--------------------------------------|
| `npm run dev`   | Start Vite dev server with HMR       |
| `npm run build` | Type-check + production build        |
| `npm run lint`  | Run ESLint                           |
| `npm run preview` | Serve the production build locally |

## Project Structure

```
src/
├── app/              App.tsx (root component with AuthProvider)
├── routes/           AppRoutes.tsx (all route definitions)
├── pages/            Page-level components (one per route)
├── components/
│   ├── layout/       AppShell, SidebarNav, TopBar
│   ├── auth/         AuthLayout, RequireRole, GoogleButton
│   ├── chat/         ThreadList, MessageList, ChatComposer
│   ├── course/       ActiveUnits, UnitCard, ObjectiveRow
│   ├── dashboard/    EnrolledCourses, CourseCard, AwardsGrid
│   └── ui/           Button, Input, Avatar, ProgressBar, etc.
├── contexts/         AuthContext (global auth state)
├── services/
│   ├── api.ts        All backend API calls (~50 functions)
│   └── cognitoAuth.ts  Cognito sign-in/sign-up/session wrapper
├── types/
│   └── domain.ts     TypeScript interfaces for all domain models
├── utils/            Progress helpers, award icon mappings
└── theme/
    └── colors.ts     Design tokens (palette, gradients)
```

## Routing

All routes are defined in `src/routes/AppRoutes.tsx`. Protected routes use `<RequireRole>`.

### Public Routes

| Path       | Page          | Description           |
|------------|---------------|-----------------------|
| `/`        | LandingPage   | Marketing intro page  |
| `/signup`  | SignUpPage    | User registration     |
| `/login`   | LoginPage     | User authentication   |

### Student Routes (role = student)

| Path                                    | Page        | Description                    |
|-----------------------------------------|-------------|--------------------------------|
| `/home` or `/courses`                   | HomePage    | Enrolled courses dashboard     |
| `/course/:courseId`                      | CoursePage  | Course detail with units       |
| `/course/:courseId/unit/:unitId/chat`    | ChatPage    | Learning interface (chat + objectives) |
| `/progress`                             | ProgressPage | Student progress overview     |
| `/settings`                             | SettingsPage | Account settings              |

### Instructor Routes (role = instructor)

| Path                                        | Page              | Description                      |
|---------------------------------------------|-------------------|----------------------------------|
| `/teacher`                                  | InstructorHomePage | Teacher dashboard                |
| `/teacher/course/create`                    | CourseCreationPage | Create new course                |
| `/teacher/course/:courseId`                  | TeacherCoursePage  | Manage course units              |
| `/teacher/course/:courseId/roster`           | EditRosterPage     | Manage enrolled students         |
| `/teacher/course/:courseId/unit/:unitId`     | CourseEditorPage   | Edit objectives, set deadlines   |
| `/teacher/course/:courseId/upload`           | UnitUploadPage     | Upload curriculum documents      |

## Authentication Flow

1. User signs up or logs in via Cognito (`cognitoAuth.ts`)
2. Cognito stores JWT tokens in `localStorage` automatically
3. `AuthContext` extracts the user's role from the `cognito:groups` JWT claim
4. `RequireRole` component gates route access — redirects to `/login` if unauthorized
5. `api.ts` attaches `Authorization: Bearer <IdToken>` to every API request

Role assignment:
- All self-registrations are **students** by default
- Admins promote users to **instructors** by adding them to the `instructors` Cognito group

## API Integration

All backend communication is in `src/services/api.ts`. Key patterns:

- **`apiFetch<T>(path, options)`** — Base fetch wrapper with JWT attachment and error handling
- **Convenience helpers:** `get<T>()`, `post<T>()`, `patch<T>()` for common HTTP methods
- **S3 upload flow** (`createUnitFromUpload`): 3-step process — get presigned URLs from API, upload files directly to S3, then trigger the processing pipeline
- **Knowledge messages** are session-only (local objects, not persisted to backend)

## State Management

- **Global:** `AuthContext` (role, loading, signOut, getAuthToken)
- **Component-level:** `useState` + `useEffect` for data fetching per page
- No Redux/Zustand — pages fetch data on mount and manage state locally
- URL search params (`?thread=X&stage=Y`) track chat selections for deep linking

## Key Design Patterns

- **Controlled cancellation:** `useEffect` cleanup sets a `cancelled` flag to prevent state updates on unmounted components
- **Optimistic UI:** Objective enable/disable toggles update locally before server confirms
- **Synthetic messages:** Stage completion badges are injected into the message array client-side (not from the API)
- **Batch fetching:** Instructor profiles loaded via `POST /instructors/batch` to avoid N+1 queries

## Design System

Colors and tokens are defined in `src/theme/colors.ts`:

- **Primary:** `#8b7a9e` (muted purple) — sidebar, buttons, accents
- **Success:** `#5c8f6a` (sage green) — progress indicators, completion states
- **Neutral:** 50–900 gray scale for text and backgrounds
- All components use inline `React.CSSProperties` with color exports (no component library)
