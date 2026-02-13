import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

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

    # NEW: stages + progress + chat + awards + feedback
    "ITEM_STAGES": os.environ["ITEM_STAGES_TABLE"],
    "STUDENT_OBJECTIVE_PROGRESS": os.environ["STUDENT_OBJECTIVE_PROGRESS_TABLE"],
    "CHAT_THREADS": os.environ["CHAT_THREADS_TABLE"],
    "CHAT_MESSAGES": os.environ["CHAT_MESSAGES_TABLE"],
    "AWARDS": os.environ["AWARDS_TABLE"],
    "FEEDBACK_ITEMS": os.environ["FEEDBACK_ITEMS_TABLE"],
}

# ---- Indexes (env vars) ----
IDX = {
    "COURSE_UNITS": os.environ["COURSE_UNITS_INDEX"],
    "UNIT_OBJECTIVES": os.environ["UNIT_OBJECTIVES_INDEX"],
    "OBJECTIVE_QUESTIONS": os.environ["OBJECTIVE_QUESTIONS_INDEX"],

    # NEW
    "ITEM_STAGES_BY_ITEM": os.environ["ITEM_STAGES_BY_ITEM_INDEX"],
    "UNIT_THREADS": os.environ["UNIT_THREADS_INDEX"],
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
    """
    Minimal POST JSON validation: if Content-Type is set and not application/json -> 415.
    If body isn't valid JSON -> 400.
    Returns: (err_response_or_None, parsed_body_or_None)
    """
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


def header(event, name: str) -> str | None:
    h = event.get("headers") or {}
    for k, v in h.items():
        if k.lower() == name.lower():
            return v
    return None


def effective_student_id(event) -> str | None:
    sub = authed_sub(event)
    if sub:
        return sub

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
    # earnedStars means completed stages count.
    # If 0 completed -> current is begin
    # If 1 completed -> current is walkthrough
    # If 2 completed -> current is challenge
    # If 3 completed -> still "challenge" (complete)
    if earned_stars <= 0:
        return "begin"
    if earned_stars == 1:
        return "walkthrough"
    return "challenge"


def _stage_id_for(objective_id: str, stage_type: str) -> str | None:
    # We’ll look up from ItemStages; caller can pass in a preloaded map for efficiency.
    return None

def batch_get_all(table_name: str, keys: list[dict], max_retries: int = 5) -> list[dict]:
    """
    DynamoDB BatchGet can return UnprocessedKeys. This helper retries until done (or max_retries).
    NOTE: keys must be DynamoDB key dicts like {"id": "..."} (DocumentClient style via boto3 resource).
    """
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
            # Stop retrying; return what we have
            break

        request = {table_name: {"Keys": unprocessed[table_name]["Keys"]}}

    return out


# ---- Route handlers (existing) ----
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



def handle_get_course(course_id: str):
    courses = dynamodb.Table(T["COURSES"])
    got = courses.get_item(Key={"id": course_id})
    item = got.get("Item")
    if not item:
        return resp_not_found("Course")
    return resp(200, item)


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
    item = got.get("Item")
    if not item:
        return resp_not_found("Unit")
    return resp(200, item)


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
    item = got.get("Item")
    if not item:
        return resp_not_found("Objective")
    return resp(200, item)


def handle_list_questions_for_objective(objective_id: str):
    questions = dynamodb.Table(T["QUESTIONS"])
    q = questions.query(
        IndexName=IDX["OBJECTIVE_QUESTIONS"],
        KeyConditionExpression=Key("objectiveId").eq(objective_id),
        ScanIndexForward=True,
    )
    return resp(200, q.get("Items", []))


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
    enr = enrollments.query(KeyConditionExpression=Key("studentId").eq(sub))
    course_ids = [it.get("courseId") for it in enr.get("Items", []) if it.get("courseId")]
    if not course_ids:
        return resp(200, [])

    keys = [{"id": cid} for cid in course_ids[:100]]
    items = batch_get_all(T["COURSES"], keys)

    by_id = {it.get("id"): it for it in items if it.get("id")}
    ordered = [by_id.get(cid) for cid in course_ids if by_id.get(cid) is not None]
    return resp(200, ordered)



# ---- Stages (contract) ----
def handle_list_stages_for_objective(objective_id: str):
    stages = dynamodb.Table(T["ITEM_STAGES"])
    q = stages.query(
        IndexName=IDX["ITEM_STAGES_BY_ITEM"],
        KeyConditionExpression=Key("itemId").eq(objective_id),
        ScanIndexForward=True,
    )
    return resp(200, q.get("Items", []))


def handle_get_stage(stage_id: str):
    stages = dynamodb.Table(T["ITEM_STAGES"])
    got = stages.get_item(Key={"id": stage_id})
    item = got.get("Item")
    if not item:
        return resp(404, {"error": "Stage not found"})
    return resp(200, item)


def _load_stages_by_objective(objective_id: str) -> list[dict]:
    stages = dynamodb.Table(T["ITEM_STAGES"])
    q = stages.query(
        IndexName=IDX["ITEM_STAGES_BY_ITEM"],
        KeyConditionExpression=Key("itemId").eq(objective_id),
        ScanIndexForward=True,
    )
    return q.get("Items", [])


def _current_stage_id_from_stages(stages: list[dict], stage_type: str) -> str | None:
    for s in stages:
        if s.get("stageType") == stage_type:
            return s.get("id")
    return None


# ---- Progress (contract) ----
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
        # Ensure currentStageType exists (backward compatible)
        if not item.get("currentStageType"):
            earned = int(item.get("earnedStars") or 0)
            item["currentStageType"] = _compute_current_stage_type(earned)

    return resp(200, item)


def handle_list_unit_progress_items(event, unit_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    # objectives in unit
    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    obj_q = objectives_tbl.query(
        IndexName=IDX["UNIT_OBJECTIVES"],
        KeyConditionExpression=Key("unitId").eq(unit_id),
        ScanIndexForward=True,
    )
    objectives = obj_q.get("Items", [])
    obj_ids = {o.get("id") for o in objectives if o.get("id")}

    if not obj_ids:
        return resp(200, [])

    # all progress for student, then filter (simple + fine for MVP)
    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    p_q = prog_tbl.query(KeyConditionExpression=Key("studentId").eq(student_id))
    all_prog = p_q.get("Items", [])

    by_obj = {p.get("objectiveId"): p for p in all_prog if p.get("objectiveId")}
    out = []
    for oid in obj_ids:
        p = by_obj.get(oid)
        if not p:
            p = _default_progress(student_id, oid)
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
    obj_q = objectives_tbl.query(
        IndexName=IDX["UNIT_OBJECTIVES"],
        KeyConditionExpression=Key("unitId").eq(unit_id),
        ScanIndexForward=True,
    )
    objectives = obj_q.get("Items", [])
    total = len(objectives)
    if total == 0:
        return resp(200, {"unitId": unit_id, "totalObjectives": 0, "completedObjectives": 0, "progressPercent": 0})

    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    p_q = prog_tbl.query(KeyConditionExpression=Key("studentId").eq(student_id))
    all_prog = p_q.get("Items", [])

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
        # create with earnedStars: 1 and currentStageType: walkthrough
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


# ---- Awards (contract) ----
def handle_list_awards(event, course_id: str | None = None):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    awards_tbl = dynamodb.Table(T["AWARDS"])
    q = awards_tbl.query(KeyConditionExpression=Key("studentId").eq(student_id))
    items = q.get("Items", [])
    if course_id:
        items = [a for a in items if a.get("courseId") == course_id]
    return resp(200, items)


# ---- Feedback (contract) ----
def handle_list_feedback(event, course_id: str | None = None):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    fb_tbl = dynamodb.Table(T["FEEDBACK_ITEMS"])
    q = fb_tbl.query(KeyConditionExpression=Key("studentId").eq(student_id))
    items = q.get("Items", [])
    if course_id:
        items = [f for f in items if f.get("courseId") == course_id]
    return resp(200, items)


# ---- Chat (contract) ----
def _ensure_threads_for_unit(unit: dict, objectives: list[dict], existing_threads: list[dict]) -> list[dict]:
    """
    Contract expects one thread per objective.
    For efficiency during integration/testing, we auto-create missing threads.
    Thread id is deterministic: thread-{objectiveId}
    """
    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    existing_by_obj = {t.get("objectiveId"): t for t in existing_threads if t.get("objectiveId")}
    out = list(existing_threads)

    course_id = unit.get("courseId")
    unit_id = unit.get("id")

    for obj in objectives:
        oid = obj.get("id")
        if not oid:
            continue
        if oid in existing_by_obj:
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
            # If a race, ignore and rely on future reads
            pass

    return out


def handle_list_threads_for_unit(event, unit_id: str):
    student_id = effective_student_id(event)
    if not student_id:
        return resp(401, {"error": "Unauthorized"})

    # fetch unit (need courseId)
    units_tbl = dynamodb.Table(T["UNITS"])
    unit = units_tbl.get_item(Key={"id": unit_id}).get("Item")
    if not unit:
        return resp(404, {"error": "Unit not found"})

    # objectives for unit (need order + kind)
    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    obj_q = objectives_tbl.query(
        IndexName=IDX["UNIT_OBJECTIVES"],
        KeyConditionExpression=Key("unitId").eq(unit_id),
        ScanIndexForward=True,
    )
    objectives = obj_q.get("Items", [])
    obj_by_id = {o.get("id"): o for o in objectives if o.get("id")}

    # existing threads by unit via GSI
    threads_tbl = dynamodb.Table(T["CHAT_THREADS"])
    t_q = threads_tbl.query(
        IndexName=IDX["UNIT_THREADS"],
        KeyConditionExpression=Key("unitId").eq(unit_id),
        ScanIndexForward=True,
    )
    threads = t_q.get("Items", [])

    # auto-create missing
    threads = _ensure_threads_for_unit(unit, objectives, threads)

    # progress for student (query once)
    prog_tbl = dynamodb.Table(T["STUDENT_OBJECTIVE_PROGRESS"])
    p_q = prog_tbl.query(KeyConditionExpression=Key("studentId").eq(student_id))
    all_prog = p_q.get("Items", [])
    prog_by_obj = {p.get("objectiveId"): p for p in all_prog if p.get("objectiveId")}

    # build ThreadWithProgress
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

    # Sort by objective order (contract uses order in ThreadWithProgress)
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

    # objective for order
    objectives_tbl = dynamodb.Table(T["OBJECTIVES"])
    obj = objectives_tbl.get_item(Key={"id": oid}).get("Item") or {}
    order = obj.get("order", 0)

    # progress
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
    q = msgs_tbl.query(
        KeyConditionExpression=Key("threadId").eq(thread_id),
        ScanIndexForward=True,  # createdAt asc
    )
    items = q.get("Items", [])

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

    # bump thread lastMessageAt
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


# ---- Main router ----
def handler(event, context):
    try:
        method, path = method_and_path(event)
        params = event.get("pathParameters") or {}

        if method == "OPTIONS":
            return resp_options()

        # Public
        if method == "GET" and path == "/health":
            return handle_health()

        # Current user
        if method == "GET" and path == "/current-student":
            return handle_current_student(event)

        # Student courses
        if method == "GET" and path.endswith("/courses") and path.startswith("/students/"):
            return handle_list_courses_for_student(event, params.get("studentId"))

        # Instructors
        if method == "POST" and path == "/instructors/batch":
            return handle_instructors_batch(event)

        # Courses
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

        # Units
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

        # Objectives
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

        # Questions
        if method == "GET" and path.startswith("/questions/"):
            question_id = params.get("questionId")
            if not question_id:
                return resp(400, {"error": "Missing questionId"})
            return handle_get_question(question_id)

        # Stage by id
        if method == "GET" and path.startswith("/stages/"):
            stage_id = params.get("stageId")
            if not stage_id:
                return resp(400, {"error": "Missing stageId"})
            return handle_get_stage(stage_id)

        # Progress for unit
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

        # Awards
        if method == "GET" and path == "/awards":
            return handle_list_awards(event)

        if method == "GET" and path.endswith("/awards") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_list_awards(event, course_id=course_id)

        # Feedback
        if method == "GET" and path == "/feedback":
            return handle_list_feedback(event)

        if method == "GET" and path.endswith("/feedback") and path.startswith("/courses/"):
            course_id = params.get("courseId")
            if not course_id:
                return resp(400, {"error": "Missing courseId"})
            return handle_list_feedback(event, course_id=course_id)

        # Chat threads
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

        return resp(404, {"error": "Route not found", "method": method, "path": path})
    except Exception as e:
        return resp(500, {"error": "Server error", "details": str(e)})
