from tenacity import retry, stop_after_attempt, wait_exponential

from utils.config import ai_client
from utils.prompt import Prompt
from utils.get_prompt_details import get_prompt_details, RAW_PROMPT_KEY, JSON_SCHEMA_KEY

# Models
GEM_3_FLASH = "gemini-3-flash-preview"

# Retry settings
GEN_CLARIFYING_QUESTIONS_TRIES = 4

# Load prompts and schemas once at module level
_questions_details = get_prompt_details("gen_clarifying_questions")
_questions_prompt = Prompt(_questions_details[RAW_PROMPT_KEY])
_questions_schema = _questions_details[JSON_SCHEMA_KEY]

_answer_details = get_prompt_details("gen_clarifying_question_answer")
_answer_prompt = Prompt(_answer_details[RAW_PROMPT_KEY])
_answer_schema = _answer_details[JSON_SCHEMA_KEY]


@retry(stop=stop_after_attempt(GEN_CLARIFYING_QUESTIONS_TRIES), wait=wait_exponential(multiplier=2, min=10, max=120))
def gen_clarifying_questions(subject: str, grade: str, question: str) -> list[str]:
    content = _questions_prompt.arguments_to_content(
        SUBJECT=subject,
        GRADE=grade,
        QUESTION=question,
    )
    response = ai_client.models.generate_content(
        model=GEM_3_FLASH,
        contents=content,
        config={
            "response_mime_type": "application/json",
            "response_schema": _questions_schema,
        },
    )
    return response.parsed["clarifying_questions"]  # type: ignore


@retry(stop=stop_after_attempt(GEN_CLARIFYING_QUESTIONS_TRIES), wait=wait_exponential(multiplier=2, min=10, max=120))
def gen_clarifying_question_answer(subject: str, grade: str, skill_description: str, question: str, clarifying_question: str) -> str:
    content = _answer_prompt.arguments_to_content(
        SUBJECT=subject,
        GRADE=grade,
        SKILL_DESCRIPTION=skill_description,
        QUESTION=question,
        CLARIFYING_QUESTION=clarifying_question,
    )
    response = ai_client.models.generate_content(
        model=GEM_3_FLASH,
        contents=content,
        config={
            "response_mime_type": "application/json",
            "response_schema": _answer_schema,
        },
    )
    return response.parsed["tutor_response"]  # type: ignore


if __name__ == "__main__":
    from pathlib import Path

    GRADE = "7"
    SUBJECT = "Life Science"

    TEST_QUESTIONS = [
        {
            "question": "Describe the role of mitochondria in a eukaryotic cell.",
            "skill_description": "Explain that mitochondria produce ATP through cellular respiration, serving as the cell's main energy source.",
        },
        {
            "question": "What is the difference between active transport and passive transport across a cell membrane?",
            "skill_description": "Distinguish active transport (requires energy, moves against concentration gradient) from passive transport (no energy needed, moves with concentration gradient).",
        },
        {
            "question": "Explain how natural selection leads to adaptations in a population over time.",
            "skill_description": "Explain the mechanism: heritable variation exists → individuals with favorable traits survive and reproduce more → those traits become more common over generations.",
        },
        {
            "question": "How do producers, consumers, and decomposers interact in a food web?",
            "skill_description": "Describe how energy and nutrients flow from producers through consumers and are recycled back by decomposers in an ecosystem.",
        },
        {
            "question": "What happens to chromosomes during mitosis, and why is this important for the organism?",
            "skill_description": "Describe how chromosomes are duplicated and then separated equally into two daughter cells, producing genetically identical copies for growth and repair.",
        },
    ]

    output_dir = Path(__file__).parent / "example_clarifying_questions"
    output_dir.mkdir(exist_ok=True)
    for f in output_dir.glob("*.md"):
        f.unlink()

    for i, entry in enumerate(TEST_QUESTIONS, start=1):
        question = entry["question"]
        skill_description = entry["skill_description"]

        print(f"Generating clarifying questions for question {i}...")
        questions = gen_clarifying_questions(SUBJECT, GRADE, question)

        print(f"  Generating tutor responses for {len(questions)} clarifying questions...")
        qa_pairs = []
        for cq in questions:
            answer = gen_clarifying_question_answer(SUBJECT, GRADE, skill_description, question, cq)
            qa_pairs.append((cq, answer))

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
            f"**Skill Being Tested:** {skill_description}",
            "",
            "## Clarifying Questions and Tutor Responses",
            "",
        ]
        for cq, answer in qa_pairs:
            lines.append(f"**Q:** {cq}")
            lines.append(f"**A:** {answer}")
            lines.append("")

        filename.write_text("\n".join(lines) + "\n")
        print(f"  Saved to {filename.name}")

    print("\nDone.")
