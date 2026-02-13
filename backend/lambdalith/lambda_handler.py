import json
import os
from datetime import datetime, timezone

import boto3
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
}

# ---- Indexes (env vars) ----
IDX = {
    "COURSE_UNITS": os.environ["COURSE_UNITS_INDEX"],
    "UNIT_OBJECTIVES": os.environ["UNIT_OBJECTIVES_INDEX"],
    "OBJECTIVE_QUESTIONS": os.environ["OBJECTIVE_QUESTIONS_INDEX"],
}

# ---- Helpers ----
def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def resp(status: int, obj):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(obj),
    }

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
    sub = authed_sub(event)
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
    instructors = dynamodb.Table(T["INSTRUCTORS"])

    # BatchGet (does not guarantee order)
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

def handle_list_courses_for_student(event):
    sub = authed_sub(event)
    if not sub:
        return resp(401, {"error": "Unauthorized"})

    enrollments = dynamodb.Table(T["ENROLLMENTS"])
    enr = enrollments.query(KeyConditionExpression=Key("studentId").eq(sub))
    course_ids = [it.get("courseId") for it in enr.get("Items", []) if it.get("courseId")]
    if not course_ids:
        return resp(200, [])

    # BatchGet courses then reorder by course_ids
    keys = [{"id": cid} for cid in course_ids[:100]]
    bg = dynamodb.batch_get_item(RequestItems={T["COURSES"]: {"Keys": keys}})
    items = bg.get("Responses", {}).get(T["COURSES"], [])
    by_id = {it.get("id"): it for it in items if it.get("id")}
    ordered = [by_id.get(cid) for cid in course_ids if by_id.get(cid) is not None]

    return resp(200, ordered)

# ---- Main router ----
def handler(event, context):
    try:
        method, path = method_and_path(event)
        params = event.get("pathParameters") or {}

        # Public
        if method == "GET" and path == "/health":
            return handle_health()

        # Auth endpoints (API Gateway authorizer should enforce; we still check in code)
        if method == "GET" and path == "/current-student":
            return handle_current_student(event)

        if method == "GET" and path.endswith("/courses") and path.startswith("/students/"):
            # GET /students/{studentId}/courses (we ignore param and use token sub)
            return handle_list_courses_for_student(event)

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

        return resp(404, {"error": "Route not found", "method": method, "path": path})
    except Exception as e:
        # This ensures you see useful details while iterating
        return resp(500, {"error": "Server error", "details": str(e)})
