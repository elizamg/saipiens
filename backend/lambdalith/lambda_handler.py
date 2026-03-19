import base64
import io
import json
import os
import sys
import tempfile
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key
from botocore.config import Config

# Add backend_code to path so pipeline modules can import `utils` correctly
_BACKEND_CODE_DIR = os.path.join(os.path.dirname(__file__), "backend_code")
if _BACKEND_CODE_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_CODE_DIR)

dynamodb = boto3.resource("dynamodb")
s3 = boto3.client(
    "s3",
    region_name="us-west-1",
    config=Config(s3={"addressing_style": "virtual"}, signature_version="s3v4"),
    endpoint_url="https://s3.us-west-1.amazonaws.com",
)
lambda_client = boto3.client("lambda")

UPLOAD_BUCKET = "sapiens-upload-staging-681816819209"


def _presign_avatar_url(avatar_url):
    """If avatarUrl is an S3 key (avatars/...), return a presigned GET URL. Otherwise pass through."""
    if not avatar_url or not isinstance(avatar_url, str):
        return avatar_url
    # Handle both raw keys and full S3 URLs stored previously
    if avatar_url.startswith("avatars/"):
        s3_key = avatar_url
    elif f"{UPLOAD_BUCKET}.s3" in avatar_url:
        # Extract key from https://bucket.s3.region.amazonaws.com/key
        s3_key = avatar_url.split(".amazonaws.com/", 1)[-1]
    else:
        return avatar_url
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": UPLOAD_BUCKET, "Key": s3_key},
        ExpiresIn=3600,
    )
SELF_FUNCTION_NAME = os.environ.get("AWS_LAMBDA_FUNCTION_NAME", "sapiens-api")

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
    "KNOWLEDGE_TOPICS": os.environ["KNOWLEDGE_TOPICS_TABLE"],
    "KNOWLEDGE_QUEUE_ITEMS": os.environ["KNOWLEDGE_QUEUE_ITEMS_TABLE"],
    "GRADING_REPORTS": os.environ.get("GRADING_REPORTS_TABLE", ""),
}

# ---- Indexes (env vars) ----
IDX = {
    "COURSE_UNITS": os.environ["COURSE_UNITS_INDEX"],
    "UNIT_OBJECTIVES": os.environ["UNIT_OBJECTIVES_INDEX"],
    "OBJECTIVE_QUESTIONS": os.environ["OBJECTIVE_QUESTIONS_INDEX"],

    "ITEM_STAGES_BY_ITEM": os.environ["ITEM_STAGES_BY_ITEM_INDEX"],
    "UNIT_THREADS": os.environ["UNIT_THREADS_INDEX"],
    "INSTRUCTOR_COURSES": os.environ["INSTRUCTOR_COURSES_INDEX"],
    "COURSE_ENROLLMENTS": "CourseEnrollmentsIndex",
    "UNIT_KNOWLEDGE_TOPICS": os.environ["UNIT_KNOWLEDGE_TOPICS_INDEX"],
    "UNIT_QUEUE": os.environ["UNIT_QUEUE_INDEX"],
}

# ---- CORS ----
CORS_ALLOW_ORIGIN = os.environ.get(
    "CORS_ALLOW_ORIGIN",
    "https://sapiens-pp4l.vercel.app",
)
CORS_ALLOW_HEADERS = os.environ.get(
    "CORS_ALLOW_HEADERS",
    "Content-Type,Authorization",
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


def resp_null():
    """Return HTTP 200 with JSON null body (null-not-404 contract)."""
    r = resp(200)
    r["body"] = "null"
    return r


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
    """Return JWT claims — prefer API Gateway authorizer, fall back to
    decoding the Authorization header directly (needed when no authorizer
    is attached to the route)."""
    rc = event.get("requestContext") or {}
    auth = rc.get("authorizer") or {}
    jwt_block = auth.get("jwt") or {}
    gw_claims = jwt_block.get("claims") or {}
    if gw_claims:
        return gw_claims

    # Decode JWT payload from Authorization header
    auth_header = header(event, "authorization") or header(event, "Authorization") or ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            # JWT is header.payload.signature — decode the payload (base64url)
            payload_b64 = token.split(".")[1]
            # Add padding
            padding = 4 - len(payload_b64) % 4
            if padding != 4:
                payload_b64 += "=" * padding
            payload_bytes = base64.urlsafe_b64decode(payload_b64)
            return json.loads(payload_bytes)
        except Exception:
            pass
    return {}


def authed_sub(event) -> str | None:
    return claims(event).get("sub")


def _cognito_groups(event) -> list[str]:
    """Return the list of Cognito groups from the JWT claims (may be absent)."""
    raw = claims(event).get("cognito:groups")
    if not raw:
        return []
    if isinstance(raw, list):
        return raw
    # API Gateway JWT authorizer may stringify lists as "[instructors]" or
    # space-separated "instructors students". Strip brackets before splitting.
    cleaned = raw.strip("[] ")
    return [g.strip() for g in cleaned.split() if g.strip()]


def effective_instructor_id(event) -> str | None:
    """
    Resolve the caller as an instructor.
    Requires a valid JWT with sub + membership in the 'instructors' Cognito group.
    Returns None if the caller is not an authenticated instructor.
    """
    sub = authed_sub(event)
    if sub:
        groups = _cognito_groups(event)
        return sub if "instructors" in groups else None
    return None


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


def effective_student_id(event) -> str | None:
    """Resolve the caller as a student. Requires a valid JWT with sub claim."""
    return authed_sub(event)


def method_and_path(event):
    rc = event.get("requestContext") or {}
    http = rc.get("http") or {}
    method = http.get("method", "UNKNOWN")
    raw_path = http.get("path", "/")
    return method, strip_stage(raw_path)


# ---- Audit logging ----

def _audit_log(event_type: str, *, sub: str | None = None, method: str = "", path: str = "", status: int = 0, detail: str = ""):
    """Emit a structured JSON audit log line to stdout (→ CloudWatch)."""
    entry = {
        "audit": True,
        "event": event_type,
        "sub": sub,
        "method": method,
        "path": path,
        "status": status,
        "detail": detail,
        "ts": iso_now(),
    }
    print(json.dumps(entry, default=str))


# ---- Enrollment helpers ----

def _is_enrolled(student_id: str, course_id: str) -> bool:
    """Check if a student is enrolled in a course."""
    tbl = dynamodb.Table(T["ENROLLMENTS"])
    got = tbl.get_item(Key={"studentId": student_id, "courseId": course_id})
    return "Item" in got


def _check_enrollment_for_unit(student_id: str, unit_id: str) -> str | None:
    """Look up unit's courseId and verify enrollment. Returns courseId if enrolled, else None."""
    unit = dynamodb.Table(T["UNITS"]).get_item(Key={"id": unit_id}).get("Item")
    if not unit:
        return None
    course_id = unit.get("courseId")
    if not course_id or not _is_enrolled(student_id, course_id):
        return None
    return course_id


def _check_enrollment_for_objective(student_id: str, objective_id: str) -> str | None:
    """Resolve objective → unit → course and verify enrollment. Returns courseId if enrolled."""
    obj = dynamodb.Table(T["OBJECTIVES"]).get_item(Key={"id": objective_id}).get("Item")
    if not obj:
        return None
    unit_id = obj.get("unitId")
    if not unit_id:
        return None
    return _check_enrollment_for_unit(student_id, unit_id)


def _check_enrollment_for_thread(student_id: str, thread_id: str) -> str | None:
    """Resolve thread → unit → course and verify enrollment. Returns courseId if enrolled."""
    thread = dynamodb.Table(T["CHAT_THREADS"]).get_item(Key={"id": thread_id}).get("Item")
    if not thread:
        return None
    unit_id = thread.get("unitId")
    if not unit_id:
        return None
    return _check_enrollment_for_unit(student_id, unit_id)


def _require_enrollment_for_course(event, course_id: str):
    """For shared endpoints: if student, verify enrollment. Returns 403 resp or None."""
    if effective_instructor_id(event):
        return None  # instructors can access any course
    student_id = effective_student_id(event)
    if not student_id:
        _audit_log("auth_failure", sub=None, status=401, detail="no valid JWT")
        return resp(401, {"error": "Unauthorized"})
    if not _is_enrolled(student_id, course_id):
        _audit_log("enrollment_denied", sub=student_id, status=403, detail=f"course={course_id}")
        return resp(403, {"error": "Not enrolled in this course"})
    return None


def _require_enrollment_for_unit(event, unit_id: str):
    """For shared endpoints: if student, verify enrollment via unit→course. Returns error resp or None."""
    if effective_instructor_id(event):
        return None
    student_id = effective_student_id(event)
    if not student_id:
        _audit_log("auth_failure", sub=None, status=401, detail="no valid JWT")
        return resp(401, {"error": "Unauthorized"})
    if not _check_enrollment_for_unit(student_id, unit_id):
        _audit_log("enrollment_denied", sub=student_id, status=403, detail=f"unit={unit_id}")
        return resp(403, {"error": "Not enrolled in this course"})
    return None


def _require_enrollment_for_objective(event, objective_id: str):
    """For shared endpoints: if student, verify enrollment via objective→unit→course."""
    if effective_instructor_id(event):
        return None
    student_id = effective_student_id(event)
    if not student_id:
        _audit_log("auth_failure", sub=None, status=401, detail="no valid JWT")
        return resp(401, {"error": "Unauthorized"})
    if not _check_enrollment_for_objective(student_id, objective_id):
        _audit_log("enrollment_denied", sub=student_id, status=403, detail=f"objective={objective_id}")
        return resp(403, {"error": "Not enrolled in this course"})
    return None


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


def _earned_stars_to_progress_state(earned: int) -> str:
    """Map earnedStars (0-3) to the frontend 5-state ProgressState string."""
    if earned <= 0:
        return "not_started"
    if earned == 1:
        return "walkthrough_started"
    if earned == 2:
        return "walkthrough_complete"
    return "challenge_complete"


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
        _audit_log("auth_failure", sub=None, method="GET", path="/current-student", status=401)
        return resp(401, {"error": "Unauthorized"})

    students = dynamodb.Table(T["STUDENTS"])
    got = students.get_item(Key={"id": sub})
    item = got.get("Item")

    if not item:
        _audit_log("student_first_login", sub=sub, method="GET", path="/current-student", status=200)

    if item:
        item["avatarUrl"] = _presign_avatar_url(item.get("avatarUrl"))
        return resp(200, item)

    now = iso_now()
    item = {
        "id": sub,
        "name": _name_from_claims(event),
        "yearLabel": "",
        "avatarUrl": None,
        "createdAt": now,
        "updatedAt": now,
    }

    students.put_item(Item=item, ConditionExpression="attribute_not_exists(id)")
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


def _normalize_course(item: dict) -> dict:
    """Ensure the course object has `instructorIds` (array) for the frontend."""
    if "instructorIds" not in item and "instructorId" in item:
        item["instructorIds"] = [item["instructorId"]]
    return item


def handle_get_course(course_id: str):
    courses = dynamodb.Table(T["COURSES"])
    got = courses.get_item(Key={"id": course_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("Course")
    return resp(200, _normalize_course(item))


def handle_list_units(course_id: str, include_deleted: bool = False):
    units = dynamodb.Table(T["UNITS"])
    items = query_all(
        units,
        index_name=IDX["COURSE_UNITS"],
        key_condition=Key("courseId").eq(course_id),
        scan_forward=True,
    )
    if not include_deleted:
        items = [i for i in items if not i.get("deletedAt")]
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
    ordered = [_normalize_course(by_id[cid]) for cid in course_ids if by_id.get(cid) is not None and not by_id.get(cid, {}).get("deletedAt")]
    return resp(200, ordered)


# ---- Stages ----
def handle_list_stages_for_objective(event, objective_id: str):
    stages_tbl = dynamodb.Table(T["ITEM_STAGES"])
    items = query_all(
        stages_tbl,
        index_name=IDX["ITEM_STAGES_BY_ITEM"],
        key_condition=Key("itemId").eq(objective_id),
        scan_forward=True,  # order asc
    )

    # Lazily generate suggestedQuestions for challenge stages that are missing them
    challenge_needs_backfill = [
        s for s in items
        if s.get("stageType") == "challenge" and not s.get("suggestedQuestions") and s.get("prompt")
    ]
    if challenge_needs_backfill:
        student_id = effective_student_id(event)
        if student_id:
            # Look up unitId from the objective
            obj = dynamodb.Table(T["OBJECTIVES"]).get_item(Key={"id": objective_id}).get("Item")
            unit_id = obj.get("unitId", "") if obj else ""
            if unit_id:
                try:
                    from backend_code.gen_clarifying_questions_pipeline import gen_clarifying_questions
                    subject, grade = _get_unit_context(unit_id, student_id)
                    for stage in challenge_needs_backfill:
                        try:
                            cqs = gen_clarifying_questions(subject, grade, stage["prompt"])
                            stages_tbl.update_item(
                                Key={"id": stage["id"]},
                                UpdateExpression="SET suggestedQuestions = :sq",
                                ExpressionAttributeValues={":sq": cqs},
                            )
                            stage["suggestedQuestions"] = cqs
                        except Exception as e:
                            print(f"[clarifying-questions] backfill failed for stage {stage['id']}: {e}")
                except Exception as e:
                    print(f"[clarifying-questions] stage backfill setup failed: {e}")

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
    if not _check_enrollment_for_objective(student_id, objective_id):
        return resp(403, {"error": "Not enrolled in this course"})

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
    if not _check_enrollment_for_unit(student_id, unit_id):
        return resp(403, {"error": "Not enrolled in this course"})

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
    if not _check_enrollment_for_unit(student_id, unit_id):
        return resp(403, {"error": "Not enrolled in this course"})

    # --- Skill / Capstone objectives ---
    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    objectives = query_all(
        objectives_tbl,
        index_name=IDX["UNIT_OBJECTIVES"],
        key_condition=Key("unitId").eq(unit_id),
        scan_forward=True,
    )
    # Exclude disabled objectives from progress counting
    objectives = [o for o in objectives if o.get("enabled") is not False]

    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    all_prog = query_all(
        prog_tbl,
        key_condition=Key("studentId").eq(student_id),
        scan_forward=True,
    )
    prog_by_obj = {p.get("objectiveId"): p for p in all_prog if p.get("objectiveId")}

    obj_completed = 0
    for o in objectives:
        oid = o.get("id")
        p = prog_by_obj.get(oid)
        if p and int(p.get("earnedStars") or 0) >= 3:
            obj_completed += 1

    total = len(objectives)
    completed = obj_completed

    if total == 0:
        return resp(200, {"unitId": unit_id, "totalObjectives": 0, "completedObjectives": 0, "progressPercent": 0})

    percent = int(round((completed / total) * 100))
    return resp(200, {"unitId": unit_id, "totalObjectives": total, "completedObjectives": completed, "progressPercent": percent})


def handle_advance_stage(event, objective_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})
    if not _check_enrollment_for_objective(student_id, objective_id):
        return resp(403, {"error": "Not enrolled in this course"})

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
    if earned == 3:
        item["completedAt"] = now

    prog_tbl.put_item(Item=item)
    return resp(200, item)


# ---- Awards ----
def handle_list_awards(event, course_id: str | None = None):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})
    if course_id and not _is_enrolled(student_id, course_id):
        return resp(403, {"error": "Not enrolled in this course"})

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
    if course_id and not _is_enrolled(student_id, course_id):
        return resp(403, {"error": "Not enrolled in this course"})

    fb_tbl = dynamodb.Table(T["FEEDBACK_ITEMS"])
    items = query_all(
        fb_tbl,
        key_condition=Key("studentId").eq(student_id),
        scan_forward=True,
    )
    if course_id:
        items = [f for f in items if f.get("courseId") == course_id]
    return resp(200, items)


# ---- Grading Reports & Per-Unit Feedback ----


def _collect_skill_feedback(objectives: list[dict]) -> dict[str, list[dict]]:
    """Collect grading feedback from chat messages for each skill/capstone objective.

    Returns a map of objective_id -> list of {"category": str, "feedback": str} dicts
    representing tutor grading results from the challenge stage.
    """
    msgs_tbl = dynamodb.Table(T["CHAT_MESSAGES"])
    feedback_map: dict[str, list[dict]] = {}
    for obj in objectives:
        kind = obj.get("kind", "skill")
        if kind == "knowledge":
            continue
        oid = obj.get("id", "")
        thread_id = f"thread-{oid}"
        try:
            items = query_all(msgs_tbl, key_condition=Key("threadId").eq(thread_id), scan_forward=True)
        except Exception:
            items = []
        feedbacks = []
        for msg in items:
            if msg.get("role") != "tutor":
                continue
            metadata = msg.get("metadata") or {}
            category = metadata.get("gradingCategory", "")
            if category:
                feedbacks.append({"category": category, "feedback": msg.get("content", "")})
        if feedbacks:
            feedback_map[oid] = feedbacks
    return feedback_map


def _format_capstone_data(objectives: list[dict], feedback_map: dict[str, list[dict]]) -> str:
    """Format capstone objective conversations into a summary string for the AI prompt.

    Includes the capstone skill focus, grading feedback received, and conversation highlights.
    """
    capstone_objs = [o for o in objectives if o.get("kind") == "capstone"]
    if not capstone_objs:
        return "No capstone objective in this unit."

    lines = []
    for obj in capstone_objs:
        oid = obj.get("id", "")
        title = obj.get("title", "Capstone")
        description = obj.get("description", "")
        lines.append(f"Capstone: \"{title}\"")
        if description:
            lines.append(f"  Description: {description}")

        # Pull the capstone thread to find what skill it focused on
        threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
        thread_id = f"thread-{oid}"
        try:
            thread = threads_tbl.get_item(Key={"id": thread_id}).get("Item") or {}
        except Exception:
            thread = {}
        capstone_ctx = thread.get("capstoneSkillContext") or {}
        if capstone_ctx:
            lines.append(f"  Focused on weakest skill: \"{capstone_ctx.get('title', 'Unknown')}\"")
            grading_fb = capstone_ctx.get("grading_feedback", "")
            if grading_fb:
                lines.append(f"  Original grading feedback on that skill: {grading_fb[:300]}")

        # Summarize the capstone conversation
        msgs_tbl = dynamodb.Table(T["CHAT_MESSAGES"])
        try:
            msgs = query_all(msgs_tbl, key_condition=Key("threadId").eq(thread_id), scan_forward=True)
        except Exception:
            msgs = []
        if msgs:
            student_msgs = [m for m in msgs if m.get("role") == "student"]
            tutor_msgs = [m for m in msgs if m.get("role") == "tutor"]
            lines.append(f"  Conversation turns: {len(student_msgs)} student, {len(tutor_msgs)} tutor")
            # Include the final tutor message as the capstone outcome
            if tutor_msgs:
                final_tutor = tutor_msgs[-1].get("content", "")
                if final_tutor:
                    # Truncate to keep prompt manageable
                    snippet = final_tutor[:400] + ("..." if len(final_tutor) > 400 else "")
                    lines.append(f"  Final tutor assessment: {snippet}")
        else:
            lines.append("  No conversation recorded (capstone not attempted).")

    return "\n".join(lines)


