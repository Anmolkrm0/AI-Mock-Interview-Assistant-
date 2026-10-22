import uuid
import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.models import Interview, Question, AnswerAttempt
from backend.app.services.interview_service import (
    transition_interview_state,
    record_interview_event,
    record_answer_attempt,
)
from backend.app.providers.gemini_live import GeminiLiveProvider


class LiveInterviewSessionManager:
    def __init__(self, interview_id: uuid.UUID, websocket: WebSocket, db: Session):
        self.interview_id = interview_id
        self.ws = websocket
        self.db = db
        self.interview: Optional[Interview] = None
        self.questions: list = []
        self.current_question_index = 0
        self.live_provider = GeminiLiveProvider()
        self.is_active = True

    async def initialize(self):
        self.interview = self.db.query(Interview).filter(Interview.id == self.interview_id).first()
        if not self.interview:
            await self.ws.close(code=1008, reason="Interview not found")
            return False

        # Transition state: connecting/ready -> in_progress
        if self.interview.status in ("ready", "connecting"):
            transition_interview_state(self.interview, "in_progress", self.db)

        # Load ordered questions
        self.questions = (
            self.db.query(Question)
            .filter(Question.interview_id == self.interview_id)
            .order_by(Question.sequence_number.asc())
            .all()
        )

        # Resume at the first unanswered question if candidate reconnected
        answered_q_ids = {
            a.question_id
            for a in self.db.query(AnswerAttempt.question_id)
            .filter(AnswerAttempt.selected_for_evaluation == True)
            .all()
        }
        for idx, q in enumerate(self.questions):
            if q.id not in answered_q_ids:
                self.current_question_index = idx
                break
        else:
            self.current_question_index = max(0, len(self.questions) - 1) if self.questions else 0

        # Calculate remaining duration
        now = datetime.now(timezone.utc)
        remaining_seconds = 0
        if self.interview.deadline_at:
            deadline = self.interview.deadline_at
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            remaining_seconds = max(0, int((deadline - now).total_seconds()))
        else:
            remaining_seconds = self.interview.duration_minutes * 60

        # Send session initialization payload
        curr_q = self.questions[self.current_question_index] if self.questions else None
        await self.ws.send_json({
            "type": "session_init",
            "interview_id": str(self.interview_id),
            "status": self.interview.status,
            "job_role": self.interview.job_role,
            "rigor": self.interview.evaluation_rigor,
            "duration_minutes": self.interview.duration_minutes,
            "remaining_seconds": remaining_seconds,
            "total_questions": len(self.questions),
            "current_question_index": self.current_question_index,
            "current_question": {
                "id": str(curr_q.id) if curr_q else None,
                "sequence": curr_q.sequence_number if curr_q else 1,
                "text": curr_q.question_text if curr_q else "Welcome to your mock interview.",
                "competency": curr_q.competency if curr_q else "Intro",
                "difficulty": curr_q.difficulty if curr_q else "Medium",
            } if curr_q else None,
            "welcome_message": f"Welcome! I am your AI Executive Interview Coach. We will go one question at a time to examine your engineering depth, architectural trade-offs, and quantifiable results for the {self.interview.job_role} role. Take your time, structure your thoughts, and let's begin.",
        })
        return True

    async def handle_message(self, data: Dict[str, Any]):
        msg_type = data.get("type")

        if msg_type == "text_answer":
            # Candidate submitted typed answer
            transcript = data.get("text", "").strip()
            if transcript and self.current_question_index < len(self.questions):
                curr_q = self.questions[self.current_question_index]
                record_answer_attempt(
                    question_id=curr_q.id,
                    transcript_text=transcript,
                    answer_source="text",
                    is_skipped=False,
                    db=self.db,
                )
                record_interview_event(
                    interview_id=self.interview_id,
                    event_type="text_answer_submitted",
                    payload={"question_id": str(curr_q.id), "length": len(transcript)},
                    db=self.db,
                )
                prev_comp = curr_q.competency
                await self.advance_to_next_question(
                    ack_prefix=f"Strong breakdown on {prev_comp}. Let's build on that."
                )

        elif msg_type == "voice_answer_complete":
            # Candidate finished speaking their answer
            transcript = data.get("transcript", "").strip() or "Spoken audio response recorded."
            if self.current_question_index < len(self.questions):
                curr_q = self.questions[self.current_question_index]
                record_answer_attempt(
                    question_id=curr_q.id,
                    transcript_text=transcript,
                    answer_source="voice",
                    is_skipped=False,
                    db=self.db,
                )
                record_interview_event(
                    interview_id=self.interview_id,
                    event_type="voice_answer_submitted",
                    payload={"question_id": str(curr_q.id)},
                    db=self.db,
                )
                prev_comp = curr_q.competency
                await self.advance_to_next_question(
                    ack_prefix=f"Understood. Great articulation on {prev_comp}. Moving to the next technical dimension."
                )

        elif msg_type == "skip_question":
            # Candidate chose to skip question
            if self.current_question_index < len(self.questions):
                curr_q = self.questions[self.current_question_index]
                record_answer_attempt(
                    question_id=curr_q.id,
                    transcript_text="[Question Skipped by Candidate]",
                    answer_source="action",
                    is_skipped=True,
                    db=self.db,
                )
                record_interview_event(
                    interview_id=self.interview_id,
                    event_type="question_skipped",
                    payload={"question_id": str(curr_q.id)},
                    db=self.db,
                )
                await self.advance_to_next_question(
                    ack_prefix="No problem at all. In live interviews, knowing when to pivot preserves valuable time. Let's tackle the next area."
                )

        elif msg_type == "retake_answer":
            # Candidate requests to retake current question
            if self.current_question_index < len(self.questions):
                curr_q = self.questions[self.current_question_index]
                record_interview_event(
                    interview_id=self.interview_id,
                    event_type="answer_retake_requested",
                    payload={"question_id": str(curr_q.id)},
                    db=self.db,
                )
                await self.ws.send_json({
                    "type": "retake_acknowledged",
                    "question_id": str(curr_q.id),
                    "message": "Previous attempt cleared. You can now re-answer this question.",
                })

        elif msg_type == "end_interview":
            await self.finalize_interview()

    async def advance_to_next_question(self, ack_prefix: str = ""):
        self.current_question_index += 1
        if self.current_question_index < len(self.questions):
            next_q = self.questions[self.current_question_index]
            await self.ws.send_json({
                "type": "question_update",
                "current_question_index": self.current_question_index,
                "total_questions": len(self.questions),
                "ai_speech_text": f"{ack_prefix} Next question: {next_q.question_text}",
                "current_question": {
                    "id": str(next_q.id),
                    "sequence": next_q.sequence_number,
                    "text": next_q.question_text,
                    "competency": next_q.competency,
                    "difficulty": next_q.difficulty,
                },
            })
        else:
            # All questions finished
            await self.finalize_interview()

    async def finalize_interview(self):
        self.is_active = False
        transition_interview_state(self.interview, "finalizing", self.db)
        record_interview_event(
            interview_id=self.interview_id,
            event_type="interview_finalized",
            payload={"completed_questions": self.current_question_index},
            db=self.db,
        )
        await self.ws.send_json({
            "type": "interview_finalized",
            "interview_id": str(self.interview_id),
            "message": "Interview completed! Preparing your evidence-based evaluation report...",
        })
