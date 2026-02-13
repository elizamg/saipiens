import json
import os
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key

from decimal import Decimal

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
}

# ---- Indexes (env vars) ----
IDX = {
    "COURSE_UNITS": os.environ["COURSE_UNITS_INDEX"],
    "UNIT_OBJECTIVES": os.environ["UNIT_OBJECTIVES_INDEX"],
    "OBJECTIVE_QUESTIONS": os.environ["OBJECTIVE_QUESTIONS_INDEX"],
}

# ---- Dev auth (Option A) ----
DEV_AUTH_ENABLED = os.environ.get("DEV_AUTH_ENABLED", "false").lower() == "true"
DEV_AUTH_HEADER = os.environ.get("DEV_AUTH_HEADER", "X-Dev-Student-Id")
DEV_AUTH_TOKEN = os.environ.get("DEV_AUTH_TOKEN")  # optional shared secret

# ---- CORS ----
CORS_ALLOW_ORIGIN = os.environ.get("CORS_ALLOW_ORIGIN", "*")
CORS_ALLOW_HEADERS = os.environ.get(
    "CORS_ALLOW_HEADERS",
    "Content-Type,Authorization,X-Dev-Student-Id,X-Dev-Token",
)
CORS_ALLOW_METHODS = os.environ.get(
    "CORS_ALLOW_METHODS",
    "GET,POST,PUT,DELETE,OPTIONS",
)

# ---- Helpers ----
def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def _json_default(o):
    # DynamoDB returns numbers as Decimal; convert them to int/float
    if isinstance(o, Decimal):
        # If it's an integer value (e.g., 1,2,3), return int
        if o % 1 == 0:
            return int(o)
        # Otherwise return float
        return float(o)
    raise TypeError(f"Object of type {type(o).__name__} is not JSON serializable")

def _sanitize_for_json(obj):
    # Optional: recursively convert Decimal in nested structures
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
    # For browser preflight requests
    return resp(200, {})


def safe_json(body: str):
    if not body:
        return None
    try:
        return json.loads(body)
    except Exception:
        return None


def strip_stage(raw_path: str) -> str:
    # Converts "/prod/health" -> "/health"
    if not raw_path:
        return "/"
    parts = raw_path.split("/")
    # ["", "prod", "health"] -> "/health"
    if len(parts) >= 3:
        return "/" + "/".join(parts[2:])
    return raw_path


def claims(event) -> dict:
    # HTTP API JWT authorizer places claims here (when enabled on route)
    rc = event.get("requestContext") or {}
    auth = rc.get("authorizer") or {}
    jwt = auth.get("jwt") or {}
    return jwt.get("claims") or {}


def authed_sub(event) -> str | None:
    return claims(event).get("sub")


def header(event, name: str) -> str | None:
    h = event.get("headers") or {}
    for k, v in h.items():
        if k.lower() == name.lower():
            return v
    return None


def effective_student_id(event) -> str | None:
    """
    Prefer Cognito JWT sub when authorizer is enabled.
    If not present, allow dev header fallback when DEV_AUTH_ENABLED=true.
    """
   

    sub = authed_sub(event)
    if sub:
        return sub

    if not DEV_AUTH_ENABLED:
        return None

    dev_id = header(event, DEV_AUTH_HEADER)
    if not dev_id:
        return None

    # Optional shared secret
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

    now = iso_now()
    item = {
        "id": sub,
        "name": "Test Student",
        "yearLabel": "Year 1",
        "avatarUrl": None,
        "createdAt": now,
        "updatedAt": now,
    }

    # Prevent race overwrite if created simultaneously
    students.put_item(Item=item, ConditionExpression="attribute_not_exists(id)")
    return resp(200, item)


def handle_instructors_batch(event):
    body = safe_json(event.get("body") or "")
    ids = body.get("ids") if isinstance(body, dict) else None
    if not isinstance(ids, list) or len(ids) == 0:
        return resp(200, [])

    ids = ids[:100]  # BatchGet limit

    # BatchGet (does not guarantee order). NOTE: no UnprocessedKeys retry yet.
    keys = [{"id": x} for x in ids]
    bg = dynamodb.batch_get_item(RequestItems={T["INSTRUCTORS"]: {"Keys": keys}})
    items = bg.get("Responses", {}).get(T["INSTRUCTORS"], [])

    by_id = {it.get("id"): it for it in items if it.get("id")}
    ordered = [by_id.get(i) for i in ids if by_id.get(i) is not None]
    return resp(200, ordered)


def handle_get_course(course_id: str):
    courses = dynamodb.Table(T["COURSES"])
    got = courses.get_item(Key={"id": course_id})
    return resp(200, got.get("Item"))


def handle_list_units(course_id: str):
    units = dynamodb.Table(T["UNITS"])
    q = units.query(
        IndexName=IDX["COURSE_UNITS"],
        KeyConditionExpression=Key("courseId").eq(course_id),
    )
    return resp(200, q.get("Items", []))


def handle_get_unit(unit_id: str):
    units = dynamodb.Table(T["UNITS"])
    got = units.get_item(Key={"id": unit_id})
    return resp(200, got.get("Item"))


def handle_list_objectives(unit_id: str):
    objectives = dynamodb.Table(T["OBJECTIVES"])
    q = objectives.query(
        IndexName=IDX["UNIT_OBJECTIVES"],
        KeyConditionExpression=Key("unitId").eq(unit_id),
    )
    return resp(200, q.get("Items", []))


