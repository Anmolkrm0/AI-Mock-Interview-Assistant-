import uuid
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.core.database import Base
from backend.app.models.models import Profile, Interview, Recording, Report
from backend.app.services.recording_service import (
    confirm_and_replace_recording,
    delete_user_latest_recording,
)

# Test DB setup
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)


def test_recording_replacement_retains_only_latest_per_user():
    db = TestingSessionLocal()
    user_id = uuid.uuid4()
    profile = Profile(id=user_id, display_name="Candidate One")
    db.add(profile)

    # 1. User conducts Interview 1
    interview_1 = Interview(
        user_id=user_id,
        job_role="Senior Systems Engineer",
        duration_minutes=30,
        status="completed",
    )
    db.add(interview_1)
    db.flush()

    report_1 = Report(
        interview_id=interview_1.id,
        overall_score=85,
        competency_scores={"Architecture": 88},
        question_evaluations={},
        strengths=["Clear articulation"],
        improvement_areas=["Latency discussion"],
        recommendations=["Practice STAR format"],
    )
    db.add(report_1)
    db.commit()

    # Upload recording for Interview 1
    rec_1 = confirm_and_replace_recording(
        user_id=user_id,
        interview_id=interview_1.id,
        storage_path=f"{user_id}/{interview_1.id}_100.webm",
        mime_type="audio/webm",
        file_size_bytes=5 * 1024 * 1024,  # 5MB
        duration_seconds=1800,
        db=db,
    )
    assert rec_1.interview_id == interview_1.id

    # Verify only 1 recording exists for user
    user_recordings = db.query(Recording).filter(Recording.user_id == user_id).all()
    assert len(user_recordings) == 1
    assert user_recordings[0].storage_path == f"{user_id}/{interview_1.id}_100.webm"

    # 2. User conducts Interview 2
    interview_2 = Interview(
        user_id=user_id,
        job_role="Staff Systems Architect",
        duration_minutes=45,
        status="completed",
    )
    db.add(interview_2)
    db.flush()

    report_2 = Report(
        interview_id=interview_2.id,
        overall_score=92,
        competency_scores={"Architecture": 95},
        question_evaluations={},
        strengths=["Exceptional depth"],
        improvement_areas=[],
        recommendations=[],
    )
    db.add(report_2)
    db.commit()

    # Upload recording for Interview 2 (Must replace Interview 1 recording pointer!)
    rec_2 = confirm_and_replace_recording(
        user_id=user_id,
        interview_id=interview_2.id,
        storage_path=f"{user_id}/{interview_2.id}_200.webm",
        mime_type="audio/webm",
        file_size_bytes=8 * 1024 * 1024,  # 8MB
        duration_seconds=2700,
        db=db,
    )
    assert rec_2.interview_id == interview_2.id

    # Verify still exactly ONE recording pointer for the user, now pointing to Interview 2
    user_recordings_after = db.query(Recording).filter(Recording.user_id == user_id).all()
    assert len(user_recordings_after) == 1
    assert user_recordings_after[0].interview_id == interview_2.id
    assert user_recordings_after[0].storage_path == f"{user_id}/{interview_2.id}_200.webm"

    # CRUCIAL: Verify Interview 1 and Report 1 are NOT deleted!
    int_1_check = db.query(Interview).filter(Interview.id == interview_1.id).first()
    rep_1_check = db.query(Report).filter(Report.interview_id == interview_1.id).first()
    assert int_1_check is not None
    assert rep_1_check is not None
    assert rep_1_check.overall_score == 85


def test_recording_oversized_rejected():
    db = TestingSessionLocal()
    user_id = uuid.uuid4()
    profile = Profile(id=user_id, display_name="Candidate Two")
    db.add(profile)
    interview = Interview(
        user_id=user_id,
        job_role="Engineer",
        duration_minutes=10,
        status="completed",
    )
    db.add(interview)
    db.commit()

    # Attempting to confirm 55MB file (>50MB) must fail with 413
    with pytest.raises(HTTPException) as exc:
        confirm_and_replace_recording(
            user_id=user_id,
            interview_id=interview.id,
            storage_path=f"{user_id}/oversized.webm",
            mime_type="audio/webm",
            file_size_bytes=55 * 1024 * 1024,
            duration_seconds=600,
            db=db,
        )
    assert exc.value.status_code == 413


def test_delete_latest_recording():
    db = TestingSessionLocal()
    user_id = uuid.uuid4()
    profile = Profile(id=user_id, display_name="Candidate Three")
    db.add(profile)
    interview = Interview(
        user_id=user_id,
        job_role="Engineer",
        duration_minutes=10,
        status="completed",
    )
    db.add(interview)
    db.flush()

    confirm_and_replace_recording(
        user_id=user_id,
        interview_id=interview.id,
        storage_path=f"{user_id}/rec.webm",
        mime_type="audio/webm",
        file_size_bytes=2 * 1024 * 1024,
        duration_seconds=600,
        db=db,
    )
    assert db.query(Recording).filter(Recording.user_id == user_id).count() == 1

    # Manual delete
    deleted = delete_user_latest_recording(user_id, db)
    assert deleted is True
    assert db.query(Recording).filter(Recording.user_id == user_id).count() == 0
