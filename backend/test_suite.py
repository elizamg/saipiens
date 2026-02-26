#!/usr/bin/env python3
"""
Sapiens API Extreme Test Suite
Tests every route, edge case, error path, and the AI pipeline end-to-end.
Run with: python3 backend/test_suite.py
"""

import json
import time
import urllib.request
import urllib.error
import sys
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────────────────────────

BASE = "https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod"
STUDENT_ID = "student_demo_1"           # enrolled in course_demo_1
STUDENT_ID_2 = "4919d94e-7071-7088-9db7-207099f7498f"  # enrolled in course-demo-001 + course_demo_1
DEV_TOKEN = "dev-secret"
TIMEOUT = 90  # seconds (AI calls can be slow)

# Known good IDs (from DynamoDB scan)
COURSE_ID = "course_demo_1"
UNIT_ID = "unit_demo_1"
OBJ_ID = "obj_demo_1"              # kind=knowledge, no stages seeded
THREAD_ID = "thread-obj_demo_1"

COURSE_ID_2 = "course-demo-001"
UNIT_ID_2 = "unit-demo-001"
OBJ_SKILL_ID = "obj-demo-002"     # kind=skill, has all 3 stages
OBJ_KNOW_ID = "obj-demo-001"      # kind=knowledge, has all 3 stages
THREAD_SKILL_ID = "thread-obj-demo-002"
THREAD_KNOW_ID = "thread-obj-demo-001"

# ── Test infrastructure ───────────────────────────────────────────────────────

results = []
passed = failed = skipped = 0