def handle_get_objective(objective_id: str):
    objectives = dynamodb.Table(T["OBJECTIVES"])
    got = objectives.get_item(Key={"id": objective_id})
    return resp(200, got.get("Item"))


def handle_list_questions_for_objective(objective_id: str):
    questions = dynamodb.Table(T["QUESTIONS"])
    q = questions.query(
        IndexName=IDX["OBJECTIVE_QUESTIONS"],
        KeyConditionExpression=Key("objectiveId").eq(objective_id),
        ScanIndexForward=True,  # ascending difficultyStars
    )
    return resp(200, q.get("Items", []))


def handle_get_question(question_id: str):
    questions = dynamodb.Table(T["QUESTIONS"])
    got = questions.get_item(Key={"id": question_id})
    return resp(200, got.get("Item"))


def handle_list_courses_for_student(event, student_id_param: str | None):
    sub = effective_student_id(event)
    if not sub:
        return resp(401, {"error": "Unauthorized"})

    # Enforce path param matches identity (helps catch frontend bugs)
    if student_id_param and student_id_param != sub:
        return resp(403, {"error": "Forbidden"})

    enrollments = dynamodb.Table(T["ENROLLMENTS"])
    enr = enrollments.query(KeyConditionExpression=Key("studentId").eq(sub))
    course_ids = [it.get("courseId") for it in enr.get("Items", []) if it.get("courseId")]
    if not course_ids:
        return resp(200, [])

    keys = [{"id": cid} for cid in course_ids[:100]]
    bg = dynamodb.batch_get_item(RequestItems={T["COURSES"]: {"Keys": keys}})
    items = bg.get("Responses", {}).get(T["COURSES"], [])
    by_id = {it.get("id"): it for it in items if it.get("id")}
    ordered = [by_id.get(cid) for cid in course_ids if by_id.get(cid) is not None]
    return resp(200, ordered)

def handle_list_stages_for_objective(objective_id: str):
    stages = dynamodb.Table(T["ITEM_STAGES"])
    q = stages.query(
        IndexName=IDX["ITEM_STAGES_BY_ITEM"],
        KeyConditionExpression=Key("itemId").eq(objective_id),
        ScanIndexForward=True,  # order asc
    )
    return resp(200, q.get("Items", []))

def handle_get_stage(stage_id: str):
    stages = dynamodb.Table(T["ITEM_STAGES"])
    got = stages.get_item(Key={"id": stage_id})
    item = got.get("Item")
    # Contract expects 404 if missing
    if not item:
        return resp(404, {"error": "Stage not found"})
    return resp(200, item)


# ---- Main router ----
def handler(event, context):
    
    try:
        method, path = method_and_path(event)
        params = event.get("pathParameters") or {}

        # CORS preflight
        if method == "OPTIONS":
            return resp_options()

        # Public
        if method == "GET" and path == "/health":
            return handle_health()

        # Auth-ish endpoints (JWT if present; dev header fallback if enabled)
        if method == "GET" and path == "/current-student":
            return handle_current_student(event)

        if method == "GET" and path.endswith("/courses") and path.startswith("/students/"):
            # GET /students/{studentId}/courses
            return handle_list_courses_for_student(event, params.get("studentId"))

        # Instructors
        if method == "POST" and path == "/instructors/batch":
            return handle_instructors_batch(event)

        # Courses
        if method == "GET" and path.endswith("/units") and path.startswith("/courses/"):
            # GET /courses/{courseId}/units
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_list_units(course_id)

        if method == "GET" and path.startswith("/courses/") and "/units" not in path:
            # GET /courses/{courseId}
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_get_course(course_id)

        # Units
        if method == "GET" and path.endswith("/objectives") and path.startswith("/units/"):
            # GET /units/{unitId}/objectives
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_list_objectives(unit_id)

        if method == "GET" and path.startswith("/units/") and "/objectives" not in path:
            # GET /units/{unitId}
            unit_id = params.get("unitId")
            if not unit_id:
                return resp(400, {"error": "Missing unitId"})
            return handle_get_unit(unit_id)

        # Objectives
        if method == "GET" and path.endswith("/questions") and path.startswith("/objectives/"):
            # GET /objectives/{objectiveId}/questions
            objective_id = params.get("objectiveId")
            if not objective_id:
                return resp(400, {"error": "Missing objectiveId"})
            return handle_list_questions_for_objective(objective_id)

        if method == "GET" and path.startswith("/objectives/") and "/questions" not in path:
            # GET /objectives/{objectiveId}
            objective_id = params.get("objectiveId")
            if not objective_id:
                return resp(400, {"error": "Missing objectiveId"})
            return handle_get_objective(objective_id)

        # Questions
        if method == "GET" and path.startswith("/questions/"):
            # GET /questions/{questionId}
            question_id = params.get("questionId")
            if not question_id:
                return resp(400, {"error": "Missing questionId"})
            return handle_get_question(question_id)

        # Stages
if method == "GET" and path.endswith("/stages") and path.startswith("/objectives/"):
    # GET /objectives/{objectiveId}/stages
    objective_id = params.get("objectiveId")
    if not objective_id:
        return resp(400, {"error": "Missing objectiveId"})
    return handle_list_stages_for_objective(objective_id)

if method == "GET" and path.startswith("/stages/"):
    # GET /stages/{stageId}
    stage_id = params.get("stageId")
    if not stage_id:
        return resp(400, {"error": "Missing stageId"})
    return handle_get_stage(stage_id)

        return resp(404, {"error": "Route not found", "method": method, "path": path})
    except Exception as e:
        return resp(500, {"error": "Server error", "details": str(e)})
