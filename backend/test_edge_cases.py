#!/usr/bin/env python3
"""
Sapiens API Edge Case & Security Test Suite
Tests boundary conditions, authorization edge cases, input validation,
concurrent access, and data integrity guarantees.

Run with: python3 backend/test_edge_cases.py
(auto-fetches Cognito tokens via Node.js)
"""

import json
import time
import ssl
import subprocess
import os
import urllib.request
import urllib.error
import sys
import concurrent.futures
from datetime import datetime, timezone

# Fix SSL certificate verification on macOS Python
_ssl_ctx = ssl.create_default_context()
try:
    import certifi
    _ssl_ctx.load_verify_locations(certifi.where())
except ImportError:
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = ssl.CERT_NONE

_https_handler = urllib.request.HTTPSHandler(context=_ssl_ctx)
_opener = urllib.request.build_opener(_https_handler)
urllib.request.install_opener(_opener)

# ── Config ────────────────────────────────────────────────────────────────────

BASE = "https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod"
TIMEOUT = 30

# Fetch real Cognito tokens
def _load_tokens():
    script_dir = os.path.dirname(os.path.realpath(__file__))
    frontend_dir = os.path.join(script_dir, "..", "frontend")
    token_script = os.path.join(script_dir, "get_tokens.js")
    # If node_modules not found (e.g. in a worktree), search parent dirs
    if not os.path.isdir(os.path.join(frontend_dir, "node_modules")):
        for depth in range(2, 6):
            candidate = os.path.join(script_dir, *([os.pardir] * depth), "frontend")
            if os.path.isdir(os.path.join(candidate, "node_modules")):
                frontend_dir = candidate
                break
    node_modules = os.path.realpath(os.path.join(frontend_dir, "node_modules"))
    env = {**os.environ, "NODE_PATH": node_modules}
    try:
        result = subprocess.run(
            ["node", token_script],
            capture_output=True, text=True, timeout=15, env=env
        )
        if result.returncode == 0:
            return json.loads(result.stdout.strip())
        else:
            print(f"  Token script stderr: {result.stderr[:200]}")
    except Exception as e:
        print(f"  WARNING: Failed to fetch tokens: {e}")
    return None

_tokens = _load_tokens()
if _tokens:
    STUDENT_TOKEN = _tokens["student_token"]
    STUDENT_SUB = _tokens["student_sub"]
    INSTRUCTOR_TOKEN = _tokens["instructor_token"]
    INSTRUCTOR_SUB = _tokens["instructor_sub"]
else:
    print("ERROR: Could not obtain Cognito tokens. Ensure Node.js and amazon-cognito-identity-js are available.")
    sys.exit(1)

# Known good IDs (enrolled for dev-student)
COURSE_ID = "course-demo-001"
UNIT_ID = "unit-demo-001"
OBJ_SKILL_ID = "obj-demo-002"
OBJ_KNOW_ID = "obj-demo-001"
THREAD_SKILL_ID = "thread-obj-demo-002"
THREAD_KNOW_ID = "thread-obj-demo-001"

# ── Test infrastructure ───────────────────────────────────────────────────────

results = []
passed = failed = 0


def _req(method, path, body=None, token=None, extra_headers=None, timeout=TIMEOUT):
    if token is None:
        token = STUDENT_TOKEN
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if extra_headers:
        headers.update(extra_headers)
    # Remove None-valued headers
    headers = {k: v for k, v in headers.items() if v is not None}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            resp_headers = dict(r.headers)
            body_text = r.read().decode()
            try:
                return r.status, json.loads(body_text), resp_headers
            except Exception:
                return r.status, body_text, resp_headers
    except urllib.error.HTTPError as e:
        resp_headers = dict(e.headers) if hasattr(e, "headers") else {}
        body_text = e.read().decode()
        try:
            return e.code, json.loads(body_text), resp_headers
        except Exception:
            return e.code, body_text, resp_headers
    except Exception as e:
        return None, str(e), {}


def GET(path, **kw): return _req("GET", path, **kw)
def POST(path, body=None, **kw): return _req("POST", path, body=body or {}, **kw)
def PUT(path, body=None, **kw): return _req("PUT", path, body=body or {}, **kw)
def PATCH(path, body=None, **kw): return _req("PATCH", path, body=body or {}, **kw)


