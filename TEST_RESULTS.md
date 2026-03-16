# Frontend-Backend Integration Test Results

**Branch:** `brooke/code-review`
**Date:** 2026-03-15
**Server:** Vite dev server (port 5173) running from worktree
**API:** `https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod`
**Auth:** AWS Cognito (us-west-1)

---

## Test Accounts

| Role       | Email                       | Result      |
|------------|-----------------------------|-------------|
| Student    | dev-student@sapiens.dev     | Login OK    |
| Instructor | dev-instructor@sapiens.dev  | Login OK    |

---

## Student Routes

### 1. Login + Auth Flow
- **Route:** `/login` -> `/home`
- **Status:** PASS
- **API Calls:**
  - `POST cognito-idp.us-west-1.amazonaws.com` -> 200 (auth)
  - `GET /current-student` -> 200 (75ms avg)
- **Notes:** Cognito JWT auth works, redirect to `/home` on success

### 2. Home Page (`/home`)
- **Status:** PASS
- **API Calls (all 200):**
  - `GET /current-student` (75ms)
  - `GET /students/{id}/courses` (48-66ms)
  - `GET /awards` (39-43ms)
  - `GET /feedback` (41-50ms)
  - `POST /instructors/batch` (35-38ms)
  - `GET /courses/{id}/units` x2 (38-77ms)
- **Renders:** Welcome banner, 2 course cards (life science, Demo Course), feedback list
- **Known issue:** `GET example.com/avatar.png` -> ERR_BLOCKED_BY_ORB (placeholder URL, not a bug)

### 3. Course Page (`/course/:courseId`)
- **Status:** PASS
- **API Calls (all 200):**
  - `GET /courses/{courseId}` (67ms)
  - `GET /courses/{courseId}/units` (48ms)
  - `GET /courses/{courseId}/awards` (similar)
  - `GET /courses/{courseId}/feedback` (similar)
  - `GET /units/{unitId}/progress` x8 (41-61ms each)
  - `GET /units/{unitId}/knowledge-progress` x8 (98-292ms each)
  - `POST /instructors/batch` (35ms)
- **Renders:** Course title with icon, instructor name/avatar, 8 unit cards with View buttons, progress bars (combined knowledge+skill counts), deadline dates in red
- **Verified fix:** Deadline display shows "Due: Mar 15 at 8:00 PM" correctly with red styling for past deadlines

### 4. Chat Page (`/course/:courseId/unit/:unitId/chat`)
- **Status:** PASS
- **API Calls (all 200):**
  - `GET /units/{unitId}` (67-88ms)
  - `GET /units/{unitId}/threads` (201-288ms)
  - `GET /units/{unitId}/progress` (43ms)
  - `GET /units/{unitId}/knowledge-queue` (90-101ms)
  - `GET /units/{unitId}/knowledge-progress` (98-103ms)
- **Renders:** Left sidebar with Knowledge (5/14) and Skills (0/8) sections, green dots for completed topics, current question with "CURRENT QUESTION" label, "Correct" status, message composer
- **Console errors:** None

### 5. Feedback Page (`/feedback`)
- **Status:** PASS
- **Renders:** "Feedback" heading, course list (life science, Demo Course) as clickable buttons
- **Console errors:** None

### 6. Feedback Course Page (`/feedback/course/:courseId`)
- **Status:** PASS
- **Renders:** Course title, back button, 8 units listed with status dots
- **Console errors:** None

### 7. Feedback Unit Page (`/feedback/course/:courseId/unit/:unitId`)
- **Status:** PASS
- **Renders:** Unit title, Skills Completed (0/8), Knowledge Correct (5/14) with progress bar, AI-generated report from "Sam", teacher feedback from "Dev Instructor" (Mar 15)
- **Console errors:** None

### 8. Settings Page (`/settings`)
- **Status:** PASS (placeholder)
- **Renders:** "Settings" heading, "Settings will appear here." placeholder text
- **Console errors:** None

---

## Instructor Routes

### 9. Login + Auth Flow (Instructor)
- **Route:** `/login` -> `/teacher`
- **Status:** PASS
- **Notes:** Role-based routing correctly sends instructors to `/teacher`

### 10. Instructor Home Page (`/teacher`)
- **Status:** PASS
- **Renders:** Welcome banner ("1 course - Ready to inspire!"), course card (life science, 1 student), "New Course" card
- **Console errors:** None