def _format_objectives_data(objectives: list[dict], progress_map: dict, deadline: str | None, feedback_map: dict[str, list[dict]] | None = None) -> str:
    """Format skill objective progress into a human-readable string for the AI prompt."""
    if feedback_map is None:
        feedback_map = {}
    lines = []
    for obj in objectives:
        oid = obj.get("id", "")
        title = obj.get("title", "Unknown")
        kind = obj.get("kind", "skill")
        prog = progress_map.get(oid, {})
        stars = int(prog.get("earnedStars", 0))
        stage = prog.get("currentStageType", "begin")
        updated_at = prog.get("updatedAt", "")

        completed = stars >= 3 or stage == "challenge" or prog.get("progressState") == "challenge_complete"
        status = "not started"
        if completed:
            status = "completed"
            if deadline and updated_at:
                try:
                    dl = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                    ua = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
                    if ua > dl:
                        diff = ua - dl
                        days = diff.days
                        if days == 0:
                            status = "completed (same day as deadline)"
                        elif days == 1:
                            status = "completed (1 day after deadline)"
                        else:
                            status = f"completed ({days} days after deadline)"
                    else:
                        status = "completed (before deadline)"
                except Exception:
                    pass
        elif stars > 0 or stage != "begin":
            status = "in progress"

        scaffolded = stage == "walkthrough" and kind != "knowledge"
        scaffold_note = " (needed scaffolding)" if scaffolded else ""

        line = f"{kind.capitalize()}: \"{title}\" — Stars: {stars}/3, Stage: {stage}{scaffold_note}, Status: {status}"

        # Append per-skill grading feedback if available
        obj_feedbacks = feedback_map.get(oid, [])
        if obj_feedbacks:
            categories = [f.get("category", "") for f in obj_feedbacks]
            worst = "correct"
            for cat in categories:
                if cat == "incorrect":
                    worst = "incorrect"
                    break
                elif cat == "small mistake" and worst in ("correct", "slight clarification"):
                    worst = "small mistake"
                elif cat == "slight clarification" and worst == "correct":
                    worst = "slight clarification"
            line += f", Grading: {worst}"
            # Include the most relevant feedback snippet (from the worst-graded response)
            worst_fb = next((f for f in obj_feedbacks if f.get("category") == worst), None)
            if worst_fb:
                snippet = worst_fb["feedback"][:200] + ("..." if len(worst_fb["feedback"]) > 200 else "")
                line += f"\n    Feedback: {snippet}"

        lines.append(line)
    return "\n".join(lines) if lines else "No skill objectives in this unit."


def _format_knowledge_data(queue_items: list[dict], topics_map: dict) -> str:
    """Format knowledge topic results into a human-readable string for the AI prompt."""
    # Group by topicId to detect retries
    by_topic: dict[str, list[dict]] = {}
    for qi in queue_items:
        tid = qi.get("knowledgeTopicId", "")
        by_topic.setdefault(tid, []).append(qi)

    lines = []
    for topic_id, attempts in by_topic.items():
        topic = topics_map.get(topic_id, {})
        description = topic.get("knowledgeTopic", topic.get("description", "Unknown topic"))

        # Find final result
        final_correct = any(a.get("status") == "completed_correct" for a in attempts)
        attempt_count = len(attempts)

        if final_correct:
            if attempt_count > 1:
                result = f"Correct (after {attempt_count} attempts)"
            else:
                result = "Correct"
        else:
            has_incorrect = any(a.get("status") == "completed_incorrect" for a in attempts)
            if has_incorrect:
                if attempt_count > 1:
                    result = f"Incorrect (after {attempt_count} attempts)"
                else:
                    result = "Incorrect"
            else:
                result = "Not attempted"

        lines.append(f"Topic: \"{description}\" — {result}")
    return "\n".join(lines) if lines else "No knowledge topics in this unit."


def handle_get_unit_grading_report(event, unit_id: str):
    """GET /units/{unitId}/grading-report?studentId={studentId} — teacher view."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    qs = event.get("queryStringParameters") or {}
    student_id = qs.get("studentId")
    if not student_id:
        return resp(400, {"error": "Missing studentId query parameter"})

    # Check for existing report
    gr_tbl = dynamodb.Table(T["GRADING_REPORTS"])
    got = gr_tbl.get_item(Key={"studentId": student_id, "unitId": unit_id})
    existing = got.get("Item")
    if existing:
        return resp(200, _format_grading_report_response(existing, is_teacher=True))

    # Generate on-demand: gather data
    units_tbl = dynamodb.Table(T["UNITS"])
    unit_got = units_tbl.get_item(Key={"id": unit_id})
    unit = unit_got.get("Item")
    if not unit:
        return resp_not_found("Unit")

    course_id = unit.get("courseId", "")
    courses_tbl = dynamodb.Table(T["COURSES"])
    course_got = courses_tbl.get_item(Key={"id": course_id})
    course = course_got.get("Item") or {}

    # Objectives for this unit
    obj_tbl = dynamodb.Table(T["OBJECTIVES"])
    objectives = query_all(
        obj_tbl,
        index_name=IDX["UNIT_OBJECTIVES"],
        key_condition=Key("unitId").eq(unit_id),
    )

    # Progress for all objectives in one query (avoid N+1)
    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    all_prog = query_all(
        prog_tbl,
        key_condition=Key("studentId").eq(student_id),
    )
    obj_id_set = {obj.get("id") for obj in objectives if obj.get("id")}
    progress_map = {
        p["objectiveId"]: p for p in all_prog
        if p.get("objectiveId") in obj_id_set
    }

    # Knowledge queue items for this student + unit
    kq_tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    all_kq = query_all(
        kq_tbl,
        key_condition=Key("studentId").eq(student_id),
    )
    unit_kq = [qi for qi in all_kq if qi.get("unitId") == unit_id]

    # Knowledge topics for this unit
    kt_tbl = dynamodb.Table(T["KNOWLEDGE_TOPICS"])
    topics = query_all(
        kt_tbl,
        index_name=IDX["UNIT_KNOWLEDGE_TOPICS"],
        key_condition=Key("unitId").eq(unit_id),
    )
    topics_map = {t["id"]: t for t in topics if t.get("id")}

    # Format data — collect skill/capstone grading feedback from chat messages
    deadline = unit.get("deadline")
    feedback_map = _collect_skill_feedback(objectives)
    objectives_data = _format_objectives_data(objectives, progress_map, deadline, feedback_map)
    knowledge_data = _format_knowledge_data(unit_kq, topics_map)
    capstone_data = _format_capstone_data(objectives, feedback_map)

    # Compute stats for structured display
    skill_objs = [o for o in objectives if o.get("objectiveType") != "knowledge"]
    skill_total = len(skill_objs)
    skill_completed = 0
    skill_completed_before_deadline = 0
    latest_completion_ts = None
    objective_details = []
    for o in skill_objs:
        p = progress_map.get(o.get("id"), {})
        completed = int(p.get("earnedStars", 0)) >= 3 or p.get("currentStageType") == "challenge"
        ts = p.get("updatedAt") or p.get("createdAt") if completed else None
        detail = {
            "title": o.get("title", ""),
            "completed": completed,
            "completedAt": ts or "",
        }
        if completed:
            skill_completed += 1
            if ts and (latest_completion_ts is None or ts > latest_completion_ts):
                latest_completion_ts = ts
            if deadline and ts and ts <= deadline:
                skill_completed_before_deadline += 1
                detail["beforeDeadline"] = True
            elif deadline and ts:
                detail["beforeDeadline"] = False
        objective_details.append(detail)

    # Knowledge stats from queue items
    by_topic: dict[str, list[dict]] = {}
    for qi in unit_kq:
        tid = qi.get("knowledgeTopicId", "")
        by_topic.setdefault(tid, []).append(qi)
    knowledge_total = len(topics_map)
    knowledge_correct = sum(
        1 for attempts in by_topic.values()
        if any(a.get("status") == "completed_correct" for a in attempts)
    )
    knowledge_attempts = len([qi for qi in unit_kq if qi.get("status", "").startswith("completed_")])

    # Deadline completion status
    all_completed = skill_completed == skill_total and skill_total > 0
    completed_before_deadline = None
    if deadline and all_completed and latest_completion_ts:
        completed_before_deadline = latest_completion_ts <= deadline

    # On-time percentage: what fraction of skills were completed before the deadline
    on_time_pct = None
    if deadline and skill_total > 0:
        on_time_pct = round(skill_completed_before_deadline / skill_total * 100)

    # Generate report — parallelize teacher and student summaries
    from concurrent.futures import ThreadPoolExecutor
    from backend_code.grading_report_pipeline import generate_teacher_summary, generate_student_summary

    summary_kwargs = dict(
        unit_title=unit.get("title", ""),
        course_title=course.get("title", ""),
        objectives_data=objectives_data,
        knowledge_data=knowledge_data,
        capstone_data=capstone_data,
    )
    with ThreadPoolExecutor(max_workers=2) as executor:
        teacher_future = executor.submit(generate_teacher_summary, **summary_kwargs)
        student_future = executor.submit(generate_student_summary, **summary_kwargs)
    teacher_summary = teacher_future.result()
    student_summary = student_future.result()

    # Store
    report_id = str(uuid.uuid4())
    now = iso_now()
    report_item = {
        "studentId": student_id,
        "unitId": unit_id,
        "id": report_id,
        "courseId": course_id,
        "teacherSummary": teacher_summary,
        "studentSummary": student_summary,
        "skillCompleted": skill_completed,
        "skillTotal": skill_total,
        "skillCompletedBeforeDeadline": skill_completed_before_deadline,
        "knowledgeCorrect": knowledge_correct,
        "knowledgeTotal": knowledge_total,
        "knowledgeAttempts": knowledge_attempts,
        "deadline": deadline or "",
        "completedBeforeDeadline": completed_before_deadline,
        "onTimePct": on_time_pct,
        "completionDate": latest_completion_ts or "",
        "objectiveDetails": objective_details,
        "createdAt": now,
    }
    gr_tbl.put_item(Item=report_item)

    return resp(200, _format_grading_report_response(report_item, is_teacher=True))


def _format_grading_report_response(report: dict, is_teacher: bool = False) -> dict:
    """Format a grading report item for API response."""
    return {
        "id": report["id"],
        "unitId": report["unitId"],
        "studentId": report["studentId"],
        "summary": report.get("teacherSummary" if is_teacher else "studentSummary", ""),
        "createdAt": report.get("createdAt", ""),
        "skillCompleted": report.get("skillCompleted", 0),
        "skillTotal": report.get("skillTotal", 0),
        "skillCompletedBeforeDeadline": report.get("skillCompletedBeforeDeadline", 0),
        "knowledgeCorrect": report.get("knowledgeCorrect", 0),
        "knowledgeTotal": report.get("knowledgeTotal", 0),
        "knowledgeAttempts": report.get("knowledgeAttempts", 0),
        "deadline": report.get("deadline", ""),
        "completedBeforeDeadline": report.get("completedBeforeDeadline"),
        "onTimePct": report.get("onTimePct"),
        "completionDate": report.get("completionDate", ""),
        "objectiveDetails": report.get("objectiveDetails", []),
        "status": report.get("status", "ready"),
    }


def _trigger_report_stats_update(student_id: str, unit_id: str):
    """Fire-and-forget async Lambda to update grading report stats."""
    if not unit_id:
        return
    try:
        lambda_client.invoke(
            FunctionName=SELF_FUNCTION_NAME,
            InvocationType="Event",
            Payload=json.dumps({
                "_internal": "update-report-stats",
                "studentId": student_id,
                "unitId": unit_id,
            }).encode(),
        )
    except Exception:
        pass  # Non-critical


SUMMARY_REGEN_COOLDOWN_SECONDS = 5 * 60  # Only regenerate AI summaries every 5 minutes


def _update_grading_report_stats(student_id: str, unit_id: str):
    """Update stats AND regenerate AI summaries on a cached grading report.
    Called after knowledge grading or skill progress changes so feedback
    stays current as the student progresses.
    AI summaries are debounced: only regenerated if >5 min since last regen."""
    gr_tbl = dynamodb.Table(T["GRADING_REPORTS"])
    existing = gr_tbl.get_item(Key={"studentId": student_id, "unitId": unit_id}).get("Item")
    if not existing:
        return  # No report to update yet

    # Check if we should regenerate AI summaries (debounce)
    should_regen_summaries = True
    last_updated = existing.get("updatedAt", "")
    if last_updated:
        try:
            last_dt = datetime.fromisoformat(last_updated.replace("Z", "+00:00"))
            now_dt = datetime.now(last_dt.tzinfo) if last_dt.tzinfo else datetime.utcnow()
            elapsed = (now_dt - last_dt).total_seconds()
            if elapsed < SUMMARY_REGEN_COOLDOWN_SECONDS:
                should_regen_summaries = False
        except Exception:
            pass  # If we can't parse, regenerate to be safe

    # Gather fresh data
    objectives = query_all(
        dynamodb.Table(T["OBJECTIVES"]),
        index_name=IDX["UNIT_OBJECTIVES"],
        key_condition=Key("unitId").eq(unit_id),
    )
    all_prog = query_all(
        dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"]),
        key_condition=Key("studentId").eq(student_id),
    )
    obj_id_set = {o.get("id") for o in objectives if o.get("id")}
    progress_map = {p["objectiveId"]: p for p in all_prog if p.get("objectiveId") in obj_id_set}

    all_kq = query_all(
        dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"]),
        key_condition=Key("studentId").eq(student_id),
    )
    unit_kq = [qi for qi in all_kq if qi.get("unitId") == unit_id]

    topics = query_all(
        dynamodb.Table(T["KNOWLEDGE_TOPICS"]),
        index_name=IDX["UNIT_KNOWLEDGE_TOPICS"],
        key_condition=Key("unitId").eq(unit_id),
    )
    topics_map = {t["id"]: t for t in topics if t.get("id")}

    unit = dynamodb.Table(T["UNITS"]).get_item(Key={"id": unit_id}).get("Item") or {}
    course = dynamodb.Table(T["COURSES"]).get_item(Key={"id": unit.get("courseId", "")}).get("Item") or {}
    deadline = unit.get("deadline")

    # Format data for AI summaries (includes skill feedback + capstone context)
    feedback_map = _collect_skill_feedback(objectives)
    objectives_data = _format_objectives_data(objectives, progress_map, deadline, feedback_map)
    knowledge_data = _format_knowledge_data(unit_kq, topics_map)
    capstone_data = _format_capstone_data(objectives, feedback_map)

    # Compute skill stats
    skill_objs = [o for o in objectives if o.get("objectiveType") != "knowledge"]
    skill_total = len(skill_objs)
    skill_completed = 0
    skill_completed_before_deadline = 0
    latest_completion_ts = None
    objective_details = []
    for o in skill_objs:
        p = progress_map.get(o.get("id"), {})
        completed = int(p.get("earnedStars", 0)) >= 3 or p.get("currentStageType") == "challenge"
        ts = p.get("updatedAt") or p.get("createdAt") if completed else None
        detail = {"title": o.get("title", ""), "completed": completed, "completedAt": ts or ""}
        if completed:
            skill_completed += 1
            if ts and (latest_completion_ts is None or ts > latest_completion_ts):
                latest_completion_ts = ts
            if deadline and ts and ts <= deadline:
                skill_completed_before_deadline += 1
                detail["beforeDeadline"] = True
            elif deadline and ts:
                detail["beforeDeadline"] = False
        objective_details.append(detail)

    # Knowledge stats
    by_topic: dict[str, list[dict]] = {}
    for qi in unit_kq:
        tid = qi.get("knowledgeTopicId", "")
        by_topic.setdefault(tid, []).append(qi)
    knowledge_total = len(topics_map)
    knowledge_correct = sum(
        1 for attempts in by_topic.values()
        if any(a.get("status") == "completed_correct" for a in attempts)
    )
    knowledge_attempts = len([qi for qi in unit_kq if qi.get("status", "").startswith("completed_")])

    all_completed = skill_completed == skill_total and skill_total > 0
    completed_before_deadline = None
    if deadline and all_completed and latest_completion_ts:
        completed_before_deadline = latest_completion_ts <= deadline
    on_time_pct = None
    if deadline and skill_total > 0:
        on_time_pct = round(skill_completed_before_deadline / skill_total * 100)

    # Regenerate AI summaries with fresh data (only if cooldown has elapsed)
    teacher_summary = None
    student_summary = None
    if should_regen_summaries:
        from concurrent.futures import ThreadPoolExecutor
        from backend_code.grading_report_pipeline import generate_teacher_summary, generate_student_summary

        summary_kwargs = dict(
            unit_title=unit.get("title", ""),
            course_title=course.get("title", ""),
            objectives_data=objectives_data,
            knowledge_data=knowledge_data,
            capstone_data=capstone_data,
        )
        try:
            with ThreadPoolExecutor(max_workers=2) as executor:
                teacher_future = executor.submit(generate_teacher_summary, **summary_kwargs)
                student_future = executor.submit(generate_student_summary, **summary_kwargs)
            teacher_summary = teacher_future.result()
            student_summary = student_future.result()
        except Exception as e:
            print(f"[update-report-stats] AI summary regen failed, updating stats only: {e}")
            teacher_summary = None
            student_summary = None
    else:
        print(f"[update-report-stats] Skipping AI regen (cooldown), stats-only update for student={student_id} unit={unit_id}")

    # Update cached report with fresh stats AND summaries
    update_expr = (
        "SET skillCompleted = :sc, skillTotal = :st, "
        "skillCompletedBeforeDeadline = :scbd, "
        "knowledgeCorrect = :kc, knowledgeTotal = :kt, "
        "knowledgeAttempts = :ka, "
        "completedBeforeDeadline = :cbd, onTimePct = :otp, "
        "completionDate = :cd, objectiveDetails = :od, "
        "updatedAt = :u"
    )
    attr_values = {
        ":sc": skill_completed,
        ":st": skill_total,
        ":scbd": skill_completed_before_deadline,
        ":kc": knowledge_correct,
        ":kt": knowledge_total,
        ":ka": knowledge_attempts,
        ":cbd": completed_before_deadline,
        ":otp": on_time_pct,
        ":cd": latest_completion_ts or "",
        ":od": objective_details,
        ":u": iso_now(),
    }
    if teacher_summary is not None:
        update_expr += ", teacherSummary = :ts"
        attr_values[":ts"] = teacher_summary
    if student_summary is not None:
        update_expr += ", studentSummary = :ss"
        attr_values[":ss"] = student_summary

    gr_tbl.update_item(
        Key={"studentId": student_id, "unitId": unit_id},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=attr_values,
    )


def handle_get_unit_feedback_for_student(event, unit_id: str):
    """GET /units/{unitId}/feedback?studentId={studentId} — teacher view.
    Returns a list of all teacher feedback messages for this student+unit."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    qs = event.get("queryStringParameters") or {}
    student_id = qs.get("studentId")
    if not student_id:
        return resp(400, {"error": "Missing studentId query parameter"})

    fb_tbl = dynamodb.Table(T["FEEDBACK_ITEMS"])
    items = query_all(
        fb_tbl,
        key_condition=Key("studentId").eq(student_id),
    )
    matches = [
        f for f in items
        if f.get("unitId") == unit_id and f.get("sourceType") == "teacher"
    ]
    # Sort oldest first
    matches.sort(key=lambda f: f.get("createdAt", ""))
    return resp(200, matches)


