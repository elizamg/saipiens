import os
import time
import requests
from google import genai

from test_pipeline.utils.prompt import Prompt

ENV_GEMINI_API_KEY = "SAIPIENS_GEMINI_API_KEY"
IDENTIFY_KNOWLEDGE_PROMPT_PATH = "../prompts/identify_knowledge_prompt.txt"
IDENTIFY_KNOWLEDGE_JSON_PATH = "../prompts/identify_knowledge_schema.json"

class Pipeline:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv(ENV_GEMINI_API_KEY))

        with open(IDENTIFY_KNOWLEDGE_PROMPT_PATH, 'r') as file:
            raw_prompt = file.read()
            self.identify_knowledge_prompt = Prompt(raw_prompt)
        
        with open(IDENTIFY_KNOWLEDGE_JSON_PATH, 'r') as file:
            schema_json = file.read()
            identify_knowledge_schema = genai.models.ResponseSchema.from_json(schema_json)
            self.identify_knowledge_schema = identify_knowledge_schema

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

    def upload_pdf(self, pdf_path, wait=True):
        pdf_file = self.client.files.upload(file=pdf_path)

        if wait and pdf_file.state.name == "PROCESSING" or pdf_file.state.name == "FAILED":
            time.sleep(2)
            pdf_file = self.client.files.get(name=pdf_file.name)
        
        if pdf_file.state.name == "FAILED":
            raise ValueError(f"File processing failed: {pdf_file.name}")
        
        return pdf_file

    def identify_knowledge(self, uploaded_file):
        content = self.identify_knowledge_prompt.arguments_to_content({"TEXTBOOK_CHAPTER": uploaded_file})
        response = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=content,
            config={
                "response_mime_type": "application/json",
                "response_schema": self.identify_knowledge_schema,
            }
        )
        return response.parsed
    
    def generate_question(self, content, level, difficulty):
        pass

    def generate_rubric(self, problem_statement, level):
        pass

    def generate_feedback(self, problem, rubric, student_answer):
        pass

    def generate_grading_report(self, student_id, assignment_id, problem_id, difficulty, problem_statement, allowed_concepts, rubric):
        pass

if __name__ == "__main__":
    TEXTBOOK_CHAPTER_DOWNLOAD_URL = "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/756/Jenkins_Independent_Schools/a1b6f2a0-efa2-4a86-8c48-390b571c4967/chap_03.pdf?disposition=inline"
    TEXTBOOK_CHAPTER_PATH = "chapter_3.pdf"

    pipeline = Pipeline()

    # Save a PDF of the textbook chapter from a download URL
    pipeline.download_pdf(TEXTBOOK_CHAPTER_DOWNLOAD_URL, TEXTBOOK_CHAPTER_PATH)

    # Upload the PDF to Gemini
    uploaded_chapter = pipeline.upload_pdf(TEXTBOOK_CHAPTER_PATH, wait=True)

    # Identify pieces of knowledge from the uploaded chapter
    identified_knowledge = pipeline.identify_knowledge(uploaded_chapter)





