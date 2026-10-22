from typing import Optional, Any
from google import genai
from google.genai import types
from backend.app.core.config import settings
from backend.app.providers.base import TextGenerationProvider


class GeminiTextProvider(TextGenerationProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_TEXT_MODEL
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    async def generate_text(self, prompt: str, schema: Optional[Any] = None) -> str:
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not configured.")

        config = types.GenerateContentConfig()
        if schema:
            config.response_mime_type = "application/json"
            config.response_schema = schema

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config,
        )
        return response.text or ""
