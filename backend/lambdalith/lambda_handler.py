import json
import os
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
import urllib.request
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")

# ---- Tables (env vars) ----
T = {
    "STUDENTS": os.environ["STUDENTS_TABLE"],
    "INSTRUCTORS": os.environ["INSTRUCTORS_TABLE"],
    "COURSES": os.environ["COURSES_TABLE"],
    "ENROLLMENTS": os.environ["ENROLLMENTS_TABLE"],
    "UNITS": os.environ["UNITS_TABLE"],
    "OBJECTIVES": os.environ["OBJECTIVES_TABLE"],
    "QUESTIONS": os.environ["QUESTIONS_TABLE"],

    # stages + progress + chat + awards + feedback
    "ITEM_STAGES": os.environ["ITEM_STAGES_TABLE"],
    "STUDENT_OBJECTIVE_PROGRESS": os.environ["STUDENT_OBJECTIVE_PROGRESS_TABLE"],
    "CHAT_THREADS": os.environ["CHAT_THREADS_TABLE"],
    "CHAT_MESSAGES": os.environ["CHAT_MESSAGES_TABLE"],
    "AWARDS": os.environ["AWARDS_TABLE"],
    "FEEDBACK_ITEMS": os.environ["FEEDBACK_ITEMS_TABLE"],

    # knowledge
    "KNOWLEDGE_TOPICS": os.environ["KNOWLEDGE_TOPICS_TABLE"],
    "KNOWLEDGE_QUEUE_ITEMS": os.environ["KNOWLEDGE_QUEUE_ITEMS_TABLE"],
}

# ---- Indexes (env vars) ----
IDX = {
    "COURSE_UNITS": os.environ["COURSE_UNITS_INDEX"],
    "UNIT_OBJECTIVES": os.environ["UNIT_OBJECTIVES_INDEX"],
    "OBJECTIVE_QUESTIONS": os.environ["OBJECTIVE_QUESTIONS_INDEX"],

    "ITEM_STAGES_BY_ITEM": os.environ["ITEM_STAGES_BY_ITEM_INDEX"],
    "UNIT_THREADS": os.environ["UNIT_THREADS_INDEX"],

    # knowledge
    "UNIT_KNOWLEDGE_TOPICS": os.environ["UNIT_KNOWLEDGE_TOPICS_INDEX"],
    "UNIT_QUEUE": os.environ["UNIT_QUEUE_INDEX"],

    # instructor courses
    "INSTRUCTOR_COURSES": os.environ["INSTRUCTOR_COURSES_INDEX"],
}

# ---- Dev auth (Option A) ----
DEV_AUTH_ENABLED = os.environ.get("DEV_AUTH_ENABLED", "false").lower() == "true"
DEV_AUTH_HEADER = os.environ.get("DEV_AUTH_HEADER", "X-Dev-Student-Id")
DEV_AUTH_TOKEN = os.environ.get("DEV_AUTH_TOKEN")  # optional shared secret

# ---- Dev instructor auth ----
DEV_INSTRUCTOR_ENABLED = os.environ.get("DEV_INSTRUCTOR_ENABLED", "false").lower() == "true"
DEV_INSTRUCTOR_HEADER = os.environ.get("DEV_INSTRUCTOR_HEADER", "X-Dev-Instructor-Id")

# ---- Cognito JWT verification ----
COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
COGNITO_REGION = os.environ.get("COGNITO_REGION", "us-west-1")
COGNITO_CLIENT_ID = os.environ.get("COGNITO_CLIENT_ID", "")

# Cache JWKS in memory (refreshed at most once per hour)
_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0
_JWKS_TTL = 3600  # 1 hour


def _get_jwks() -> dict:
    """Fetch and cache the Cognito JWKS (JSON Web Key Set)."""
    global _jwks_cache, _jwks_fetched_at
    now = time.time()
    if _jwks_cache and (now - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache
    url = (
        f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com"
        f"/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    )
    try:
        with urllib.request.urlopen(url, timeout=3) as r:
            _jwks_cache = json.loads(r.read())
            _jwks_fetched_at = now
            return _jwks_cache
    except Exception:
        return _jwks_cache or {"keys": []}


def _b64url_decode(s: str) -> bytes:
    """Decode a base64url string (no padding required)."""
    import base64
    pad = 4 - len(s) % 4
    if pad != 4:
        s += "=" * pad
    return base64.urlsafe_b64decode(s)


def _verify_cognito_jwt(token: str) -> dict | None:
    """
    Manually verify a Cognito ID token.

    Steps:
    1. Decode header to get `kid`
    2. Find matching key in JWKS
    3. Reconstruct RSA public key from n/e
    4. Verify RS256 signature
    5. Validate claims (exp, iss, aud/client_id, token_use=id)

    Returns decoded payload dict on success, None on any failure.
    Uses only stdlib — no PyJWT dependency required.
    """
    try:
        import base64
        import struct
        import hashlib
        import hmac as _hmac

        parts = token.split(".")
        if len(parts) != 3:
            return None

        header = json.loads(_b64url_decode(parts[0]))
        payload = json.loads(_b64url_decode(parts[1]))

        kid = header.get("kid")
        alg = header.get("alg", "")
        if alg != "RS256" or not kid:
            return None

        # Find key in JWKS
        jwks = _get_jwks()
        key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key_data:
            return None

        # Validate claims before verifying signature (fail fast on obvious issues)
        now = time.time()
        if payload.get("exp", 0) < now:
            return None  # expired

        expected_iss = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
        if payload.get("iss") != expected_iss:
            return None

        if payload.get("token_use") != "id":
            return None

        # Verify RS256 signature using cryptography library (available in Lambda Python runtime)
        from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicNumbers
        from cryptography.hazmat.primitives.asymmetric import padding
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.backends import default_backend

        def _b64url_int(s: str) -> int:
            return int.from_bytes(_b64url_decode(s), "big")

        n = _b64url_int(key_data["n"])
        e = _b64url_int(key_data["e"])
        pub_key = RSAPublicNumbers(e, n).public_key(default_backend())

        signing_input = f"{parts[0]}.{parts[1]}".encode("utf-8")
        signature = _b64url_decode(parts[2])

        pub_key.verify(signature, signing_input, padding.PKCS1v15(), hashes.SHA256())
        return payload

    except Exception:
        return None


def verify_jwt(token: str) -> tuple[str | None, bool]:
    """
    Verify a Cognito ID token and extract identity.

    Returns (sub, is_instructor):
      - sub: Cognito user UUID (used as the user's primary ID), or None if invalid
      - is_instructor: True if 'cognito:groups' includes 'instructors'
    """
    if not token or not COGNITO_USER_POOL_ID:
        return None, False

    payload = _verify_cognito_jwt(token)
    if not payload:
        return None, False

    sub = payload.get("sub")
    groups = payload.get("cognito:groups") or []
    is_instructor = "instructors" in groups
    return sub, is_instructor


# ---- CORS ----
CORS_ALLOW_ORIGIN = os.environ.get("CORS_ALLOW_ORIGIN", "*")
CORS_ALLOW_HEADERS = os.environ.get(
    "CORS_ALLOW_HEADERS",
    "Content-Type,Authorization,X-Dev-Student-Id,X-Dev-Token,X-Dev-Instructor-Id",
)
CORS_ALLOW_METHODS = os.environ.get(
    "CORS_ALLOW_METHODS",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
)

# ---- Helpers ----
def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _json_default(o):
    if isinstance(o, Decimal):
        if o % 1 == 0:
            return int(o)
        return float(o)
    raise TypeError(f"Object of type {type(o).__name__} is not JSON serializable")


def _sanitize_for_json(obj):
    if isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_for_json(v) for v in obj]
    if isinstance(obj, Decimal):
        return _json_default(obj)
    return obj


def resp(status: int, obj=None, extra_headers: dict | None = None):
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": CORS_ALLOW_ORIGIN,
        "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
        "Access-Control-Allow-Methods": CORS_ALLOW_METHODS,
    }
    if extra_headers:
        headers.update(extra_headers)

    if obj is None:
        body = ""
    else:
        body = json.dumps(_sanitize_for_json(obj), default=_json_default)

    return {"statusCode": status, "headers": headers, "body": body}


