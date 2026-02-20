import time
import requests
import json
from pprint import pprint
from google import genai
from tenacity import retry, stop_after_attempt, stop_after_delay

from utils.config import Config
from utils.config import ai_client

from utils.prompt import Prompt
from utils.get_prompt_details import get_prompt_details, RAW_PROMPT_KEY, JSON_SCHEMA_KEY

ENV_GEMINI_API_KEY = Config.GEMINI_API_KEY

# Main Settings
QUESTIONS_PER_KNOWLEDGE = 2

# Models
GEM_3_FLASH = "gemini-3-flash-preview"

# Retry and model settings
DOWNLOAD_PDF_TRIES = 2

UPLOAD_PDF_TRIES = 2
UPLOAD_PDF_TIMEOUT = 120

IDENTIFY_KNOWLEDGE_MODEL = GEM_3_FLASH
IDENTIFY_KNOWLEDGE_TRIES = 3
IDENTIFY_KNOWLEDGE_TIMEOUT = 11*60

GEN_QUESTION_TRIES = 3
GEN_QUESTION_TIMEOUT = 3*60

# Testing settings
TEST_TEXTBOOK_CHAPTER_DOWNLOAD_URL = "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/756/Jenkins_Independent_Schools/a1b6f2a0-efa2-4a86-8c48-390b571c4967/chap_03.pdf?disposition=inline"
TEST_TEXTBOOK_CHAPTER_PATH = "chapter_3.pdf"

class Gen_Curriculum_Pipeline:
    def __init__(self):
        self.client = ai_client

        identify_knowledge_details = get_prompt_details("identify_knowledge")
        self.identify_knowledge_prompt = Prompt(identify_knowledge_details[RAW_PROMPT_KEY])
        self.identify_knowledge_schema = identify_knowledge_details[JSON_SCHEMA_KEY]

        gen_skill_question_details = get_prompt_details("gen_skill_question")
        self.gen_skill_question_prompt = Prompt(gen_skill_question_details[RAW_PROMPT_KEY])
        # Schema file wraps the actual schema under "generationConfig.response_schema"
        self.gen_skill_question_schema = gen_skill_question_details[JSON_SCHEMA_KEY]["generationConfig"]["response_schema"]

        gen_info_question_details = get_prompt_details("gen_info_question")
        self.gen_info_question_prompt = Prompt(gen_info_question_details[RAW_PROMPT_KEY])
        # Schema file wraps the actual schema under "response_schema"
        self.gen_info_question_schema = gen_info_question_details[JSON_SCHEMA_KEY]["response_schema"]
    
    @retry(stop=(stop_after_attempt(DOWNLOAD_PDF_TRIES)))
    def download_pdf(self, url, output_file_path):
        try:
            # Send a GET request to the URL
            # stream=True ensures we don't load the whole file into memory at once
            response = requests.get(url, stream=True)
            
            # Raise an error for bad status codes (like 404 or 500)
            response.raise_for_status()

            # Open a local file with write-binary (wb) mode
            with open(output_file_path, 'wb') as file:
                for chunk in response.iter_content(chunk_size=8192):
                    # Write the file in 8KB chunks
                    file.write(chunk)
            
            print(f"Success! PDF saved to: {output_file_path}")

        except requests.exceptions.RequestException as e:
            print(f"An error occurred: {e}")
    
    @retry(stop=(stop_after_attempt(UPLOAD_PDF_TRIES) | stop_after_delay(UPLOAD_PDF_TIMEOUT)))
    def upload_pdf(self, pdf_path, wait=True):
        pdf_file = self.client.files.upload(file=pdf_path)

        while wait and (pdf_file.state is None or pdf_file.state.name == "PROCESSING"):
            time.sleep(2)
            if pdf_file.name:
                pdf_file = self.client.files.get(name=pdf_file.name)
            else:
                break
        
        if pdf_file.state is None or pdf_file.state.name == "FAILED":
            raise ValueError(f"File processing failed: {pdf_file.name}")
        
        return pdf_file
    
    @retry(stop=(stop_after_attempt(IDENTIFY_KNOWLEDGE_TRIES) | stop_after_delay(IDENTIFY_KNOWLEDGE_TIMEOUT)))
    def identify_knowledge(self, uploaded_file):
        content = self.identify_knowledge_prompt.arguments_to_content(**{"TEXTBOOK_CHAPTER": uploaded_file})
        response = self.client.models.generate_content(
            model=IDENTIFY_KNOWLEDGE_MODEL,
            contents=content,
            config={
                "response_mime_type": "application/json",
                "response_schema": self.identify_knowledge_schema,
            }
        )
        return response.parsed["knowledge_list"]  # type:ignore

    @retry(stop=(stop_after_attempt(GEN_QUESTION_TRIES) | stop_after_delay(GEN_QUESTION_TIMEOUT)))
    def create_skill_question(self, subject, grade, description):
        content = self.gen_skill_question_prompt.arguments_to_content(
            GRADE=grade,
            SUBJECT=subject,
            DESCRIPTION=description,
        )
        response = self.client.models.generate_content(
            model=GEM_3_FLASH,
            contents=content,
            config={
                "response_mime_type": "application/json",
                "response_schema": self.gen_skill_question_schema,
            },
        )
        print("\t\t> Generated skill question!")
        return response.parsed["Question"]  # type: ignore

    @retry(stop=(stop_after_attempt(GEN_QUESTION_TRIES) | stop_after_delay(GEN_QUESTION_TIMEOUT)))
    def create_info_question(self, subject, grade, description):
        content = self.gen_info_question_prompt.arguments_to_content(
            GRADE=grade,
            SUBJECT=subject,
            DESCRIPTION=description,
        )
        response = self.client.models.generate_content(
            model=GEM_3_FLASH,
            contents=content,
            config={
                "response_mime_type": "application/json",
                "response_schema": self.gen_info_question_schema,
            },
        )
        print("\t\t> Generated info question!")
        return response.parsed["Question"]  # type: ignore

    def download_test_textbook(self):
        self.download_pdf(TEST_TEXTBOOK_CHAPTER_DOWNLOAD_URL, TEST_TEXTBOOK_CHAPTER_PATH)

        return TEST_TEXTBOOK_CHAPTER_PATH

    def run(self, textbook_chapter_path, subject, grade):
        print("Running generate curriculum pipeline ...")

        # Upload the PDF to Gemini
        uploaded_chapter = self.upload_pdf(textbook_chapter_path, wait=True)
        print("\t> Uploaded PDF!")

        # Identify pieces of knowledge from the uploaded chapter
        identified_knowledge = self.identify_knowledge(uploaded_chapter)
        print(f"\t> Identified knowledge! ({len(identified_knowledge)} objectives identified!)")

        # For each piece of knowledge, generate QUESTION_NUMBER questions
        # using the matching prompt type ("skill" or "information")
        questions = []
        for knowledge in identified_knowledge:
            create_question = (
                self.create_skill_question
                if knowledge["type"] == "skill"
                else self.create_info_question
            )
            for _ in range(QUESTIONS_PER_KNOWLEDGE):
                question = create_question(subject, grade, knowledge["description"])
                questions.append({
                    "knowledge_type": knowledge["type"],
                    "knowledge_description": knowledge["description"],
                    "question": question,
                })

        return questions


