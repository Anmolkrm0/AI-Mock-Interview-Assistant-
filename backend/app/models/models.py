import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    String,
    Text,
    Integer,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index,
    JSON,
)
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB as PG_JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base


class GUID(TypeDecorator):
    """
    Platform-independent GUID/UUID type.
    Uses PostgreSQL's native UUID type in PostgreSQL.
    Uses CHAR(36) in SQLite for fast isolated testing.
    """
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(str(value)))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value


JSON_TYPE = JSON().with_variant(PG_JSONB(), "postgresql")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    documents: Mapped[List["Document"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    interviews: Mapped[List["Interview"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    feedback: Mapped[List["Feedback"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    recording: Mapped[Optional["Recording"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'resume' | 'job_description'
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extracted_data: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)
    parsing_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # 'pending', 'completed', 'failed'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped["Profile"] = relationship(back_populates="documents")


class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_document_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    job_description_document_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    job_role: Mapped[str] = mapped_column(String(255), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    evaluation_rigor: Mapped[str] = mapped_column(String(50), default="target_bar", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="created", nullable=False, index=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    deadline_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user: Mapped["Profile"] = relationship(back_populates="interviews")
    plan: Mapped[Optional["InterviewPlan"]] = relationship(back_populates="interview", uselist=False, cascade="all, delete-orphan")
    questions: Mapped[List["Question"]] = relationship(back_populates="interview", cascade="all, delete-orphan")
    events: Mapped[List["InterviewEvent"]] = relationship(back_populates="interview", cascade="all, delete-orphan")
    report: Mapped[Optional["Report"]] = relationship(back_populates="interview", uselist=False, cascade="all, delete-orphan")
    recordings: Mapped[List["Recording"]] = relationship(back_populates="interview")

    __table_args__ = (
        CheckConstraint(
            "status IN ('created', 'preparing', 'ready', 'connecting', 'in_progress', 'paused', 'finalizing', 'evaluating', 'completed', 'failed', 'cancelled')",
            name="valid_interview_status",
        ),
        CheckConstraint(
            "evaluation_rigor IN ('standard', 'target_bar', 'stress_test')",
            name="valid_evaluation_rigor",
        ),
    )


class InterviewPlan(Base):
    __tablename__ = "interview_plans"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    interview_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("interviews.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan_json: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    interview: Mapped["Interview"] = relationship(back_populates="plan")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    interview_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    competency: Mapped[str] = mapped_column(String(100), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False)
    question_type: Mapped[str] = mapped_column(String(50), default="technical", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    interview: Mapped["Interview"] = relationship(back_populates="questions")
    attempts: Mapped[List["AnswerAttempt"]] = relationship(back_populates="question", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_interview_sequence", "interview_id", "sequence_number"),
    )


class AnswerAttempt(Base):
    __tablename__ = "answer_attempts"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    question_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    answer_source: Mapped[str] = mapped_column(String(50), default="voice", nullable=False)
    transcript_text: Mapped[str] = mapped_column(Text, nullable=False)
    selected_for_evaluation: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_skipped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    question: Mapped["Question"] = relationship(back_populates="attempts")


class InterviewEvent(Base):
    __tablename__ = "interview_events"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    interview_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_payload: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    interview: Mapped["Interview"] = relationship(back_populates="events")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    interview_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("interviews.id", ondelete="CASCADE"), unique=True, nullable=False)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)
    competency_scores: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    question_evaluations: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    strengths: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    improvement_areas: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    recommendations: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    report_status: Mapped[str] = mapped_column(String(50), default="completed", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    interview: Mapped["Interview"] = relationship(back_populates="report")


class Recording(Base):
    """
    Enforces the 'Single Latest Recording Per User' business rule:
    user_id is the PRIMARY KEY, so each user has at most one current recording record.
    """
    __tablename__ = "recordings"

    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    interview_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), default="audio/webm", nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped["Profile"] = relationship(back_populates="recording")
    interview: Mapped["Interview"] = relationship(back_populates="recordings")


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    interview_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped["Profile"] = relationship(back_populates="feedback")

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="valid_rating_range"),
    )
