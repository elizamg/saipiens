# config.py
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from google import genai

class Config:
    GEMINI_API_KEY = os.getenv("SAIPIENS_GEMINI_API_KEY")  # Either from .env or "Configuration" in Lambda

    @classmethod
    def validate(cls):
        """Check if all critical secrets are present."""
        if not cls.GEMINI_API_KEY:
            raise ValueError("Missing SAIPIENS_GEMINI_API_KEY in environment!")


# 1. Validate configuration immediately on import
Config.validate()

# 2. Initialize the client once at the module level
# This object will be reused across Lambda warm starts
ai_client = genai.Client(api_key=Config.GEMINI_API_KEY)