from tenacity import retry, stop_after_attempt, wait_exponential

from utils.config import ai_client
from utils.prompt import Prompt
from utils.get_prompt_details import get_prompt_details, RAW_PROMPT_KEY, JSON_SCHEMA_KEY

# Models
GEM_3_FLASH = "gemini-3-flash-preview"

# Retry settings
GEN_CLARIFYING_QUESTIONS_TRIES = 4

# Load prompt and schema once at module level
_details = get_prompt_details("gen_clarifying_questions")
_prompt = Prompt(_details[RAW_PROMPT_KEY])
_schema = _details[JSON_SCHEMA_KEY]


@retry(stop=stop_after_attempt(GEN_CLARIFYING_QUESTIONS_TRIES), wait=wait_exponential(multiplier=2, min=10, max=120))
def gen_clarifying_questions(subject: str, grade: str, question: str) -> list[str]:
    content = _prompt.arguments_to_content(
        SUBJECT=subject,
        GRADE=grade,
        QUESTION=question,
    )
    response = ai_client.models.generate_content(
        model=GEM_3_FLASH,
        contents=content,
        config={
            "response_mime_type": "application/json",
            "response_schema": _schema,
        },
    )
    return response.parsed["clarifying_questions"]  # type: ignore


def gen_clarifying_question_answer(subject, grade, question, clarifying_question):
    pass


if __name__ == "__main__":
    from pathlib import Path

    GRADE = "7"
    SUBJECT = "Life Science"

    TEST_QUESTIONS = [
        "Describe the role of mitochondria in a eukaryotic cell.",
        "What is the difference between active transport and passive transport across a cell membrane?",
        "Explain how natural selection leads to adaptations in a population over time.",
        "How do producers, consumers, and decomposers interact in a food web?",
        "What happens to chromosomes during mitosis, and why is this important for the organism?",
    ]

    output_dir = Path(__file__).parent / "example_clarifying_questions"
    output_dir.mkdir(exist_ok=True)
    for f in output_dir.glob("*.md"):
        f.unlink()

    for i, question in enumerate(TEST_QUESTIONS, start=1):
        print(f"Generating clarifying questions for question {i}...")

        questions = gen_clarifying_questions(SUBJECT, GRADE, question)

        slug = question[:40].rstrip().replace(" ", "_").replace("?", "").replace(",", "")
        filename = output_dir / f"{i:02d}_{slug}.md"

        lines = [
            f"# Clarifying Questions — Example {i}",
            "",
            f"**Grade / Subject:** {GRADE}th grade {SUBJECT}",
            "",
            "**Student Question:**",
            f"> {question}",
            "",
            "## Generated Clarifying Questions",
            "",
        ]
        for q in questions:
            lines.append(f"- {q}")

        filename.write_text("\n".join(lines) + "\n")
        print(f"  Saved to {filename.name}")

    print("\nDone.")
