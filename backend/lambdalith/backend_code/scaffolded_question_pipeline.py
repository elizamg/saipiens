# Will be implemented later


"""
TODO: Scaffolded question pipeline:

This pipeline takes in a class "subject" (e.g. science), student "grade" level (e.g. 7), and a question.

You should create an agent that acts like a tutor and walks a student through the question by telling them what the next step is and helping them if they get stuck. For the first response, the agent should briefly introduce the question (the student can see the question above the agent's reponse) then explain the first step towards solving the problem to the student. If the student has any questions or gets stuck, the agent should help the student. For the following steps, the agent should look at the student's last step, and if it's correct explain the next step towards solving the problem, and if it's wrong, help the student through how to correct their work and teach them anything they might be missing or misunderstanding.

The agent should take in a conversation and output a response.

The response should be in structured JSON form and have the following:
```
{
    "Tutor_Response": [the response given with the tutor persona that either walkts the student through a step of the problem or helps them get unstuck],

    "Is_Finished": [boolean for whether the student is finished with the problem and has gotten to a satisfactory answer]

}
```

"""

from tenacity import retry, stop_after_attempt, stop_after_delay

from utils.config import ai_client
from utils.prompt import Prompt
from utils.get_prompt_details import get_prompt_details, RAW_PROMPT_KEY, JSON_SCHEMA_KEY

# Models
GEM_3_FLASH = "gemini-3-flash-preview"

# Retry settings
SCAFFOLDED_STEP_TRIES = 3
SCAFFOLDED_STEP_TIMEOUT = 3 * 60

# Load prompt and schema once at module level
_details = get_prompt_details("scaffolded_question")
_prompt = Prompt(_details[RAW_PROMPT_KEY])
_schema = _details[JSON_SCHEMA_KEY]


def _format_conversation(conversation: list[dict]) -> str:
    if not conversation:
        return "(No conversation yet — this is the first message.)"
    lines = []
    for turn in conversation:
        label = "Student" if turn["role"] == "student" else "Tutor"
        lines.append(f"[{label}]: {turn['content']}")
    return "\n".join(lines)


@retry(stop=(stop_after_attempt(SCAFFOLDED_STEP_TRIES) | stop_after_delay(SCAFFOLDED_STEP_TIMEOUT)))
def scaffolded_question_step(
    subject: str,
    grade: str,
    question: str,
    conversation: list[dict],
) -> dict:
    """
    Advance the tutoring session by one step.

    conversation: list of {"role": "student"|"tutor", "content": str} dicts,
                  ordered oldest-first. Pass an empty list for the first turn.

    Returns {"Tutor_Response": str, "Is_Finished": bool}.
    """
    content = _prompt.arguments_to_content(
        GRADE=grade,
        SUBJECT=subject,
        QUESTION=question,
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


if __name__ == "__main__":
    GRADE = "7"
    SUBJECT = "Life Science"
    QUESTION = (
        "A frog skin cell contains 26 chromosomes. "
        "Explain what happens to the chromosomes during mitosis and determine "
        "how many chromosomes each daughter cell will contain."
    )

    conversation: list[dict] = []

    print(f"Question: {QUESTION}")
    print("-" * 60)

    while True:
        result = scaffolded_question_step(SUBJECT, GRADE, QUESTION, conversation)
        tutor_response: str = result["Tutor_Response"]  # type: ignore
        is_finished: bool = result["Is_Finished"]  # type: ignore

        conversation.append({"role": "tutor", "content": tutor_response})

        print(f"\nTutor: {tutor_response}\n")

        if is_finished:
            print("(Problem complete!)")
            break

        student_input = input("You: ").strip()
        if not student_input:
            break

        conversation.append({"role": "student", "content": student_input})
