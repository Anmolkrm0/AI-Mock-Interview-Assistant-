from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, AsyncGenerator


class TextGenerationProvider(ABC):
    @abstractmethod
    async def generate_text(self, prompt: str, schema: Optional[Any] = None) -> str:
        """Generates text or structured JSON from a text prompt."""
        pass


class LiveInterviewProvider(ABC):
    @abstractmethod
    async def connect_session(
        self,
        system_instruction: str,
        role: str,
        first_question: str,
    ) -> Any:
        """Initializes a live bidirectional conversation session."""
        pass

    @abstractmethod
    async def send_audio_chunk(self, chunk_bytes: bytes) -> None:
        """Sends an audio PCM buffer to the live provider."""
        pass

    @abstractmethod
    async def send_text_message(self, text: str) -> None:
        """Sends a text prompt or candidate reply."""
        pass


class EvaluationProvider(ABC):
    @abstractmethod
    async def evaluate_interview(
        self,
        job_role: str,
        transcript_data: list,
        planned_questions: list,
        rigor: str,
    ) -> Dict[str, Any]:
        """Scores candidate answers against competencies and generates structured report."""
        pass
