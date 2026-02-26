# Backend Testing Quickstart

No AWS credentials needed. The API is publicly accessible with dev auth headers.

**Base URL:** `https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod`
**Dev student ID:** `student_demo_1`
**Dev token:** `dev-secret`

---

## Option A: Run the automated test suite

Requires Python 3.8+, no extra packages.

```bash
python3 backend/test_suite.py
```

Runs 88 tests covering every route, error cases, and the AI tutor pipeline. Takes ~90s (AI calls are slow).

---

## Option B: Browser console

Open any page, press `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows), go to the Console tab, and paste:

```javascript
const BASE = "https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod";
const SID = "student_demo_1";
const TOKEN = "dev-secret";

async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: {
      "Content-Type": "application/json",
      "X-Dev-Student-Id": SID,
      "X-Dev-Token": TOKEN,
      ...(options.headers || {}),
    },
    ...options,
  });
  const json = await res.json();
  console.log(res.status, json);
  return json;
}
```

Then try:

```javascript
// Who am I?
await api("/current-student");

// What courses am I in?
await api(`/students/${SID}/courses`);

// Units in the demo course
await api("/courses/course_demo_1/units");

// Objectives in the demo unit
await api("/units/unit_demo_1/objectives");

// Chat threads for the unit
await api("/units/unit_demo_1/threads");

// Read messages in a thread
await api("/threads/thread-obj_demo_1/messages");

// Send a message (no AI — no stageType)
await api("/threads/thread-obj_demo_1/messages", {
  method: "POST",
  body: JSON.stringify({ content: "Hello!" }),
});

// Send a message and get an AI tutor response (walkthrough pipeline)
await api("/threads/thread-obj-demo-002/messages", {
  method: "POST",
  body: JSON.stringify({
    content: "I think the first step is to identify the variables.",
    stageType: "walkthrough",
  }),
});
// tutorMessage in the response is a real Gemini AI reply — takes ~10s
```

---

## Option C: curl

```bash
BASE="https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod"
AUTH='-H "X-Dev-Student-Id: student_demo_1" -H "X-Dev-Token: dev-secret"'

# Health check
curl $BASE/health

# Current student
curl $BASE/current-student -H "X-Dev-Student-Id: student_demo_1" -H "X-Dev-Token: dev-secret"

# Send a message with AI tutor reply
curl -X POST "$BASE/threads/thread-obj-demo-002/messages" \
  -H "Content-Type: application/json" \
  -H "X-Dev-Student-Id: student_demo_1" \
  -H "X-Dev-Token: dev-secret" \
  -d '{"content": "What should I do first?", "stageType": "walkthrough"}'
```

---

## Demo data reference

| Thing | ID |
|-------|----|
| Student | `student_demo_1` |
| Course | `course_demo_1` |
| Unit | `unit_demo_1` |
| Thread (for AI tests) | `thread-obj-demo-002` (skill objective, has all 3 stages) |
| Thread (knowledge AI) | `thread-obj-demo-001` |

**AI pipeline stageTypes:**
- `"walkthrough"` → tutors the student through the problem step by step
- `"challenge"` → grades the student's answer and gives feedback
- omit / `"begin"` → no AI, just stores the message

---

## Testing instructor / teacher routes

Instructor routes use a separate dev header. Any string works as the instructor ID — a record is auto-created on first access.

```javascript
// Browser console — instructor helper
const BASE = "https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod";
const IID = "instructor_demo_1";
const TOKEN = "dev-secret";

async function iapi(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: {
      "Content-Type": "application/json",
      "X-Dev-Instructor-Id": IID,
      "X-Dev-Token": TOKEN,
      ...(options.headers || {}),
    },
    ...options,
  });
  const json = await res.json();
  console.log(res.status, json);
  return json;
}

// Who am I (instructor)?
await iapi("/current-instructor");

// List my courses
await iapi("/instructor/courses");

// Create a course
const course = await iapi("/courses", {
  method: "POST",
  body: JSON.stringify({ title: "AP Chemistry" }),
});

// List all students
await iapi("/students");

// Create a student
const student = await iapi("/students", {
  method: "POST",
  body: JSON.stringify({ name: "Jane Doe", yearLabel: "Year 1" }),
});

// Set roster (replace entirely)
await iapi(`/courses/${course.id}/roster`, {
  method: "PUT",
  body: JSON.stringify({ studentIds: [student.id] }),
});

// Get roster
await iapi(`/courses/${course.id}/roster`);

// Rename a unit
await iapi("/units/unit_demo_1/title", {
  method: "PATCH",
  body: JSON.stringify({ title: "Cell Division & Mitosis" }),
});

// Toggle an objective off
await iapi("/objectives/obj_demo_1/enabled", {
  method: "PATCH",
  body: JSON.stringify({ enabled: false }),
});
```

### Curriculum upload (curl)

```bash
BASE="https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod"

curl -X POST "$BASE/courses/<courseId>/units/upload" \
  -H "X-Dev-Instructor-Id: instructor_demo_1" \
  -H "X-Dev-Token: dev-secret" \
  -F "unitName=Chapter 3: Cellular Respiration" \
  -F "grade=10" \
  -F "files=@chapter3.pdf"
```

⚠ This call runs the full AI curriculum pipeline — expect 30–90s response time.