def handle_create_unit_feedback(event, unit_id: str):
    """POST /units/{unitId}/feedback — teacher creates feedback."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    student_id = body.get("studentId")
    feedback_body = body.get("body")
    if not student_id or not feedback_body:
        return resp(400, {"error": "Missing studentId or body"})

    # Look up unit for courseId and title
    units_tbl = dynamodb.Table(T["UNITS"])
    unit_got = units_tbl.get_item(Key={"id": unit_id})
    unit = unit_got.get("Item")
    if not unit:
        return resp_not_found("Unit")

    # Look up instructor name
    instr_tbl = dynamodb.Table(T["INSTRUCTORS"])
    instr_got = instr_tbl.get_item(Key={"id": instructor_id})
    instr = instr_got.get("Item") or {}
    instructor_name = instr.get("name", "Teacher")

    item = {
        "id": str(uuid.uuid4()),
        "studentId": student_id,
        "courseId": unit.get("courseId", ""),
        "unitId": unit_id,
        "title": unit.get("title", ""),
        "body": feedback_body,
        "sourceType": "teacher",
        "instructorId": instructor_id,
        "instructorName": instructor_name,
        "createdAt": iso_now(),
    }
    fb_tbl = dynamodb.Table(T["FEEDBACK_ITEMS"])
    fb_tbl.put_item(Item=item)
    return resp(201, item)


def handle_update_feedback(event, feedback_id: str):
    """PATCH /feedback/{feedbackId} — teacher updates feedback.
    Body: { "body": string, "studentId": string }
    studentId is required so we can do a direct lookup (PK=studentId, SK=id)
    instead of an expensive table scan.
    """
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    new_body = body.get("body")
    student_id = body.get("studentId")
    if not new_body:
        return resp(400, {"error": "Missing body"})

    fb_tbl = dynamodb.Table(T["FEEDBACK_ITEMS"])

    if student_id:
        # Direct lookup using composite key
        got = fb_tbl.get_item(Key={"studentId": student_id, "id": feedback_id})
        item = got.get("Item")
    else:
        # Fallback scan for backwards compatibility
        from boto3.dynamodb.conditions import Attr
        scan_result = fb_tbl.scan(FilterExpression=Attr("id").eq(feedback_id), Limit=100)
        items = scan_result.get("Items", [])
        item = items[0] if items else None

    if not item:
        return resp_not_found("FeedbackItem")

    fb_tbl.update_item(
        Key={"studentId": item["studentId"], "id": item["id"]},
        UpdateExpression="SET body = :b",
        ExpressionAttributeValues={":b": new_body},
    )
    item["body"] = new_body
    return resp(200, item)


def handle_get_my_grading_report(event, unit_id: str):
    """GET /units/{unitId}/my-grading-report — student view.
    Returns cached report. Report stats are updated live as the student works."""
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})
    if not _check_enrollment_for_unit(student_id, unit_id):
        return resp(403, {"error": "Not enrolled in this course"})

    gr_tbl = dynamodb.Table(T["GRADING_REPORTS"])
    got = gr_tbl.get_item(Key={"studentId": student_id, "unitId": unit_id})
    existing = got.get("Item")
    if existing:
        return resp(200, _format_grading_report_response(existing, is_teacher=False))

    # No report yet — trigger async generation
    async_payload = {
        "_internal": "generate-grading-report",
        "studentId": student_id,
        "unitId": unit_id,
    }
    lambda_client.invoke(
        FunctionName=SELF_FUNCTION_NAME,
        InvocationType="Event",
        Payload=json.dumps(async_payload).encode(),
    )
    return resp(200, {"status": "generating", "unitId": unit_id, "studentId": student_id})


def handle_get_my_feedback(event, unit_id: str):
    """GET /units/{unitId}/my-feedback — student view.
    Returns a list of all teacher feedback messages for this student+unit."""
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})
    if not _check_enrollment_for_unit(student_id, unit_id):
        return resp(403, {"error": "Not enrolled in this course"})

    fb_tbl = dynamodb.Table(T["FEEDBACK_ITEMS"])
    items = query_all(
        fb_tbl,
        key_condition=Key("studentId").eq(student_id),
    )
    matches = [
        f for f in items
        if f.get("unitId") == unit_id and f.get("sourceType") == "teacher"
    ]
    matches.sort(key=lambda f: f.get("createdAt", ""))
    return resp(200, matches)


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
    if not _check_enrollment_for_unit(student_id, unit_id):
        return resp(403, {"error": "Not enrolled in this course"})

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
    # Filter out disabled objectives so students don't see them
    objectives = [o for o in objectives if o.get("enabled") is not False]
    obj_by_id = {o.get("id"): o for o in objectives if o.get("id")}

    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    threads = query_all(
        threads_tbl,
        index_name=IDX["UNIT_THREADS"],
        key_condition=Key("unitId").eq(unit_id),
        scan_forward=True,
    )

    threads = _ensure_threads_for_unit(unit, objectives, threads)
    # Only include threads whose objective is enabled
    threads = [t for t in threads if t.get("objectiveId") in obj_by_id]

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
        obj_kind = obj.get("kind", "skill")
        stage_type = p.get("currentStageType") or _compute_current_stage_type(earned)

        # Capstone only has a challenge stage — override begin/walkthrough
        if obj_kind == "capstone" and stage_type in ("begin", "walkthrough"):
            stage_type = "challenge"

        stages = _load_stages_by_objective(oid) if oid else []
        stage_id = _current_stage_id_from_stages(stages, stage_type)

        # Determine if student has sent any messages (distinguishes auto-advance from real activity).
        # Only needs a DB check for walkthrough_started (earned==1); other states are unambiguous.
        if earned == 0:
            has_student_messages = False
        elif earned >= 2:
            has_student_messages = True
        else:
            # earned == 1 (walkthrough_started) — check if any messages exist for this thread
            msgs_tbl = dynamodb.Table(T["CHAT_MESSAGES"])
            msg_result = msgs_tbl.query(
                KeyConditionExpression=Key("threadId").eq(t.get("id", "")),
                Limit=1,
            )
            has_student_messages = len(msg_result.get("Items", [])) > 0

        twp = dict(t)
        twp["earnedStars"] = earned
        twp["progressState"] = _earned_stars_to_progress_state(earned)
        twp["currentStageType"] = stage_type
        twp["currentStageId"] = stage_id
        twp["order"] = order
        twp["hasStudentMessages"] = has_student_messages
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
    if not _check_enrollment_for_thread(student_id, thread_id):
        return resp(403, {"error": "Not enrolled in this course"})

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
    obj_kind = obj.get("kind", "skill")
    stage_type = p.get("currentStageType") or _compute_current_stage_type(earned)

    # Capstone only has a challenge stage — override begin/walkthrough
    if obj_kind == "capstone" and stage_type in ("begin", "walkthrough"):
        stage_type = "challenge"

    stages = _load_stages_by_objective(oid)
    stage_id = _current_stage_id_from_stages(stages, stage_type)

    if earned == 0:
        has_student_messages = False
    elif earned >= 2:
        has_student_messages = True
    else:
        msgs_tbl = dynamodb.Table(T["CHAT_MESSAGES"])
        msg_result = msgs_tbl.query(
            KeyConditionExpression=Key("threadId").eq(thread_id),
            Limit=1,
        )
        has_student_messages = len(msg_result.get("Items", [])) > 0

    twp = dict(thread)
    twp["earnedStars"] = earned
    twp["progressState"] = _earned_stars_to_progress_state(earned)
    twp["currentStageType"] = stage_type
    twp["currentStageId"] = stage_id
    twp["order"] = order
    twp["hasStudentMessages"] = has_student_messages
    return resp(200, twp)


def handle_list_messages(event, thread_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})
    if not _check_enrollment_for_thread(student_id, thread_id):
        return resp(403, {"error": "Not enrolled in this course"})

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


def _get_thread_context(thread_id: str, student_id: str):
    """Return (thread, course, objective, stage) dicts needed for pipeline calls, or None on error.

    Uses ThreadPoolExecutor to parallelize independent DB lookups after fetching the thread.
    """
    from concurrent.futures import ThreadPoolExecutor

    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    thread = threads_tbl.get_item(Key={"id": thread_id}).get("Item")
    if not thread:
        return None

    objective_id = thread.get("objectiveId")
    course_id = thread.get("courseId")
    if not objective_id or not course_id:
        return None

    # Fetch objective, course, and student in parallel
    def _get_objective():
        return dynamodb.Table(T["OBJECTIVES"]).get_item(Key={"id": objective_id}).get("Item")

    def _get_course():
        return dynamodb.Table(T["COURSES"]).get_item(Key={"id": course_id}).get("Item")

    def _get_student():
        return dynamodb.Table(T["STUDENTS"]).get_item(Key={"id": student_id}).get("Item") or {}

    with ThreadPoolExecutor(max_workers=3) as executor:
        obj_future = executor.submit(_get_objective)
        course_future = executor.submit(_get_course)
        student_future = executor.submit(_get_student)

    objective = obj_future.result()
    course = course_future.result()
    student = student_future.result()

    if not objective or not course:
        return None

    return {
        "thread": thread,
        "course": course,
        "objective": objective,
        "student": student,
    }


def _load_conversation_history(thread_id: str, stage_id: str | None) -> list[dict]:
    """Load prior messages for this thread/stage as [{"role": ..., "content": ...}]."""
    msgs_tbl = dynamodb.Table(T["CHAT_MESSAGES"])
    items = query_all(
        msgs_tbl,
        key_condition=Key("threadId").eq(thread_id),
        scan_forward=True,
    )
    if stage_id:
        items = [m for m in items if m.get("stageId") == stage_id]
    return [{"role": m["role"], "content": m["content"]} for m in items]


def _advance_progress_for_student(student_id: str, objective_id: str, required_stars: int) -> None:
    """Advance progress by 1 star only if currently at required_stars (idempotent guard)."""
    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    item = prog_tbl.get_item(Key={"studentId": student_id, "objectiveId": objective_id}).get("Item")
    now = iso_now()
    if not item:
        if required_stars == 0:
            prog_tbl.put_item(Item={
                "studentId": student_id,
                "objectiveId": objective_id,
                "earnedStars": 1,
                "currentStageType": "walkthrough",
                "updatedAt": now,
            })
        return
    earned = int(item.get("earnedStars") or 0)
    if earned != required_stars:
        return  # Already advanced or not at expected state
    earned = min(3, earned + 1)
    item["earnedStars"] = earned
    item["currentStageType"] = _compute_current_stage_type(earned)
    item["updatedAt"] = now
    prog_tbl.put_item(Item=item)


def _complete_challenge_for_student(student_id: str, objective_id: str) -> None:
    """Unconditionally advance progress to challenge_complete (earnedStars=3).
    Handles students who went directly to challenge without doing walkthrough first
    (earnedStars=1) as well as the normal path (earnedStars=2). Idempotent if already complete.
    """
    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    item = prog_tbl.get_item(Key={"studentId": student_id, "objectiveId": objective_id}).get("Item")
    now = iso_now()
    if not item:
        item = {
            "studentId": student_id,
            "objectiveId": objective_id,
        }
    if int(item.get("earnedStars") or 0) >= 3:
        return  # Already complete
    item["earnedStars"] = 3
    item["currentStageType"] = "challenge"
    item["completedAt"] = now
    item["updatedAt"] = now
    prog_tbl.put_item(Item=item)


def _call_tutor_pipeline(
    stage_type: str,
    objective: dict,
    course: dict,
    student: dict,
    conversation: list[dict],
    student_message: str,
    stage_prompt: str,
) -> dict:
    """Call the appropriate AI pipeline.
    Returns {"text": str | None, "is_finished": bool, "grading_category": str | None}.
    """
    subject = course.get("title", "Unknown Subject")
    grade = student.get("yearLabel", "Unknown Grade")
    objective_kind = objective.get("kind", "knowledge")
    objective_title = objective.get("title", "")
    question = stage_prompt or objective_title

    try:
        if stage_type == "walkthrough":
            from scaffolded_question_pipeline import scaffolded_question_step
            result = scaffolded_question_step(
                subject=subject,
                grade=grade,
                question=question,
                conversation=conversation,
            )
            if result:
                return {
                    "text": result.get("Tutor_Response"),
                    "is_finished": bool(result.get("Is_Finished")),
                    "grading_category": None,
                }

        elif stage_type == "challenge":
            if objective_kind == "capstone":
                # Capstone: teach-back conversation pipeline
                from backend_code.capstone_pipeline import capstone_teach_step, identify_weakest_skill

                # Load or identify the weakest skill for this capstone
                thread_obj = objective  # objective dict passed in
                unit_id = thread_obj.get("unitId", "")
                student_id = student.get("id", "")

                # Check if we already identified the skill (stored in thread metadata)
                thread_tbl = dynamodb.Table(T["CHAT_THREADS"])
                thread_record = thread_tbl.get_item(Key={"id": f"thread-{objective.get('id', '')}"}).get("Item", {})
                capstone_meta = thread_record.get("capstoneSkillContext")

                if not capstone_meta:
                    # First message — identify weakest skill and store it
                    capstone_meta = identify_weakest_skill(
                        dynamodb, T, IDX, unit_id, student_id
                    )
                    # Store skill context and update thread title to show the chosen topic
                    skill_title = capstone_meta.get("title", "Capstone")
                    thread_key = thread_record.get("id", f"thread-{objective.get('id', '')}")
                    thread_tbl.update_item(
                        Key={"id": thread_key},
                        UpdateExpression="SET capstoneSkillContext = :ctx, title = :t",
                        ExpressionAttributeValues={
                            ":ctx": capstone_meta,
                            ":t": f"Teach: {skill_title}",
                        },
                    )

                result = capstone_teach_step(
                    subject=subject,
                    grade=grade,
                    skill_description=capstone_meta.get("description", objective_title),
                    grading_feedback=capstone_meta.get("grading_feedback", ""),
                    conversation=conversation,
                )
                if result:
                    return {
                        "text": result.get("Tutor_Response"),
                        "is_finished": bool(result.get("Is_Finished")),
                        "grading_category": None,
                    }

            elif objective_kind == "knowledge":
                from backend_code.info_question_pipeline import grade_info
                _is_correct, feedback = grade_info(
                    grade=grade,
                    subject=subject,
                    information=objective_title,
                    question=question,
                    answer=student_message,
                )
                return {"text": feedback, "is_finished": False, "grading_category": None}
            else:
                # skill
                from challenge_question_pipeline import grade_skill
                category, feedback = grade_skill(
                    grade=grade,
                    subject=subject,
                    skill=objective_title,
                    question=question,
                    answer=student_message,
                )
                return {
                    "text": feedback,
                    "is_finished": False,
                    "grading_category": str(category),
                }

    except Exception as e:
        print(f"[pipeline error] stage={stage_type} kind={objective_kind}: {e}")

    return {"text": None, "is_finished": False, "grading_category": None}


def handle_new_attempt(event, thread_id: str):
    """Create a new ItemStage of the same type for a new attempt on this thread's objective."""
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})
    if not _check_enrollment_for_thread(student_id, thread_id):
        return resp(403, {"error": "Not enrolled in this course"})

    err, body = require_json(event)
    if err:
        return err
    stage_type = (body.get("stageType") if isinstance(body, dict) else None) or "challenge"

    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    thread = threads_tbl.get_item(Key={"id": thread_id}).get("Item")
    if not thread:
        return resp(404, {"error": "Thread not found"})

    objective_id = thread.get("objectiveId")
    if not objective_id:
        return resp(500, {"error": "Thread missing objectiveId"})

    stages = _load_stages_by_objective(objective_id)
    template = next((s for s in stages if s.get("stageType") == stage_type), None)
    if not template:
        return resp(404, {"error": f"No {stage_type} stage found for this objective"})

    max_order = max((int(s.get("order") or 0) for s in stages), default=0)
    new_stage = {
        "id": str(uuid.uuid4()),
        "itemId": objective_id,
        "stageType": stage_type,
        "order": max_order + 1,
        "prompt": template.get("prompt", ""),
        "createdAt": iso_now(),
    }
    if template.get("suggestedQuestions"):
        new_stage["suggestedQuestions"] = template["suggestedQuestions"]

    dynamodb.Table(T["ITEM_STAGES"]).put_item(Item=new_stage)
    return resp(200, new_stage)