class T:
    def __init__(self, name):
        self.name = name
        self.notes = []

    def check(self, cond, msg):
        if not cond:
            self.notes.append(f"  x {msg}")
        return cond

    def note(self, msg):
        self.notes.append(f"  -> {msg}")

    def done(self, passed_flag):
        global passed, failed
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
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_auth_edge_cases():
    section("1. AUTHENTICATION EDGE CASES")

    with T("Malformed Bearer token → 401") as t:
        s, b, _ = GET("/current-student", token="not.a.real.jwt.token")
        ok = t.check(s == 401, f"status={s}")
        t.done(ok)

    with T("Empty token → 401") as t:
        s, b, _ = GET("/current-student", token="")
        ok = t.check(s == 401, f"status={s}")
        t.done(ok)

    with T("Health endpoint doesn't require auth") as t:
        s, b, _ = GET("/health", token="")
        ok = t.check(s == 200, f"status={s}")
        t.done(ok)

    with T("Valid student token → 200") as t:
        s, b, _ = GET("/current-student", token=STUDENT_TOKEN)
        ok = t.check(s == 200 and isinstance(b, dict) and "id" in b, f"status={s}")
        t.done(ok)

    with T("Valid instructor token → 200 on instructor endpoint") as t:
        s, b, _ = GET("/current-instructor", token=INSTRUCTOR_TOKEN)
        ok = t.check(s == 200 and isinstance(b, dict), f"status={s}")
        t.done(ok)


def test_input_validation():
    section("2. INPUT VALIDATION EDGE CASES")

    with T("POST message with null content → 400") as t:
        s, b, _ = POST(f"/threads/{THREAD_SKILL_ID}/messages", {"content": None})
        ok = t.check(s == 400, f"status={s}")
        t.done(ok)

    with T("POST message with numeric content → 400") as t:
        s, b, _ = POST(f"/threads/{THREAD_SKILL_ID}/messages", {"content": 12345})
        ok = t.check(s == 400, f"status={s}")
        t.done(ok)

    with T("POST message with empty content → 400") as t:
        s, b, _ = POST(f"/threads/{THREAD_SKILL_ID}/messages", {"content": ""})
        ok = t.check(s == 400, f"status={s}")
        t.done(ok)

    with T("POST message with whitespace-only → 400") as t:
        s, b, _ = POST(f"/threads/{THREAD_SKILL_ID}/messages", {"content": "   "})
        ok = t.check(s == 400, f"status={s}")
        t.done(ok)

    with T("POST message with missing content → 400") as t:
        s, b, _ = POST(f"/threads/{THREAD_SKILL_ID}/messages", {"other": "field"})
        ok = t.check(s == 400, f"status={s}")
        t.done(ok)

    with T("POST message with 10KB content → 200") as t:
        s, b, _ = POST(f"/threads/{THREAD_SKILL_ID}/messages", {"content": "x" * 10000})
        ok = t.check(s == 200, f"status={s}")
        t.done(ok)

    with T("Special chars in content are preserved") as t:
        special = r'<script>alert("xss")</script> & "quotes"'
        s, b, _ = POST(f"/threads/{THREAD_SKILL_ID}/messages", {"content": special})
        msg = b.get("studentMessage") if isinstance(b, dict) else None
        ok = t.check(msg is not None and msg.get("content") == special, "mismatch")
        t.done(ok)

    with T("Unicode content (emoji, CJK) is preserved") as t:
        content = "光合作用 means photosynthesis 🌿"
        s, b, _ = POST(f"/threads/{THREAD_SKILL_ID}/messages", {"content": content})
        msg = b.get("studentMessage") if isinstance(b, dict) else None
        ok = t.check(msg is not None and msg.get("content") == content, "mismatch")
        t.done(ok)

    with T("Newlines and tabs are preserved") as t:
        content = "line1\nline2\tindented"
        s, b, _ = POST(f"/threads/{THREAD_SKILL_ID}/messages", {"content": content})
        msg = b.get("studentMessage") if isinstance(b, dict) else None
        ok = t.check(msg is not None and msg.get("content") == content, "mismatch")
        t.done(ok)

    with T("Extra body fields are ignored") as t:
        s, b, _ = POST(f"/threads/{THREAD_SKILL_ID}/messages", {
            "content": "test", "unexpected_field": True
        })
        ok = t.check(s == 200, f"status={s}")
        t.done(ok)


