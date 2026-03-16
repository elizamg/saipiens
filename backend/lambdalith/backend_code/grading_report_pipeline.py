from tenacity import retry, stop_after_attempt

from utils.config import ai_client
from utils.prompt import Prompt
from utils.get_prompt_details import get_prompt_details, RAW_PROMPT_KEY, JSON_SCHEMA_KEY

# Models
GEM_3_FLASH = "gemini-3-flash-preview"

# Retry settings
GRADING_REPORT_TRIES = 3

# Load prompts and shared schema once at module level
_teacher_details = get_prompt_details("grading_report_teacher")
_teacher_prompt = Prompt(_teacher_details[RAW_PROMPT_KEY])

_student_details = get_prompt_details("grading_report_student")
_student_prompt = Prompt(_student_details[RAW_PROMPT_KEY])

_report_schema = get_prompt_details("grading_report")[JSON_SCHEMA_KEY]


def _generate_summary(prompt: Prompt, unit_title: str, course_title: str, objectives_data: str, knowledge_data: str) -> str:
    """Call the AI model with the given prompt and return the summary string."""
    content = prompt.arguments_to_content(
        UNIT_TITLE=unit_title,
        COURSE_TITLE=course_title,
        OBJECTIVES_DATA=objectives_data,
        KNOWLEDGE_DATA=knowledge_data,
    )
    response = ai_client.models.generate_content(
        model=GEM_3_FLASH,
        contents=content,
        config={
            "response_mime_type": "application/json",
            "response_schema": _report_schema,
        },
    )
    return response.parsed["summary"]  # type: ignore


@retry(stop=stop_after_attempt(GRADING_REPORT_TRIES))
def generate_teacher_summary(
    unit_title: str,
    course_title: str,
    objectives_data: str,
    knowledge_data: str,
) -> str:
    """Generate a detailed, analytical grading report for the teacher."""
    return _generate_summary(_teacher_prompt, unit_title, course_title, objectives_data, knowledge_data)


@retry(stop=stop_after_attempt(GRADING_REPORT_TRIES))
def generate_student_summary(
    unit_title: str,
    course_title: str,
    objectives_data: str,
    knowledge_data: str,
) -> str:
    """Generate an encouraging, actionable progress report for the student."""
    return _generate_summary(_student_prompt, unit_title, course_title, objectives_data, knowledge_data)
