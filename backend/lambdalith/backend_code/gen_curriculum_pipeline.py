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
QUESTIONS_PER_KNOWLEDGE = 3

# Models
GEM_3_FLASH = "gemini-3-flash-preview"

# Retry and model settings
DOWNLOAD_PDF_TRIES = 2

UPLOAD_PDF_TRIES = 2
UPLOAD_PDF_TIMEOUT = 120

IDENTIFY_KNOWLEDGE_MODEL = GEM_3_FLASH
IDENTIFY_KNOWLEDGE_TRIES = 3
IDENTIFY_KNOWLEDGE_TIMEOUT = 11*60

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
        self.gen_skill_question_schema = gen_skill_question_details[JSON_SCHEMA_KEY]

        gen_info_question_details = get_prompt_details("gen_info_question")
        self.gen_info_question_prompt = Prompt(gen_info_question_details[RAW_PROMPT_KEY])
        self.gen_info_question_schema = gen_info_question_details[JSON_SCHEMA_KEY]
    
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

    def create_skill_question(self):
        pass
    
    def create_info_question(self):
        pass

    def download_test_textbook(self):
        self.download_pdf(TEST_TEXTBOOK_CHAPTER_DOWNLOAD_URL, TEST_TEXTBOOK_CHAPTER_PATH)

        return TEST_TEXTBOOK_CHAPTER_PATH

    def run(self, textbook_chapter_path, subject, grade):
        # Upload the PDF to Gemini
        uploaded_chapter = self.upload_pdf(textbook_chapter_path, wait=True)

        # Identify pieces of knowledge from the uploaded chapter
        identified_knowledge = self.identify_knowledge(uploaded_chapter)

        # TODO: For identified knowledge, generate a question (using the corresponding prompt based on whether it's a skill or info)