def test_path_edge_cases():
    section("3. PATH EDGE CASES")

    with T("Non-existent course → 403 or 404 (enrollment check first)") as t:
        s, b, _ = GET("/courses/nonexistent-id-12345")
        ok = t.check(s in (403, 404), f"status={s}")
        t.done(ok)

    with T("Non-existent unit → 403 or 404 (enrollment check first)") as t:
        s, b, _ = GET("/units/nonexistent-id-12345")
        ok = t.check(s in (403, 404), f"status={s}")
        t.done(ok)

    with T("Non-existent objective → 403 or 404 (enrollment check first)") as t:
        s, b, _ = GET("/objectives/nonexistent-id-12345")
        ok = t.check(s in (403, 404), f"status={s}")
        t.done(ok)

    with T("Non-existent thread → 404") as t:
        s, b, _ = GET("/threads/nonexistent-id-12345")
        ok = t.check(s == 404, f"status={s}")
        t.done(ok)

    with T("Completely unknown route → 404") as t:
        s, b, _ = GET("/this-route-does-not-exist")
        ok = t.check(s == 404, f"status={s}")
        t.done(ok)

    with T("URL-encoded path traversal → 404") as t:
        s, b, _ = GET("/courses/..%2F..%2Fetc%2Fpasswd")
        ok = t.check(s == 404, f"status={s}")
        t.done(ok)


def test_cross_student_isolation():
    section("4. CROSS-STUDENT DATA ISOLATION")

    with T("Student cannot access other student's courses → 403") as t:
        s, b, _ = GET(f"/students/{INSTRUCTOR_SUB}/courses", token=STUDENT_TOKEN)
        ok = t.check(s == 403, f"status={s}")
        t.done(ok)

    with T("Student cannot create courses → 401/403 (blocked at gateway or Lambda)") as t:
        s, b, _ = POST("/courses", {"title": "Hacked"}, token=STUDENT_TOKEN)
        ok = t.check(s in (401, 403), f"status={s}")
        t.done(ok)

    with T("Student cannot access /current-instructor → 401/403") as t:
        s, b, _ = GET("/current-instructor", token=STUDENT_TOKEN)
        ok = t.check(s in (401, 403), f"status={s}")
        t.done(ok)

    with T("Instructor batch lookup works for students (read-only)") as t:
        s, b, _ = POST("/instructors/batch", {"ids": [INSTRUCTOR_SUB]}, token=STUDENT_TOKEN)
        ok = t.check(s == 200 and isinstance(b, list), f"status={s}")
        t.done(ok)


def test_idempotency():
    section("5. IDEMPOTENCY & CONSISTENCY")

    with T("GET /current-student is idempotent") as t:
        s1, b1, _ = GET("/current-student")
        s2, b2, _ = GET("/current-student")
        ok = t.check(s1 == s2 == 200, f"statuses={s1},{s2}")
        if isinstance(b1, dict) and isinstance(b2, dict):
            t.check(b1.get("id") == b2.get("id"), "IDs differ")
        t.done(ok)

    with T("Thread listing is deterministic") as t:
        s1, b1, _ = GET(f"/units/{UNIT_ID}/threads")
        s2, b2, _ = GET(f"/units/{UNIT_ID}/threads")
        ids1 = [x.get("id") for x in b1] if isinstance(b1, list) else []
        ids2 = [x.get("id") for x in b2] if isinstance(b2, list) else []
        ok = t.check(ids1 == ids2, f"order differs")
        t.done(ok)


def test_concurrent_messages():
    section("6. CONCURRENT MESSAGE SENDING")

    with T("3 concurrent messages all succeed and persist") as t:
        prefix = f"concurrent-{int(time.time())}"

        def send_msg(i):
            s, b, _ = POST(f"/threads/{THREAD_SKILL_ID}/messages", {"content": f"{prefix}-{i}"})
            return s

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            statuses = list(executor.map(send_msg, range(3)))

        all_200 = all(s == 200 for s in statuses)
        t.check(all_200, f"statuses={statuses}")

        time.sleep(1)
        s, msgs, _ = GET(f"/threads/{THREAD_SKILL_ID}/messages")
        found = sum(1 for m in (msgs or []) if isinstance(m, dict) and m.get("content", "").startswith(prefix))
        ok = t.check(found == 3, f"found {found}/3")
        t.done(ok)


def test_response_format():
    section("7. RESPONSE FORMAT CONSISTENCY")

    with T("All list endpoints return arrays") as t:
        endpoints = [
            f"/students/{STUDENT_SUB}/courses",
            f"/courses/{COURSE_ID}/units",
            f"/units/{UNIT_ID}/objectives",
            f"/objectives/{OBJ_SKILL_ID}/stages",
            f"/units/{UNIT_ID}/threads",
            f"/threads/{THREAD_SKILL_ID}/messages",
            "/awards", "/feedback",
        ]
        all_ok = True
        for ep in endpoints:
            s, b, _ = GET(ep)
            if not isinstance(b, list):
                t.note(f"  {ep} returned {type(b).__name__} (status={s})")
                all_ok = False
        ok = t.check(all_ok, "some returned non-list")
        t.done(ok)

    with T("Non-existent resources return 403 or 404 (never 200)") as t:
        paths = ["/courses/nope", "/units/nope", "/objectives/nope", "/threads/nope"]
        all_ok = True
        for p in paths:
            s, b, _ = GET(p)
            if s not in (403, 404):
                t.note(f"  {p}: unexpected status={s}")
                all_ok = False
        ok = t.check(all_ok, "some resources returned unexpected status")
        t.done(ok)


