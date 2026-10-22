import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.app.models.models import Interview, Question, AnswerAttempt, InterviewEvent


# Authoritative state transitions mapping
ALLOWED_TRANSITIONS = {
    "created": ["preparing", "ready", "cancelled", "failed"],
    "preparing": ["ready", "failed", "cancelled"],
    "ready": ["connecting", "in_progress", "cancelled", "failed"],
    "connecting": ["in_progress", "failed", "cancelled"],
    "in_progress": ["in_progress", "paused", "finalizing", "failed", "cancelled"],
    "paused": ["in_progress", "finalizing", "failed", "cancelled"],
    "finalizing": ["evaluating", "failed"],
    "evaluating": ["completed", "failed"],
    "failed": ["ready", "connecting", "evaluating"],  # Allowed bounded retries
    "completed": [],  # Terminal state
    "cancelled": [],  # Terminal state
}


def transition_interview_state(interview: Interview, target_state: str, db: Session) -> Interview:
    """
    Enforces authoritative state machine transitions.
    Raises HTTPException(400) if an illegal transition is attempted.
    """
    current_state = interview.status
    if target_state == current_state:
        return interview

    allowed = ALLOWED_TRANSITIONS.get(current_state, [])
    if target_state not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid state transition from '{current_state}' to '{target_state}'.",
        )

    interview.status = target_state
    now = datetime.now(timezone.utc)

    if target_state == "in_progress" and not interview.started_at:
        interview.started_at = now
        interview.deadline_at = now + timedelta(minutes=interview.duration_minutes)
    elif target_state in ("completed", "finalizing", "cancelled"):
        if not interview.completed_at:
            interview.completed_at = now

    db.commit()
    db.refresh(interview)
    return interview


def record_interview_event(
    interview_id: uuid.UUID,
    event_type: str,
    payload: Dict[str, Any],
    db: Session,
) -> InterviewEvent:
    """Appends an immutable interview lifecycle event."""
    last_seq = (
        db.query(InterviewEvent.sequence_number)
        .filter(InterviewEvent.interview_id == interview_id)
        .order_by(InterviewEvent.sequence_number.desc())
        .first()
    )
    next_seq = (last_seq[0] + 1) if last_seq else 1

    event = InterviewEvent(
        interview_id=interview_id,
        event_type=event_type,
        event_payload=payload,
        sequence_number=next_seq,
    )
    db.add(event)
    db.commit()
    return event


def record_answer_attempt(
    question_id: uuid.UUID,
    transcript_text: str,
    answer_source: str,
    is_skipped: bool,
    db: Session,
) -> AnswerAttempt:
    """
    Records an answer attempt. If retrying, marks previous attempts as not selected for evaluation.
    """
    # Count existing attempts for this question
    existing_attempts = (
        db.query(AnswerAttempt)
        .filter(AnswerAttempt.question_id == question_id)
        .order_by(AnswerAttempt.attempt_number.desc())
        .all()
    )

    attempt_number = (existing_attempts[0].attempt_number + 1) if existing_attempts else 1

    # Deselect previous attempts from final evaluation
    for prior in existing_attempts:
        prior.selected_for_evaluation = False

    new_attempt = AnswerAttempt(
        question_id=question_id,
        attempt_number=attempt_number,
        answer_source=answer_source,
        transcript_text=transcript_text,
        selected_for_evaluation=not is_skipped,
        is_skipped=is_skipped,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(new_attempt)

    # Update question status
    question = db.query(Question).filter(Question.id == question_id).first()
    if question:
        question.status = "skipped" if is_skipped else "answered"

    db.commit()
    db.refresh(new_attempt)
    return new_attempt