def handle_send_message(event, thread_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})
    if not _check_enrollment_for_thread(student_id, thread_id):
        return resp(403, {"error": "Not enrolled in this course"})

    err, body = require_json(event)
    if err:
        return err

    if not isinstance(body, dict):
        return resp(400, {"error": "Invalid body"})

    content = body.get("content")
    stage_id = body.get("stageId")
    stage_type = body.get("stageType")  # client sends this to avoid extra DB lookup
    is_clarify = body.get("clarify") is True
    capstone_init = body.get("capstoneInit") is True  # Allow empty content for capstone initialization
    walkthrough_init = body.get("walkthroughInit") is True  # Allow empty content for walkthrough initialization
    if not capstone_init and not walkthrough_init and (not isinstance(content, str) or not content.strip()):
        return resp(400, {"error": "Missing content"})
    if capstone_init or walkthrough_init:
        content = content or ""

    from concurrent.futures import ThreadPoolExecutor, Future

    now = iso_now()
    student_msg = {
        "id": str(uuid.uuid4()),
        "threadId": thread_id,
        "stageId": stage_id,
        "role": "student",
        "content": content,
        "createdAt": now,
    }

    msgs_tbl = dynamodb.Table(T["CHAT_MESSAGES"])

    # Parallelize: save student message + update thread + fetch context + stage + conversation
    def _save_msg():
        if not capstone_init and not walkthrough_init:
            msgs_tbl.put_item(Item=student_msg)

    def _update_thread():
        try:
            dynamodb.Table(T["CHAT_THREADS"]).update_item(
                Key={"id": thread_id},
                UpdateExpression="SET lastMessageAt = :t",
                ExpressionAttributeValues={":t": now},
            )
        except Exception:
            pass

    def _get_stage_prompt():
        if stage_id:
            stage_item = dynamodb.Table(T["ITEM_STAGES"]).get_item(Key={"id": stage_id}).get("Item")
            if stage_item:
                return stage_item.get("prompt", "")
        return ""

    need_pipeline = stage_type in ("walkthrough", "challenge")
    ctx_future: Future | None = None
    stage_future: Future | None = None
    conv_future: Future | None = None

    with ThreadPoolExecutor(max_workers=5) as executor:
        executor.submit(_save_msg)
        executor.submit(_update_thread)
        if need_pipeline:
            ctx_future = executor.submit(_get_thread_context, thread_id, student_id)
            stage_future = executor.submit(_get_stage_prompt)
            conv_future = executor.submit(_load_conversation_history, thread_id, stage_id)

    # Generate tutor reply for walkthrough and challenge stages
    tutor_msg = None
    if need_pipeline:
        ctx = ctx_future.result() if ctx_future else None
        if ctx:
            stage_prompt = stage_future.result() if stage_future else ""

            if is_clarify:
                # Clarifying question — answer the student's question without grading
                try:
                    from backend_code.gen_clarifying_questions_pipeline import gen_clarifying_question_answer
                    objective_title = ctx["objective"].get("title", "")
                    answer = gen_clarifying_question_answer(
                        subject=ctx["course"].get("title", "Unknown Subject"),
                        grade=ctx["student"].get("yearLabel", "Unknown Grade"),
                        skill_description=objective_title,
                        question=stage_prompt or objective_title,
                        clarifying_question=content,
                    )
                    tutor_now = iso_now()
                    tutor_msg = {
                        "id": str(uuid.uuid4()),
                        "threadId": thread_id,
                        "stageId": stage_id,
                        "role": "tutor",
                        "content": answer,
                        "createdAt": tutor_now,
                    }
                    msgs_tbl.put_item(Item=tutor_msg)
                except Exception as e:
                    print(f"[clarify error] stage_type={stage_type}: {e}")
            else:
                conversation = conv_future.result() if conv_future else _load_conversation_history(thread_id, stage_id)
                pipeline_result = _call_tutor_pipeline(
                    stage_type=stage_type,
                    objective=ctx["objective"],
                    course=ctx["course"],
                    student=ctx["student"],
                    conversation=conversation,
                    student_message=content,
                    stage_prompt=stage_prompt,
                )
                tutor_text = pipeline_result.get("text")
                is_finished = pipeline_result.get("is_finished", False)
                grading_category = pipeline_result.get("grading_category")

                if tutor_text:
                    metadata: dict = {}
                    if grading_category:
                        metadata["gradingCategory"] = grading_category
                        if grading_category in ("correct", "slight clarification"):
                            metadata["isCompletionMessage"] = True
                    elif is_finished:
                        metadata["isCompletionMessage"] = True

                    tutor_now = iso_now()
                    tutor_msg = {
                        "id": str(uuid.uuid4()),
                        "threadId": thread_id,
                        "stageId": stage_id,
                        "role": "tutor",
                        "content": tutor_text,
                        "createdAt": tutor_now,
                    }
                    if metadata:
                        tutor_msg["metadata"] = metadata
                    msgs_tbl.put_item(Item=tutor_msg)

                    # Auto-advance objective progress
                    objective_id = ctx["objective"].get("id")
                    objective_kind = ctx["objective"].get("kind", "")
                    if objective_id:
                        if is_finished and stage_type == "walkthrough":
                            _advance_progress_for_student(student_id, objective_id, required_stars=1)
                            _trigger_report_stats_update(student_id, ctx["thread"].get("unitId", ""))
                        elif grading_category in ("correct", "slight clarification") and stage_type == "challenge":
                            _complete_challenge_for_student(student_id, objective_id)
                            _trigger_report_stats_update(student_id, ctx["thread"].get("unitId", ""))
                        elif is_finished and objective_kind == "capstone" and stage_type == "challenge":
                            _complete_challenge_for_student(student_id, objective_id)
                            _trigger_report_stats_update(student_id, ctx["thread"].get("unitId", ""))

    return resp(200, {"studentMessage": None if (capstone_init or walkthrough_init) else student_msg, "tutorMessage": tutor_msg})


# ---- Instructor routes ----

def _name_from_claims(event) -> str:
    """Build a display name from JWT given_name / family_name claims."""
    c = claims(event)
    given = (c.get("given_name") or "").strip()
    family = (c.get("family_name") or "").strip()
    full = f"{given} {family}".strip()
    return full or "Unknown"


def handle_current_instructor(event):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        sub = authed_sub(event)
        detail = "not in instructors group" if sub else "no valid JWT"
        _audit_log("auth_failure", sub=sub, method="GET", path="/current-instructor", status=401, detail=detail)
        return resp(401, {"error": "Unauthorized"})

    instructors_tbl = dynamodb.Table(T["INSTRUCTORS"])
    got = instructors_tbl.get_item(Key={"id": instructor_id})
    item = got.get("Item")

    if not item:
        _audit_log("instructor_first_login", sub=instructor_id, method="GET", path="/current-instructor", status=200)

    if item:
        item["avatarUrl"] = _presign_avatar_url(item.get("avatarUrl"))
        return resp(200, item)

    # Auto-create instructor record on first access
    now = iso_now()
    item = {
        "id": instructor_id,
        "name": _name_from_claims(event),
        "avatarUrl": None,
        "createdAt": now,
        "updatedAt": now,
    }
    instructors_tbl.put_item(Item=item, ConditionExpression="attribute_not_exists(id)")
    return resp(200, item)


def handle_list_instructor_courses(event):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    courses_tbl = dynamodb.Table(T["COURSES"])
    items = query_all(
        courses_tbl,
        index_name=IDX["INSTRUCTOR_COURSES"],
        key_condition=Key("instructorId").eq(instructor_id),
        scan_forward=True,
    )

    # Filter out soft-deleted courses
    items = [i for i in items if not i.get("deletedAt")]

    # Attach studentCount to each course by counting enrollments
    enrollments_tbl = dynamodb.Table(T["ENROLLMENTS"])
    for item in items:
        cid = item.get("id")
        if cid:
            enroll_items = query_all(
                enrollments_tbl,
                index_name=IDX["COURSE_ENROLLMENTS"],
                key_condition=Key("courseId").eq(cid),
            )
            item["studentCount"] = len(enroll_items)
        else:
            item["studentCount"] = 0

    return resp(200, [_normalize_course(i) for i in items])


def handle_create_course(event):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    title = (body.get("title") or "").strip() if isinstance(body, dict) else ""
    if not title:
        return resp(400, {"error": "Missing title"})

    icon = (body.get("icon") or "general").strip() if isinstance(body, dict) else "general"
    subject = (body.get("subject") or "").strip() if isinstance(body, dict) else ""
    grade_level = (body.get("gradeLevel") or "").strip() if isinstance(body, dict) else ""
    student_ids = body.get("studentIds") if isinstance(body, dict) else None
    if not isinstance(student_ids, list):
        student_ids = []

    now = iso_now()
    course_id = str(uuid.uuid4())
    item = {
        "id": course_id,
        "title": title,
        "icon": icon,
        "instructorId": instructor_id,
        "createdAt": now,
        "updatedAt": now,
    }
    if subject:
        item["subject"] = subject
    if grade_level:
        item["gradeLevel"] = grade_level
    dynamodb.Table(T["COURSES"]).put_item(Item=item)

    # Create enrollment records for the initial roster
    if student_ids:
        enrollments_tbl = dynamodb.Table(T["ENROLLMENTS"])
        with enrollments_tbl.batch_writer() as batch:
            for sid in student_ids:
                batch.put_item(Item={
                    "studentId": sid,
                    "courseId": course_id,
                    "enrolledAt": now,
                })

    # Return the TeacherCourse shape expected by the contract
    return resp(201, {
        "id": course_id,
        "title": title,
        "studentCount": len(student_ids),
        "icon": icon,
    })


def handle_get_course_roster(event, course_id: str):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    enrollments_tbl = dynamodb.Table(T["ENROLLMENTS"])
    items = query_all(
        enrollments_tbl,
        index_name=IDX["COURSE_ENROLLMENTS"],
        key_condition=Key("courseId").eq(course_id),
        scan_forward=True,
    )
    student_ids = [it["studentId"] for it in items if it.get("studentId")]
    return resp(200, {"courseId": course_id, "studentIds": student_ids})


def handle_update_course_roster(event, course_id: str):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    student_ids = body.get("studentIds") if isinstance(body, dict) else None
    if not isinstance(student_ids, list):
        return resp(400, {"error": "Missing studentIds array"})

    enrollments_tbl = dynamodb.Table(T["ENROLLMENTS"])

    # Remove existing enrollments for this course
    existing = query_all(
        enrollments_tbl,
        index_name=IDX["COURSE_ENROLLMENTS"],
        key_condition=Key("courseId").eq(course_id),
        scan_forward=True,
    )
    with enrollments_tbl.batch_writer() as batch:
        for item in existing:
            batch.delete_item(Key={"studentId": item["studentId"], "courseId": course_id})

    # Write new enrollments
    now = iso_now()
    with enrollments_tbl.batch_writer() as batch:
        for sid in student_ids:
            batch.put_item(Item={"studentId": sid, "courseId": course_id, "enrolledAt": now})

    return resp(200, {"courseId": course_id, "studentIds": student_ids})


def handle_list_students(event):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    students_tbl = dynamodb.Table(T["STUDENTS"])
    result = students_tbl.scan()
    items = result.get("Items", [])
    # Handle pagination for scan
    while result.get("LastEvaluatedKey"):
        result = students_tbl.scan(ExclusiveStartKey=result["LastEvaluatedKey"])
        items.extend(result.get("Items", []))

    # Filter out users who are also instructors
    instructors_tbl = dynamodb.Table(T["INSTRUCTORS"])
    instr_result = instructors_tbl.scan(ProjectionExpression="id")
    instructor_ids = {i["id"] for i in instr_result.get("Items", [])}
    while instr_result.get("LastEvaluatedKey"):
        instr_result = instructors_tbl.scan(ProjectionExpression="id", ExclusiveStartKey=instr_result["LastEvaluatedKey"])
        instructor_ids.update(i["id"] for i in instr_result.get("Items", []))

    items = [s for s in items if s.get("id") not in instructor_ids]
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
        return resp(400, {"error": "Missing name"})

    now = iso_now()
    student_id = str(uuid.uuid4())
    item = {
        "id": student_id,
        "name": name,
        "yearLabel": body.get("yearLabel") or "Year 1",
        "avatarUrl": None,
        "createdAt": now,
        "updatedAt": now,
    }
    dynamodb.Table(T["STUDENTS"]).put_item(Item=item)
    return resp(201, item)


def handle_update_unit_title(event, unit_id: str):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    title = (body.get("title") or "").strip() if isinstance(body, dict) else ""
    if not title:
        return resp(400, {"error": "Missing title"})

    units_tbl = dynamodb.Table(T["UNITS"])
    got = units_tbl.get_item(Key={"id": unit_id})
    if not got.get("Item"):
        return resp_not_found("Unit")

    now = iso_now()
    units_tbl.update_item(
        Key={"id": unit_id},
        UpdateExpression="SET title = :t, updatedAt = :u",
        ExpressionAttributeValues={":t": title, ":u": now},
    )
    updated = units_tbl.get_item(Key={"id": unit_id}).get("Item")
    return resp(200, updated)


def handle_update_unit_deadline(event, unit_id: str):
    """PATCH /units/{unitId}/deadline — set or clear a unit deadline."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    deadline = body.get("deadline") if isinstance(body, dict) else None

    units_tbl = dynamodb.Table(T["UNITS"])
    got = units_tbl.get_item(Key={"id": unit_id})
    if not got.get("Item"):
        return resp_not_found("Unit")

    now = iso_now()
    if deadline:
        units_tbl.update_item(
            Key={"id": unit_id},
            UpdateExpression="SET deadline = :d, updatedAt = :u",
            ExpressionAttributeValues={":d": deadline, ":u": now},
        )
    else:
        units_tbl.update_item(
            Key={"id": unit_id},
            UpdateExpression="SET updatedAt = :u REMOVE deadline",
            ExpressionAttributeValues={":u": now},
        )
    updated = units_tbl.get_item(Key={"id": unit_id}).get("Item")
    return resp(200, updated)


def handle_update_course_title(event, course_id: str):
    """PATCH /courses/{courseId}/title — update course title."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    title = (body.get("title") or "").strip() if isinstance(body, dict) else ""
    if not title:
        return resp(400, {"error": "Missing title"})

    courses_tbl = dynamodb.Table(T["COURSES"])
    got = courses_tbl.get_item(Key={"id": course_id})
    if not got.get("Item"):
        return resp_not_found("Course")

    now = iso_now()
    courses_tbl.update_item(
        Key={"id": course_id},
        UpdateExpression="SET title = :t, updatedAt = :u",
        ExpressionAttributeValues={":t": title, ":u": now},
    )
    updated = courses_tbl.get_item(Key={"id": course_id}).get("Item")
    return resp(200, _normalize_course(updated))


def handle_soft_delete_unit(event, unit_id: str):
    """DELETE /units/{unitId} — soft delete (sets deletedAt timestamp)."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    units_tbl = dynamodb.Table(T["UNITS"])
    got = units_tbl.get_item(Key={"id": unit_id})
    if not got.get("Item"):
        return resp_not_found("Unit")

    now = iso_now()
    units_tbl.update_item(
        Key={"id": unit_id},
        UpdateExpression="SET deletedAt = :d, updatedAt = :u",
        ExpressionAttributeValues={":d": now, ":u": now},
    )
    return resp(200, {"unitId": unit_id, "deletedAt": now})


def handle_soft_delete_course(event, course_id: str):
    """DELETE /courses/{courseId} — soft delete (sets deletedAt timestamp)."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    courses_tbl = dynamodb.Table(T["COURSES"])
    got = courses_tbl.get_item(Key={"id": course_id})
    if not got.get("Item"):
        return resp_not_found("Course")

    now = iso_now()
    courses_tbl.update_item(
        Key={"id": course_id},
        UpdateExpression="SET deletedAt = :d, updatedAt = :u",
        ExpressionAttributeValues={":d": now, ":u": now},
    )
    return resp(200, {"courseId": course_id, "deletedAt": now})


def handle_restore_unit(event, unit_id: str):
    """PATCH /units/{unitId}/restore — restore a soft-deleted unit."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    units_tbl = dynamodb.Table(T["UNITS"])
    got = units_tbl.get_item(Key={"id": unit_id})
    if not got.get("Item"):
        return resp_not_found("Unit")

    now = iso_now()
    units_tbl.update_item(
        Key={"id": unit_id},
        UpdateExpression="REMOVE deletedAt SET updatedAt = :u",
        ExpressionAttributeValues={":u": now},
    )
    updated = units_tbl.get_item(Key={"id": unit_id}).get("Item")
    return resp(200, updated)


def handle_restore_course(event, course_id: str):
    """PATCH /courses/{courseId}/restore — restore a soft-deleted course."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    courses_tbl = dynamodb.Table(T["COURSES"])
    got = courses_tbl.get_item(Key={"id": course_id})
    if not got.get("Item"):
        return resp_not_found("Course")

    now = iso_now()
    courses_tbl.update_item(
        Key={"id": course_id},
        UpdateExpression="REMOVE deletedAt SET updatedAt = :u",
        ExpressionAttributeValues={":u": now},
    )
    updated = courses_tbl.get_item(Key={"id": course_id}).get("Item")
    return resp(200, _normalize_course(updated))


