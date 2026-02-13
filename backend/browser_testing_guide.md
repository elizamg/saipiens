# Browser Testing Guide (No AWS Credentials Required)

This guide explains how to test the entire backend API directly from a
web browser without needing AWS CLI or AWS credentials.

These instructions assume: - The API is deployed and accessible. - Dev
auth is currently enabled (`DEV_AUTH_ENABLED=true`). - You have a valid
test student ID. - You know the API base URL.

Example base URL:

    https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod

Example test student:

    4919d94e-7071-7088-9db7-207099f7498f

Example dev token:

    dev-secret

------------------------------------------------------------------------

# Step 1 --- Open the Browser Developer Console

1.  Open a website like https://example.com/.
2.  Press:
    -   Mac: `Cmd + Option + I`
    -   Windows: `Ctrl + Shift + I`
3.  Go to the **Console** tab.

You will use `fetch()` to call the API.

------------------------------------------------------------------------

# Step 2 --- Create a helper function

Paste this once into the console:

``` javascript
const BASE = "https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod";
const SID = "4919d94e-7071-7088-9db7-207099f7498f";
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
  return res.json();
}
```

------------------------------------------------------------------------

# Step 3 --- Run Contract Tests

## 1. Current Student

``` javascript
await api("/current-student");
```

Expected: Student object.

------------------------------------------------------------------------

## 2. Courses

``` javascript
await api(`/students/${SID}/courses`);
```

Expected: Array of courses.

------------------------------------------------------------------------

## 3. Units

``` javascript
await api("/courses/course-demo-001/units");
```

------------------------------------------------------------------------

## 4. Objectives (sorted by order)

``` javascript
await api("/units/unit-demo-001/objectives");
```

Verify `order` is ascending.

------------------------------------------------------------------------

## 5. Stages (must be 1,2,3 order)

``` javascript
await api("/objectives/obj-demo-001/stages");
```

------------------------------------------------------------------------

## 6. Objective Progress

``` javascript
await api("/objectives/obj-demo-001/progress");
```

------------------------------------------------------------------------

## 7. Advance Stage

``` javascript
await api("/objectives/obj-demo-001/advance", {
  method: "POST",
  body: JSON.stringify({})
});
```

------------------------------------------------------------------------

## 8. Unit Progress (aggregate)

``` javascript
await api("/units/unit-demo-001/progress");
```

------------------------------------------------------------------------

## 9. Chat Threads

``` javascript
await api("/units/unit-demo-001/threads");
```

Verify: - `order` present - `currentStageId` not null

------------------------------------------------------------------------

## 10. Chat Messages

``` javascript
await api("/threads/thread-obj-demo-001/messages");
```

Verify messages are chronological.

------------------------------------------------------------------------

## 11. Send Chat Message

``` javascript
await api("/threads/thread-obj-demo-001/messages", {
  method: "POST",
  body: JSON.stringify({
    content: "Testing from browser",
    stageId: "stage-obj-demo-001-begin"
  })
});
```

------------------------------------------------------------------------

## 12. Awards

``` javascript
await api("/awards");
await api("/courses/course-demo-001/awards");
```

------------------------------------------------------------------------

## 13. Feedback

``` javascript
await api("/feedback");
await api("/courses/course-demo-001/feedback");
```

------------------------------------------------------------------------

# Step 4 --- Verify Error Handling

Test a 404:

``` javascript
await fetch(BASE + "/courses/not-real");
```

Expected: - HTTP 404 - JSON `{ "error": "Course not found" }`


