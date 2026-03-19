from tenacity import retry, stop_after_attempt

from utils.config import ai_client
from utils.prompt import Prompt
from utils.get_prompt_details import get_prompt_details, RAW_PROMPT_KEY, JSON_SCHEMA_KEY

# Models
GEM_3_FLASH = "gemini-3-flash-preview"

# Retry settings
GRADE_INFO_TRIES = 3

# Load prompt and schema once at module level
_grade_info_details = get_prompt_details("gen_info_feedback")
_grade_info_prompt = Prompt(_grade_info_details[RAW_PROMPT_KEY])
_grade_info_schema = _grade_info_details[JSON_SCHEMA_KEY]


@retry(stop=stop_after_attempt(GRADE_INFO_TRIES))
def grade_info(grade: str, subject: str, information: str, question: str, answer: str) -> tuple[bool, str]:
    content = _grade_info_prompt.arguments_to_content(
        GRADE=grade,
        SUBJECT=subject,
        INFORMATION=information,
        QUESTION=question,
        ANSWER=answer,
    )
    response = ai_client.models.generate_content(
        model=GEM_3_FLASH,
        contents=content,
        config={
            "response_mime_type": "application/json",
            "response_schema": _grade_info_schema,
        },
    )
    result = response.parsed
    return result["is_correct"], result["tutor_feedback"]  # type: ignore


RESPOND_TRIES = 3

# Load respond prompt and schema once at module level
_respond_details = get_prompt_details("gen_info_respond")
_respond_prompt = Prompt(_respond_details[RAW_PROMPT_KEY])
_respond_schema = _respond_details[JSON_SCHEMA_KEY]


@retry(stop=stop_after_attempt(RESPOND_TRIES))
def respond_to_knowledge_answer(
    grade: str,
    subject: str,
    information: str,
    question: str,
    conversation_history: str,
    answer: str,
    attempt_number: int,
) -> tuple[str, str]:
    """Evaluate a student's knowledge answer with support for partial responses.

    Returns (outcome, tutor_feedback) where outcome is 'correct', 'incorrect', or 'partial'.
    'partial' is only returned on attempt 1; attempt 2 always returns 'correct' or 'incorrect'.
    """
    content = _respond_prompt.arguments_to_content(
        GRADE=grade,
        SUBJECT=subject,
        INFORMATION=information,
        QUESTION=question,
        CONVERSATION_HISTORY=conversation_history,
        ANSWER=answer,
        ATTEMPT_NUMBER=str(attempt_number),
    )
    response = ai_client.models.generate_content(
        model=GEM_3_FLASH,
        contents=content,
        config={
            "response_mime_type": "application/json",
            "response_schema": _respond_schema,
        },
    )
    result = response.parsed
    outcome = result["outcome"]  # type: ignore
    # Enforce: attempt 1 always returns "correct" or "partial" (never "incorrect")
    if attempt_number == 1 and outcome == "incorrect":
        outcome = "partial"
    # Enforce: attempt 2 cannot return "partial"
    if attempt_number >= 2 and outcome == "partial":
        outcome = "incorrect"
    return outcome, result["tutor_feedback"]  # type: ignore


GEN_QUESTION_TRIES = 3

# Load question-generation prompt and schema once at module level
_gen_question_details = get_prompt_details("gen_info_question")
_gen_question_prompt = Prompt(_gen_question_details[RAW_PROMPT_KEY])
_gen_question_schema = _gen_question_details[JSON_SCHEMA_KEY]


@retry(stop=stop_after_attempt(GEN_QUESTION_TRIES))
def generate_info_question(grade: str, subject: str, description: str) -> str:
    """Generate a new knowledge question for the given topic description."""
    content = _gen_question_prompt.arguments_to_content(
        GRADE=grade,
        SUBJECT=subject,
        DESCRIPTION=description,
    )
    response = ai_client.models.generate_content(
        model=GEM_3_FLASH,
        contents=content,
        config={
            "response_mime_type": "application/json",
            "response_schema": _gen_question_schema,
        },
    )
    return response.parsed["Question"]  # type: ignore


if __name__ == "__main__":
    import random

    GRADE = "7"
    SUBJECT = "Science"

    SCIENCE_INFO = [
        "Age of the Earth: approximately 4.5 billion years old, determined by radiometric dating of rocks and meteorites",
        "Cell membrane: a thin, flexible barrier surrounding every cell that controls what substances enter and leave the cell",
        "Photosynthesis: the process by which plants use sunlight, water, and carbon dioxide to produce glucose (sugar) and oxygen",
        "Tectonic plates: large sections of Earth's crust and upper mantle that slowly move, causing earthquakes, volcanic activity, and the formation of mountains at their boundaries",
        "DNA: a molecule found in the nucleus of every cell that carries genetic instructions for the development, functioning, growth, and reproduction of all living organisms",
        "Newton's First Law of Motion: an object at rest stays at rest and an object in motion stays in motion at the same speed and direction unless acted on by an unbalanced force",
        "Water cycle: the continuous movement of water through Earth's systems via evaporation (liquid to vapor), condensation (vapor to liquid, forming clouds), and precipitation (water falling back to Earth as rain or snow)",
        "Atoms and elements: all matter is made of atoms, which are the smallest unit of an element that retains its chemical properties; elements are pure substances made of only one kind of atom",
        "Mitosis: the process by which a cell duplicates its chromosomes and divides into two genetically identical daughter cells, used for growth and tissue repair in living organisms",
        "Gravity: the attractive force between any two objects with mass; near Earth's surface it pulls objects downward with an acceleration of about 9.8 m/s²",
    ]

    # Load gen_info_question prompt and schema
    _gen_question_details = get_prompt_details("gen_info_question")
    _gen_question_prompt = Prompt(_gen_question_details[RAW_PROMPT_KEY])
    _gen_question_schema = _gen_question_details[JSON_SCHEMA_KEY]

    # Pick a random piece of information
    information = random.choice(SCIENCE_INFO)

    # Generate a question
    print("Generating question...\n")
    content = _gen_question_prompt.arguments_to_content(
        GRADE=GRADE,
        SUBJECT=SUBJECT,
        DESCRIPTION=information,
    )
    response = ai_client.models.generate_content(
        model=GEM_3_FLASH,
        contents=content,
        config={
            "response_mime_type": "application/json",
            "response_schema": _gen_question_schema,
        },
    )
    question = response.parsed["Question"]  # type: ignore

    print(f"Question: {question}\n")

    # Wait for student answer
    answer = input("Your answer: ").strip()
    print()

    # Grade the answer and print feedback
    print("Grading...\n")
    is_correct, feedback = grade_info(GRADE, SUBJECT, information, question, answer)

    print(f"Result: {'Correct!' if is_correct else 'Incorrect.'}")
    print(f"\nTutor feedback:\n{feedback}")
