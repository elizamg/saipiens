# Sapiens — Comprehensive Test Plan

## Table of Contents
- [Authentication & Login](#authentication--login)
- [Teacher: Dashboard & Navigation](#teacher-dashboard--navigation)
- [Teacher: Course Management](#teacher-course-management)
- [Teacher: Roster Management](#teacher-roster-management)
- [Teacher: Unit Upload & Processing](#teacher-unit-upload--processing)
- [Teacher: Objectives Management](#teacher-objectives-management)
- [Teacher: Deadlines](#teacher-deadlines)
- [Teacher: Delete & Restore](#teacher-delete--restore)
- [Teacher: Feedback & Grading Reports](#teacher-feedback--grading-reports)
- [Student: Dashboard & Navigation](#student-dashboard--navigation)
- [Student: Course & Unit Views](#student-course--unit-views)
- [Student: Skill/Capstone Chat (Threaded Learning)](#student-skillcapstone-chat-threaded-learning)
- [Student: Knowledge Queue](#student-knowledge-queue)
- [Student: Awards](#student-awards)
- [Student: Feedback](#student-feedback)
- [Cross-Role Interactions](#cross-role-interactions)
- [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## Authentication & Login

| # | Action | Expected Behavior (Teacher) | Expected Behavior (Student) |
|---|--------|----------------------------|----------------------------|
| 1 | First-time login via Cognito | Instructor record auto-created; name synced from JWT claims; redirected to `/teacher` | Student record auto-created; name synced from JWT claims; redirected to `/home` |
| 2 | Subsequent login | Name re-synced from JWT if changed in Cognito; lands on dashboard | Name re-synced from JWT if changed in Cognito; lands on dashboard |
| 3 | Logout (TopBar avatar/button) | Session cleared; redirected to login page | Session cleared; redirected to login page |
| 4 | Access teacher route as student | Redirected away / access denied (RequireRole guard) | N/A |
| 5 | Access student route as teacher | N/A | Redirected away / access denied (RequireRole guard) |
| 6 | Expired/invalid JWT | API returns 401; user prompted to re-authenticate | API returns 401; user prompted to re-authenticate |

---

## Teacher: Dashboard & Navigation

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 7 | Load teacher home page (`/teacher`) | Welcome banner shows instructor name; course grid displays all owned courses with icons, titles, student counts; "New Course" card visible |
| 8 | Click course card on dashboard | Navigates to `/teacher/course/{courseId}` |
| 9 | Click "New Course" card | Navigates to `/teacher/course/create` |
| 10 | Sidebar — Home link | Navigates to `/teacher`; link highlighted as active |
| 11 | Sidebar — Feedback link | Navigates to `/teacher/feedback`; link highlighted as active |
| 12 | Sidebar — Settings link | Navigates to `/teacher/settings`; shows placeholder page |
| 13 | Sidebar — Courses dropdown | Expands/collapses list of owned courses |
| 14 | Sidebar — Click individual course | Navigates to `/teacher/course/{courseId}` |
| 15 | No courses exist | Dashboard shows only the "New Course" card; empty state messaging |

---

## Teacher: Course Management

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 16 | Fill course creation form (name, grade, icon) | "Create Course" button becomes enabled once course name is non-empty |
| 17 | Submit course creation without name | Button stays disabled; cannot submit |
| 18 | Submit course creation with name only | Course created with default icon; navigates to course page |
| 19 | Submit course creation with name + icon + students | Course created with selected icon and enrolled students; navigates to course page |
| 20 | Select icon (History/Science/General) | Icon visually selected; persisted on create |
| 21 | View course page (`/teacher/course/{courseId}`) | Shows course title (editable), student count, "Edit Roster" button, units grid, "New Unit" card |
| 22 | Click-to-edit course title | Inline input appears; type new title; press Enter to save (PATCH to API) or Escape to cancel |
| 23 | Save edited course title | Title updates in header and sidebar immediately |
| 24 | Cancel course title edit (Escape) | Reverts to previous title; no API call |
| 25 | Course with no units | Shows only the "New Unit" card |

---

## Teacher: Roster Management

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 26 | Click "Edit Roster" on course page | Navigates to `/teacher/course/{courseId}/roster` |
| 27 | View roster page | Lists all students in system with checkboxes; currently enrolled students pre-checked; search input visible |
| 28 | Search students by name | List filters in real-time to matching students |
| 29 | Check/uncheck student checkbox | Student added/removed from selection; selection count updates |
| 30 | Click "Add Student" | Inline form appears with First Name, Last Name, Email fields |
| 31 | Submit add student with valid data | New student created via API; appears in list and is auto-selected |
| 32 | Submit add student with invalid email | Validation error shown; student not created |
| 33 | Submit add student with missing fields | Add button stays disabled |
| 34 | Cancel add student form | Form hides; no student created |
| 35 | Save roster changes | PUT to API with selected student IDs; navigates back to course page; student count updates |
| 36 | Save roster with no changes | No error; navigates back |

---

## Teacher: Unit Upload & Processing

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 37 | Click "New Unit" card on course page | Navigates to `/teacher/course/{courseId}/upload` |
| 38 | Step 1 — Enter unit name | "Continue to Upload" button enables when name is non-empty |
| 39 | Step 1 — Leave name empty | "Continue to Upload" button stays disabled |
| 40 | Step 2 — Drag & drop files into zone | Files appear in file list below drop zone; accepted types: PDF, TXT, DOCX, DOC, MD, RTF |
| 41 | Step 2 — Click "Browse" to select files | Native file picker opens; selected files appear in list |
| 42 | Step 2 — Drop unsupported file type | File rejected or error shown |
| 43 | Step 2 — Remove file from list (× button) | File removed from list |
| 44 | Step 2 — Click "Process Documents" | Files uploaded to S3 via presigned URLs; transitions to Step 3 (processing) |
| 45 | Step 3 — Processing state | Spinner animates; "Processing your documents..." and "Sam is analyzing your content" shown; page polls `upload-status` every 3s |
| 46 | Step 3 — Processing completes successfully | Transitions to Step 4 (review objectives); skill/knowledge items shown with checkboxes |
| 47 | Step 3 — Processing fails | Error state shown with message; option to retry |
| 48 | Step 4 — Review identified objectives | Checkboxes for each identified skill/knowledge item; "Select All" / "Deselect All" buttons available |
| 49 | Step 4 — Select/deselect individual items | Checkbox toggles; count updates |
| 50 | Step 4 — Click "Select All" | All items checked |
| 51 | Step 4 — Click "Deselect All" | All items unchecked |
| 52 | Step 4 — Click "Save" with selections | POST to generate selected objectives; returns to processing state; polls until ready |
| 53 | Step 4 — Save with nothing selected | Button disabled or warning shown |
| 54 | Generation completes | Unit status changes to "ready"; navigates to unit editor page |

---

## Teacher: Objectives Management

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 55 | View unit editor (`/teacher/course/{courseId}/unit/{unitId}`) | Shows objectives grouped by kind (Knowledge, Skills, Capstone); each has enable/disable checkbox; progress count "X of Y objectives selected" |
| 56 | Toggle objective checkbox (enable) | Objective enabled; PATCH to API; count updates |
| 57 | Toggle objective checkbox (disable) | Objective disabled; PATCH to API; count updates |
| 58 | Click "Save" on objectives | All changes persisted; button disabled until new changes made |
| 59 | No changes made | Save button stays disabled |
| 60 | View knowledge topics (for ready units) | Read-only list of identified knowledge topics displayed |
| 61 | Click "Re-upload Documents" | Navigates to upload page with `?unitId=` param; shows previously uploaded files; allows new file upload |
| 62 | Re-upload and process | New presigned URLs generated; files uploaded; processing restarts; previous objectives cleared |

---

## Teacher: Deadlines

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 63 | Click deadline area (no deadline set) | Datetime input appears |
| 64 | Set a deadline datetime | Save button appears; click Save to persist (PATCH to API) |
| 65 | Cancel deadline edit | Reverts; no API call |
| 66 | Remove existing deadline | Click "Remove"; deadline cleared via API |
| 67 | Set deadline in the past | Deadline saved (no client-side restriction); may show as overdue for students |

---

## Teacher: Delete & Restore

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 68 | Click "Delete Course" on course page | Confirmation modal appears with Confirm/Cancel buttons |
| 69 | Confirm delete course | Course soft-deleted; removed from dashboard and sidebar; navigates to `/teacher` |
| 70 | Cancel delete course | Modal closes; nothing happens |
| 71 | Click "Delete Unit" on unit editor | Confirmation modal appears |
| 72 | Confirm delete unit | Unit soft-deleted; removed from course page; navigates to `/teacher/course/{courseId}` |
| 73 | Cancel delete unit | Modal closes; nothing happens |

---

## Teacher: Feedback & Grading Reports

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 74 | Navigate to `/teacher/feedback` | Course grid shown with all courses and student counts |
| 75 | Click a course card | Navigates to `/teacher/feedback/course/{courseId}`; lists enrolled students as clickable cards with avatar initials |
| 76 | Click a student card | Navigates to `/teacher/feedback/course/{courseId}/student/{studentId}`; shows units grid with report-ready status indicators |
| 77 | Unit with report ready | Green dot + "Report ready" label shown |
| 78 | Unit without report | Grey dot + "Awaiting report" label shown |
| 79 | Unit with feedback already sent | Green badge "Feedback sent" shown |
| 80 | Click a unit card | Navigates to feedback unit page; loads grading report (generates on-demand if first access) |
| 81 | View grading report | Stat cards show: Skills Completed (X/Y + progress bar), Knowledge Correct (X/Y + progress bar); deadline card shows date + on-time/late/in-progress badge |
| 82 | View Sam's report | Card with Sam's avatar; analytical summary of student performance |
| 83 | View past feedback messages | History of previously sent teacher messages displayed |
| 84 | Type feedback in textarea | Text entered in 4-row textarea |
| 85 | Click "Send" feedback | POST to API; button shows "Sending..." state; success shows green "✓ Sent"; message appears in history |
| 86 | Send empty feedback | Button disabled or prevented |
| 87 | Student has no progress on unit | Report may show 0/0 or null; appropriate empty state |

---

## Student: Dashboard & Navigation

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 88 | Load student home page (`/home`) | Welcome banner with "Welcome back, [Name]!"; enrolled courses grid; awards section; recent teacher feedback panel |
| 89 | No enrolled courses | Empty state shown in courses area |
| 90 | Click course card | Navigates to `/course/{courseId}` |
| 91 | Sidebar — Home link | Navigates to `/home`; active highlight |
| 92 | Sidebar — Feedback link | Navigates to `/feedback`; active highlight |
| 93 | Sidebar — Settings link | Navigates to `/settings`; placeholder page shown |
| 94 | Sidebar — Courses dropdown | Expands to show enrolled courses |
| 95 | Sidebar — Click individual course | Navigates to `/course/{courseId}` |

---

## Student: Course & Unit Views

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 96 | View course page (`/course/{courseId}`) | Course header with icon + instructor avatars; units list sorted by status (active first); course-specific awards; course feedback |
| 97 | Active unit card | Green dot; title; deadline (red if past due); progress bar showing combined skill + knowledge progress; "View" button |
| 98 | Completed unit card | Green checkmark badge; progress bar at 100% |
| 99 | Locked unit card | Lock icon; greyed out; not clickable |
| 100 | Processing unit card | Pulsing dot; "Generating assignments..." text; not clickable |
| 101 | Click active/completed unit | Navigates to `/course/{courseId}/unit/{unitId}/chat` |
| 102 | Click locked unit | Nothing happens (not interactive) |

---

## Student: Skill/Capstone Chat (Threaded Learning)

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 103 | Load chat page | Left sidebar shows ThreadList with collapsible sections: Knowledge, Skills, Capstone; center shows message area + composer |
| 104 | ThreadList — Knowledge section | Shows DualProgressBar (green = correct, grey = incorrect); lists knowledge queue items with KnowledgeCircle status indicators |
| 105 | ThreadList — Skills section | Lists skill objectives with ProgressCircle (5 states: empty, 1/4, 1/2, 3/4, full) |
| 106 | ThreadList — Capstone section | Lists capstone objectives with ProgressCircle |
| 107 | Select a skill/capstone thread | Thread highlighted with left border; messages load for current stage; stage navigation (Previous/Next) appears |
| 108 | Begin stage | Intro message from tutor shown; CTA to "Start Walkthrough" |
| 109 | Click "Start Walkthrough" | Stage advances to walkthrough; new prompt/messages load; suggested question pills appear |
| 110 | Walkthrough stage — type and send message | Student message appears right-aligned; tutor responds with scaffolded guidance; typing indicator shows during AI response |
| 111 | Walkthrough stage — click suggested question pill | Text auto-fills in composer; sent as clarification type message |
| 112 | Walkthrough stage — complete | CTA to "Start Challenge" appears; ProgressCircle updates to 1/2 |
| 113 | Click "Start Challenge" | Stage advances to challenge; new prompt loads |
| 114 | Challenge stage — send answer | Student answer sent; tutor grades and responds; if correct, ProgressCircle updates to full (green) |
| 115 | Challenge stage — incorrect answer | Tutor provides feedback; student can retry |
| 116 | Navigate Previous/Next between stages | Messages switch to selected stage; stage indicator updates |
| 117 | All stages completed for an objective | ProgressCircle shows full green; thread marked complete |
| 118 | Auto-scroll behavior | Message list scrolls to bottom on new messages; respects user scroll position (doesn't force-scroll if user scrolled up) |
| 119 | Typing indicator | Animated bouncing dots shown while waiting for tutor response |
| 120 | Empty composer — send button | Button disabled when textarea is empty |
| 121 | Enter to send, Shift+Enter for newline | Enter submits message; Shift+Enter inserts line break |
| 122 | Back button in chat | Returns to course page |

---

## Student: Knowledge Queue

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 123 | First access to knowledge queue for a unit | Queue auto-initializes: creates items for all knowledge topics; first item set to "active", rest "pending" |
| 124 | Select knowledge item in sidebar | Item highlighted; question prompt displayed in chat area; clarifying question pills shown |
| 125 | Answer knowledge question — correct | Tutor confirms correct; item status → `completed_correct`; green KnowledgeCircle; next pending item auto-activates |
| 126 | Answer knowledge question — incorrect | Tutor provides feedback; item status → `completed_incorrect`; grey KnowledgeCircle; new retry item created as pending with new question |
| 127 | Click clarifying question pill | Question sent; tutor answers without grading; pill marked as used |
| 128 | Click "Ask a question" pill | Composer focuses for free-form clarification; answer returned without grading |
| 129 | Knowledge progress bar | DualProgressBar updates: green section = correct unique topics, grey = incorrect unique topics |
| 130 | All knowledge items completed correctly | Knowledge section shows full green progress; all circles green |
| 131 | Retry item appears after incorrect answer | New pending item in queue with different question for same topic; can be attempted when it becomes active |
| 132 | Pending knowledge item (not yet active) | Shows "Pending" badge; not interactive until previous items completed |
| 133 | Active knowledge item | Shows "Active" badge; interactive |
| 134 | Completed knowledge item | Shows "Completed" badge with green (correct) or grey (incorrect) circle |
| 135 | Grading in progress | Loading state while AI grades answer; send button disabled |

---

## Student: Awards

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 136 | View awards on home page | AwardsGrid shows all earned awards across courses with icon, title, subtitle |
| 137 | View awards on course page | Shows only awards earned in that specific course |
| 138 | No awards earned | Awards section hidden or shows empty state |
| 139 | Award card display | Shows appropriate icon (early/medium/owl), title, subtitle, optional course tag |

---

## Student: Feedback

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 140 | Navigate to `/feedback` | Lists all enrolled courses as clickable items |
| 141 | Click a course | Navigates to `/feedback/course/{courseId}`; lists units with green/grey dots indicating report availability |
| 142 | Unit with grading report available | Green dot shown; clickable |
| 143 | Unit without grading report | Grey dot shown; may still be clickable but shows empty state |
| 144 | Click a unit | Navigates to `/feedback/course/{courseId}/unit/{unitId}` |
| 145 | View feedback unit page | Shows: Skills Completed (X/Y + progress bar), Knowledge Correct (X/Y + progress bar), deadline + on-time/late/in-progress badge |
| 146 | View Sam's student-facing report | Encouraging summary card with Sam's avatar |
| 147 | View teacher feedback messages | Cards showing teacher name, date, message body |
| 148 | No teacher feedback yet | Empty state or "No feedback yet" message |
| 149 | No grading report generated | Appropriate empty/null state (student cannot trigger generation) |
| 150 | Recent feedback on home page | TeacherFeedbackPanel shows latest feedback with unit title, message preview, source avatar, CTA button to navigate |

---

## Cross-Role Interactions

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 151 | Teacher creates course + enrolls students | Students see course appear in their dashboard on next load |
| 152 | Teacher updates roster (adds student) | Newly added student sees course on their dashboard |
| 153 | Teacher updates roster (removes student) | Removed student no longer sees course on dashboard |
| 154 | Teacher uploads + processes unit | Students enrolled in course see new unit (status depends on processing state) |
| 155 | Teacher enables/disables objectives | Student chat reflects only enabled objectives in thread list |
| 156 | Teacher sets deadline on unit | Student sees deadline on unit card (red if past due) |
| 157 | Teacher sends feedback | Student sees feedback on their feedback page and in recent feedback panel on home |
| 158 | Student completes objectives | Teacher sees updated progress in grading report |
| 159 | Student completes knowledge queue | Teacher grading report reflects correct/incorrect counts |
| 160 | Teacher generates grading report | Both teacher and student versions generated; student can now view their report |
| 161 | Teacher deletes unit | Students no longer see unit in course |
| 162 | Teacher deletes course | Students no longer see course in dashboard |

---

## Edge Cases & Error Handling

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 163 | Network failure during API call | Error message displayed; user can retry action |
| 164 | Upload large file | Upload progresses; timeout handled gracefully (presigned URLs expire in 15 min) |
| 165 | Processing pipeline fails (Gemini error) | Unit status set to "error"; error message shown; teacher can retry processing |
| 166 | Send message while AI is responding | Send button disabled during AI response; prevents double-sends |
| 167 | Navigate away during upload/processing | Unit stays in processing state; can return and check status |
| 168 | Two teachers manage same student | Both can see student in their roster; student sees courses from both |
| 169 | Empty course (no units) | "New Unit" card shown as only item |
| 170 | Unit with 0 objectives enabled | Handle gracefully; student should see empty thread list or appropriate message |
| 171 | Student accesses unit still processing | Unit card shows processing state; not clickable |
| 172 | Concurrent roster edits | Last write wins (PUT replaces entire roster) |
| 173 | Very long course/unit name | Text truncated with ellipsis in cards; full name shown in edit fields |
| 174 | Special characters in course/unit name | Handled correctly; no XSS or display issues |
| 175 | Multiple file upload (drag multiple at once) | All files added to list; all uploaded on process |
| 176 | Re-upload documents on existing unit | Previous objectives cleared; new processing pipeline runs; status resets to processing |
| 177 | Student refreshes chat page | Messages and progress re-loaded; state restored correctly |
| 178 | Browser back/forward navigation | Routes load correctly; no stale state |
| 179 | Mobile/responsive layout | AppShell sidebar collapses; content reflows appropriately |
| 180 | Session timeout during long processing | Re-authentication required; processing continues on backend |
