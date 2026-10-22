import asyncio
import json
from typing import Optional, Any, Callable
from google import genai
from google.genai import types

from backend.app.core.config import settings
from backend.app.providers.base import LiveInterviewProvider


class GeminiLiveProvider(LiveInterviewProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_LIVE_MODEL
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None
        self.active_session = None

    async def connect_session(
        self,
        system_instruction: str,
        role: str,
        first_question: str,
    ) -> Any:
        if not self.client:
            return None

        config = types.LiveConnectConfig(
            response_modalities=[types.LiveClientContentModality.AUDIO],
            system_instruction=types.Content(
                parts=[types.Part.from_text(system_instruction)]
            ),
        )

        # Connect live async session
        self.active_session = self.client.aio.live.connect(model=self.model, config=config)
        return self.active_session

    async def send_audio_chunk(self, chunk_bytes: bytes) -> None:
        if self.active_session:
            try:
                await self.active_session.send_realtime_input(
                    media_chunks=[types.Blob(data=chunk_bytes, mime_type="audio/pcm;rate=16000")]
                )
            except Exception as e:
                print(f"Failed to send audio chunk to Gemini Live: {e}")

    async def send_text_message(self, text: str) -> None:
        if self.active_session:
            try:
                await self.active_session.send_realtime_input(text=text)
            except Exception as e:
                print(f"Failed to send text to Gemini Live: {e}")