def resp_options():
    return resp(200, {})


def resp_not_found(entity: str):
    return resp(404, {"error": f"{entity} not found"})


def safe_json(body: str):
    if not body:
        return None
    try:
        return json.loads(body)
    except Exception:
        return None


def require_json(event):
    ct = (event.get("headers") or {}).get("content-type") or (event.get("headers") or {}).get("Content-Type")
    if ct and "application/json" not in ct:
        return resp(415, {"error": "Unsupported Media Type"}), None
    body = safe_json(event.get("body") or "")
    if body is None:
        return resp(400, {"error": "Invalid JSON"}), None
    return None, body


def strip_stage(raw_path: str) -> str:
    if not raw_path:
        return "/"
    parts = raw_path.split("/")
    if len(parts) >= 3:
        return "/" + "/".join(parts[2:])
    return raw_path


def claims(event) -> dict:
    rc = event.get("requestContext") or {}
    auth = rc.get("authorizer") or {}
    jwt = auth.get("jwt") or {}
    return jwt.get("claims") or {}


def authed_sub(event) -> str | None:
    return claims(event).get("sub")


def query_all(table, *, index_name: str | None = None, key_condition=None, scan_forward: bool = True):
    """
    Fetch all pages for a DynamoDB Query (frontend does not paginate yet).
    Returns combined Items[].
    """
    kwargs = {
        "KeyConditionExpression": key_condition,
        "ScanIndexForward": scan_forward,
    }
    if index_name:
        kwargs["IndexName"] = index_name

    items: list[dict] = []
    start_key = None

    while True:
        if start_key:
            kwargs["ExclusiveStartKey"] = start_key
        resp_q = table.query(**kwargs)
        items.extend(resp_q.get("Items", []))
        start_key = resp_q.get("LastEvaluatedKey")
        if not start_key:
            break

    return items


def header(event, name: str) -> str | None:
    h = event.get("headers") or {}
    for k, v in h.items():
        if k.lower() == name.lower():
            return v
    return None


def extract_bearer_token(event) -> str | None:
    """Extract Bearer token from Authorization header."""
    auth_header = header(event, "Authorization")
    if not auth_header:
        return None
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return None


def effective_student_id(event) -> str | None:
    # 1. Try API Gateway JWT authorizer claims (when authorizer is configured)
    sub = authed_sub(event)
    if sub:
        return sub

    # 2. Try direct JWT verification from Authorization header
    token = extract_bearer_token(event)
    if token:
        jwt_sub, is_instructor = verify_jwt(token)
        if jwt_sub and not is_instructor:
            return jwt_sub
        # Instructor token used on student endpoint — still allow (sub is valid)
        if jwt_sub:
            return jwt_sub

    # 3. Dev header fallback (only when DEV_AUTH_ENABLED=true)
    if not DEV_AUTH_ENABLED:
        return None

    dev_id = header(event, DEV_AUTH_HEADER)
    if not dev_id:
        return None

    if DEV_AUTH_TOKEN:
        tok = header(event, "X-Dev-Token")
        if tok != DEV_AUTH_TOKEN:
            return None

    return dev_id


def method_and_path(event):
    rc = event.get("requestContext") or {}
    http = rc.get("http") or {}
    method = http.get("method", "UNKNOWN")
    raw_path = http.get("path", "/")
    return method, strip_stage(raw_path)


# ---- Small domain helpers ----
STAGE_ORDER = {"begin": 1, "walkthrough": 2, "challenge": 3}
ORDER_STAGE = {1: "begin", 2: "walkthrough", 3: "challenge"}


def _default_progress(student_id: str, objective_id: str):
    now = iso_now()
    return {
        "studentId": student_id,
        "objectiveId": objective_id,
        "earnedStars": 0,
        "currentStageType": "begin",
        "updatedAt": now,
    }