def _hard_delete_unit_records(unit_id: str):
    """Delete all child records for a unit (objectives, questions, stages, threads, messages, progress, knowledge)."""
    # Objectives + their children
    obj_items = query_all(
        dynamodb.Table(T["OBJECTIVES"]),
        index_name=IDX["UNIT_OBJECTIVES"],
        key_condition=Key("unitId").eq(unit_id),
    )
    for obj in obj_items:
        oid = obj["id"]
        # Questions
        for q in query_all(dynamodb.Table(T["QUESTIONS"]), index_name=IDX["OBJECTIVE_QUESTIONS"], key_condition=Key("objectiveId").eq(oid)):
            dynamodb.Table(T["QUESTIONS"]).delete_item(Key={"id": q["id"]})
        # Item stages
        for s in query_all(dynamodb.Table(T["ITEM_STAGES"]), index_name=IDX["ITEM_STAGES_BY_ITEM"], key_condition=Key("itemId").eq(oid)):
            dynamodb.Table(T["ITEM_STAGES"]).delete_item(Key={"id": s["id"]})
        # Objective itself
        dynamodb.Table(T["OBJECTIVES"]).delete_item(Key={"id": oid})

    # Chat threads + messages
    threads = query_all(
        dynamodb.Table(T["CHAT_THREADS"]),
        index_name=IDX["UNIT_THREADS"],
        key_condition=Key("unitId").eq(unit_id),
    )
    for t in threads:
        tid = t["id"]
        # Messages for this thread
        msgs = query_all(dynamodb.Table(T["CHAT_MESSAGES"]), key_condition=Key("threadId").eq(tid))
        for m in msgs:
            dynamodb.Table(T["CHAT_MESSAGES"]).delete_item(Key={"threadId": tid, "id": m["id"]})
        dynamodb.Table(T["CHAT_THREADS"]).delete_item(Key={"id": tid})

    # Knowledge topics
    topics = query_all(
        dynamodb.Table(T["KNOWLEDGE_TOPICS"]),
        index_name=IDX["UNIT_KNOWLEDGE_TOPICS"],
        key_condition=Key("unitId").eq(unit_id),
    )
    for topic in topics:
        dynamodb.Table(T["KNOWLEDGE_TOPICS"]).delete_item(Key={"id": topic["id"]})

    # Knowledge queue items (scan and filter — no unit-level index with studentId PK)
    kqi_tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    result = kqi_tbl.scan(FilterExpression=Key("unitId").eq(unit_id))
    for item in result.get("Items", []):
        kqi_tbl.delete_item(Key={"studentId": item["studentId"], "id": item["id"]})
    while result.get("LastEvaluatedKey"):
        result = kqi_tbl.scan(FilterExpression=Key("unitId").eq(unit_id), ExclusiveStartKey=result["LastEvaluatedKey"])
        for item in result.get("Items", []):
            kqi_tbl.delete_item(Key={"studentId": item["studentId"], "id": item["id"]})

    # Student objective progress (scan and filter by objective IDs)
    if obj_items:
        prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
        obj_id_set = {o["id"] for o in obj_items}
        result = prog_tbl.scan()
        for item in result.get("Items", []):
            if item.get("objectiveId") in obj_id_set:
                prog_tbl.delete_item(Key={"studentId": item["studentId"], "objectiveId": item["objectiveId"]})
        while result.get("LastEvaluatedKey"):
            result = prog_tbl.scan(ExclusiveStartKey=result["LastEvaluatedKey"])
            for item in result.get("Items", []):
                if item.get("objectiveId") in obj_id_set:
                    prog_tbl.delete_item(Key={"studentId": item["studentId"], "objectiveId": item["objectiveId"]})


def handle_hard_delete_unit(event, unit_id: str):
    """DELETE /units/{unitId}/permanent — permanently delete unit and all child records."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    units_tbl = dynamodb.Table(T["UNITS"])
    got = units_tbl.get_item(Key={"id": unit_id})
    if not got.get("Item"):
        return resp_not_found("Unit")

    _hard_delete_unit_records(unit_id)
    units_tbl.delete_item(Key={"id": unit_id})

    # Clean up S3 uploads
    try:
        objs = s3.list_objects_v2(Bucket=UPLOAD_BUCKET, Prefix=f"uploads/{unit_id}/")
        for obj in objs.get("Contents", []):
            s3.delete_object(Bucket=UPLOAD_BUCKET, Key=obj["Key"])
    except Exception:
        pass  # S3 cleanup is best-effort

    return resp(200, {"unitId": unit_id, "deleted": True})


def handle_hard_delete_course(event, course_id: str):
    """DELETE /courses/{courseId}/permanent — permanently delete course, its units, and enrollments."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    courses_tbl = dynamodb.Table(T["COURSES"])
    got = courses_tbl.get_item(Key={"id": course_id})
    if not got.get("Item"):
        return resp_not_found("Course")

    # Delete all units in this course
    unit_items = query_all(
        dynamodb.Table(T["UNITS"]),
        index_name=IDX["COURSE_UNITS"],
        key_condition=Key("courseId").eq(course_id),
    )
    for u in unit_items:
        _hard_delete_unit_records(u["id"])
        dynamodb.Table(T["UNITS"]).delete_item(Key={"id": u["id"]})

    # Delete enrollments
    enroll_items = query_all(
        dynamodb.Table(T["ENROLLMENTS"]),
        index_name=IDX["COURSE_ENROLLMENTS"],
        key_condition=Key("courseId").eq(course_id),
    )
    for e in enroll_items:
        dynamodb.Table(T["ENROLLMENTS"]).delete_item(Key={"studentId": e["studentId"], "courseId": e["courseId"]})

    # Delete course
    courses_tbl.delete_item(Key={"id": course_id})
    return resp(200, {"courseId": course_id, "deleted": True})


def handle_update_objective_enabled(event, objective_id: str):
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    if not isinstance(body, dict) or "enabled" not in body:
        return resp(400, {"error": "Missing enabled field"})

    enabled = bool(body["enabled"])

    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    got = objectives_tbl.get_item(Key={"id": objective_id})
    if not got.get("Item"):
        return resp_not_found("Objective")

    now = iso_now()
    objectives_tbl.update_item(
        Key={"id": objective_id},
        UpdateExpression="SET enabled = :e, updatedAt = :u",
        ExpressionAttributeValues={":e": enabled, ":u": now},
    )
    updated = objectives_tbl.get_item(Key={"id": objective_id}).get("Item")
    return resp(200, updated)


# ---- Knowledge Topics (teacher-visible) ----

def handle_list_knowledge_topics(unit_id: str):
    """GET /units/{unitId}/knowledge-topics → KnowledgeTopic[] sorted by order asc."""
    tbl = dynamodb.Table(T["KNOWLEDGE_TOPICS"])
    items = query_all(
        tbl,
        index_name=IDX["UNIT_KNOWLEDGE_TOPICS"],
        key_condition=Key("unitId").eq(unit_id),
    )
    return resp(200, items)


def handle_update_knowledge_topic_enabled(event, topic_id: str):
    """PATCH /knowledge-topics/{topicId}/enabled → updated KnowledgeTopic."""
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err
    enabled = body.get("enabled")
    if not isinstance(enabled, bool):
        return resp(400, {"error": "Missing or invalid 'enabled' boolean"})

    tbl = dynamodb.Table(T["KNOWLEDGE_TOPICS"])
    existing = tbl.get_item(Key={"id": topic_id}).get("Item")
    if not existing:
        return resp_not_found("KnowledgeTopic")

    tbl.update_item(
        Key={"id": topic_id},
        UpdateExpression="SET enabled = :e",
        ExpressionAttributeValues={":e": enabled},
    )
    existing["enabled"] = enabled
    return resp(200, existing)


# ---- Knowledge Queue helpers ----

def _get_unit_context(unit_id: str, student_id: str) -> tuple:
    """Return (subject, grade) for a unit + student.
    Parallelizes the student lookup with the unit→course chain."""
    from concurrent.futures import ThreadPoolExecutor

    def _get_student_grade():
        student = dynamodb.Table(T["STUDENTS"]).get_item(Key={"id": student_id}).get("Item") or {}
        return student.get("yearLabel", "Unknown Grade")

    # Start student lookup in parallel with unit lookup
    with ThreadPoolExecutor(max_workers=2) as executor:
        grade_future = executor.submit(_get_student_grade)

        unit = dynamodb.Table(T["UNITS"]).get_item(Key={"id": unit_id}).get("Item")
        course_id = unit.get("courseId", "") if unit else ""
        subject = "Unknown Subject"
        if course_id:
            course = dynamodb.Table(T["COURSES"]).get_item(Key={"id": course_id}).get("Item")
            subject = course.get("title", "Unknown Subject") if course else "Unknown Subject"

    grade = grade_future.result()
    return subject, grade


# ---- Knowledge Queue (student-facing) ----

def _activate_knowledge_item(tbl, student_id: str, unit_id: str, item: dict):
    """Activate a pending knowledge queue item and kick off async clarifying question gen."""
    tbl.update_item(
        Key={"studentId": student_id, "id": item["id"]},
        UpdateExpression="SET #s = :s",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "active"},
    )
    # Generate clarifying questions in the background
    if not item.get("suggestedQuestions") and item.get("questionPrompt"):
        async_payload = {
            "_internal": "backfill-clarifying-questions",
            "studentId": student_id,
            "unitId": unit_id,
            "items": [{"id": item["id"], "questionPrompt": item["questionPrompt"]}],
        }
        lambda_client.invoke(
            FunctionName=SELF_FUNCTION_NAME,
            InvocationType="Event",
            Payload=json.dumps(async_payload).encode(),
        )


def _init_knowledge_queue(student_id: str, unit_id: str) -> list[dict]:
    """Auto-create queue items for a student on first access to a unit's queue.
    One item per KnowledgeTopic, first is 'active', rest are 'pending'.
    Returns the created items.
    """
    topics_tbl = dynamodb.Table(T["KNOWLEDGE_TOPICS"])
    topics = query_all(
        topics_tbl,
        index_name=IDX["UNIT_KNOWLEDGE_TOPICS"],
        key_condition=Key("unitId").eq(unit_id),
    )
    # Filter out disabled knowledge topics
    topics = [t for t in topics if t.get("enabled") is not False]
    if not topics:
        return []

    # Look up the question for each topic's objective
    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    questions_tbl = dynamodb.Table(T["QUESTIONS"])

    queue_tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    now = iso_now()
    created: list[dict] = []

    for idx, topic in enumerate(topics):
        topic_id = topic["id"]

        # Find the matching objective to get the question text
        objective_id = topic.get("objectiveId")
        question_text = ""
        if objective_id:
            q_items = query_all(
                questions_tbl,
                index_name=IDX["OBJECTIVE_QUESTIONS"],
                key_condition=Key("objectiveId").eq(objective_id),
            )
            if q_items:
                question_text = q_items[0].get("text", "")

        # Fallback: use topic description if question text is empty
        if not question_text:
            question_text = topic.get("knowledgeTopic", "") or topic.get("description", "")

        item_id = str(uuid.uuid4())
        item = {
            "studentId": student_id,
            "id": item_id,
            "unitId": unit_id,
            "knowledgeTopicId": topic_id,
            "labelIndex": idx + 1,
            "order": idx,
            "status": "active" if idx == 0 else "pending",
            "questionPrompt": question_text,
            "createdAt": now,
        }
        queue_tbl.put_item(Item=item)
        created.append(item)

    return created


def handle_list_knowledge_queue(event, unit_id: str):
    """GET /units/{unitId}/knowledge-queue → KnowledgeQueueItem[]
    Returns only visible items (status ≠ 'pending'), sorted by order asc.
    Auto-initializes queue on first access.
    """
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})
    if not _check_enrollment_for_unit(student_id, unit_id):
        return resp(403, {"error": "Not enrolled in this course"})

    tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])

    # Query all items for this student in this unit
    all_items = query_all(
        tbl,
        key_condition=Key("studentId").eq(student_id),
    )
    unit_items = [i for i in all_items if i.get("unitId") == unit_id]

    # Auto-init if empty
    if not unit_items:
        unit_items = _init_knowledge_queue(student_id, unit_id)

    # Filter out pending, sort by order
    visible = [i for i in unit_items if i.get("status") != "pending"]
    visible.sort(key=lambda x: x.get("order", 0))

    # Normalize legacy "question" field to "questionPrompt" for frontend compat
    for item in visible:
        if "questionPrompt" not in item and "question" in item:
            item["questionPrompt"] = item["question"]

    # Backfill clarifying questions asynchronously — don't block the response
    needs_backfill = [i for i in visible if not i.get("suggestedQuestions") and i.get("questionPrompt")]
    if needs_backfill:
        async_payload = {
            "_internal": "backfill-clarifying-questions",
            "studentId": student_id,
            "unitId": unit_id,
            "items": [{"id": i["id"], "questionPrompt": i["questionPrompt"]} for i in needs_backfill],
        }
        lambda_client.invoke(
            FunctionName=SELF_FUNCTION_NAME,
            InvocationType="Event",
            Payload=json.dumps(async_payload).encode(),
        )

    return resp(200, visible)


def handle_list_knowledge_messages(event, queue_item_id: str):
    """GET /knowledge-queue/{queueItemId}/messages → ChatMessage[]
    Returns persisted messages for this knowledge queue item, sorted by createdAt asc.
    """
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    msgs_tbl = dynamodb.Table(T["CHAT_MESSAGES"])
    # Knowledge messages use threadId = "kq-{queueItemId}" to namespace them
    thread_id = f"kq-{queue_item_id}"
    items = query_all(
        msgs_tbl,
        key_condition=Key("threadId").eq(thread_id),
        scan_forward=True,
    )
    return resp(200, items)


def handle_save_knowledge_message(event, queue_item_id: str):
    """POST /knowledge-queue/{queueItemId}/messages
    Body: { "role": "student"|"tutor", "content": string, "metadata"?: object }
    Persists a knowledge chat message and returns it.
    """
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err

    role = body.get("role")
    content = body.get("content")
    if role not in ("student", "tutor") or not isinstance(content, str):
        return resp(400, {"error": "Missing role or content"})

    now = iso_now()
    thread_id = f"kq-{queue_item_id}"
    msg = {
        "id": str(uuid.uuid4()),
        "threadId": thread_id,
        "role": role,
        "content": content,
        "createdAt": now,
    }
    metadata = body.get("metadata")
    if metadata and isinstance(metadata, dict):
        msg["metadata"] = metadata

    msgs_tbl = dynamodb.Table(T["CHAT_MESSAGES"])
    msgs_tbl.put_item(Item=msg)
    return resp(200, msg)


def handle_clarify_knowledge_question(event, queue_item_id: str):
    """POST /knowledge-queue/{queueItemId}/clarify
    Body: { "question": string }
    Returns the tutor's answer to a clarifying question (does NOT grade).
    """
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    body = json.loads(event.get("body") or "{}")
    clarifying_question = body.get("question")
    if not clarifying_question:
        return resp(400, {"error": "Missing question"})

    tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    existing = tbl.get_item(Key={"studentId": student_id, "id": queue_item_id}).get("Item")
    if not existing:
        return resp_not_found("KnowledgeQueueItem")
    if existing.get("status") != "active":
        return resp(400, {"error": "Item is not active"})

    unit_id = existing["unitId"]
    if not _check_enrollment_for_unit(student_id, unit_id):
        return resp(403, {"error": "Not enrolled in this course"})
    question = existing.get("questionPrompt", "") or existing.get("question", "")

    # Parallelize topic lookup and unit context fetch
    from concurrent.futures import ThreadPoolExecutor

    topic_id = existing.get("knowledgeTopicId")

    def _get_topic():
        if topic_id:
            return dynamodb.Table(T["KNOWLEDGE_TOPICS"]).get_item(Key={"id": topic_id}).get("Item")
        return None

    with ThreadPoolExecutor(max_workers=2) as executor:
        topic_future = executor.submit(_get_topic)
        ctx_future = executor.submit(_get_unit_context, unit_id, student_id)

    topic = topic_future.result()
    skill_description = (topic.get("knowledgeTopic", "") if topic else "") or question
    subject, grade = ctx_future.result()

    try:
        from backend_code.gen_clarifying_questions_pipeline import gen_clarifying_question_answer
        answer = gen_clarifying_question_answer(
            subject=subject,
            grade=grade,
            skill_description=skill_description,
            question=question,
            clarifying_question=clarifying_question,
        )
        return resp(200, {"answer": answer})
    except Exception as e:
        print(f"[clarifying-answer] failed for {queue_item_id}: {e}")
        return resp(500, {"error": "Failed to generate clarifying answer"})