if __name__ == "__main__":
    import os
    from pathlib import Path
    from collections import defaultdict

    pipeline = Gen_Curriculum_Pipeline()

    # Download the test textbook only if not already present
    if not os.path.exists(TEST_TEXTBOOK_CHAPTER_PATH):
        print(f"Downloading test textbook to {TEST_TEXTBOOK_CHAPTER_PATH}...")
        pipeline.download_test_textbook()
    else:
        print(f"Using existing file at {TEST_TEXTBOOK_CHAPTER_PATH}")

    # Run the full pipeline
    print("Running curriculum pipeline...\n")
    questions = pipeline.run(TEST_TEXTBOOK_CHAPTER_PATH, "Science", "7")

    # Group questions by (knowledge_type, knowledge_description), preserving order
    grouped: dict = defaultdict(list)
    for q in questions:
        grouped[(q["knowledge_type"], q["knowledge_description"])].append(q["question"])

    info_items = [(desc, qs) for (ktype, desc), qs in grouped.items() if ktype == "information"]
    skill_items = [(desc, qs) for (ktype, desc), qs in grouped.items() if ktype == "skill"]

    # Print in readable format
    file_name = Path(TEST_TEXTBOOK_CHAPTER_PATH).name
    print(f"{'='*60}")
    print(f"  {file_name}")
    print(f"{'='*60}")

    print(f"\n--- Information ({len(info_items)} items) ---")
    for desc, qs in info_items:
        print(f"\n  {desc}")
        for q in qs:
            print(f"    - {q}")

    print(f"\n--- Skills ({len(skill_items)} items) ---")
    for desc, qs in skill_items:
        print(f"\n  {desc}")
        for q in qs:
            print(f"    - {q}")

    # Write .md file named after the chapter
    file_stem = Path(TEST_TEXTBOOK_CHAPTER_PATH).stem
    output_dir = Path(__file__).parent / "example_gen_curriculum"
    output_dir.mkdir(exist_ok=True)
    output_path = output_dir / f"{file_stem}_curriculum.md"

    lines = [f"# {file_name}", "", "## Information", ""]
    for desc, qs in info_items:
        lines.append(f"### {desc}")
        lines.append("")
        for q in qs:
            lines.append(f"- {q}")
        lines.append("")

    lines += ["## Skills", ""]
    for desc, qs in skill_items:
        lines.append(f"### {desc}")
        lines.append("")
        for q in qs:
            lines.append(f"- {q}")
        lines.append("")

    output_path.write_text("\n".join(lines))
    print(f"\nSaved to {output_path.name}")