def _compute_current_stage_type(earned_stars: int) -> str:
    if earned_stars <= 0:
        return "begin"
    if earned_stars == 1:
        return "walkthrough"
    return "challenge"


def batch_get_all(table_name: str, keys: list[dict], max_retries: int = 5) -> list[dict]:
    if not keys:
        return []

    request = {table_name: {"Keys": keys}}
    out: list[dict] = []
    retries = 0

    while True:
        resp_bg = dynamodb.batch_get_item(RequestItems=request)
        out.extend(resp_bg.get("Responses", {}).get(table_name, []))

        unprocessed = resp_bg.get("UnprocessedKeys", {})
        if not unprocessed or table_name not in unprocessed or not unprocessed[table_name].get("Keys"):
            break

        retries += 1
        if retries > max_retries:
            break

        request = {table_name: {"Keys": unprocessed[table_name]["Keys"]}}

    return out


# ---- Route handlers ----
def handle_health():
    return resp(200, {"ok": True})


def handle_current_student(event):
    sub = effective_student_id(event)
    if not sub:
        return resp(401, {"error": "Unauthorized"})

    students = dynamodb.Table(T["STUDENTS"])
    got = students.get_item(Key={"id": sub})
    item = got.get("Item")

    if item:
        return resp(200, item)

    # Auto-create student record on first login via JWT
    # Try to get name from JWT payload
    name = "Student"
    token = extract_bearer_token(event)
    if token:
        payload = _verify_cognito_jwt(token)
        if payload:
            given = payload.get("given_name") or ""
            family = payload.get("family_name") or ""
            full = f"{given} {family}".strip()
            if full:
                name = full

    now = iso_now()
    item = {
        "id": sub,
        "name": name,
        "yearLabel": "",
        "avatarUrl": None,
        "createdAt": now,
        "updatedAt": now,
    }

    try:
        students.put_item(Item=item, ConditionExpression="attribute_not_exists(id)")
    except Exception:
        # Race condition: another request created it first — fetch the existing record
        got2 = students.get_item(Key={"id": sub})
        item = got2.get("Item") or item

    return resp(200, item)


def handle_instructors_batch(event):
    err, body = require_json(event)
    if err:
        return err

    ids = body.get("ids") if isinstance(body, dict) else None
    if not isinstance(ids, list) or len(ids) == 0:
        return resp(200, [])

    ids = ids[:100]
    keys = [{"id": x} for x in ids]
    items = batch_get_all(T["INSTRUCTORS"], keys)

    by_id = {it.get("id"): it for it in items if it.get("id")}
    ordered = [by_id.get(i) for i in ids if by_id.get(i) is not None]
    return resp(200, ordered)


