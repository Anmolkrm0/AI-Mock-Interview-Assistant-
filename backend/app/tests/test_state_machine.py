import uuid
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.core.database import Base
from backend.app.models.models import Profile, Interview, Question, AnswerAttempt
from backend.app.services.interview_service import (
    transition_interview_state,
    record_answer_attempt,
)

# Test DB setup
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)


def test_valid_state_transitions():
    db = TestingSessionLocal()
    user_id = uuid.uuid4()
    profile = Profile(id=user_id, display_name="Test User")
    db.add(profile)

    interview = Interview(
        user_id=user_id,
        job_role="Senior Engineer",
        duration_minutes=30,
        status="ready",
    )
    db.add(interview)
    db.commit()

    # ready -> connecting
    interview = transition_interview_state(interview, "connecting", db)
    assert interview.status == "connecting"

    # connecting -> in_progress
    interview = transition_interview_state(interview, "in_progress", db)
    assert interview.status == "in_progress"
    assert interview.started_at is not None
    assert interview.deadline_at is not None

    # in_progress -> finalizing
    interview = transition_interview_state(interview, "finalizing", db)
    assert interview.status == "finalizing"

    # finalizing -> evaluating
    interview = transition_interview_state(interview, "evaluating", db)
    assert interview.status == "evaluating"

    # evaluating -> completed
    interview = transition_interview_state(interview, "completed", db)
    assert interview.status == "completed"


def test_ready_to_in_progress_direct_transition():
    db = TestingSessionLocal()
    user_id = uuid.uuid4()
    profile = Profile(id=user_id, display_name="Direct Start Candidate")
    db.add(profile)

    interview = Interview(
        user_id=user_id,
        job_role="Staff Systems Architect",
        duration_minutes=45,
        status="ready",
    )
    db.add(interview)
    db.commit()

    # ready -> in_progress directly (e.g. WebSocket connection opens)
    interview = transition_interview_state(interview, "in_progress", db)
    assert interview.status == "in_progress"
    assert interview.started_at is not None

    # Idempotent transition when in_progress connects again
    interview = transition_interview_state(interview, "in_progress", db)
    assert interview.status == "in_progress"


def test_illegal_state_transition_raises_400():
    db = TestingSessionLocal()
    user_id = uuid.uuid4()
    profile = Profile(id=user_id, display_name="Test User")
    db.add(profile)

    interview = Interview(
        user_id=user_id,
        job_role="Senior Engineer",
        duration_minutes=30,
        status="completed",
    )
    db.add(interview)
    db.commit()

    # completed is terminal; attempting to restart must fail
    with pytest.raises(HTTPException) as exc:
        transition_interview_state(interview, "in_progress", db)
    assert exc.value.status_code == 400


def test_answer_attempts_retake_logic():
    db = TestingSessionLocal()
    user_id = uuid.uuid4()
    profile = Profile(id=user_id, display_name="Test User")
    db.add(profile)

    interview = Interview(
        user_id=user_id,
        job_role="Senior Engineer",
        duration_minutes=30,
        status="in_progress",
    )
    db.add(interview)
    db.flush()

    question = Question(
        interview_id=interview.id,
        sequence_number=1,
        question_text="Explain distributed consensus.",
        competency="Distributed Systems",
        difficulty="Hard",
        status="pending",
    )
    db.add(question)
    db.commit()

    # Attempt 1
    attempt1 = record_answer_attempt(
        question_id=question.id,
        transcript_text="First answer attempt with some errors.",
        answer_source="voice",
        is_skipped=False,
        db=db,
    )
    assert attempt1.attempt_number == 1
    assert attempt1.selected_for_evaluation is True

    # Retake -> Attempt 2
    attempt2 = record_answer_attempt(
        question_id=question.id,
        transcript_text="Second answer attempt with complete Raft explanation.",
        answer_source="voice",
        is_skipped=False,
        db=db,
    )
    assert attempt2.attempt_number == 2
    assert attempt2.selected_for_evaluation is True

    # Verify attempt 1 was deselected
    db.refresh(attempt1)
    assert attempt1.selected_for_evaluation is False
