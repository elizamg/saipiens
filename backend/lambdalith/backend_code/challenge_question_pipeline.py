from enum import StrEnum
from tenacity import retry, stop_after_attempt

from utils.config import ai_client
from utils.prompt import Prompt
from utils.get_prompt_details import get_prompt_details, RAW_PROMPT_KEY, JSON_SCHEMA_KEY

# Models
GEM_3_FLASH = "gemini-3-flash-preview"

# Retry settings
GRADE_SKILL_TRIES = 3

# Load prompt and schema once at module level
_grade_skill_details = get_prompt_details("grade_skill")
_grade_skill_prompt = Prompt(_grade_skill_details[RAW_PROMPT_KEY])
_grade_skill_schema = _grade_skill_details[JSON_SCHEMA_KEY]


class GradingCategory(StrEnum):
    CORRECT = "correct"
    SLIGHT_CLARIFICATION = "slight clarification"
    SMALL_MISTAKE = "small mistake"
    INCORRECT = "incorrect"


@retry(stop=stop_after_attempt(GRADE_SKILL_TRIES))
def grade_skill(grade: str, subject: str, skill: str, question: str, answer: str) -> tuple[GradingCategory, str]:
    content = _grade_skill_prompt.arguments_to_content(
        GRADE=grade,
        SUBJECT=subject,
        SKILL=skill,
        QUESTION=question,
        ANSWER=answer,
    )
    response = ai_client.models.generate_content(
        model=GEM_3_FLASH,
        contents=content,
        config={
            "response_mime_type": "application/json",
            "response_schema": _grade_skill_schema,
        },
    )
    result = response.parsed
    return GradingCategory(result["answer_category"]), result["feedback"]  # type: ignore
