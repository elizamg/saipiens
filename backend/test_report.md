# Sapiens API Extreme Test Report

**Date:** 2026-02-26
**Target:** `https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod`
**Runtime:** `sapiens-api` Lambda, Python 3.12
**Result:** ✅ **88/88 PASSED** in 95s

Run with: `python3 backend/test_suite.py`

---

## Test Coverage Summary

| Section | Tests | Result |
|---------|-------|--------|
| 1. Health | 1 | ✅ |
| 2. Authentication | 4 | ✅ |
| 3. Current Student | 2 | ✅ |
| 4. Courses | 5 | ✅ |
| 5. Instructors | 4 | ✅ |
| 6. Units | 5 | ✅ |
| 7. Objectives | 5 | ✅ |
| 8. Item Stages | 7 | ✅ |
| 9. Student Progress | 8 | ✅ |
| 10. Awards | 3 | ✅ |
| 11. Feedback | 3 | ✅ |
| 12. Chat Threads | 8 | ✅ |
| 13. Chat Messages | 4 | ✅ |
| 14. Send Message — No AI | 10 | ✅ |
| 15. Walkthrough AI Pipeline | 5 | ✅ |
| 16. Challenge (knowledge) | 2 | ✅ |
| 17. Challenge (skill) | 1 | ✅ |
| 18. Error Handling & Edge Cases | 9 | ✅ |
| 19. Message Ordering & Consistency | 2 | ✅ |
| **Total** | **88** | **✅ 88/88** |

---

## What Was Tested

### Authentication
- No auth headers → 401
- Wrong dev token → 401
- Valid dev auth (X-Dev-Student-Id + X-Dev-Token) → 200
- Each student ID resolves only their own profile
- Cross-student access → 403

### Data Shape Contracts
- Every response was checked for required fields per `FRONTEND_BACKEND_CONTRACT.md`
- Ordering guarantees verified: objectives by `order`, stages by `order` (1,2,3), messages by `createdAt` asc, threads by objective `order`
- 404 for every non-existent entity (course, unit, objective, stage, thread)
- Empty lists returned (not 404) for valid parents with no children

### AI Tutor Pipeline
- `stageType=walkthrough` on a skill thread → real Gemini response returned as `tutorMessage`
- `stageType=challenge` on a knowledge thread → `grade_info` feedback returned
- `stageType=challenge` on a skill thread → `grade_skill` feedback returned
- No `stageType` → `tutorMessage: null` (no pipeline invoked)
- `stageType=begin` → `tutorMessage: null`
- Unknown `stageType` → `tutorMessage: null` (graceful degradation, no crash)
- Both student and tutor messages persisted to DynamoDB and retrievable via GET

### Message Integrity
- Empty content → 400
- Whitespace-only content → 400
- Missing content field → 400
- Invalid JSON body → 400
- Wrong Content-Type header → 415
- No auth → 401
- Content exactly matches what was sent (no mangling)
- Very long content (5000 chars) accepted
- Unicode / emoji / CJK characters preserved
- Messages appear in GET immediately after POST
- `lastMessageAt` on thread updated after every send
- Multiple messages sent in sequence appear in chronological order

### CORS & HTTP
- OPTIONS preflight returns 200/204 with `Access-Control-Allow-Origin` header
- Unknown routes → 404 with `{error: ...}` body
- Unsupported HTTP methods → 404

---

## Notable Findings (Non-Failures)

1. **`obj_demo_1` has no ItemStages seeded** — verified the Lambda correctly returns `[]` rather than erroring, and `currentStageId` in ThreadWithProgress is `null` (expected for this demo seed state).

2. **`advanceStage` has no cap enforcement beyond stars=3** — calling it 5× caps at earnedStars=3 correctly. No 400 is returned for over-advancing (acceptable per current TODO item K).

3. **awards and feedback are empty** for demo students — endpoints return `[]` correctly; no test data seeded yet.

4. **AI response latency** — walkthrough/challenge calls take ~8–15s each via Gemini 3 Flash Preview. Lambda timeout of 60s provides adequate headroom.

5. **OPTIONS returns 204 (not 200)** — API Gateway HTTP API v2 returns 204 for preflight by default. This is correct RFC 7231 behavior; our test was corrected to accept both 200 and 204.

---

## Test Data Used

| Entity | ID | Notes |
|--------|-----|-------|
| Student 1 | `student_demo_1` | enrolled in course_demo_1 |
| Student 2 | `4919d94e-7071-7088-9db7-207099f7498f` | enrolled in course-demo-001 |
| Course | `course_demo_1` | Demo Course |
| Unit | `unit_demo_1` | Demo Unit |
| Objective (knowledge, no stages) | `obj_demo_1` | Demo Objective |
| Course 2 | `course-demo-001` | Demo Course (old seed) |
| Unit 2 | `unit-demo-001` | Unit 1: Basics |
| Objective (skill, 3 stages) | `obj-demo-002` | Objective 2 |
| Objective (knowledge, 3 stages) | `obj-demo-001` | Objective 1 |
| Thread (skill) | `thread-obj-demo-002` | used for walkthrough/challenge tests |
| Thread (knowledge) | `thread-obj-demo-001` | used for challenge knowledge tests |