def handle_respond_knowledge_queue_item(event, queue_item_id: str):
    """POST /knowledge-queue/{queueItemId}/respond
    Body: { "answer": string, "attemptNumber": 1 | 2 }
    Multi-turn knowledge evaluation. On attempt 1, may return "partial" with feedback
    instead of grading. On attempt 2, always returns a final binary grade.
    """
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    body = json.loads(event.get("body") or "{}")
    answer = body.get("answer")
    attempt_number = body.get("attemptNumber", 1)
    if not answer:
        return resp(400, {"error": "Missing answer"})

    tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    existing = tbl.get_item(Key={"studentId": student_id, "id": queue_item_id}).get("Item")
    if not existing:
        return resp_not_found("KnowledgeQueueItem")
    if existing.get("status") != "active":
        return resp(400, {"error": "Item is not active"})

    unit_id = existing["unitId"]
    if not _check_enrollment_for_unit(student_id, unit_id):
        return resp(403, {"error": "Not enrolled in this course"})

    # Parallelize: topic lookup, unit context, conversation history, and next pending item
    from concurrent.futures import ThreadPoolExecutor

    topic_id = existing.get("knowledgeTopicId")
    question = existing.get("questionPrompt", "") or existing.get("question", "")
    thread_id = f"kq-{queue_item_id}"

    def _get_topic():
        if topic_id:
            return dynamodb.Table(T["KNOWLEDGE_TOPICS"]).get_item(Key={"id": topic_id}).get("Item")
        return None

    def _get_conversation():
        msgs_tbl = dynamodb.Table(T["CHAT_MESSAGES"])
        all_msgs = query_all(msgs_tbl, key_condition=Key("threadId").eq(thread_id), scan_forward=True)
        lines = []
        for m in all_msgs:
            role_label = "Student" if m.get("role") == "student" else "Tutor"
            lines.append(f"{role_label}: {m.get('content', '')}")
        return "\n".join(lines) if lines else "(no prior messages)"

    def _get_all_unit_items():
        return [
            i for i in query_all(tbl, key_condition=Key("studentId").eq(student_id))
            if i.get("unitId") == unit_id
        ]

    with ThreadPoolExecutor(max_workers=4) as executor:
        topic_future = executor.submit(_get_topic)
        ctx_future = executor.submit(_get_unit_context, unit_id, student_id)
        conv_future = executor.submit(_get_conversation)
        items_future = executor.submit(_get_all_unit_items)

    topic = topic_future.result()
    topic_description = (topic.get("knowledgeTopic", "") if topic else "") or question
    subject, grade = ctx_future.result()
    conversation_history = conv_future.result()
    all_items = items_future.result()

    # Find the next pending item now so we can generate its clarifying questions in parallel with grading
    pending = [i for i in all_items if i.get("status") == "pending"]
    pending.sort(key=lambda x: x.get("order", 0))
    next_pending = pending[0] if pending else None

    # Run grading AI call + clarifying question gen for next item in parallel
    clarify_future = None

    def _gen_clarifying_for_next():
        """Generate clarifying questions for the next item while grading runs."""
        if not next_pending:
            return None
        if next_pending.get("suggestedQuestions") or not next_pending.get("questionPrompt"):
            return None
        try:
            from backend_code.gen_clarifying_questions_pipeline import gen_clarifying_questions
            return gen_clarifying_questions(subject, grade, next_pending["questionPrompt"])
        except Exception as e:
            print(f"[clarifying-questions] parallel gen failed for {next_pending['id']}: {e}")
            return None

    with ThreadPoolExecutor(max_workers=2) as executor:
        clarify_future = executor.submit(_gen_clarifying_for_next)

        # Call the multi-turn evaluation LLM (runs in main thread while clarify runs in bg)
        try:
            from backend_code.info_question_pipeline import respond_to_knowledge_answer
            outcome, tutor_feedback = respond_to_knowledge_answer(
                grade=grade,
                subject=subject,
                information=topic_description,
                question=question,
                conversation_history=conversation_history,
                answer=answer,
                attempt_number=attempt_number,
            )
        except Exception as e:
            print(f"[respond error] knowledge queue item {queue_item_id}: {e}")
            # Wait for clarify thread before returning
            clarify_future.result()
            return resp(500, {"error": "Evaluation failed"})

    result: dict = {"outcome": outcome, "tutorFeedback": tutor_feedback}

    # If partial, return feedback without grading — student gets another attempt
    if outcome == "partial":
        # Save clarifying questions if they finished (for next time)
        cqs = clarify_future.result()
        if cqs and next_pending:
            tbl.update_item(
                Key={"studentId": student_id, "id": next_pending["id"]},
                UpdateExpression="SET suggestedQuestions = :sq",
                ExpressionAttributeValues={":sq": cqs},
            )
        return resp(200, result)

    # Final grade: correct or incorrect — same completion logic as /complete
    now = iso_now()
    is_correct = outcome == "correct"
    new_status = "completed_correct" if is_correct else "completed_incorrect"
    tbl.update_item(
        Key={"studentId": student_id, "id": queue_item_id},
        UpdateExpression="SET #s = :s, is_correct = :ic, updatedAt = :u, completedAt = :c",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": new_status, ":ic": is_correct, ":u": now, ":c": now},
    )
    # Construct updated item from known values instead of re-fetching; sanitize Decimals from DynamoDB
    updated_item = _sanitize_for_json({**existing, "status": new_status, "is_correct": is_correct, "updatedAt": now, "completedAt": now})
    result["updatedItem"] = updated_item

    # Activate next pending item and save its clarifying questions (already generated in parallel)
    if next_pending:
        cqs = clarify_future.result()
        update_expr = "SET #s = :s"
        expr_values: dict = {":s": "active"}
        if cqs:
            update_expr += ", suggestedQuestions = :sq"
            expr_values[":sq"] = cqs
        tbl.update_item(
            Key={"studentId": student_id, "id": next_pending["id"]},
            UpdateExpression=update_expr,
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues=expr_values,
        )

    # If incorrect, defer retry question generation to async Lambda
    if not is_correct:
        max_order = max((i.get("order", 0) for i in all_items), default=0)
        max_label = max((i.get("labelIndex", 0) for i in all_items), default=0)
        async_payload = {
            "_internal": "generate-retry-question",
            "studentId": student_id,
            "unitId": unit_id,
            "knowledgeTopicId": existing["knowledgeTopicId"],
            "question": question,
            "topicDescription": topic_description,
            "grade": grade,
            "subject": subject,
            "maxOrder": max_order,
            "maxLabel": max_label,
        }
        lambda_client.invoke(
            FunctionName=SELF_FUNCTION_NAME,
            InvocationType="Event",
            Payload=json.dumps(async_payload, default=_json_default).encode(),
        )

    _trigger_report_stats_update(student_id, unit_id)
    return resp(200, result)


def handle_complete_knowledge_queue_item(event, queue_item_id: str):
    """POST /knowledge-queue/{queueItemId}/complete
    Body: { "answer": string }
    Grades the student's answer via AI, sets status, optionally creates retry item,
    advances next pending item.  Falls back to { "is_correct": boolean } if provided.
    """
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    body = json.loads(event.get("body") or "{}")
    answer = body.get("answer")
    is_correct = body.get("is_correct")
    if answer is None and is_correct is None:
        return resp(400, {"error": "Missing answer"})

    tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    existing = tbl.get_item(Key={"studentId": student_id, "id": queue_item_id}).get("Item")
    if not existing:
        return resp_not_found("KnowledgeQueueItem")

    unit_id = existing["unitId"]
    if not _check_enrollment_for_unit(student_id, unit_id):
        return resp(403, {"error": "Not enrolled in this course"})
    now = iso_now()
    tutor_feedback = None

    # Pre-fetch context in parallel
    from concurrent.futures import ThreadPoolExecutor

    topic_id = existing.get("knowledgeTopicId")
    question = existing.get("questionPrompt", "") or existing.get("question", "")

    def _get_topic():
        if topic_id:
            return dynamodb.Table(T["KNOWLEDGE_TOPICS"]).get_item(Key={"id": topic_id}).get("Item")
        return None

    with ThreadPoolExecutor(max_workers=2) as executor:
        topic_future = executor.submit(_get_topic)
        ctx_future = executor.submit(_get_unit_context, unit_id, student_id)

    topic = topic_future.result()
    topic_description = (topic.get("knowledgeTopic", "") if topic else "") or question
    subject, grade = ctx_future.result()

    # Grade via AI if answer text was provided
    if answer is not None and is_correct is None:
        try:
            from backend_code.info_question_pipeline import grade_info
            is_correct, tutor_feedback = grade_info(
                grade=grade,
                subject=subject,
                information=topic_description,
                question=question,
                answer=answer,
            )
        except Exception as e:
            print(f"[grading error] knowledge queue item {queue_item_id}: {e}")
            return resp(500, {"error": "Grading failed"})

    # Update the completed item
    new_status = "completed_correct" if is_correct else "completed_incorrect"
    tbl.update_item(
        Key={"studentId": student_id, "id": queue_item_id},
        UpdateExpression="SET #s = :s, is_correct = :ic, updatedAt = :u, completedAt = :c",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": new_status, ":ic": is_correct, ":u": now, ":c": now},
    )
    # Construct updated item from known values instead of re-fetching; sanitize Decimals from DynamoDB
    updated_item = _sanitize_for_json({**existing, "status": new_status, "is_correct": is_correct, "updatedAt": now, "completedAt": now})

    result: dict = {"updatedItem": updated_item}
    if tutor_feedback is not None:
        result["tutorFeedback"] = tutor_feedback

    # Query unit items once for both retry creation and next-item advancement
    all_items = [
        i for i in query_all(tbl, key_condition=Key("studentId").eq(student_id))
        if i.get("unitId") == unit_id
    ]

    # Advance the next pending item to active and eagerly gen clarifying questions
    pending = [i for i in all_items if i.get("status") == "pending"]
    pending.sort(key=lambda x: x.get("order", 0))
    if pending:
        _activate_knowledge_item(tbl, student_id, unit_id, pending[0])

    # If incorrect, defer retry question generation to async Lambda
    if not is_correct:
        max_order = int(max((i.get("order", 0) for i in all_items), default=0))
        max_label = int(max((i.get("labelIndex", 0) for i in all_items), default=0))
        async_payload = {
            "_internal": "generate-retry-question",
            "studentId": student_id,
            "unitId": unit_id,
            "knowledgeTopicId": existing["knowledgeTopicId"],
            "question": question,
            "topicDescription": topic_description,
            "grade": grade,
            "subject": subject,
            "maxOrder": max_order,
            "maxLabel": max_label,
        }
        lambda_client.invoke(
            FunctionName=SELF_FUNCTION_NAME,
            InvocationType="Event",
            Payload=json.dumps(async_payload, default=_json_default).encode(),
        )

    _trigger_report_stats_update(student_id, unit_id)
    return resp(200, result)


def handle_get_knowledge_progress(event, unit_id: str):
    """GET /units/{unitId}/knowledge-progress → KnowledgeProgress
    Counts unique topics answered correctly/incorrectly.
    A topic retried correctly is removed from incorrectCount.
    """
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})
    if not _check_enrollment_for_unit(student_id, unit_id):
        return resp(403, {"error": "Not enrolled in this course"})

    # Get total topics for this unit (exclude disabled)
    topics_tbl = dynamodb.Table(T["KNOWLEDGE_TOPICS"])
    topics = query_all(
        topics_tbl,
        index_name=IDX["UNIT_KNOWLEDGE_TOPICS"],
        key_condition=Key("unitId").eq(unit_id),
    )
    topics = [t for t in topics if t.get("enabled") is not False]
    total_topics = len(topics)
    enabled_topic_ids = {t["id"] for t in topics if t.get("id")}

    # Get all queue items for this student in this unit
    queue_tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    all_items = query_all(queue_tbl, key_condition=Key("studentId").eq(student_id))
    unit_items = [i for i in all_items if i.get("unitId") == unit_id]

    # Track per-topic best result (only for enabled topics)
    topic_results: dict[str, bool] = {}
    for item in unit_items:
        tid = item.get("knowledgeTopicId")
        if not tid or tid not in enabled_topic_ids:
            continue
        status = item.get("status", "")
        if status == "completed_correct":
            topic_results[tid] = True
        elif status == "completed_incorrect" and tid not in topic_results:
            topic_results[tid] = False

    correct_count = sum(1 for v in topic_results.values() if v)
    incorrect_count = sum(1 for v in topic_results.values() if not v)

    progress = {
        "unitId": unit_id,
        "totalTopics": total_topics,
        "correctCount": correct_count,
        "incorrectCount": incorrect_count,
        "correctPercent": round(correct_count / total_topics * 100, 1) if total_topics else 0,
        "incorrectPercent": round(incorrect_count / total_topics * 100, 1) if total_topics else 0,
    }
    return resp(200, progress)


def _parse_multipart(event) -> tuple[dict, list[tuple[str, bytes]]]:
    """
    Parse a multipart/form-data Lambda event.
    Returns (fields: {name: value}, files: [(filename, bytes)]).
    API Gateway v2 base64-encodes binary payloads when isBase64Encoded=True.
    """
    from email.parser import BytesParser
    from email.policy import default as default_policy

    raw_body = event.get("body") or ""
    is_b64 = event.get("isBase64Encoded", False)
    body_bytes = base64.b64decode(raw_body) if is_b64 else raw_body.encode("utf-8")

    content_type = header(event, "content-type") or ""

    # Build a full MIME message so the email parser can handle it
    mime_header = f"Content-Type: {content_type}\r\n\r\n".encode("utf-8")
    msg = BytesParser(policy=default_policy).parsebytes(mime_header + body_bytes)

    fields: dict = {}
    files: list[tuple[str, bytes]] = []

    for part in msg.walk():
        cd = part.get("Content-Disposition", "")
        if "form-data" not in cd:
            continue

        name = part.get_param("name", header="Content-Disposition") or ""
        filename = part.get_filename()
        payload = part.get_payload(decode=True)

        if filename:
            files.append((filename, payload or b""))
        elif name:
            fields[name] = payload.decode("utf-8") if payload else ""

    return fields, files


def handle_create_unit_from_upload(event, course_id: str):
    """
    POST /courses/{courseId}/units/upload
    JSON body: { unitName: string, fileNames: string[] }

    Creates a Unit record with status="processing" and returns pre-signed
    S3 PUT URLs so the browser can upload files directly — bypassing the
    API Gateway 10 MB payload limit.

    Returns 201 { unitId, uploadUrls: { filename: presignedUrl, ... } }
    """
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    body = json.loads(event.get("body") or "{}")
    file_names: list[str] = body.get("fileNames") or []
    if not file_names:
        return resp(400, {"error": "fileNames is required (non-empty list)"})

    unit_name = (body.get("unitName") or "Untitled Unit").strip()

    # Verify the course exists
    courses_tbl = dynamodb.Table(T["COURSES"])
    course = courses_tbl.get_item(Key={"id": course_id}).get("Item")
    if not course:
        return resp_not_found("Course")

    now = iso_now()
    unit_id = str(uuid.uuid4())

    # Create Unit immediately with status="processing"
    unit_item = {
        "id": unit_id,
        "courseId": course_id,
        "title": unit_name,
        "order": 0,
        "status": "processing",
        "uploadedFileNames": file_names,
        "createdAt": now,
        "updatedAt": now,
    }
    dynamodb.Table(T["UNITS"]).put_item(Item=unit_item)

    # Generate pre-signed PUT URLs (valid for 15 minutes).
    # A dedicated client forces SigV4 + the regional endpoint so the
    # pre-signed URL domain matches the bucket's region (us-west-1).
    presign_client = boto3.client(
        "s3",
        region_name="us-west-1",
        endpoint_url="https://s3.us-west-1.amazonaws.com",
        config=Config(signature_version="s3v4"),
    )
    upload_urls: dict[str, str] = {}
    for filename in file_names:
        s3_key = f"uploads/{unit_id}/{filename}"
        url = presign_client.generate_presigned_url(
            "put_object",
            Params={"Bucket": UPLOAD_BUCKET, "Key": s3_key},
            ExpiresIn=900,
        )
        upload_urls[filename] = url

    return resp(201, {"unitId": unit_id, "uploadUrls": upload_urls})


def handle_process_unit(event, unit_id: str):
    """
    POST /units/{unitId}/process
    Triggers the async pipeline worker after the browser has finished
    uploading files to S3.

    Reads the Unit record, lists staged files in S3, then invokes
    this Lambda asynchronously to run the curriculum pipeline.

    Returns 202 { unitId, status: "processing" }
    """
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    units_tbl = dynamodb.Table(T["UNITS"])
    unit = units_tbl.get_item(Key={"id": unit_id}).get("Item")
    if not unit:
        return resp_not_found("Unit")

    course_id = unit["courseId"]

    # List uploaded files in S3 under uploads/{unitId}/
    prefix = f"uploads/{unit_id}/"
    response = s3.list_objects_v2(Bucket=UPLOAD_BUCKET, Prefix=prefix)
    contents = response.get("Contents", [])
    if not contents:
        return resp(400, {"error": "No files found in S3 staging area"})

    s3_keys = [
        {"key": obj["Key"], "filename": obj["Key"].split("/")[-1]}
        for obj in contents
    ]

    # Clean up existing objectives/questions (safe now — files are in S3)
    _cleanup_unit_objectives(unit_id)

    # Persist file names and set status to processing
    file_names = [entry["filename"] for entry in s3_keys]
    units_tbl.update_item(
        Key={"id": unit_id},
        UpdateExpression="SET #s = :s, uploadedFileNames = :f, updatedAt = :u REMOVE identifiedKnowledge, statusError",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "processing", ":f": file_names, ":u": iso_now()},
    )

    # Invoke self async to run the pipeline in the background
    async_payload = {
        "_internal": "process-upload",
        "unitId": unit_id,
        "courseId": course_id,
        "unitName": unit.get("title", "Untitled Unit"),
        "grade": "Unknown Grade",
        "s3Keys": s3_keys,
    }
    lambda_client.invoke(
        FunctionName=SELF_FUNCTION_NAME,
        InvocationType="Event",
        Payload=json.dumps(async_payload).encode(),
    )

    return resp(202, {"unitId": unit_id, "status": "processing"})


def _handle_identify_async(payload: dict):
    """
    Phase 1 async handler — identifies knowledge from uploaded documents.

    Downloads files from S3, converts to PDF, runs identify_knowledge() only
    (no question generation), stores results on the Unit record, and sets
    status to "review" so the teacher can select which objectives to keep.
    """
    unit_id = payload["unitId"]
    course_id = payload["courseId"]
    s3_keys = payload["s3Keys"]
    grade = payload.get("grade", "Unknown Grade")

    courses_tbl = dynamodb.Table(T["COURSES"])
    course = courses_tbl.get_item(Key={"id": course_id}).get("Item") or {}
    subject = course.get("subject") or course.get("title", "Unknown Subject")
    grade = course.get("gradeLevel") or grade

    units_tbl = dynamodb.Table(T["UNITS"])

    tmp_paths: list[str] = []
    pdf_paths: list[str] = []
    try:
        from file_converter import convert_to_pdf
        from gen_curriculum_pipeline import Gen_Curriculum_Pipeline

        for entry in s3_keys:
            s3_key = entry["key"]
            filename = entry["filename"]
            suffix = os.path.splitext(filename)[1] or ".pdf"
            fd, tmp_path = tempfile.mkstemp(suffix=suffix)
            try:
                obj = s3.get_object(Bucket=UPLOAD_BUCKET, Key=s3_key)
                os.write(fd, obj["Body"].read())
            finally:
                os.close(fd)
            tmp_paths.append(tmp_path)

            pdf_path = convert_to_pdf(tmp_path)
            pdf_paths.append(pdf_path)
            if pdf_path != tmp_path:
                tmp_paths.append(pdf_path)

        # Run identify_knowledge only (no question generation)
        pipeline = Gen_Curriculum_Pipeline()
        all_identified: list[dict] = []
        for pdf_path in pdf_paths:
            uploaded_file = pipeline.upload_pdf(pdf_path, wait=True)
            print(f"\t> Uploaded PDF to Gemini")
            identified = pipeline.identify_knowledge(uploaded_file)
            print(f"\t> Identified {len(identified)} knowledge items")
            all_identified.extend(identified)

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[async-identify] Pipeline failed for unit {unit_id}: {e}\n{tb}")
        units_tbl.update_item(
            Key={"id": unit_id},
            UpdateExpression="SET #s = :s, statusError = :e, updatedAt = :u",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":s": "error", ":e": str(e), ":u": iso_now()},
        )
        return
    finally:
        for p in tmp_paths:
            try:
                os.unlink(p)
            except Exception:
                pass
        # Keep S3 files so they appear on the re-upload page

    if not all_identified:
        units_tbl.update_item(
            Key={"id": unit_id},
            UpdateExpression="SET #s = :s, statusError = :e, updatedAt = :u",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":s": "error",
                ":e": "No knowledge items identified from uploaded content",
                ":u": iso_now(),
            },
        )
        return

    # Store identified knowledge on the Unit record and set status to "review"
    units_tbl.update_item(
        Key={"id": unit_id},
        UpdateExpression="SET #s = :s, identifiedKnowledge = :k, updatedAt = :u",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":s": "review",
            ":k": json.dumps(all_identified),
            ":u": iso_now(),
        },
    )
    print(
        f"[async-identify] Unit {unit_id} identification complete: "
        f"{len(all_identified)} items ready for teacher review"
    )