def test_cors():
    section("8. CORS")

    with T("OPTIONS preflight returns 200/204") as t:
        req = urllib.request.Request(
            BASE + "/current-student",
            headers={
                "Origin": "https://sapiens-pp4l.vercel.app",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization",
            },
            method="OPTIONS",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                s = r.status
        except urllib.error.HTTPError as e:
            s = e.code
        ok = t.check(s in (200, 204), f"status={s}")
        t.done(ok)


def test_timestamps():
    section("9. TIMESTAMP FORMAT")

    with T("createdAt in messages is valid ISO 8601") as t:
        s, b, _ = GET(f"/threads/{THREAD_SKILL_ID}/messages")
        if isinstance(b, list) and len(b) > 0:
            ts = b[0].get("createdAt", "")
            try:
                datetime.fromisoformat(ts.replace("Z", "+00:00"))
                ok = True
                t.note(f"sample: {ts}")
            except ValueError:
                ok = False
                t.note(f"invalid: {ts}")
        else:
            ok = True
            t.note("no messages")
        t.done(ok)


def test_http_methods():
    section("10. HTTP METHOD RESTRICTIONS")

    with T("DELETE on /health → 404") as t:
        req = urllib.request.Request(BASE + "/health",
            headers={"Authorization": f"Bearer {STUDENT_TOKEN}"}, method="DELETE")
        try:
            with urllib.request.urlopen(req, timeout=10) as r: s = r.status
        except urllib.error.HTTPError as e: s = e.code
        ok = t.check(s in (404, 405), f"status={s}")
        t.done(ok)

    with T("PUT on /current-student → 404") as t:
        req = urllib.request.Request(BASE + "/current-student", data=b'{}',
            headers={"Content-Type": "application/json",
                     "Authorization": f"Bearer {STUDENT_TOKEN}"}, method="PUT")
        try:
            with urllib.request.urlopen(req, timeout=10) as r: s = r.status
        except urllib.error.HTTPError as e: s = e.code
        ok = t.check(s in (404, 405), f"status={s}")
        t.done(ok)


def test_query_params():
    section("11. QUERY PARAMETER EDGE CASES")

    with T("stageId filter with non-existent stageId → empty list") as t:
        s, b, _ = GET(f"/threads/{THREAD_SKILL_ID}/messages?stageId=nonexistent")
        ok = t.check(s == 200 and isinstance(b, list) and len(b) == 0,
                     f"status={s} count={len(b) if isinstance(b, list) else '?'}")
        t.done(ok)

    with T("Unknown query params are ignored") as t:
        s, b, _ = GET(f"/courses/{COURSE_ID}?foo=bar")
        ok = t.check(s == 200, f"status={s}")
        t.done(ok)

    with T("Message persistence verified") as t:
        unique = f"persist-{int(time.time())}"
        POST(f"/threads/{THREAD_SKILL_ID}/messages", {"content": unique})
        time.sleep(0.3)
        s, msgs, _ = GET(f"/threads/{THREAD_SKILL_ID}/messages")
        found = any(m.get("content") == unique for m in (msgs or []) if isinstance(m, dict))
        ok = t.check(found, "not found")
        t.done(ok)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    start = time.time()
    print(f"\n{'=' * 60}")
    print(f"  SAPIENS API EDGE CASE & SECURITY TEST SUITE")
    print(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}")
    print(f"  Target: {BASE}")
    print(f"  Student: {STUDENT_SUB[:12]}...")
    print(f"{'=' * 60}")

    test_auth_edge_cases()
    test_input_validation()
    test_path_edge_cases()
    test_cross_student_isolation()
    test_idempotency()
    test_concurrent_messages()
    test_response_format()
    test_cors()
    test_timestamps()
    test_http_methods()
    test_query_params()

    elapsed = time.time() - start
    total = passed + failed

    print(f"\n{'=' * 60}")
    print(f"  RESULTS: {passed}/{total} passed  ({failed} failed)  [{elapsed:.1f}s]")
    print(f"{'=' * 60}")

    if failed > 0:
        print("\n  FAILURES:")
        for r in results:
            if r["status"] == "FAIL":
                print(f"    x {r['name']}")
                for n in r["notes"]:
                    print(f"      {n}")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