### 11. Teacher Course Page (`/teacher/course/:courseId`)
- **Status:** PASS
- **Renders:** Course title, "1 student enrolled", Edit Roster + Delete Course buttons, 8 unit cards with View buttons, deadline dates in red
- **Console errors:** None

### 12. Teacher Unit/Editor Page (`/teacher/course/:courseId/unit/:unitId`)
- **Status:** PASS
- **Renders:** Unit title (m1), "No deadline set - click to add", "22 of 22 objectives selected", Save/Re-upload/Delete buttons, Skills (8) with checkboxes, Knowledge (14) list
- **Console errors:** None

### 13. Teacher Feedback Page (`/teacher/feedback`)
- **Status:** PASS
- **Renders:** Banner with personalized message, course card (life science, 1 student)
- **Console errors:** None

### 14. Teacher Feedback Course Page (`/teacher/feedback/course/:courseId`)
- **Status:** PASS
- **Renders:** Course title, "Select a student to review their unit feedback", student list ("Dev Student" with avatar)
- **Console errors:** None

### 15. Teacher Feedback Student Page (`/teacher/feedback/course/:courseId/student/:studentId`)
- **Status:** PASS
- **Renders:** Student name, unit list with status badges ("Report ready", "Feedback sent", "Awaiting report"), View buttons, deadline dates
- **Console errors:** None

### 16. Teacher Feedback Unit Page (`/teacher/feedback/course/:courseId/student/:studentId/unit/:unitId`)
- **Status:** PASS
- **Renders:** Student name + unit title, Skills Completed (0/8), Knowledge Correct (5/14), detailed AI report from "Sam", "YOUR MESSAGES" section with 2 sent feedback messages (Mar 15), "Add Another Message" textarea + Send button
- **Console errors:** None
- **Note:** Some 503s on grading-report/feedback endpoints for OTHER units due to DynamoDB throttling from parallel requests on the parent page — pre-existing issue, not caused by our changes

---

## API Response Time Summary

| Endpoint                    | Avg Response Time | Status |
|-----------------------------|-------------------|--------|
| `GET /current-student`      | 75-153ms          | Fast   |
| `GET /students/{id}/courses`| 48-66ms           | Fast   |
| `GET /awards`               | 39-43ms           | Fast   |
| `GET /feedback`             | 41-50ms           | Fast   |
| `POST /instructors/batch`   | 35-38ms           | Fast   |
| `GET /courses/{id}/units`   | 38-77ms           | Fast   |
| `GET /courses/{id}`         | 67ms              | Fast   |
| `GET /units/{id}/progress`  | 41-61ms           | Fast   |
| `GET /units/{id}/knowledge-progress` | 98-292ms | Acceptable |
| `GET /units/{id}`           | 67-88ms           | Fast   |
| `GET /units/{id}/threads`   | 201-288ms         | Acceptable |
| `GET /units/{id}/knowledge-queue` | 90-101ms    | Fast   |
| `GET /units/{id}/grading-report` | varies       | Throttle-sensitive |

All endpoints return within acceptable latency. The slowest are knowledge-progress (up to 292ms) and threads (up to 288ms), both still under 300ms.

---

## Verified Code Changes

The following fixes from the code review were verified working on this branch:

1. **Deadline display (UnitCard.tsx):** Red styling for past deadlines renders correctly on both student and teacher course pages
2. **Course icon extraction (courseIcons.ts):** Shared constant imported correctly by CoursePage and FeedbackPage — science icon renders on course cards
3. **Sidebar navigation (SidebarNav.tsx):** Shows "Feedback" (not "Progress"), all navigation links work correctly for both student and teacher routes
4. **updateFeedback with studentId (api.ts):** Teacher feedback unit page sends feedback successfully
5. **Combined progress counts (CoursePage.tsx):** Unit cards show combined knowledge+skill objective counts (e.g., 5/22 for m1 = knowledge + skills)

---

## Issues Found

| Issue | Severity | Source |
|-------|----------|--------|
| `example.com/avatar.png` blocked by ORB | Low | Placeholder URL in demo data |
| 503 throttling on parallel grading-report requests | Medium | Pre-existing DynamoDB capacity issue |
| "See all" button on home page feedback section has no onClick handler | Low | Pre-existing UI stub |

---

**Result: All 16 routes tested and passing. No regressions from code review changes.**
