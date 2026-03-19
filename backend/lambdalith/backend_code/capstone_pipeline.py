"""
Capstone pipeline: identifies the student's weakest skill and runs
a "teach it back" conversation where the student teaches the concept
to a curious AI learner.
"""

from tenacity import retry, stop_after_attempt, stop_after_delay

from utils.config import ai_client
from utils.prompt import Prompt
from utils.get_prompt_details import get_prompt_details, RAW_PROMPT_KEY, JSON_SCHEMA_KEY

# Models
GEM_3_FLASH = "gemini-3-flash-preview"

# Retry settings
CAPSTONE_TEACH_TRIES = 3
CAPSTONE_TEACH_TIMEOUT = 3 * 60

# Load prompt and schema once at module level
_details = get_prompt_details("capstone_teach")
_prompt = Prompt(_details[RAW_PROMPT_KEY])
_schema = _details[JSON_SCHEMA_KEY]

# Weakness ranking: higher score = weaker performance
_CATEGORY_WEAKNESS = {
    "incorrect": 4,
    "small mistake": 3,
    "slight clarification": 2,
    "correct": 1,
}


def _format_conversation(conversation: list[dict]) -> str:
    if not conversation:
        return "(No conversation yet — this is the first message.)"
    lines = []
    for turn in conversation:
        label = "Student" if turn["role"] == "student" else "Learner"
        lines.append(f"[{label}]: {turn['content']}")
    return "\n".join(lines)


def identify_weakest_skill(dynamodb, table_names: dict, index_names: dict,
                           unit_id: str, student_id: str) -> dict:
    """
    Find the skill objective where the student struggled the most,
    based on grading categories stored in challenge-stage chat messages.

    Returns {"objective_id", "title", "description", "grading_feedback"}.
    """
    from boto3.dynamodb.conditions import Key

    # 1. Get all skill objectives for the unit
    objectives_tbl = dynamodb.Table(table_names["OBJECTIVES"])
    objs = []
    resp = objectives_tbl.query(
        IndexName=index_names["UNIT_OBJECTIVES"],
        KeyConditionExpression=Key("unitId").eq(unit_id),
    )
    objs = resp.get("Items", [])
    while resp.get("LastEvaluatedKey"):
        resp = objectives_tbl.query(
            IndexName=index_names["UNIT_OBJECTIVES"],
            KeyConditionExpression=Key("unitId").eq(unit_id),
            ExclusiveStartKey=resp["LastEvaluatedKey"],
        )
        objs.extend(resp.get("Items", []))

    skill_objs = [o for o in objs if o.get("kind") == "skill"]
    if not skill_objs:
        return {"objective_id": "", "title": "General Review", "description": "Review the unit material", "grading_feedback": "No specific skill data available."}

    # 2. For each skill, find the thread and check challenge grading categories
    threads_tbl = dynamodb.Table(table_names["CHAT_THREADS"])
    msgs_tbl = dynamodb.Table(table_names["CHAT_MESSAGES"])

    skill_scores: list[tuple[int, str, dict]] = []  # (weakness_score, worst_feedback, objective)

    for obj in skill_objs:
        obj_id = obj["id"]
        thread_id = f"thread-{obj_id}"

        # Get all messages for this thread
        try:
            msg_resp = msgs_tbl.query(
                KeyConditionExpression=Key("threadId").eq(thread_id),
                ScanIndexForward=True,
            )
            messages = msg_resp.get("Items", [])
        except Exception:
            messages = []

        # Find the worst grading category from tutor messages
        worst_score = 0
        worst_feedback = ""
        for msg in messages:
            if msg.get("role") != "tutor":
                continue
            metadata = msg.get("metadata", {})
            category = metadata.get("gradingCategory", "")
            score = _CATEGORY_WEAKNESS.get(category, 0)
            if score > worst_score:
                worst_score = score
                worst_feedback = msg.get("content", "")

        skill_scores.append((worst_score, worst_feedback, obj))

    # 3. Pick the weakest skill (highest score)
    skill_scores.sort(key=lambda x: x[0], reverse=True)
    worst_score, worst_feedback, weakest_obj = skill_scores[0]

    # If all skills were correct, just pick the first one
    if worst_score <= 1:
        weakest_obj = skill_objs[0]
        worst_feedback = "The student did well overall but could benefit from deeper explanation practice."

    return {
        "objective_id": weakest_obj.get("id", ""),
        "title": weakest_obj.get("title", ""),
        "description": weakest_obj.get("description", weakest_obj.get("title", "")),
        "grading_feedback": worst_feedback,
    }


@retry(stop=(stop_after_attempt(CAPSTONE_TEACH_TRIES) | stop_after_delay(CAPSTONE_TEACH_TIMEOUT)))
def capstone_teach_step(
    subject: str,
    grade: str,
    skill_description: str,
    grading_feedback: str,
    conversation: list[dict],
) -> dict:
    """
    Advance the capstone teach-back session by one step.

    The AI plays a curious student; the real student teaches the concept.

    conversation: list of {"role": "student"|"tutor", "content": str} dicts,
                  ordered oldest-first. Pass an empty list for the first turn.

    Returns {"Tutor_Response": str, "Is_Finished": bool}.
    """
    content = _prompt.arguments_to_content(
        GRADE=grade,
        SUBJECT=subject,
        SKILL_DESCRIPTION=skill_description,
        GRADING_FEEDBACK=grading_feedback,
        CONVERSATION=_format_conversation(conversation),
    )
    response = ai_client.models.generate_content(
        model=GEM_3_FLASH,
        contents=content,
        config={
            "response_mime_type": "application/json",
            "response_schema": _schema,
        },
    )
    return response.parsed  # type: ignore