def handle_get_identified_knowledge(unit_id: str):
    """GET /units/{unitId}/identified-knowledge — return identified objectives for review."""
    units_tbl = dynamodb.Table(T["UNITS"])
    got = units_tbl.get_item(Key={"id": unit_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("Unit")
    raw = item.get("identifiedKnowledge", "[]")
    knowledge = json.loads(raw) if isinstance(raw, str) else raw
    return resp(200, {"unitId": unit_id, "identifiedKnowledge": knowledge})


def handle_generate_objectives(event, unit_id: str):
    """
    POST /units/{unitId}/generate

    Teacher has reviewed identified knowledge and selected which objectives to
    keep. Triggers async question generation for the selected items only.

    Body: { selectedObjectives: [{ type, description }, ...] }
    """
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    body = json.loads(event.get("body") or "{}")
    selected = body.get("selectedObjectives", [])
    if not selected:
        return resp(400, {"error": "No objectives selected"})

    units_tbl = dynamodb.Table(T["UNITS"])
    got = units_tbl.get_item(Key={"id": unit_id})
    unit = got.get("Item")
    if not unit:
        return resp_not_found("Unit")

    course_id = unit["courseId"]

    # Set status back to processing while we generate questions
    units_tbl.update_item(
        Key={"id": unit_id},
        UpdateExpression="SET #s = :s, updatedAt = :u",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "processing", ":u": iso_now()},
    )

    # Invoke self async for question generation
    async_payload = {
        "_internal": "generate-objectives",
        "unitId": unit_id,
        "courseId": course_id,
        "selectedObjectives": selected,
    }
    lambda_client.invoke(
        FunctionName=SELF_FUNCTION_NAME,
        InvocationType="Event",
        Payload=json.dumps(async_payload).encode(),
    )

    return resp(202, {"unitId": unit_id, "status": "processing"})


def _handle_backfill_clarifying_questions_async(payload: dict):
    """Async handler — generates clarifying questions for items missing them."""
    student_id = payload["studentId"]
    unit_id = payload["unitId"]
    items = payload["items"]

    try:
        from backend_code.gen_clarifying_questions_pipeline import gen_clarifying_questions
        subject, grade = _get_unit_context(unit_id, student_id)
        tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])

        for item in items:
            try:
                cqs = gen_clarifying_questions(subject, grade, item["questionPrompt"])
                tbl.update_item(
                    Key={"studentId": student_id, "id": item["id"]},
                    UpdateExpression="SET suggestedQuestions = :sq",
                    ExpressionAttributeValues={":sq": cqs},
                )
                print(f"[async] Backfilled clarifying questions for {item['id']}")
            except Exception as e:
                print(f"[async clarifying-questions] backfill failed for {item['id']}: {e}")
    except Exception as e:
        print(f"[async clarifying-questions] error: {e}")


def _handle_generate_grading_report_async(payload: dict):
    """Async handler — generates a grading report for a student in the background."""
    student_id = payload["studentId"]
    unit_id = payload["unitId"]

    gr_tbl = dynamodb.Table(T["GRADING_REPORTS"])
    force = payload.get("force", False)

    # Skip if report already exists and not forced
    if not force:
        existing = gr_tbl.get_item(Key={"studentId": student_id, "unitId": unit_id}).get("Item")
        if existing:
            print(f"[async grading report] Already exists for student={student_id} unit={unit_id}")
            return

    try:
        units_tbl = dynamodb.Table(T["UNITS"])
        unit = units_tbl.get_item(Key={"id": unit_id}).get("Item")
        if not unit:
            print(f"[async grading report] Unit {unit_id} not found")
            return

        course_id = unit.get("courseId", "")
        course = dynamodb.Table(T["COURSES"]).get_item(Key={"id": course_id}).get("Item") or {}

        objectives = query_all(
            dynamodb.Table(T["OBJECTIVES"]),
            index_name=IDX["UNIT_OBJECTIVES"],
            key_condition=Key("unitId").eq(unit_id),
        )

        all_prog = query_all(
            dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"]),
            key_condition=Key("studentId").eq(student_id),
        )
        obj_id_set = {obj.get("id") for obj in objectives if obj.get("id")}
        progress_map = {p["objectiveId"]: p for p in all_prog if p.get("objectiveId") in obj_id_set}

        all_kq = query_all(
            dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"]),
            key_condition=Key("studentId").eq(student_id),
        )
        unit_kq = [qi for qi in all_kq if qi.get("unitId") == unit_id]

        topics = query_all(
            dynamodb.Table(T["KNOWLEDGE_TOPICS"]),
            index_name=IDX["UNIT_KNOWLEDGE_TOPICS"],
            key_condition=Key("unitId").eq(unit_id),
        )
        topics_map = {t["id"]: t for t in topics if t.get("id")}

        deadline = unit.get("deadline")
        feedback_map = _collect_skill_feedback(objectives)
        objectives_data = _format_objectives_data(objectives, progress_map, deadline, feedback_map)
        knowledge_data = _format_knowledge_data(unit_kq, topics_map)
        capstone_data = _format_capstone_data(objectives, feedback_map)

        # Compute stats
        skill_objs = [o for o in objectives if o.get("objectiveType") != "knowledge"]
        skill_total = len(skill_objs)
        skill_completed = 0
        skill_completed_before_deadline = 0
        latest_completion_ts = None
        objective_details = []
        for o in skill_objs:
            p = progress_map.get(o.get("id"), {})
            completed = int(p.get("earnedStars", 0)) >= 3 or p.get("currentStageType") == "challenge"
            ts = p.get("updatedAt") or p.get("createdAt") if completed else None
            detail = {"title": o.get("title", ""), "completed": completed, "completedAt": ts or ""}
            if completed:
                skill_completed += 1
                if ts and (latest_completion_ts is None or ts > latest_completion_ts):
                    latest_completion_ts = ts
                if deadline and ts and ts <= deadline:
                    skill_completed_before_deadline += 1
                    detail["beforeDeadline"] = True
                elif deadline and ts:
                    detail["beforeDeadline"] = False
            objective_details.append(detail)

        by_topic: dict[str, list[dict]] = {}
        for qi in unit_kq:
            tid = qi.get("knowledgeTopicId", "")
            by_topic.setdefault(tid, []).append(qi)
        knowledge_total = len(topics_map)
        knowledge_correct = sum(
            1 for attempts in by_topic.values()
            if any(a.get("status") == "completed_correct" for a in attempts)
        )
        knowledge_attempts = len([qi for qi in unit_kq if qi.get("status", "").startswith("completed_")])

        all_completed = skill_completed == skill_total and skill_total > 0
        completed_before_deadline = None
        if deadline and all_completed and latest_completion_ts:
            completed_before_deadline = latest_completion_ts <= deadline
        on_time_pct = None
        if deadline and skill_total > 0:
            on_time_pct = round(skill_completed_before_deadline / skill_total * 100)

        # Generate summaries in parallel
        from concurrent.futures import ThreadPoolExecutor
        from backend_code.grading_report_pipeline import generate_teacher_summary, generate_student_summary

        summary_kwargs = dict(
            unit_title=unit.get("title", ""),
            course_title=course.get("title", ""),
            objectives_data=objectives_data,
            knowledge_data=knowledge_data,
            capstone_data=capstone_data,
        )
        with ThreadPoolExecutor(max_workers=2) as executor:
            teacher_future = executor.submit(generate_teacher_summary, **summary_kwargs)
            student_future = executor.submit(generate_student_summary, **summary_kwargs)
        teacher_summary = teacher_future.result()
        student_summary = student_future.result()

        now = iso_now()
        report_item = {
            "studentId": student_id,
            "unitId": unit_id,
            "id": str(uuid.uuid4()),
            "courseId": course_id,
            "teacherSummary": teacher_summary,
            "studentSummary": student_summary,
            "skillCompleted": skill_completed,
            "skillTotal": skill_total,
            "skillCompletedBeforeDeadline": skill_completed_before_deadline,
            "knowledgeCorrect": knowledge_correct,
            "knowledgeTotal": knowledge_total,
            "knowledgeAttempts": knowledge_attempts,
            "deadline": deadline or "",
            "completedBeforeDeadline": completed_before_deadline,
            "onTimePct": on_time_pct,
            "completionDate": latest_completion_ts or "",
            "objectiveDetails": objective_details,
            "createdAt": now,
        }
        gr_tbl.put_item(Item=report_item)
        print(f"[async grading report] Generated for student={student_id} unit={unit_id}")

    except Exception as e:
        print(f"[async grading report error] student={student_id} unit={unit_id}: {e}")


def _handle_generate_retry_question_async(payload: dict):
    """Async handler — generates a retry question for an incorrect knowledge answer."""
    student_id = payload["studentId"]
    unit_id = payload["unitId"]
    topic_id = payload["knowledgeTopicId"]
    question = payload["question"]
    topic_description = payload["topicDescription"]
    grade = payload["grade"]
    subject = payload["subject"]
    max_order = payload["maxOrder"]
    max_label = payload["maxLabel"]

    retry_question = question
    try:
        from backend_code.info_question_pipeline import generate_info_question
        retry_question = generate_info_question(
            grade=grade,
            subject=subject,
            description=topic_description,
        )
    except Exception as e:
        print(f"[async retry question gen error] topic={topic_id}: {e}")

    now = iso_now()
    tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    retry_id = str(uuid.uuid4())
    tbl.put_item(Item={
        "studentId": student_id,
        "id": retry_id,
        "unitId": unit_id,
        "knowledgeTopicId": topic_id,
        "labelIndex": max_label + 1,
        "order": max_order + 1,
        "status": "pending",
        "questionPrompt": retry_question,
        "createdAt": now,
    })
    print(f"[async] Created retry question {retry_id} for student={student_id} topic={topic_id}")


def _handle_generate_objectives_async(payload: dict):
    """
    Phase 2 async handler — generates questions for teacher-selected objectives
    and persists all DynamoDB records.
    """
    import asyncio

    unit_id = payload["unitId"]
    course_id = payload["courseId"]
    selected = payload["selectedObjectives"]

    courses_tbl = dynamodb.Table(T["COURSES"])
    course = courses_tbl.get_item(Key={"id": course_id}).get("Item") or {}
    subject = course.get("subject") or course.get("title", "Unknown Subject")
    grade = course.get("gradeLevel", "Unknown Grade")

    units_tbl = dynamodb.Table(T["UNITS"])

    try:
        from gen_curriculum_pipeline import Gen_Curriculum_Pipeline

        pipeline = Gen_Curriculum_Pipeline()

        # Build identified_knowledge list in the format _run_questions_async expects
        identified_knowledge = [
            {"type": obj["type"], "description": obj["description"]}
            for obj in selected
        ]

        # Generate questions for selected objectives only
        all_knowledge = asyncio.run(
            pipeline._run_questions_async(identified_knowledge, subject, grade)
        )
        print(f"[async-generate] Generated {len(all_knowledge)} questions for unit {unit_id}")

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[async-generate] Question generation failed for unit {unit_id}: {e}\n{tb}")
        units_tbl.update_item(
            Key={"id": unit_id},
            UpdateExpression="SET #s = :s, statusError = :e, updatedAt = :u",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":s": "error", ":e": str(e), ":u": iso_now()},
        )
        return

    # Persist DynamoDB records
    now = iso_now()

    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    stages_tbl = dynamodb.Table(T["ITEM_STAGES"])
    questions_tbl = dynamodb.Table(T["QUESTIONS"])
    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    knowledge_topics_tbl = dynamodb.Table(T["KNOWLEDGE_TOPICS"])
    knowledge_queue_tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])
    enrollments_tbl = dynamodb.Table(T["ENROLLMENTS"])

    STAGE_TYPES = ["begin", "walkthrough", "challenge"]

    enrolled_student_ids: list[str] = []
    try:
        enrollment_items = query_all(
            enrollments_tbl,
            index_name=IDX["COURSE_ENROLLMENTS"],
            key_condition=Key("courseId").eq(course_id),
        )
        enrolled_student_ids = [e["studentId"] for e in enrollment_items]
    except Exception as e:
        print(f"[async-generate] Warning: could not query enrollments for course {course_id}: {e}")

    knowledge_order = 0
    skill_order = 0

    for k in all_knowledge:
        knowledge_type = k.get("knowledge_type", "information")
        description = k.get("knowledge_description", "")
        question_text = k.get("question", "")

        if knowledge_type == "skill":
            # Skills become Objectives with stages, questions, and threads
            obj_id = str(uuid.uuid4())
            obj_item = {
                "id": obj_id,
                "unitId": unit_id,
                "title": description,
                "description": description,
                "kind": "skill",
                "order": skill_order,
                "enabled": True,
                "createdAt": now,
                "updatedAt": now,
            }
            objectives_tbl.put_item(Item=obj_item)

            for stage_order, stage_type in enumerate(STAGE_TYPES):
                stage_id = str(uuid.uuid4())
                stage_item = {
                    "id": stage_id,
                    "itemId": obj_id,
                    "stageType": stage_type,
                    "order": stage_order,
                    "prompt": question_text or description,
                    "createdAt": now,
                }
                stages_tbl.put_item(Item=stage_item)

            if question_text:
                q_id = str(uuid.uuid4())
                q_item = {
                    "id": q_id,
                    "objectiveId": obj_id,
                    "text": question_text,
                    "kind": "skill",
                    "difficultyStars": 1,
                    "createdAt": now,
                }
                questions_tbl.put_item(Item=q_item)

            thread_id = f"thread-{obj_id}"
            thread_item = {
                "id": thread_id,
                "courseId": course_id,
                "unitId": unit_id,
                "objectiveId": obj_id,
                "title": description,
                "kind": "skill",
                "lastMessageAt": now,
            }
            threads_tbl.put_item(Item=thread_item)

            skill_order += 1

        else:
            # Information items become KnowledgeTopics with queue items only
            topic_id = str(uuid.uuid4())
            topic_item = {
                "id": topic_id,
                "unitId": unit_id,
                "knowledgeTopic": description,
                "order": knowledge_order,
                "createdAt": now,
            }
            knowledge_topics_tbl.put_item(Item=topic_item)

            if enrolled_student_ids:
                for student_id in enrolled_student_ids:
                    queue_item_id = str(uuid.uuid4())
                    status = "active" if knowledge_order == 0 else "pending"
                    queue_item = {
                        "id": queue_item_id,
                        "unitId": unit_id,
                        "studentId": student_id,
                        "knowledgeTopicId": topic_id,
                        "labelIndex": knowledge_order + 1,
                        "order": knowledge_order,
                        "status": status,
                        "questionPrompt": question_text or description,
                        "createdAt": now,
                    }
                    knowledge_queue_tbl.put_item(Item=queue_item)

                    # Generate clarifying questions for the first active item
                    if status == "active" and (question_text or description):
                        try:
                            subject_ctx, grade_ctx = _get_unit_context(unit_id, student_id)
                            from backend_code.gen_clarifying_questions_pipeline import gen_clarifying_questions
                            cqs = gen_clarifying_questions(subject_ctx, grade_ctx, question_text or description)
                            knowledge_queue_tbl.update_item(
                                Key={"studentId": student_id, "id": queue_item_id},
                                UpdateExpression="SET suggestedQuestions = :sq",
                                ExpressionAttributeValues={":sq": cqs},
                            )
                        except Exception as e:
                            print(f"[clarifying-questions] generate-flow failed for {queue_item_id}: {e}")

            knowledge_order += 1

    # Create one capstone objective per unit (unlocked after all skills complete)
    capstone_obj_id = str(uuid.uuid4())
    capstone_item = {
        "id": capstone_obj_id,
        "unitId": unit_id,
        "title": "Capstone",
        "description": "Teach-back capstone: explain a concept to a curious learner",
        "kind": "capstone",
        "order": 9999,  # always last
        "enabled": True,
        "createdAt": now,
        "updatedAt": now,
    }
    objectives_tbl.put_item(Item=capstone_item)

    # Single challenge stage for the capstone (prompt generated dynamically at chat time)
    capstone_stage_id = str(uuid.uuid4())
    capstone_stage = {
        "id": capstone_stage_id,
        "itemId": capstone_obj_id,
        "stageType": "challenge",
        "order": 0,
        "prompt": "Teach the concept to your curious classmate!",
        "createdAt": now,
    }
    stages_tbl.put_item(Item=capstone_stage)

    capstone_thread_id = f"thread-{capstone_obj_id}"
    capstone_thread = {
        "id": capstone_thread_id,
        "courseId": course_id,
        "unitId": unit_id,
        "objectiveId": capstone_obj_id,
        "title": "Capstone",
        "kind": "capstone",
        "lastMessageAt": now,
    }
    threads_tbl.put_item(Item=capstone_thread)

    # Mark unit as ready (keep identifiedKnowledge so teacher can edit later)
    units_tbl.update_item(
        Key={"id": unit_id},
        UpdateExpression="SET #s = :s, updatedAt = :u",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "ready", ":u": iso_now()},
    )
    print(
        f"[async-generate] Unit {unit_id} complete: "
        f"{len(all_knowledge)} objectives, "
        f"{knowledge_order} knowledge topics with queue items for "
        f"{len(enrolled_student_ids)} students"
    )