def handle_get_course(course_id: str):
    courses = dynamodb.Table(T["COURSES"])
    got = courses.get_item(Key={"id": course_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("Course")
    return resp(200, item)


def handle_list_units(course_id: str):
    units = dynamodb.Table(T["UNITS"])
    items = query_all(
        units,
        index_name=IDX["COURSE_UNITS"],
        key_condition=Key("courseId").eq(course_id),
        scan_forward=True,
    )
    return resp(200, items)


def handle_get_unit(unit_id: str):
    units = dynamodb.Table(T["UNITS"])
    got = units.get_item(Key={"id": unit_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("Unit")
    return resp(200, item)


def handle_list_objectives(unit_id: str):
    objectives = dynamodb.Table(T["OBJECTIVES"])
    items = query_all(
        objectives,
        index_name=IDX["UNIT_OBJECTIVES"],
        key_condition=Key("unitId").eq(unit_id),
        scan_forward=True,
    )
    # CONTRACT: sort by Objective.order (not by id)
    items.sort(key=lambda o: int(o.get("order") or 0))
    return resp(200, items)


def handle_get_objective(objective_id: str):
    objectives = dynamodb.Table(T["OBJECTIVES"])
    got = objectives.get_item(Key={"id": objective_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("Objective")
    return resp(200, item)


def handle_list_questions_for_objective(objective_id: str):
    questions = dynamodb.Table(T["QUESTIONS"])
    items = query_all(
        questions,
        index_name=IDX["OBJECTIVE_QUESTIONS"],
        key_condition=Key("objectiveId").eq(objective_id),
        scan_forward=True,  # difficultyStars asc
    )
    return resp(200, items)


def handle_get_question(question_id: str):
    questions = dynamodb.Table(T["QUESTIONS"])
    got = questions.get_item(Key={"id": question_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("Question")
    return resp(200, item)


def handle_list_courses_for_student(event, student_id_param: str | None):
    sub = effective_student_id(event)
    if not sub:
        return resp(401, {"error": "Unauthorized"})

    if student_id_param and student_id_param != sub:
        return resp(403, {"error": "Forbidden"})

    enrollments = dynamodb.Table(T["ENROLLMENTS"])
    enr_items = query_all(
        enrollments,
        key_condition=Key("studentId").eq(sub),
        scan_forward=True,
    )
    course_ids = [it.get("courseId") for it in enr_items if it.get("courseId")]

    if not course_ids:
        return resp(200, [])

    keys = [{"id": cid} for cid in course_ids[:100]]
    items = batch_get_all(T["COURSES"], keys)

    by_id = {it.get("id"): it for it in items if it.get("id")}
    ordered = [by_id.get(cid) for cid in course_ids if by_id.get(cid) is not None]
    return resp(200, ordered)


# ---- Stages ----
def handle_list_stages_for_objective(objective_id: str):
    stages = dynamodb.Table(T["ITEM_STAGES"])
    items = query_all(
        stages,
        index_name=IDX["ITEM_STAGES_BY_ITEM"],
        key_condition=Key("itemId").eq(objective_id),
        scan_forward=True,  # order asc
    )
    return resp(200, items)


def handle_get_stage(stage_id: str):
    stages = dynamodb.Table(T["ITEM_STAGES"])
    got = stages.get_item(Key={"id": stage_id})
    item = got.get("Item")
    if not item:
        return resp(404, {"error": "Stage not found"})
    return resp(200, item)


def _load_stages_by_objective(objective_id: str) -> list[dict]:
    stages_tbl = dynamodb.Table(T["ITEM_STAGES"])
    return query_all(
        stages_tbl,
        index_name=IDX["ITEM_STAGES_BY_ITEM"],
        key_condition=Key("itemId").eq(objective_id),
        scan_forward=True,
    )


def _current_stage_id_from_stages(stages: list[dict], stage_type: str) -> str | None:
    for s in stages:
        if s.get("stageType") == stage_type:
            return s.get("id")
    return None


# ---- Progress ----
def handle_get_objective_progress(event, objective_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    prog = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    got = prog.get_item(Key={"studentId": student_id, "objectiveId": objective_id})
    item = got.get("Item")
    if not item:
        item = _default_progress(student_id, objective_id)
    else:
        if not item.get("currentStageType"):
            earned = int(item.get("earnedStars") or 0)
            item["currentStageType"] = _compute_current_stage_type(earned)

    return resp(200, item)


def handle_list_unit_progress_items(event, unit_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    objectives = query_all(
        objectives_tbl,
        index_name=IDX["UNIT_OBJECTIVES"],
        key_condition=Key("unitId").eq(unit_id),
        scan_forward=True,
    )

    obj_ids = [o.get("id") for o in objectives if o.get("id")]
    if not obj_ids:
        return resp(200, [])

    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    all_prog = query_all(
        prog_tbl,
        key_condition=Key("studentId").eq(student_id),
        scan_forward=True,
    )

    by_obj = {p.get("objectiveId"): p for p in all_prog if p.get("objectiveId")}
    out = []
    for oid in obj_ids:
        p = by_obj.get(oid) or _default_progress(student_id, oid)
        if not p.get("currentStageType"):
            earned = int(p.get("earnedStars") or 0)
            p["currentStageType"] = _compute_current_stage_type(earned)
        out.append(p)

    return resp(200, out)


def handle_get_unit_progress(event, unit_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    objectives = query_all(
        objectives_tbl,
        index_name=IDX["UNIT_OBJECTIVES"],
        key_condition=Key("unitId").eq(unit_id),
        scan_forward=True,
    )

    total = len(objectives)
    if total == 0:
        return resp(200, {"unitId": unit_id, "totalObjectives": 0, "completedObjectives": 0, "progressPercent": 0})

    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    all_prog = query_all(
        prog_tbl,
        key_condition=Key("studentId").eq(student_id),
        scan_forward=True,
    )

    prog_by_obj = {p.get("objectiveId"): p for p in all_prog if p.get("objectiveId")}
    completed = 0
    for o in objectives:
        oid = o.get("id")
        p = prog_by_obj.get(oid)
        earned = int(p.get("earnedStars") or 0) if p else 0
        if earned == 3:
            completed += 1

    percent = int(round((completed / total) * 100))
    return resp(200, {"unitId": unit_id, "totalObjectives": total, "completedObjectives": completed, "progressPercent": percent})


def handle_advance_stage(event, objective_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    got = prog_tbl.get_item(Key={"studentId": student_id, "objectiveId": objective_id})
    item = got.get("Item")

    now = iso_now()
    if not item:
        item = {
            "studentId": student_id,
            "objectiveId": objective_id,
            "earnedStars": 1,
            "currentStageType": "walkthrough",
            "updatedAt": now,
        }
        prog_tbl.put_item(Item=item)
        return resp(200, item)

    earned = int(item.get("earnedStars") or 0)
    earned = min(3, earned + 1)
    item["earnedStars"] = earned
    item["currentStageType"] = _compute_current_stage_type(earned)
    item["updatedAt"] = now

    prog_tbl.put_item(Item=item)
    return resp(200, item)


# ---- Awards ----
def handle_list_awards(event, course_id: str | None = None):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    awards_tbl = dynamodb.Table(T["AWARDS"])
    items = query_all(
        awards_tbl,
        key_condition=Key("studentId").eq(student_id),
        scan_forward=True,
    )
    if course_id:
        items = [a for a in items if a.get("courseId") == course_id]
    return resp(200, items)


# ---- Feedback ----
def handle_list_feedback(event, course_id: str | None = None):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    fb_tbl = dynamodb.Table(T["FEEDBACK_ITEMS"])
    items = query_all(
        fb_tbl,
        key_condition=Key("studentId").eq(student_id),
        scan_forward=True,
    )
    if course_id:
        items = [f for f in items if f.get("courseId") == course_id]
    return resp(200, items)


# ---- Chat ----
def _ensure_threads_for_unit(unit: dict, objectives: list[dict], existing_threads: list[dict]) -> list[dict]:
    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    existing_by_obj = {t.get("objectiveId"): t for t in existing_threads if t.get("objectiveId")}
    out = list(existing_threads)

    course_id = unit.get("courseId")
    unit_id = unit.get("id")

    for obj in objectives:
        oid = obj.get("id")
        if not oid or oid in existing_by_obj:
            continue

        tid = f"thread-{oid}"
        item = {
            "id": tid,
            "courseId": course_id,
            "unitId": unit_id,
            "objectiveId": oid,
            "title": obj.get("title") or "Thread",
            "kind": obj.get("kind") or "knowledge",
            "lastMessageAt": iso_now(),
        }
        try:
            threads_tbl.put_item(Item=item, ConditionExpression="attribute_not_exists(id)")
            out.append(item)
        except Exception:
            pass

    return out


def handle_list_threads_for_unit(event, unit_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    units_tbl = dynamodb.Table(T["UNITS"])
    unit = units_tbl.get_item(Key={"id": unit_id}).get("Item")
    if not unit:
        return resp_not_found("Unit")

    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    objectives = query_all(
        objectives_tbl,
        index_name=IDX["UNIT_OBJECTIVES"],
        key_condition=Key("unitId").eq(unit_id),
        scan_forward=True,
    )
    # contract: objective order drives thread ordering
    objectives.sort(key=lambda o: int(o.get("order") or 0))
    obj_by_id = {o.get("id"): o for o in objectives if o.get("id")}

    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    threads = query_all(
        threads_tbl,
        index_name=IDX["UNIT_THREADS"],
        key_condition=Key("unitId").eq(unit_id),
        scan_forward=True,
    )

    threads = _ensure_threads_for_unit(unit, objectives, threads)

    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    all_prog = query_all(
        prog_tbl,
        key_condition=Key("studentId").eq(student_id),
        scan_forward=True,
    )
    prog_by_obj = {p.get("objectiveId"): p for p in all_prog if p.get("objectiveId")}

    out = []
    for t in threads:
        oid = t.get("objectiveId")
        obj = obj_by_id.get(oid, {})
        order = obj.get("order", 0)

        p = prog_by_obj.get(oid) or _default_progress(student_id, oid or "")
        earned = int(p.get("earnedStars") or 0)
        stage_type = p.get("currentStageType") or _compute_current_stage_type(earned)

        stages = _load_stages_by_objective(oid) if oid else []
        stage_id = _current_stage_id_from_stages(stages, stage_type)

        twp = dict(t)
        twp["earnedStars"] = earned
        twp["currentStageType"] = stage_type
        twp["currentStageId"] = stage_id
        twp["order"] = order
        out.append(twp)

    out.sort(key=lambda x: int(x.get("order") or 0))
    return resp(200, out)


def handle_get_thread(thread_id: str):
    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    got = threads_tbl.get_item(Key={"id": thread_id})
    item = got.get("Item")
    if not item:
        return resp(404, {"error": "Thread not found"})
    return resp(200, item)


def handle_get_thread_with_progress(event, thread_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    thread = threads_tbl.get_item(Key={"id": thread_id}).get("Item")
    if not thread:
        return resp(404, {"error": "Thread not found"})

    oid = thread.get("objectiveId")
    if not oid:
        return resp(500, {"error": "Thread missing objectiveId"})

    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    obj = objectives_tbl.get_item(Key={"id": oid}).get("Item") or {}
    order = obj.get("order", 0)

    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    p = prog_tbl.get_item(Key={"studentId": student_id, "objectiveId": oid}).get("Item")
    if not p:
        p = _default_progress(student_id, oid)
    earned = int(p.get("earnedStars") or 0)
    stage_type = p.get("currentStageType") or _compute_current_stage_type(earned)

    stages = _load_stages_by_objective(oid)
    stage_id = _current_stage_id_from_stages(stages, stage_type)

    twp = dict(thread)
    twp["earnedStars"] = earned
    twp["currentStageType"] = stage_type
    twp["currentStageId"] = stage_id
    twp["order"] = order
    return resp(200, twp)


def handle_list_messages(event, thread_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    qs = event.get("queryStringParameters") or {}
    stage_id_filter = qs.get("stageId")

    msgs_tbl = dynamodb.Table(T["CHAT_MESSAGES"])
    items = query_all(
        msgs_tbl,
        key_condition=Key("threadId").eq(thread_id),
        scan_forward=True,  # createdAt asc
    )

    if stage_id_filter:
        items = [m for m in items if m.get("stageId") == stage_id_filter]

    return resp(200, items)


def handle_send_message(event, thread_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    if not isinstance(body, dict):
        return resp(400, {"error": "Invalid body"})

    content = body.get("content")
    stage_id = body.get("stageId")
    if not isinstance(content, str) or not content.strip():
        return resp(400, {"error": "Missing content"})

    now = iso_now()
    msg = {
        "id": str(uuid.uuid4()),
        "threadId": thread_id,
        "stageId": stage_id,
        "role": "student",
        "content": content,
        "createdAt": now,
    }

    msgs_tbl = dynamodb.Table(T["CHAT_MESSAGES"])
    msgs_tbl.put_item(Item=msg)

    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    try:
        threads_tbl.update_item(
            Key={"id": thread_id},
            UpdateExpression="SET lastMessageAt = :t",
            ExpressionAttributeValues={":t": now},
        )
    except Exception:
        pass

    return resp(200, msg)


# ---- Instructor auth ----
def effective_instructor_id(event) -> str | None:
    # 1. Try API Gateway JWT authorizer claims
    sub = authed_sub(event)
    if sub:
        return sub

    # 2. Try direct JWT verification — must be in the instructors group
    token = extract_bearer_token(event)
    if token:
        jwt_sub, is_instructor = verify_jwt(token)
        if jwt_sub and is_instructor:
            return jwt_sub
        if jwt_sub and not is_instructor:
            return None  # Valid token but not an instructor — deny

    # 3. Dev header fallback (only when DEV_INSTRUCTOR_ENABLED=true)
    if not DEV_INSTRUCTOR_ENABLED:
        return None

    dev_id = header(event, DEV_INSTRUCTOR_HEADER)
    if not dev_id:
        return None

    # Reuse the same shared token as student dev auth
    if DEV_AUTH_TOKEN:
        tok = header(event, "X-Dev-Token")
        if tok != DEV_AUTH_TOKEN:
            return None

    return dev_id


# ---- Teacher / instructor route handlers ----

def handle_current_instructor(event):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    instructors = dynamodb.Table(T["INSTRUCTORS"])
    got = instructors.get_item(Key={"id": instructor_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("Instructor")
    return resp(200, item)


def handle_list_instructor_courses(event):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    courses = dynamodb.Table(T["COURSES"])
    items = query_all(
        courses,
        index_name=IDX["INSTRUCTOR_COURSES"],
        key_condition=Key("instructorId").eq(instructor_id),
        scan_forward=True,
    )
    return resp(200, items)


def handle_create_course(event):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    title = (body.get("title") or "").strip()
    if not title:
        return resp(400, {"error": "title is required"})

    now = iso_now()
    course_id = str(uuid.uuid4())
    item = {
        "id": course_id,
        "title": title,
        "subject": body.get("subject") or "",
        "gradeLabel": body.get("gradeLabel") or "",
        "instructorId": instructor_id,
        "createdAt": now,
        "updatedAt": now,
    }
    dynamodb.Table(T["COURSES"]).put_item(Item=item)
    return resp(201, item)


def handle_get_course_roster(event, course_id: str):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    # Verify course belongs to this instructor
    courses = dynamodb.Table(T["COURSES"])
    got = courses.get_item(Key={"id": course_id})
    course = got.get("Item")
    if not course:
        return resp_not_found("Course")
    if course.get("instructorId") != instructor_id:
        return resp(403, {"error": "Forbidden"})

    enrollments = dynamodb.Table(T["ENROLLMENTS"])
    # Enrollments PK=studentId, so we need a GSI on courseId — fall back to scan filter
    # Use the existing COURSE_ENROLLMENTS pattern if GSI exists, otherwise scan
    try:
        course_enr_idx = os.environ.get("COURSE_ENROLLMENTS_INDEX")
        if course_enr_idx:
            items = query_all(
                enrollments,
                index_name=course_enr_idx,
                key_condition=Key("courseId").eq(course_id),
                scan_forward=True,
            )
        else:
            scan_resp = enrollments.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr("courseId").eq(course_id)
            )
            items = scan_resp.get("Items", [])
    except Exception:
        scan_resp = enrollments.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr("courseId").eq(course_id)
        )
        items = scan_resp.get("Items", [])

    student_ids = [it.get("studentId") for it in items if it.get("studentId")]
    return resp(200, {"courseId": course_id, "studentIds": student_ids})


def handle_update_course_roster(event, course_id: str):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    # Verify course belongs to this instructor
    courses = dynamodb.Table(T["COURSES"])
    got = courses.get_item(Key={"id": course_id})
    course = got.get("Item")
    if not course:
        return resp_not_found("Course")
    if course.get("instructorId") != instructor_id:
        return resp(403, {"error": "Forbidden"})

    new_student_ids = body.get("studentIds") if isinstance(body, dict) else None
    if not isinstance(new_student_ids, list):
        return resp(400, {"error": "studentIds array is required"})

    enrollments = dynamodb.Table(T["ENROLLMENTS"])

    # Read existing enrollments for this course (scan — same as get_roster)
    try:
        course_enr_idx = os.environ.get("COURSE_ENROLLMENTS_INDEX")
        if course_enr_idx:
            existing_items = query_all(
                enrollments,
                index_name=course_enr_idx,
                key_condition=Key("courseId").eq(course_id),
                scan_forward=True,
            )
        else:
            scan_resp = enrollments.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr("courseId").eq(course_id)
            )
            existing_items = scan_resp.get("Items", [])
    except Exception:
        scan_resp = enrollments.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr("courseId").eq(course_id)
        )
        existing_items = scan_resp.get("Items", [])

    existing_ids = {it.get("studentId") for it in existing_items if it.get("studentId")}
    new_set = set(new_student_ids)

    to_add = new_set - existing_ids
    to_remove = existing_ids - new_set

    now = iso_now()
    with enrollments.batch_writer() as batch:
        for sid in to_add:
            batch.put_item(Item={"studentId": sid, "courseId": course_id, "enrolledAt": now})
        for sid in to_remove:
            batch.delete_item(Key={"studentId": sid, "courseId": course_id})

    return resp(200, {"courseId": course_id, "studentIds": list(new_set)})


def handle_update_unit_title(event, unit_id: str):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    title = (body.get("title") or "").strip() if isinstance(body, dict) else ""
    if not title:
        return resp(400, {"error": "title is required"})

    units = dynamodb.Table(T["UNITS"])
    got = units.get_item(Key={"id": unit_id})
    unit = got.get("Item")
    if not unit:
        return resp_not_found("Unit")

    now = iso_now()
    units.update_item(
        Key={"id": unit_id},
        UpdateExpression="SET #t = :t, updatedAt = :ua",
        ExpressionAttributeNames={"#t": "title"},
        ExpressionAttributeValues={":t": title, ":ua": now},
    )
    unit["title"] = title
    unit["updatedAt"] = now
    return resp(200, unit)


def handle_update_objective_enabled(event, objective_id: str):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    if not isinstance(body, dict) or "enabled" not in body:
        return resp(400, {"error": "enabled (boolean) is required"})

    enabled = bool(body["enabled"])

    objectives = dynamodb.Table(T["OBJECTIVES"])
    got = objectives.get_item(Key={"id": objective_id})
    obj = got.get("Item")
    if not obj:
        return resp_not_found("Objective")

    now = iso_now()
    objectives.update_item(
        Key={"id": objective_id},
        UpdateExpression="SET enabled = :e, updatedAt = :ua",
        ExpressionAttributeValues={":e": enabled, ":ua": now},
    )
    obj["enabled"] = enabled
    obj["updatedAt"] = now
    return resp(200, obj)


def handle_create_unit_from_upload(event, course_id: str):
    """
    Accepts multipart/form-data with:
      - unitName: string field
      - files: one or more file parts (content ignored in mock)
    Returns a Unit + list of mock Objectives.
    """
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    # Verify course exists
    courses = dynamodb.Table(T["COURSES"])
    got = courses.get_item(Key={"id": course_id})
    course = got.get("Item")
    if not course:
        return resp_not_found("Course")

    # Extract unitName from multipart body (best-effort plain parse)
    # API Gateway base64-encodes binary bodies; for multipart we look for unitName in body text
    body_raw = event.get("body") or ""
    is_b64 = event.get("isBase64Encoded", False)
    if is_b64:
        import base64
        try:
            body_raw = base64.b64decode(body_raw).decode("utf-8", errors="replace")
        except Exception:
            body_raw = ""

    # Naive multipart field extraction: find "unitName" field value
    unit_name = ""
    try:
        idx = body_raw.find('name="unitName"')
        if idx == -1:
            idx = body_raw.find("name=unitName")
        if idx != -1:
            after = body_raw[idx:]
            # Skip past the blank line that separates headers from value
            nl = after.find("\r\n\r\n")
            if nl == -1:
                nl = after.find("\n\n")
            if nl != -1:
                value_start = after[nl + 4 if "\r\n\r\n" in after else nl + 2:]
                end = value_start.find("\r\n--")
                if end == -1:
                    end = value_start.find("\n--")
                unit_name = (value_start[:end] if end != -1 else value_start[:200]).strip()
    except Exception:
        unit_name = ""

    if not unit_name:
        unit_name = "Untitled Unit"

    now = iso_now()
    unit_id = str(uuid.uuid4())

    # Count how many units already exist in this course to set order
    units_table = dynamodb.Table(T["UNITS"])
    existing_units = query_all(
        units_table,
        index_name=IDX["COURSE_UNITS"],
        key_condition=Key("courseId").eq(course_id),
    )
    unit_order = len(existing_units) + 1

    unit = {
        "id": unit_id,
        "courseId": course_id,
        "title": unit_name,
        "order": unit_order,
        "createdAt": now,
        "updatedAt": now,
    }
    units_table.put_item(Item=unit)

    # Mock objectives — realistic placeholders so the teacher can see the flow
    mock_objective_titles = [
        f"Understand the core concepts of {unit_name}",
        f"Identify key terminology related to {unit_name}",
        f"Apply foundational principles of {unit_name}",
    ]
    objectives_table = dynamodb.Table(T["OBJECTIVES"])
    objectives = []
    for i, title in enumerate(mock_objective_titles, start=1):
        obj_id = str(uuid.uuid4())
        obj = {
            "id": obj_id,
            "unitId": unit_id,
            "title": title,
            "order": i,
            "enabled": True,
            "createdAt": now,
            "updatedAt": now,
        }
        objectives_table.put_item(Item=obj)
        objectives.append(obj)

    return resp(201, {"unit": unit, "objectives": objectives})


def handle_list_all_students(event):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    students = dynamodb.Table(T["STUDENTS"])
    scan_resp = students.scan()
    items = scan_resp.get("Items", [])
    # Handle pagination
    while "LastEvaluatedKey" in scan_resp:
        scan_resp = students.scan(ExclusiveStartKey=scan_resp["LastEvaluatedKey"])
        items.extend(scan_resp.get("Items", []))
    return resp(200, items)


def handle_create_student(event):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    name = (body.get("name") or "").strip() if isinstance(body, dict) else ""
    if not name:
        return resp(400, {"error": "name is required"})

    now = iso_now()
    student_id = str(uuid.uuid4())
    item = {
        "id": student_id,
        "name": name,
        "yearLabel": body.get("yearLabel") or "",
        "avatarUrl": body.get("avatarUrl") or None,
        "createdAt": now,
        "updatedAt": now,
    }
    dynamodb.Table(T["STUDENTS"]).put_item(Item=item)
    return resp(201, item)


# ---- Knowledge topic handlers ----

def handle_list_knowledge_topics(unit_id: str):
    topics = dynamodb.Table(T["KNOWLEDGE_TOPICS"])
    items = query_all(
        topics,
        index_name=IDX["UNIT_KNOWLEDGE_TOPICS"],
        key_condition=Key("unitId").eq(unit_id),
        scan_forward=True,
    )
    items.sort(key=lambda t: int(t.get("order") or 0))
    return resp(200, items)


def handle_get_knowledge_queue(event, unit_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    queue_table = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    items = query_all(
        queue_table,
        index_name=IDX["UNIT_QUEUE"],
        key_condition=Key("unitId").eq(unit_id),
        scan_forward=True,
    )
    # Filter to this student's items only
    student_items = [it for it in items if it.get("studentId") == student_id]
    student_items.sort(key=lambda x: int(x.get("order") or 0))
    return resp(200, student_items)


def handle_complete_knowledge_attempt(event, item_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    status = (body.get("status") or "").strip() if isinstance(body, dict) else ""
    valid_statuses = {"completed_correct", "completed_incorrect"}
    if status not in valid_statuses:
        return resp(400, {"error": f"status must be one of {list(valid_statuses)}"})

    queue_table = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    got = queue_table.get_item(Key={"studentId": student_id, "id": item_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("KnowledgeQueueItem")

    if item.get("studentId") != student_id:
        return resp(403, {"error": "Forbidden"})

    now = iso_now()
    queue_table.update_item(
        Key={"studentId": student_id, "id": item_id},
        UpdateExpression="SET #s = :s, completedAt = :ca, updatedAt = :ua",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": status, ":ca": now, ":ua": now},
    )
    item["status"] = status
    item["completedAt"] = now
    item["updatedAt"] = now
    return resp(200, item)


def handle_get_knowledge_progress(event, unit_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    # Get all topics for the unit
    topics = dynamodb.Table(T["KNOWLEDGE_TOPICS"])
    topic_items = query_all(
        topics,
        index_name=IDX["UNIT_KNOWLEDGE_TOPICS"],
        key_condition=Key("unitId").eq(unit_id),
        scan_forward=True,
    )
    total_topics = len(topic_items)
    topic_ids = {t["id"] for t in topic_items if t.get("id")}

    # Get completed queue items for this student in this unit
    queue_table = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    unit_items = query_all(
        queue_table,
        index_name=IDX["UNIT_QUEUE"],
        key_condition=Key("unitId").eq(unit_id),
        scan_forward=True,
    )
    student_items = [it for it in unit_items if it.get("studentId") == student_id and it.get("knowledgeTopicId") in topic_ids]

    correct_topic_ids = {it["knowledgeTopicId"] for it in student_items if it.get("status") == "completed_correct"}
    incorrect_topic_ids = {it["knowledgeTopicId"] for it in student_items if it.get("status") == "completed_incorrect"}
    # If a topic was retried correctly, remove it from incorrect
    incorrect_topic_ids -= correct_topic_ids

    correct_count = len(correct_topic_ids)
    incorrect_count = len(incorrect_topic_ids)

    return resp(200, {
        "unitId": unit_id,
        "totalTopics": total_topics,
        "correctCount": correct_count,
        "incorrectCount": incorrect_count,
        "correctPercent": round((correct_count / total_topics) * 100) if total_topics else 0,
        "incorrectPercent": round((incorrect_count / total_topics) * 100) if total_topics else 0,
    })


# ---- Main router ----
def handler(event, context):
    try:
        method, path = method_and_path(event)
        params = event.get("pathParameters") or {}

        if method == "OPTIONS":
            return resp_options()

        if method == "GET" and path == "/health":
            return handle_health()

        if method == "GET" and path == "/current-student":
            return handle_current_student(event)

        if method == "GET" and path.endswith("/courses") and path.startswith("/students/"):
            return handle_list_courses_for_student(event, params.get("studentId"))

        if method == "POST" and path == "/instructors/batch":
            return handle_instructors_batch(event)

        if method == "GET" and path.endswith("/units") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_list_units(course_id)

        if method == "GET" and path.startswith("/courses/") and "/units" not in path and "/awards" not in path and "/feedback" not in path:
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_get_course(course_id)

        if method == "GET" and path.endswith("/objectives") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_list_objectives(unit_id)

        if method == "GET" and path.startswith("/units/") and "/objectives" not in path and "/progress" not in path and "/threads" not in path:
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_unit(unit_id)

        if method == "GET" and path.endswith("/questions") and path.startswith("/objectives/"):
            objective_id = params.get("objectiveId")
            if not objective_id:
                return resp(400, {"error": "Missing objectiveId"})
            return handle_list_questions_for_objective(objective_id)

        if method == "GET" and path.endswith("/stages") and path.startswith("/objectives/"):
            objective_id = params.get("objectiveId")
            if not objective_id:
                return resp(400, {"error": "Missing objectiveId"})
            return handle_list_stages_for_objective(objective_id)

        if method == "GET" and path.endswith("/progress") and path.startswith("/objectives/"):
            objective_id = params.get("objectiveId")
            if not objective_id:
                return resp(400, {"error": "Missing objectiveId"})
            return handle_get_objective_progress(event, objective_id)

        if method == "POST" and path.endswith("/advance") and path.startswith("/objectives/"):
            objective_id = params.get("objectiveId")
            if not objective_id:
                return resp(400, {"error": "Missing objectiveId"})
            return handle_advance_stage(event, objective_id)

        if method == "GET" and path.startswith("/objectives/") and "/questions" not in path and "/stages" not in path and "/progress" not in path and "/advance" not in path:
            objective_id = params.get("objectiveId")
            if not objective_id:
                return resp(400, {"error": "Missing objectiveId"})
            return handle_get_objective(objective_id)

        if method == "GET" and path.startswith("/questions/"):
            question_id = params.get("questionId")
            if not question_id:
                return resp(400, {"error": "Missing questionId"})
            return handle_get_question(question_id)

        if method == "GET" and path.startswith("/stages/"):
            stage_id = params.get("stageId")
            if not stage_id:
                return resp(400, {"error": "Missing stageId"})
            return handle_get_stage(stage_id)

        if method == "GET" and path.endswith("/progress/items") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_list_unit_progress_items(event, unit_id)

        if method == "GET" and path.endswith("/progress") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_unit_progress(event, unit_id)

        if method == "GET" and path == "/awards":
            return handle_list_awards(event)

        if method == "GET" and path.endswith("/awards") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_list_awards(event, course_id=course_id)

        if method == "GET" and path == "/feedback":
            return handle_list_feedback(event)

        if method == "GET" and path.endswith("/feedback") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_list_feedback(event, course_id=course_id)

        if method == "GET" and path.endswith("/threads") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_list_threads_for_unit(event, unit_id)

        if method == "GET" and path.startswith("/threads/") and path.endswith("/with-progress"):
            thread_id = params.get("threadId")
            if not thread_id:
                return resp(400, {"error": "Missing threadId"})
            return handle_get_thread_with_progress(event, thread_id)

        if method == "GET" and path.startswith("/threads/") and path.endswith("/messages"):
            thread_id = params.get("threadId")
            if not thread_id:
                return resp(400, {"error": "Missing threadId"})
            return handle_list_messages(event, thread_id)

        if method == "POST" and path.startswith("/threads/") and path.endswith("/messages"):
            thread_id = params.get("threadId")
            if not thread_id:
                return resp(400, {"error": "Missing threadId"})
            return handle_send_message(event, thread_id)

        if method == "GET" and path.startswith("/threads/") and "/messages" not in path and "/with-progress" not in path:
            thread_id = params.get("threadId")
            if not thread_id:
                return resp(400, {"error": "Missing threadId"})
            return handle_get_thread(thread_id)

        # ---- Teacher / instructor routes ----

        if method == "GET" and path == "/current-instructor":
            return handle_current_instructor(event)

        if method == "GET" and path == "/instructor/courses":
            return handle_list_instructor_courses(event)

        if method == "POST" and path == "/courses":
            return handle_create_course(event)

        if method == "GET" and path.endswith("/roster") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_get_course_roster(event, course_id)

        if method == "PUT" and path.endswith("/roster") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_update_course_roster(event, course_id)

        if method == "PATCH" and path.endswith("/title") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_update_unit_title(event, unit_id)

        if method == "PATCH" and path.endswith("/enabled") and path.startswith("/objectives/"):
            objective_id = params.get("objectiveId")
            if not objective_id:
                return resp(400, {"error": "Missing objectiveId"})
            return handle_update_objective_enabled(event, objective_id)

        if method == "POST" and path.endswith("/units/upload") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_create_unit_from_upload(event, course_id)

        if method == "GET" and path == "/students":
            return handle_list_all_students(event)

        if method == "POST" and path == "/students":
            return handle_create_student(event)

        if method == "GET" and path.endswith("/knowledge-topics") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_list_knowledge_topics(unit_id)

        if method == "GET" and path.endswith("/knowledge-queue") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_knowledge_queue(event, unit_id)

        if method == "POST" and path.endswith("/complete") and path.startswith("/knowledge-queue/"):
            item_id = params.get("itemId")
            if not item_id:
                return resp(400, {"error": "Missing itemId"})
            return handle_complete_knowledge_attempt(event, item_id)

        if method == "GET" and path.endswith("/knowledge-progress") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_knowledge_progress(event, unit_id)

        return resp(404, {"error": "Route not found", "method": method, "path": path})
    except Exception as e:
        return resp(500, {"error": "Server error", "details": str(e)})