def _req(method, path, body=None, student_id=STUDENT_ID, token=DEV_TOKEN, extra_headers=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    headers = {
        "Content-Type": "application/json",
        "X-Dev-Student-Id": student_id,
        "X-Dev-Token": token,
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            status = r.status
            body = r.read().decode()
            try:
                return status, json.loads(body)
            except Exception:
                return status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body
    except Exception as e:
        return None, str(e)


def GET(path, **kw): return _req("GET", path, **kw)
def POST(path, body=None, **kw): return _req("POST", path, body=body or {}, **kw)
def PUT(path, body=None, **kw): return _req("PUT", path, body=body or {}, **kw)
def PATCH(path, body=None, **kw): return _req("PATCH", path, body=body or {}, **kw)


class T:
    """Test assertion context."""
    def __init__(self, name):
        self.name = name
        self.notes = []

    def check(self, cond, msg):
        if not cond:
            self.notes.append(f"  ✗ {msg}")
        return cond

    def note(self, msg):
        self.notes.append(f"  → {msg}")

    def done(self, passed_flag):
        global passed, failed
        icon = "✓" if passed_flag else "✗"
        status = "PASS" if passed_flag else "FAIL"
        print(f"  [{status}] {self.name}")
        for n in self.notes:
            print(n)
        results.append({"name": self.name, "status": status, "notes": self.notes})
        if passed_flag:
            passed += 1
        else:
            failed += 1

    def __enter__(self):
        return self

    def __exit__(self, *_):
        pass


def section(title):
    print(f"\n{'═' * 60}")
    print(f"  {title}")
    print(f"{'═' * 60}")


# ── Test sections ──────────────────────────────────────────────────────────────

def test_health():
    section("1. HEALTH")
    with T("GET /health → 200 ok:true") as t:
        s, b = GET("/health", student_id="", token="")
        ok = t.check(s == 200, f"status={s}")
        t.check(isinstance(b, dict) and b.get("ok") is True, f"body={b}")
        t.done(ok)


def test_auth():
    section("2. AUTHENTICATION")

    with T("No auth headers → 401") as t:
        s, b = GET("/current-student", student_id="", token="")
        ok = t.check(s == 401, f"status={s}")
        t.done(ok)

    with T("Wrong dev token → 401") as t:
        s, b = GET("/current-student", student_id=STUDENT_ID, token="wrong-token")
        ok = t.check(s == 401, f"status={s}")
        t.done(ok)

    with T("Valid dev auth → 200") as t:
        s, b = GET("/current-student")
        ok = t.check(s == 200, f"status={s}")
        t.check(isinstance(b, dict) and b.get("id") == STUDENT_ID, f"id={b.get('id') if isinstance(b, dict) else b}")
        t.done(ok)

    with T("Different student ID resolves own profile") as t:
        s, b = GET("/current-student", student_id=STUDENT_ID_2)
        ok = t.check(s == 200 and isinstance(b, dict) and b.get("id") == STUDENT_ID_2, f"status={s} id={b.get('id') if isinstance(b, dict) else b}")
        t.done(ok)


def test_student():
    section("3. CURRENT STUDENT")

    with T("Response has required fields: id, name, yearLabel") as t:
        s, b = GET("/current-student")
        ok = (s == 200 and isinstance(b, dict)
              and "id" in b and "name" in b and "yearLabel" in b)
        t.check(ok, f"body={b}")
        t.done(ok)

    with T("student_demo_1 has name='Demo Student'") as t:
        s, b = GET("/current-student")
        ok = t.check(isinstance(b, dict) and b.get("name") == "Demo Student", f"name={b.get('name') if isinstance(b, dict) else b}")
        t.done(ok)


def test_courses():
    section("4. COURSES")

    with T("List courses for student_demo_1 → [course_demo_1]") as t:
        s, b = GET(f"/students/{STUDENT_ID}/courses")
        ok = (s == 200 and isinstance(b, list)
              and any(c.get("id") == COURSE_ID for c in b))
        t.check(ok, f"status={s} ids={[c.get('id') for c in b] if isinstance(b, list) else b}")
        t.done(ok)

    with T("Student cannot list other student's courses → 403") as t:
        s, b = GET(f"/students/{STUDENT_ID_2}/courses", student_id=STUDENT_ID)
        ok = t.check(s == 403, f"status={s}")
        t.done(ok)

    with T("Get course by id → Course shape") as t:
        s, b = GET(f"/courses/{COURSE_ID}")
        ok = (s == 200 and isinstance(b, dict)
              and b.get("id") == COURSE_ID and "title" in b)
        t.check(ok, f"status={s} body={b}")
        t.done(ok)

    with T("Get non-existent course → 404") as t:
        s, b = GET("/courses/does-not-exist")
        ok = t.check(s == 404, f"status={s}")
        t.done(ok)

    with T("Course has instructorIds list") as t:
        s, b = GET(f"/courses/{COURSE_ID}")
        ok = t.check(isinstance(b, dict) and isinstance(b.get("instructorIds"), list), f"body={b}")
        t.done(ok)


def test_instructors():
    section("5. INSTRUCTORS")

    with T("Batch get instructors → list") as t:
        s, b = POST("/instructors/batch", {"ids": ["inst_demo_1"]})
        ok = t.check(s == 200 and isinstance(b, list), f"status={s} body={b}")
        t.note(f"returned {len(b) if isinstance(b, list) else '?'} instructors")
        t.done(ok)

    with T("Batch get empty ids → []") as t:
        s, b = POST("/instructors/batch", {"ids": []})
        ok = t.check(s == 200 and b == [], f"status={s} body={b}")
        t.done(ok)

    with T("Batch get non-existent instructor → []") as t:
        s, b = POST("/instructors/batch", {"ids": ["nobody"]})
        ok = t.check(s == 200 and isinstance(b, list) and len(b) == 0, f"status={s} body={b}")
        t.done(ok)

    with T("Missing ids field → 200 []") as t:
        s, b = POST("/instructors/batch", {"wrong": "field"})
        ok = t.check(s == 200 and b == [], f"status={s} body={b}")
        t.done(ok)


def test_units():
    section("6. UNITS")

    with T("List units for course_demo_1") as t:
        s, b = GET(f"/courses/{COURSE_ID}/units")
        ok = (s == 200 and isinstance(b, list)
              and any(u.get("id") == UNIT_ID for u in b))
        t.check(ok, f"status={s} units={[u.get('id') for u in b] if isinstance(b, list) else b}")
        t.done(ok)

    with T("Unit has required fields: id, courseId, title, status") as t:
        s, b = GET(f"/courses/{COURSE_ID}/units")
        unit = next((u for u in b if u.get("id") == UNIT_ID), None) if isinstance(b, list) else None
        ok = (unit is not None
              and all(k in unit for k in ("id", "courseId", "title", "status")))
        t.check(ok, f"unit={unit}")
        t.done(ok)

    with T("Get unit by id → Unit shape") as t:
        s, b = GET(f"/units/{UNIT_ID}")
        ok = s == 200 and isinstance(b, dict) and b.get("id") == UNIT_ID
        t.check(ok, f"status={s} id={b.get('id') if isinstance(b, dict) else b}")
        t.done(ok)

    with T("Get non-existent unit → 404") as t:
        s, b = GET("/units/ghost-unit")
        ok = t.check(s == 404, f"status={s}")
        t.done(ok)

    with T("Units for non-existent course → []") as t:
        s, b = GET("/courses/no-such-course/units")
        ok = t.check(s == 200 and b == [], f"status={s} body={b}")
        t.done(ok)


def test_objectives():
    section("7. OBJECTIVES")

    with T("List objectives for unit_demo_1") as t:
        s, b = GET(f"/units/{UNIT_ID}/objectives")
        ok = (s == 200 and isinstance(b, list)
              and any(o.get("id") == OBJ_ID for o in b))
        t.check(ok, f"status={s} ids={[o.get('id') for o in b] if isinstance(b, list) else b}")
        t.done(ok)

    with T("Objectives sorted by order asc") as t:
        s, b = GET(f"/units/{UNIT_ID_2}/objectives")
        if isinstance(b, list) and len(b) > 1:
            orders = [o.get("order", 0) for o in b]
            ok = t.check(orders == sorted(orders), f"orders={orders}")
        else:
            ok = True
            t.note("Only 1 objective, skip order check")
        t.done(ok)

    with T("Get objective by id → Objective shape") as t:
        s, b = GET(f"/objectives/{OBJ_SKILL_ID}")
        ok = (s == 200 and isinstance(b, dict)
              and b.get("id") == OBJ_SKILL_ID
              and "kind" in b and "title" in b and "unitId" in b)
        t.check(ok, f"status={s} body={b}")
        t.done(ok)

    with T("Get non-existent objective → 404") as t:
        s, b = GET("/objectives/ghost-obj")
        ok = t.check(s == 404, f"status={s}")
        t.done(ok)

    with T("Objectives for non-existent unit → []") as t:
        s, b = GET("/units/no-unit/objectives")
        ok = t.check(s == 200 and b == [], f"status={s} body={b}")
        t.done(ok)


def test_stages():
    section("8. ITEM STAGES")

    with T("List stages for obj-demo-002 (skill) → 3 stages") as t:
        s, b = GET(f"/objectives/{OBJ_SKILL_ID}/stages")
        ok = (s == 200 and isinstance(b, list) and len(b) == 3)
        t.check(ok, f"count={len(b) if isinstance(b, list) else '?'} status={s}")
        t.done(ok)

    with T("Stages have types begin, walkthrough, challenge") as t:
        s, b = GET(f"/objectives/{OBJ_SKILL_ID}/stages")
        if isinstance(b, list):
            types = {st.get("stageType") for st in b}
            ok = t.check(types == {"begin", "walkthrough", "challenge"}, f"types={types}")
        else:
            ok = False
            t.check(False, f"status={s} body={b}")
        t.done(ok)

    with T("Stages sorted by order asc (1, 2, 3)") as t:
        s, b = GET(f"/objectives/{OBJ_SKILL_ID}/stages")
        if isinstance(b, list) and len(b) == 3:
            orders = [int(st.get("order", 0)) for st in b]
            ok = t.check(orders == [1, 2, 3], f"orders={orders}")
        else:
            ok = False
        t.done(ok)

    with T("Each stage has id, itemId, stageType, order, prompt") as t:
        s, b = GET(f"/objectives/{OBJ_SKILL_ID}/stages")
        if isinstance(b, list):
            ok = all(all(k in st for k in ("id", "itemId", "stageType", "order", "prompt")) for st in b)
            t.check(ok, f"stages={b}")
        else:
            ok = False
        t.done(ok)

    with T("Get stage by id") as t:
        s, b = GET("/stages/stage-obj-demo-002-begin")
        ok = (s == 200 and isinstance(b, dict)
              and b.get("stageType") == "begin")
        t.check(ok, f"status={s} body={b}")
        t.done(ok)

    with T("Get non-existent stage → 404") as t:
        s, b = GET("/stages/ghost-stage")
        ok = t.check(s == 404, f"status={s}")
        t.done(ok)

    with T("List stages for objective with no stages → []") as t:
        s, b = GET(f"/objectives/{OBJ_ID}/stages")
        ok = t.check(s == 200 and isinstance(b, list) and len(b) == 0, f"status={s} len={len(b) if isinstance(b, list) else '?'}")
        t.done(ok)


def test_progress():
    section("9. STUDENT PROGRESS")

    with T("Get progress for objective with no record → default (earnedStars=0)") as t:
        s, b = GET(f"/objectives/{OBJ_ID}/progress")
        ok = (s == 200 and isinstance(b, dict)
              and int(b.get("earnedStars", -1)) == 0
              and b.get("currentStageType") == "begin")
        t.check(ok, f"status={s} body={b}")
        t.done(ok)

    with T("Progress has required fields: studentId, objectiveId, earnedStars, currentStageType, updatedAt") as t:
        s, b = GET(f"/objectives/{OBJ_ID}/progress")
        ok = (isinstance(b, dict)
              and all(k in b for k in ("studentId", "objectiveId", "earnedStars", "currentStageType", "updatedAt")))
        t.check(ok, f"body={b}")
        t.done(ok)

    with T("List unit progress items → one per objective") as t:
        s, b = GET(f"/units/{UNIT_ID}/progress/items")
        ok = s == 200 and isinstance(b, list)
        t.check(ok, f"status={s}")
        t.note(f"got {len(b) if isinstance(b, list) else '?'} items")
        t.done(ok)

    with T("Unit progress aggregate has required fields") as t:
        s, b = GET(f"/units/{UNIT_ID}/progress")
        ok = (s == 200 and isinstance(b, dict)
              and all(k in b for k in ("unitId", "totalObjectives", "completedObjectives", "progressPercent")))
        t.check(ok, f"status={s} body={b}")
        t.done(ok)

    with T("progressPercent is 0–100 integer") as t:
        s, b = GET(f"/units/{UNIT_ID}/progress")
        pct = b.get("progressPercent") if isinstance(b, dict) else None
        ok = t.check(isinstance(pct, int) and 0 <= pct <= 100, f"progressPercent={pct}")
        t.done(ok)

    with T("Unit progress for unit with no objectives → 0/0/0") as t:
        s, b = GET("/units/ghost-unit/progress")
        ok = (s == 200 and isinstance(b, dict)
              and b.get("totalObjectives") == 0
              and b.get("progressPercent") == 0)
        t.check(ok, f"status={s} body={b}")
        t.done(ok)

    with T("Advance stage for fresh objective → earnedStars=1 walkthrough") as t:
        # Use student 2 so we don't corrupt demo student state
        s, b = POST(f"/objectives/{OBJ_ID}/advance", student_id=STUDENT_ID_2)
        ok = (s == 200 and isinstance(b, dict)
              and int(b.get("earnedStars", 0)) >= 1)
        t.check(ok, f"status={s} body={b}")
        t.note(f"earnedStars={b.get('earnedStars') if isinstance(b, dict) else '?'}")
        t.done(ok)

    with T("Advance again → earnedStars increases, caps at 3") as t:
        POST(f"/objectives/{OBJ_ID}/advance", student_id=STUDENT_ID_2)
        POST(f"/objectives/{OBJ_ID}/advance", student_id=STUDENT_ID_2)
        s, b = POST(f"/objectives/{OBJ_ID}/advance", student_id=STUDENT_ID_2)
        stars = int(b.get("earnedStars", 0)) if isinstance(b, dict) else -1
        ok = t.check(s == 200 and 1 <= stars <= 3, f"earnedStars={stars}")
        t.done(ok)


def test_awards():
    section("10. AWARDS")

    with T("List awards for student → list (may be empty)") as t:
        s, b = GET("/awards")
        ok = t.check(s == 200 and isinstance(b, list), f"status={s} body={b}")
        t.note(f"awards count={len(b) if isinstance(b, list) else '?'}")
        t.done(ok)

    with T("List awards for course → list") as t:
        s, b = GET(f"/courses/{COURSE_ID}/awards")
        ok = t.check(s == 200 and isinstance(b, list), f"status={s}")
        t.done(ok)

    with T("Awards without auth → 401") as t:
        s, b = GET("/awards", student_id="", token="")
        ok = t.check(s == 401, f"status={s}")
        t.done(ok)


def test_feedback():
    section("11. FEEDBACK")

    with T("List feedback for student → list") as t:
        s, b = GET("/feedback")
        ok = t.check(s == 200 and isinstance(b, list), f"status={s}")
        t.note(f"feedback count={len(b) if isinstance(b, list) else '?'}")
        t.done(ok)

    with T("List feedback for course → list") as t:
        s, b = GET(f"/courses/{COURSE_ID}/feedback")
        ok = t.check(s == 200 and isinstance(b, list), f"status={s}")
        t.done(ok)

    with T("Feedback without auth → 401") as t:
        s, b = GET("/feedback", student_id="", token="")
        ok = t.check(s == 401, f"status={s}")
        t.done(ok)


def test_threads():
    section("12. CHAT THREADS")

    with T("List threads for unit → ThreadWithProgress[]") as t:
        s, b = GET(f"/units/{UNIT_ID}/threads")
        ok = (s == 200 and isinstance(b, list)
              and any(t2.get("id") == THREAD_ID for t2 in b))
        t.check(ok, f"status={s} ids={[x.get('id') for x in b] if isinstance(b, list) else b}")
        t.done(ok)

    with T("ThreadWithProgress has earnedStars, currentStageType, currentStageId, order") as t:
        s, b = GET(f"/units/{UNIT_ID}/threads")
        thread = next((x for x in b if x.get("id") == THREAD_ID), None) if isinstance(b, list) else None
        ok = (thread is not None
              and all(k in thread for k in ("earnedStars", "currentStageType", "currentStageId", "order")))
        t.check(ok, f"thread={thread}")
        t.done(ok)

    with T("Threads sorted by order asc") as t:
        s, b = GET(f"/units/{UNIT_ID_2}/threads")
        if isinstance(b, list) and len(b) > 1:
            orders = [x.get("order", 0) for x in b]
            ok = t.check(orders == sorted(orders), f"orders={orders}")
        else:
            ok = True
            t.note(f"only {len(b) if isinstance(b, list) else '?'} thread(s), skip")
        t.done(ok)

    with T("Auto-creates thread for objective missing one") as t:
        # List threads for unit_demo_1 which has obj_demo_1 — thread should auto-create
        s, b = GET(f"/units/{UNIT_ID}/threads")
        ok = s == 200 and isinstance(b, list) and len(b) >= 1
        t.check(ok, f"count={len(b) if isinstance(b, list) else '?'}")
        t.done(ok)

    with T("Get thread by id → ChatThread") as t:
        s, b = GET(f"/threads/{THREAD_ID}")
        ok = (s == 200 and isinstance(b, dict)
              and b.get("id") == THREAD_ID
              and all(k in b for k in ("unitId", "courseId", "objectiveId", "title", "kind")))
        t.check(ok, f"status={s} body={b}")
        t.done(ok)

    with T("Get non-existent thread → 404") as t:
        s, b = GET("/threads/ghost-thread")
        ok = t.check(s == 404, f"status={s}")
        t.done(ok)

    with T("Get thread with-progress → ThreadWithProgress") as t:
        s, b = GET(f"/threads/{THREAD_ID}/with-progress")
        ok = (s == 200 and isinstance(b, dict)
              and all(k in b for k in ("earnedStars", "currentStageType", "currentStageId", "order")))
        t.check(ok, f"status={s} body={b}")
        t.done(ok)

    with T("Threads for non-existent unit → 404") as t:
        s, b = GET("/units/ghost/threads")
        ok = t.check(s == 404, f"status={s}")
        t.done(ok)


def test_messages():
    section("13. CHAT MESSAGES")

    with T("List messages for thread → ChatMessage[] sorted by createdAt asc") as t:
        s, b = GET(f"/threads/{THREAD_ID}/messages")
        ok = s == 200 and isinstance(b, list)
        t.check(ok, f"status={s}")
        if isinstance(b, list) and len(b) > 1:
            timestamps = [m.get("createdAt", "") for m in b]
            t.check(timestamps == sorted(timestamps), f"not sorted: {timestamps[:3]}")
        t.note(f"message count={len(b) if isinstance(b, list) else '?'}")
        t.done(ok)

    with T("List messages filter by stageId → only matching messages") as t:
        # Send a message with a known stageId, then filter
        stage_id = "stage-obj-demo-002-walkthrough"
        s, b = GET(f"/threads/{THREAD_SKILL_ID}/messages?stageId={stage_id}")
        ok = s == 200 and isinstance(b, list)
        t.check(ok, f"status={s}")
        if isinstance(b, list):
            bad = [m for m in b if m.get("stageId") != stage_id]
            t.check(len(bad) == 0, f"{len(bad)} messages with wrong stageId")
        t.done(ok)

    with T("Messages without auth → 401") as t:
        s, b = GET(f"/threads/{THREAD_ID}/messages", student_id="", token="")
        ok = t.check(s == 401, f"status={s}")
        t.done(ok)

    with T("ChatMessage has required fields: id, threadId, role, content, createdAt") as t:
        s, b = GET(f"/threads/{THREAD_ID}/messages")
        if isinstance(b, list) and len(b) > 0:
            msg = b[0]
            ok = all(k in msg for k in ("id", "threadId", "role", "content", "createdAt"))
            t.check(ok, f"msg={msg}")
        else:
            ok = True
            t.note("No messages yet, skip field check")
        t.done(ok)


def test_send_message_no_pipeline():
    section("14. SEND MESSAGE — NO AI (begin stage / no stageType)")

    with T("Send message with no stageType → studentMessage, tutorMessage=null") as t:
        s, b = POST(f"/threads/{THREAD_ID}/messages", {"content": "Hello, just testing."})
        ok = (s == 200 and isinstance(b, dict)
              and "studentMessage" in b
              and b.get("tutorMessage") is None)
        t.check(ok, f"status={s} keys={list(b.keys()) if isinstance(b, dict) else b}")
        t.done(ok)

    with T("studentMessage has correct shape and role=student") as t:
        s, b = POST(f"/threads/{THREAD_ID}/messages", {"content": "Shape test."})
        msg = b.get("studentMessage") if isinstance(b, dict) else None
        ok = (msg is not None
              and msg.get("role") == "student"
              and msg.get("threadId") == THREAD_ID
              and all(k in msg for k in ("id", "threadId", "role", "content", "createdAt")))
        t.check(ok, f"msg={msg}")
        t.done(ok)

    with T("studentMessage content matches what was sent") as t:
        content = f"Content test {time.time()}"
        s, b = POST(f"/threads/{THREAD_ID}/messages", {"content": content})
        msg = b.get("studentMessage") if isinstance(b, dict) else None
        ok = t.check(msg is not None and msg.get("content") == content, f"sent={content!r} got={msg.get('content') if msg else None!r}")
        t.done(ok)

    with T("Send message with empty content → 400") as t:
        s, b = POST(f"/threads/{THREAD_ID}/messages", {"content": ""})
        ok = t.check(s == 400, f"status={s}")
        t.done(ok)

    with T("Send message with whitespace-only content → 400") as t:
        s, b = POST(f"/threads/{THREAD_ID}/messages", {"content": "   "})
        ok = t.check(s == 400, f"status={s}")
        t.done(ok)

    with T("Send message with missing content field → 400") as t:
        s, b = POST(f"/threads/{THREAD_ID}/messages", {"other": "field"})
        ok = t.check(s == 400, f"status={s}")
        t.done(ok)

    with T("Send message with invalid JSON body → 400") as t:
        req = urllib.request.Request(
            BASE + f"/threads/{THREAD_ID}/messages",
            data=b"not-json",
            headers={
                "Content-Type": "application/json",
                "X-Dev-Student-Id": STUDENT_ID,
                "X-Dev-Token": DEV_TOKEN,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                s = r.status
        except urllib.error.HTTPError as e:
            s = e.code
        ok = t.check(s == 400, f"status={s}")
        t.done(ok)

    with T("Send message without auth → 401") as t:
        s, b = POST(f"/threads/{THREAD_ID}/messages", {"content": "test"}, student_id="", token="")
        ok = t.check(s == 401, f"status={s}")
        t.done(ok)

    with T("Message persisted — appears in subsequent GET") as t:
        unique = f"persistence-check-{time.time()}"
        POST(f"/threads/{THREAD_ID}/messages", {"content": unique})
        time.sleep(0.3)
        s, msgs = GET(f"/threads/{THREAD_ID}/messages")
        found = any(m.get("content") == unique for m in msgs) if isinstance(msgs, list) else False
        ok = t.check(found, f"message not found in thread; total msgs={len(msgs) if isinstance(msgs, list) else '?'}")
        t.done(ok)

    with T("lastMessageAt updated on thread after send") as t:
        before_s, before_b = GET(f"/threads/{THREAD_ID}")
        before_ts = before_b.get("lastMessageAt") if isinstance(before_b, dict) else ""
        time.sleep(1)
        POST(f"/threads/{THREAD_ID}/messages", {"content": "ts-update-test"})
        after_s, after_b = GET(f"/threads/{THREAD_ID}")
        after_ts = after_b.get("lastMessageAt") if isinstance(after_b, dict) else ""
        ok = t.check(after_ts >= before_ts, f"before={before_ts} after={after_ts}")
        t.done(ok)


def test_send_message_walkthrough():
    section("15. SEND MESSAGE — WALKTHROUGH AI PIPELINE")

    print("  (These tests call Gemini — may take up to 30s each)")

    with T("Walkthrough stageType → tutorMessage non-null") as t:
        s, b = POST(f"/threads/{THREAD_SKILL_ID}/messages", {
            "content": "I think I need to start by identifying what we know.",
            "stageType": "walkthrough",
        }, student_id=STUDENT_ID_2)
        ok = (s == 200 and isinstance(b, dict)
              and isinstance(b.get("tutorMessage"), dict))
        t.check(ok, f"status={s} tutorMessage={b.get('tutorMessage') if isinstance(b, dict) else b}")
        t.done(ok)

    with T("Tutor message has role=tutor") as t:
        s, b = POST(f"/threads/{THREAD_SKILL_ID}/messages", {
            "content": "Can you give me a hint?",
            "stageType": "walkthrough",
        }, student_id=STUDENT_ID_2)
        tutor = b.get("tutorMessage") if isinstance(b, dict) else None
        ok = t.check(tutor is not None and tutor.get("role") == "tutor", f"role={tutor.get('role') if tutor else None}")
        t.done(ok)

    with T("Tutor message content is non-empty string") as t:
        s, b = POST(f"/threads/{THREAD_SKILL_ID}/messages", {
            "content": "What is the next step?",
            "stageType": "walkthrough",
        }, student_id=STUDENT_ID_2)
        tutor = b.get("tutorMessage") if isinstance(b, dict) else None
        content = tutor.get("content") if isinstance(tutor, dict) else None
        ok = t.check(isinstance(content, str) and len(content) > 0, f"content={content!r}")
        t.note(f"AI response (first 100 chars): {str(content)[:100]!r}" if content else "")
        t.done(ok)

    with T("Tutor message persisted — appears in GET /messages") as t:
        unique = f"walkthrough-persist-{time.time()}"
        s, b = POST(f"/threads/{THREAD_SKILL_ID}/messages", {
            "content": unique,
            "stageType": "walkthrough",
        }, student_id=STUDENT_ID_2)
        tutor = b.get("tutorMessage") if isinstance(b, dict) else None
        time.sleep(0.3)
        s2, msgs = GET(f"/threads/{THREAD_SKILL_ID}/messages", student_id=STUDENT_ID_2)
        student_found = any(m.get("content") == unique for m in msgs) if isinstance(msgs, list) else False
        tutor_found = any(m.get("role") == "tutor" and m.get("id") == (tutor.get("id") if tutor else None) for m in msgs) if isinstance(msgs, list) else False
        ok = t.check(student_found and tutor_found, f"student_found={student_found} tutor_found={tutor_found}")
        t.done(ok)

    with T("Walkthrough with stageId scopes messages") as t:
        stage_id = "stage-obj-demo-002-walkthrough"
        s, b = POST(f"/threads/{THREAD_SKILL_ID}/messages", {
            "content": "Testing with stageId.",
            "stageId": stage_id,
            "stageType": "walkthrough",
        }, student_id=STUDENT_ID_2)
        msg = b.get("studentMessage") if isinstance(b, dict) else None
        ok = t.check(msg is not None and msg.get("stageId") == stage_id, f"stageId={msg.get('stageId') if msg else None}")
        t.done(ok)


def test_send_message_challenge_knowledge():
    section("16. SEND MESSAGE — CHALLENGE (knowledge objective)")

    print("  (These tests call Gemini — may take up to 30s each)")

    with T("Challenge on knowledge objective → tutorMessage non-null") as t:
        s, b = POST(f"/threads/{THREAD_KNOW_ID}/messages", {
            "content": "Photosynthesis is the process by which plants convert sunlight into glucose.",
            "stageType": "challenge",
        }, student_id=STUDENT_ID_2)
        ok = (s == 200 and isinstance(b, dict)
              and isinstance(b.get("tutorMessage"), dict))
        t.check(ok, f"status={s} keys={list(b.keys()) if isinstance(b, dict) else b}")
        tutor = b.get("tutorMessage") if isinstance(b, dict) else None
        t.note(f"feedback (first 100): {str(tutor.get('content') if tutor else '')[:100]!r}")
        t.done(ok)

    with T("Challenge feedback content is meaningful (>20 chars)") as t:
        s, b = POST(f"/threads/{THREAD_KNOW_ID}/messages", {
            "content": "I have no idea.",
            "stageType": "challenge",
        }, student_id=STUDENT_ID_2)
        tutor = b.get("tutorMessage") if isinstance(b, dict) else None
        content = tutor.get("content") if isinstance(tutor, dict) else ""
        ok = t.check(len(content) > 20, f"len={len(content)} content={content!r}")
        t.done(ok)


def test_send_message_challenge_skill():
    section("17. SEND MESSAGE — CHALLENGE (skill objective)")

    print("  (These tests call Gemini — may take up to 30s each)")

    with T("Challenge on skill objective → tutorMessage non-null") as t:
        s, b = POST(f"/threads/{THREAD_SKILL_ID}/messages", {
            "content": "I believe the answer involves applying conservation of energy.",
            "stageType": "challenge",
        }, student_id=STUDENT_ID_2)
        ok = (s == 200 and isinstance(b, dict)
              and isinstance(b.get("tutorMessage"), dict))
        t.check(ok, f"status={s}")
        tutor = b.get("tutorMessage") if isinstance(b, dict) else None
        t.note(f"feedback (first 100): {str(tutor.get('content') if tutor else '')[:100]!r}")
        t.done(ok)


def test_error_handling():
    section("18. ERROR HANDLING & EDGE CASES")

    with T("404 for completely unknown route") as t:
        s, b = GET("/this-route-does-not-exist-at-all")
        ok = t.check(s == 404, f"status={s}")
        t.done(ok)

    with T("Wrong HTTP method → 404 (router falls through)") as t:
        # DELETE is not defined for /health
        req = urllib.request.Request(
            BASE + "/health",
            headers={"X-Dev-Student-Id": STUDENT_ID, "X-Dev-Token": DEV_TOKEN},
            method="DELETE",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                s = r.status
        except urllib.error.HTTPError as e:
            s = e.code
        ok = t.check(s == 404, f"status={s}")
        t.done(ok)

    with T("OPTIONS preflight → 200/204 with CORS headers") as t:
        req = urllib.request.Request(
            BASE + "/current-student",
            headers={
                "Origin": "https://example.com",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization",
            },
            method="OPTIONS",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                s = r.status
                hdrs = dict(r.headers)
        except urllib.error.HTTPError as e:
            s = e.code
            hdrs = {}
        # API Gateway may return 200 or 204 for preflight — both are valid
        ok = t.check(s in (200, 204), f"status={s}")
        has_cors = ("Access-Control-Allow-Origin" in hdrs
                    or "access-control-allow-origin" in hdrs)
        t.check(has_cors, f"no CORS header in {list(hdrs.keys())[:6]}")
        t.done(ok)

    with T("415 Unsupported Media Type when Content-Type is wrong") as t:
        req = urllib.request.Request(
            BASE + f"/threads/{THREAD_ID}/messages",
            data=b'{"content":"test"}',
            headers={
                "Content-Type": "text/plain",
                "X-Dev-Student-Id": STUDENT_ID,
                "X-Dev-Token": DEV_TOKEN,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                s = r.status
        except urllib.error.HTTPError as e:
            s = e.code
        ok = t.check(s == 415, f"status={s}")
        t.done(ok)

    with T("Error responses include 'error' field in body") as t:
        s, b = GET("/courses/not-real")
        ok = t.check(isinstance(b, dict) and "error" in b, f"body={b}")
        t.done(ok)

    with T("Very long content string is accepted") as t:
        long_content = "A" * 5000
        s, b = POST(f"/threads/{THREAD_ID}/messages", {"content": long_content})
        ok = t.check(s == 200 and isinstance(b, dict) and "studentMessage" in b, f"status={s}")
        t.done(ok)

    with T("Unicode content (emoji, CJK) is preserved") as t:
        unicode_content = "I think 光合作用 means photosynthesis 🌿"
        s, b = POST(f"/threads/{THREAD_ID}/messages", {"content": unicode_content})
        msg = b.get("studentMessage") if isinstance(b, dict) else None
        ok = t.check(msg is not None and msg.get("content") == unicode_content, f"content={msg.get('content') if msg else None!r}")
        t.done(ok)

    with T("stageType=begin → tutorMessage is null (no pipeline)") as t:
        s, b = POST(f"/threads/{THREAD_ID}/messages", {
            "content": "Starting the begin stage.",
            "stageType": "begin",
        })
        ok = (s == 200 and isinstance(b, dict)
              and b.get("tutorMessage") is None)
        t.check(ok, f"status={s} tutorMessage={b.get('tutorMessage') if isinstance(b, dict) else b}")
        t.done(ok)

    with T("Unknown stageType → tutorMessage is null (graceful)") as t:
        s, b = POST(f"/threads/{THREAD_ID}/messages", {
            "content": "Unknown stage type.",
            "stageType": "mystery_stage",
        })
        ok = (s == 200 and isinstance(b, dict)
              and b.get("tutorMessage") is None)
        t.check(ok, f"status={s} tutorMessage={b.get('tutorMessage') if isinstance(b, dict) else b}")
        t.done(ok)


def test_message_ordering():
    section("19. MESSAGE ORDERING & CONSISTENCY")

    with T("Send multiple messages — all appear in order") as t:
        prefix = f"order-test-{int(time.time())}"
        sent = []
        for i in range(3):
            s, b = POST(f"/threads/{THREAD_ID}/messages", {"content": f"{prefix}-{i}"})
            if isinstance(b, dict) and "studentMessage" in b:
                sent.append(b["studentMessage"]["createdAt"])
            time.sleep(0.1)

        time.sleep(0.5)
        s, msgs = GET(f"/threads/{THREAD_ID}/messages")
        got = [m for m in msgs if m.get("content", "").startswith(prefix)] if isinstance(msgs, list) else []
        ok = t.check(len(got) == 3, f"expected 3 got {len(got)}")
        if len(got) > 1:
            ts = [m.get("createdAt") for m in got]
            t.check(ts == sorted(ts), f"not sorted: {ts}")
        t.done(ok)

    with T("Both student and tutor messages appear in GET after AI call") as t:
        send_s, send_b = POST(f"/threads/{THREAD_SKILL_ID}/messages", {
            "content": "Please help me understand this step.",
            "stageType": "walkthrough",
        }, student_id=STUDENT_ID_2)
        tutor_msg = send_b.get("tutorMessage") if isinstance(send_b, dict) else None
        tutor_id = tutor_msg.get("id") if isinstance(tutor_msg, dict) else None
        student_msg = send_b.get("studentMessage") if isinstance(send_b, dict) else None
        student_id_in_resp = student_msg.get("id") if isinstance(student_msg, dict) else None

        time.sleep(0.3)
        s2, msgs = GET(f"/threads/{THREAD_SKILL_ID}/messages", student_id=STUDENT_ID_2)
        ids = [m.get("id") for m in msgs] if isinstance(msgs, list) else []
        student_found = student_id_in_resp in ids if student_id_in_resp else False
        tutor_found = tutor_id in ids if tutor_id else False
        ok = t.check(student_found and tutor_found,
                     f"student_found={student_found} tutor_found={tutor_found} tutor_id={tutor_id} ids[-4:]={ids[-4:]}")
        t.done(ok)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    start = time.time()
    print(f"\n{'═'*60}")
    print(f"  SAPIENS API EXTREME TEST SUITE")
    print(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}")
    print(f"  Target: {BASE}")
    print(f"{'═'*60}")

    test_health()
    test_auth()
    test_student()
    test_courses()
    test_instructors()
    test_units()
    test_objectives()
    test_stages()
    test_progress()
    test_awards()
    test_feedback()
    test_threads()
    test_messages()
    test_send_message_no_pipeline()
    test_send_message_walkthrough()
    test_send_message_challenge_knowledge()
    test_send_message_challenge_skill()
    test_error_handling()
    test_message_ordering()

    elapsed = time.time() - start
    total = passed + failed

    print(f"\n{'═'*60}")
    print(f"  RESULTS: {passed}/{total} passed  ({failed} failed)  [{elapsed:.1f}s]")
    print(f"{'═'*60}")

    if failed > 0:
        print("\n  FAILURES:")
        for r in results:
            if r["status"] == "FAIL":
                print(f"    ✗ {r['name']}")
                for n in r["notes"]:
                    print(f"      {n}")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