def _cleanup_unit_objectives(unit_id: str):
    """Delete all objectives, questions, stages, threads, knowledge topics,
    and knowledge queue items associated with a unit.  Used when a teacher
    re-selects objectives or re-uploads documents."""

    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    questions_tbl = dynamodb.Table(T["QUESTIONS"])
    stages_tbl = dynamodb.Table(T["ITEM_STAGES"])
    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    knowledge_topics_tbl = dynamodb.Table(T["KNOWLEDGE_TOPICS"])
    knowledge_queue_tbl = dynamodb.Table(T["KNOWLEDGE_QUEUE_ITEMS"])

    # 1) Get all objectives for this unit
    objs = query_all(
        objectives_tbl,
        index_name=IDX["UNIT_OBJECTIVES"],
        key_condition=Key("unitId").eq(unit_id),
    )

    for obj in objs:
        oid = obj["id"]

        # Delete questions for this objective
        qs = query_all(
            questions_tbl,
            index_name=IDX["OBJECTIVE_QUESTIONS"],
            key_condition=Key("objectiveId").eq(oid),
        )
        for q in qs:
            questions_tbl.delete_item(Key={"id": q["id"]})

        # Delete stages for this objective (itemId = objectiveId)
        ss = query_all(
            stages_tbl,
            index_name=IDX["ITEM_STAGES_BY_ITEM"],
            key_condition=Key("itemId").eq(oid),
        )
        for s in ss:
            stages_tbl.delete_item(Key={"id": s["id"]})

        # Delete the objective itself
        objectives_tbl.delete_item(Key={"id": oid})

    # 2) Delete threads for this unit
    ts = query_all(
        threads_tbl,
        index_name=IDX["UNIT_THREADS"],
        key_condition=Key("unitId").eq(unit_id),
    )
    for t in ts:
        threads_tbl.delete_item(Key={"id": t["id"]})

    # 3) Delete knowledge topics for this unit
    kt = query_all(
        knowledge_topics_tbl,
        index_name=IDX["UNIT_KNOWLEDGE_TOPICS"],
        key_condition=Key("unitId").eq(unit_id),
    )
    for topic in kt:
        knowledge_topics_tbl.delete_item(Key={"id": topic["id"]})

    # 4) Delete knowledge queue items for this unit (single query, not per-topic)
    qi = query_all(
        knowledge_queue_tbl,
        index_name=IDX["UNIT_QUEUE"],
        key_condition=Key("unitId").eq(unit_id),
    )
    for item in qi:
        knowledge_queue_tbl.delete_item(Key={"studentId": item["studentId"], "id": item["id"]})

    print(f"[cleanup] Deleted {len(objs)} objectives + related data for unit {unit_id}")


def handle_edit_objectives(event, unit_id: str):
    """POST /units/{unitId}/edit-objectives

    Resets a unit back to 'review' status so the teacher can re-select
    objectives.  Deletes existing objectives and related records.
    """
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    units_tbl = dynamodb.Table(T["UNITS"])
    got = units_tbl.get_item(Key={"id": unit_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("Unit")

    # If identifiedKnowledge is missing (older units), reconstruct it from
    # the existing objectives so the teacher can still edit.
    if not item.get("identifiedKnowledge"):
        objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
        objs = query_all(
            objectives_tbl,
            index_name=IDX["UNIT_OBJECTIVES"],
            key_condition=Key("unitId").eq(unit_id),
        )
        if not objs:
            return resp(400, {"error": "No objectives to edit"})
        reconstructed = [
            {"type": obj.get("kind", "skill"), "description": obj.get("description", "")}
            for obj in objs
        ]
        # Store reconstructed knowledge on the unit
        units_tbl.update_item(
            Key={"id": unit_id},
            UpdateExpression="SET identifiedKnowledge = :k",
            ExpressionAttributeValues={":k": json.dumps(reconstructed)},
        )

    # Clean up existing generated data
    _cleanup_unit_objectives(unit_id)

    # Set status back to "review"
    units_tbl.update_item(
        Key={"id": unit_id},
        UpdateExpression="SET #s = :s, updatedAt = :u",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "review", ":u": iso_now()},
    )

    return resp(200, {"unitId": unit_id, "status": "review"})


def handle_reupload(event, unit_id: str):
    """POST /units/{unitId}/reupload

    Re-upload documents for an existing unit.  Generates fresh pre-signed
    S3 PUT URLs, cleans up old objectives, and sets status to 'processing'.
    The caller must upload files to S3, then call POST /units/{unitId}/process.
    """
    instructor_id = effective_instructor_id(event)
    if not instructor_id:
        return resp(401, {"error": "Unauthorized"})

    err, body = require_json(event)
    if err:
        return err
    file_names = (body.get("fileNames") or []) if isinstance(body, dict) else []
    if not file_names:
        return resp(400, {"error": "fileNames is required"})

    units_tbl = dynamodb.Table(T["UNITS"])
    got = units_tbl.get_item(Key={"id": unit_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("Unit")

    # Persist file names on the unit record so the re-upload page can
    # show them even after S3 files are cleaned up.
    units_tbl.update_item(
        Key={"id": unit_id},
        UpdateExpression="SET uploadedFileNames = :f, updatedAt = :u",
        ExpressionAttributeValues={":f": file_names, ":u": iso_now()},
    )

    # Generate pre-signed PUT URLs (use regional client for SigV4)
    # NOTE: We do NOT clean up objectives or change status here.
    # Cleanup and status change happen in handle_process_unit after
    # files are successfully uploaded to S3.
    presign_client = boto3.client(
        "s3",
        region_name="us-west-1",
        endpoint_url="https://s3.us-west-1.amazonaws.com",
        config=Config(signature_version="s3v4"),
    )
    upload_urls: dict[str, str] = {}
    for filename in file_names:
        s3_key = f"uploads/{unit_id}/{filename}"
        url = presign_client.generate_presigned_url(
            "put_object",
            Params={"Bucket": UPLOAD_BUCKET, "Key": s3_key},
            ExpiresIn=900,
        )
        upload_urls[filename] = url

    return resp(200, {"unitId": unit_id, "uploadUrls": upload_urls})


def handle_list_unit_files(unit_id: str):
    """GET /units/{unitId}/files — list uploaded files for a unit.

    Tries S3 first; falls back to the uploadedFileNames stored on the
    Unit record (file names are persisted at upload time so they survive
    even if S3 objects are cleaned up after processing).
    """
    # Try S3 first
    files = []
    try:
        prefix = f"uploads/{unit_id}/"
        response = s3.list_objects_v2(Bucket=UPLOAD_BUCKET, Prefix=prefix)
        contents = response.get("Contents", [])
        for obj in contents:
            filename = obj["Key"].split("/")[-1]
            if filename:
                files.append({
                    "name": filename,
                    "size": obj.get("Size", 0),
                    "lastModified": obj.get("LastModified", "").isoformat() if hasattr(obj.get("LastModified", ""), "isoformat") else str(obj.get("LastModified", "")),
                })
    except Exception:
        pass

    # Fall back to stored file names on the Unit record
    if not files:
        units_tbl = dynamodb.Table(T["UNITS"])
        got = units_tbl.get_item(Key={"id": unit_id})
        item = got.get("Item")
        if item:
            stored_names = item.get("uploadedFileNames", [])
            files = [{"name": n, "size": 0} for n in stored_names]

    return resp(200, {"files": files})


def handle_get_upload_status(unit_id: str):
    """GET /units/{unitId}/upload-status → { status, statusError? }"""
    units_tbl = dynamodb.Table(T["UNITS"])
    got = units_tbl.get_item(Key={"id": unit_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("Unit")
    result = {
        "unitId": unit_id,
        "status": item.get("status", "ready"),
    }
    if item.get("statusError"):
        result["statusError"] = item["statusError"]
    return resp(200, result)


# ---- Profile (PATCH /me, POST /me/avatar-upload-url) ----

def handle_update_profile(event):
    """PATCH /me — update the current user's name and/or avatarUrl."""
    err, body = require_json(event)
    if err:
        return err

    # Determine if student or instructor
    instructor_id = effective_instructor_id(event)
    student_id = effective_student_id(event)

    if instructor_id:
        tbl = dynamodb.Table(T["INSTRUCTORS"])
        user_id = instructor_id
    elif student_id:
        tbl = dynamodb.Table(T["STUDENTS"])
        user_id = student_id
    else:
        return resp(401, {"error": "Unauthorized"})

    got = tbl.get_item(Key={"id": user_id})
    item = got.get("Item")
    if not item:
        return resp(404, {"error": "User not found"})

    updates = {}
    if "name" in body and isinstance(body["name"], str) and body["name"].strip():
        updates["name"] = body["name"].strip()
    if "avatarUrl" in body:
        updates["avatarUrl"] = body["avatarUrl"]

    if not updates:
        return resp(200, item)

    updates["updatedAt"] = iso_now()
    expr_parts = []
    attr_names = {}
    attr_values = {}
    for i, (k, v) in enumerate(updates.items()):
        alias = f"#k{i}"
        val_alias = f":v{i}"
        expr_parts.append(f"{alias} = {val_alias}")
        attr_names[alias] = k
        attr_values[val_alias] = v

    tbl.update_item(
        Key={"id": user_id},
        UpdateExpression="SET " + ", ".join(expr_parts),
        ExpressionAttributeNames=attr_names,
        ExpressionAttributeValues=attr_values,
    )
    item.update(updates)
    item["avatarUrl"] = _presign_avatar_url(item.get("avatarUrl"))
    return resp(200, item)


def handle_avatar_upload_url(event):
    """POST /me/avatar-upload-url — return a pre-signed S3 PUT URL for avatar upload."""
    err, body = require_json(event)
    if err:
        return err

    instructor_id = effective_instructor_id(event)
    student_id = effective_student_id(event)
    user_id = instructor_id or student_id
    if not user_id:
        return resp(401, {"error": "Unauthorized"})

    filename = body.get("filename")
    if not filename or not isinstance(filename, str):
        return resp(400, {"error": "Missing filename"})

    s3_key = f"avatars/{user_id}/{filename}"

    presign_client = boto3.client(
        "s3",
        region_name="us-west-1",
        endpoint_url="https://s3.us-west-1.amazonaws.com",
        config=Config(signature_version="s3v4"),
    )
    upload_url = presign_client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": UPLOAD_BUCKET,
            "Key": s3_key,
            "ContentType": body.get("contentType", "image/png"),
        },
        ExpiresIn=900,
    )
    return resp(200, {"uploadUrl": upload_url, "publicUrl": s3_key})


# ---- Main router ----
def handler(event, context):
    # Handle internal async events (not from API Gateway)
    if isinstance(event, dict) and event.get("_internal") == "process-upload":
        _handle_identify_async(event)
        return  # async invocation, no HTTP response needed
    if isinstance(event, dict) and event.get("_internal") == "generate-objectives":
        _handle_generate_objectives_async(event)
        return
    if isinstance(event, dict) and event.get("_internal") == "generate-retry-question":
        _handle_generate_retry_question_async(event)
        return
    if isinstance(event, dict) and event.get("_internal") == "backfill-clarifying-questions":
        _handle_backfill_clarifying_questions_async(event)
        return
    if isinstance(event, dict) and event.get("_internal") == "update-report-stats":
        _update_grading_report_stats(event["studentId"], event["unitId"])
        return
    if isinstance(event, dict) and event.get("_internal") == "generate-grading-report":
        _handle_generate_grading_report_async(event)
        return

    try:
        method, path = method_and_path(event)
        params = event.get("pathParameters") or {}

        # Audit: log every non-OPTIONS, non-health request with resolved identity
        if method != "OPTIONS" and path != "/health":
            sub = authed_sub(event)
            _audit_log("request", sub=sub, method=method, path=path,
                       detail="authenticated" if sub else "unauthenticated")

        if method == "OPTIONS":
            return resp_options()

        if method == "GET" and path == "/health":
            return handle_health()

        if method == "GET" and path == "/current-student":
            return handle_current_student(event)

        if method == "PATCH" and path == "/me":
            return handle_update_profile(event)

        if method == "POST" and path == "/me/avatar-upload-url":
            return handle_avatar_upload_url(event)

        if method == "GET" and path.endswith("/courses") and path.startswith("/students/"):
            return handle_list_courses_for_student(event, params.get("studentId"))

        if method == "POST" and path == "/instructors/batch":
            return handle_instructors_batch(event)

        if method == "GET" and path.endswith("/units") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            err = _require_enrollment_for_course(event, course_id)
            if err:
                return err
            return handle_list_units(course_id)

        if method == "GET" and path.startswith("/courses/") and "/units" not in path and "/awards" not in path and "/feedback" not in path and "/roster" not in path:
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            err = _require_enrollment_for_course(event, course_id)
            if err:
                return err
            return handle_get_course(course_id)

        if method == "GET" and path.endswith("/objectives") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            err = _require_enrollment_for_unit(event, unit_id)
            if err:
                return err
            return handle_list_objectives(unit_id)

        if method == "GET" and path.endswith("/knowledge-topics") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_list_knowledge_topics(unit_id)

        if method == "PATCH" and path.endswith("/enabled") and path.startswith("/knowledge-topics/"):
            topic_id = params.get("topicId")
            if not topic_id:
                # Extract from path manually
                parts = path.strip("/").split("/")
                topic_id = parts[1] if len(parts) >= 2 else None
            if not topic_id:
                return resp(400, {"error": "Missing topicId"})
            return handle_update_knowledge_topic_enabled(event, topic_id)

        if method == "GET" and path.endswith("/knowledge-queue") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_list_knowledge_queue(event, unit_id)

        if method == "GET" and path.endswith("/knowledge-progress") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_knowledge_progress(event, unit_id)

        if method == "GET" and path.endswith("/messages") and path.startswith("/knowledge-queue/"):
            item_id = params.get("itemId")
            if not item_id:
                return resp(400, {"error": "Missing itemId"})
            return handle_list_knowledge_messages(event, item_id)

        if method == "POST" and path.endswith("/messages") and path.startswith("/knowledge-queue/"):
            item_id = params.get("itemId")
            if not item_id:
                return resp(400, {"error": "Missing itemId"})
            return handle_save_knowledge_message(event, item_id)

        if method == "POST" and path.endswith("/clarify") and path.startswith("/knowledge-queue/"):
            item_id = params.get("itemId")
            if not item_id:
                return resp(400, {"error": "Missing itemId"})
            return handle_clarify_knowledge_question(event, item_id)

        if method == "POST" and path.endswith("/respond") and path.startswith("/knowledge-queue/"):
            item_id = params.get("itemId")
            if not item_id:
                return resp(400, {"error": "Missing itemId"})
            return handle_respond_knowledge_queue_item(event, item_id)

        if method == "POST" and path.endswith("/complete") and path.startswith("/knowledge-queue/"):
            item_id = params.get("itemId")
            if not item_id:
                return resp(400, {"error": "Missing itemId"})
            return handle_complete_knowledge_queue_item(event, item_id)

        if method == "GET" and path.endswith("/files") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_list_unit_files(unit_id)

        if method == "GET" and path.endswith("/upload-status") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_upload_status(unit_id)

        if method == "GET" and path.endswith("/identified-knowledge") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_identified_knowledge(unit_id)

        if method == "POST" and path.endswith("/generate") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_generate_objectives(event, unit_id)

        if method == "POST" and path.endswith("/edit-objectives") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_edit_objectives(event, unit_id)

        if method == "POST" and path.endswith("/reupload") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_reupload(event, unit_id)

        # ---- Student grading/feedback routes ----

        if method == "GET" and path.endswith("/my-grading-report") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_my_grading_report(event, unit_id)

        if method == "GET" and path.endswith("/my-feedback") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_my_feedback(event, unit_id)

        if method == "GET" and path.startswith("/units/") and "/objectives" not in path and "/progress" not in path and "/threads" not in path and "/knowledge" not in path and "/upload-status" not in path and "/identified-knowledge" not in path and "/files" not in path and "/grading-report" not in path and "/feedback" not in path and "/my-grading-report" not in path and "/my-feedback" not in path:
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            err = _require_enrollment_for_unit(event, unit_id)
            if err:
                return err
            return handle_get_unit(unit_id)

        if method == "GET" and path.endswith("/questions") and path.startswith("/objectives/"):
            objective_id = params.get("objectiveId")
            if not objective_id:
                return resp(400, {"error": "Missing objectiveId"})
            err = _require_enrollment_for_objective(event, objective_id)
            if err:
                return err
            return handle_list_questions_for_objective(objective_id)

        if method == "GET" and path.endswith("/stages") and path.startswith("/objectives/"):
            objective_id = params.get("objectiveId")
            if not objective_id:
                return resp(400, {"error": "Missing objectiveId"})
            err = _require_enrollment_for_objective(event, objective_id)
            if err:
                return err
            return handle_list_stages_for_objective(event, objective_id)

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

        if method == "GET" and path.startswith("/objectives/") and "/questions" not in path and "/stages" not in path and "/progress" not in path and "/advance" not in path and "/enabled" not in path:
            objective_id = params.get("objectiveId")
            if not objective_id:
                return resp(400, {"error": "Missing objectiveId"})
            err = _require_enrollment_for_objective(event, objective_id)
            if err:
                return err
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

        # ---- Teacher grading/feedback routes ----

        if method == "GET" and path.endswith("/grading-report") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_unit_grading_report(event, unit_id)

        if method == "GET" and path.endswith("/feedback") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_unit_feedback_for_student(event, unit_id)

        if method == "POST" and path.endswith("/feedback") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_create_unit_feedback(event, unit_id)

        if method == "PATCH" and path.startswith("/feedback/"):
            feedback_id = params.get("feedbackId")
            if not feedback_id:
                # Extract from path manually if pathParameters doesn't have it
                parts = path.strip("/").split("/")
                feedback_id = parts[1] if len(parts) >= 2 else None
            if not feedback_id:
                return resp(400, {"error": "Missing feedbackId"})
            return handle_update_feedback(event, feedback_id)

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

        if method == "POST" and path.startswith("/threads/") and path.endswith("/new-attempt"):
            thread_id = params.get("threadId")
            if not thread_id:
                return resp(400, {"error": "Missing threadId"})
            return handle_new_attempt(event, thread_id)

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

        # ---- Instructor routes ----

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

        if method == "GET" and path == "/students":
            return handle_list_students(event)

        if method == "POST" and path == "/students":
            return handle_create_student(event)

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

        if method == "POST" and path.endswith("/process") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_process_unit(event, unit_id)

        if method == "PATCH" and path.endswith("/deadline") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_update_unit_deadline(event, unit_id)

        if method == "PATCH" and path.endswith("/title") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_update_course_title(event, course_id)

        if method == "DELETE" and path.endswith("/permanent") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_hard_delete_unit(event, unit_id)

        if method == "DELETE" and path.endswith("/permanent") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_hard_delete_course(event, course_id)

        if method == "DELETE" and path.startswith("/units/") and "/permanent" not in path:
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_soft_delete_unit(event, unit_id)

        if method == "DELETE" and path.startswith("/courses/") and "/permanent" not in path and "/roster" not in path:
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_soft_delete_course(event, course_id)

        if method == "PATCH" and path.endswith("/restore") and path.startswith("/units/"):
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_restore_unit(event, unit_id)

        if method == "PATCH" and path.endswith("/restore") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_restore_course(event, course_id)

        return resp(404, {"error": "Route not found", "method": method, "path": path})
    except Exception as e:
        return resp(500, {"error": "Server error", "details": str(e)})
