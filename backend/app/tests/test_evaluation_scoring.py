import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.core.database import Base
from backend.app.models.models import Profile, Interview, Question, AnswerAttempt, InterviewPlan
from backend.app.services.evaluation_service import (
    calculate_competency_weighted_score,
    evaluate_interview_session,
)

# Test DB setup
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)


def test_calculate_competency_weighted_score_skips_excluded():
    evals = [
        {"competency": "Architecture", "score": 5.0, "is_skipped": False},  # 100%
        {"competency": "Incident Triage", "score": 4.0, "is_skipped": False},  # 80%
        {"competency": "Leadership", "score": 1.0, "is_skipped": True},  # SKIPPED -> excluded from denominator
    ]
    weights = {
        "Architecture": 0.6,
        "Incident Triage": 0.4,
        "Leadership": 0.2,
    }
    # Weighted avg: (100 * 0.6 + 80 * 0.4) / (0.6 + 0.4) = (60 + 32) / 1.0 = 92
    overall = calculate_competency_weighted_score(evals, weights)
    assert overall == 92


@pytest.mark.asyncio
async def test_evaluate_interview_session_generates_persisted_report():
    db = TestingSessionLocal()
    user_id = uuid.uuid4()
    profile = Profile(id=user_id, display_name="Evaluation Candidate")
    db.add(profile)

    interview = Interview(
        user_id=user_id,
        job_role="Senior Distributed Systems Engineer",
        duration_minutes=30,
        evaluation_rigor="target_bar",
        status="in_progress",
    )
    db.add(interview)
    db.flush()

    # Plan
    plan = InterviewPlan(
        interview_id=interview.id,
        plan_json={
            "competency_weights": {
                "Architecture": 0.5,
                "Resilience": 0.5,
            }
        },
        version=1,
    )
    db.add(plan)

    # Questions & Attempts
    q1 = Question(
        interview_id=interview.id,
        sequence_number=1,
        question_text="How would you design a distributed cache?",
        competency="Architecture",
        difficulty="Hard",
        status="answered",
    )
    q2 = Question(
        interview_id=interview.id,
        sequence_number=2,
        question_text="How do you handle split-brain in network partitions?",
        competency="Resilience",
        difficulty="Staff",
        status="answered",
    )
    db.add_all([q1, q2])
    db.flush()

    att1 = AnswerAttempt(
        question_id=q1.id,
        attempt_number=1,
        answer_source="voice",
        transcript_text="I utilized consistent hashing with virtual nodes to avoid cache stampedes and minimize key reshuffling under node failure.",
        selected_for_evaluation=True,
        is_skipped=False,
    )
    att2 = AnswerAttempt(
        question_id=q2.id,
        attempt_number=1,
        answer_source="voice",
        transcript_text="We enforced an odd-numbered quorum size with Raft leader leases to guarantee single-leader consistency during cross-rack partitions.",
        selected_for_evaluation=True,
        is_skipped=False,
    )
    db.add_all([att1, att2])
    db.commit()

    # Run evaluation
    report = await evaluate_interview_session(interview.id, db)

    assert report is not None
    assert report.report_status == "completed"
    assert report.overall_score >= 0 and report.overall_score <= 100
    assert len(report.strengths) > 0
    assert len(report.recommendations) > 0

    # Verify interview marked completed
    db.refresh(interview)
    assert interview.status == "completed"
