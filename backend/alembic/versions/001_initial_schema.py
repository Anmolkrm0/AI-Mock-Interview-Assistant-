"""Initial database schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-22 23:08:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. profiles
    op.create_table(
        "profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 2. documents
    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_type", sa.String(50), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("storage_path", sa.String(512), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("extracted_data", postgresql.JSONB(), nullable=True),
        sa.Column("parsing_status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("idx_documents_user_id", "documents", ["user_id"])

    # 3. interviews
    op.create_table(
        "interviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resume_document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("documents.id", ondelete="SET NULL"), nullable=True),
        sa.Column("job_description_document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("documents.id", ondelete="SET NULL"), nullable=True),
        sa.Column("job_role", sa.String(255), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("evaluation_rigor", sa.String(50), nullable=False, server_default="target_bar"),
        sa.Column("status", sa.String(50), nullable=False, server_default="created"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deadline_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('created', 'preparing', 'ready', 'connecting', 'in_progress', 'paused', 'finalizing', 'evaluating', 'completed', 'failed', 'cancelled')",
            name="valid_interview_status",
        ),
        sa.CheckConstraint(
            "evaluation_rigor IN ('standard', 'target_bar', 'stress_test')",
            name="valid_evaluation_rigor",
        ),
    )
    op.create_index("idx_interviews_user_id", "interviews", ["user_id"])
    op.create_index("idx_interviews_status", "interviews", ["status"])

    # 4. interview_plans
    op.create_table(
        "interview_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("interview_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("interviews.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("plan_json", postgresql.JSONB(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 5. questions
    op.create_table(
        "questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("interview_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("competency", sa.String(100), nullable=False),
        sa.Column("difficulty", sa.String(50), nullable=False),
        sa.Column("question_type", sa.String(50), nullable=False, server_default="technical"),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("idx_questions_interview_seq", "questions", ["interview_id", "sequence_number"])

    # 6. answer_attempts
    op.create_table(
        "answer_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("answer_source", sa.String(50), nullable=False, server_default="voice"),
        sa.Column("transcript_text", sa.Text(), nullable=False),
        sa.Column("selected_for_evaluation", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_skipped", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_answer_attempts_question_id", "answer_attempts", ["question_id"])

    # 7. interview_events
    op.create_table(
        "interview_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("interview_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("event_payload", postgresql.JSONB(), nullable=False),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("idx_interview_events_interview_id", "interview_events", ["interview_id"])

    # 8. reports
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("interview_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("interviews.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("overall_score", sa.Integer(), nullable=False),
        sa.Column("competency_scores", postgresql.JSONB(), nullable=False),
        sa.Column("question_evaluations", postgresql.JSONB(), nullable=False),
        sa.Column("strengths", postgresql.JSONB(), nullable=False),
        sa.Column("improvement_areas", postgresql.JSONB(), nullable=False),
        sa.Column("recommendations", postgresql.JSONB(), nullable=False),
        sa.Column("report_status", sa.String(50), nullable=False, server_default="completed"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 9. recordings (user_id as Primary Key guarantees 1 recording per user)
    op.create_table(
        "recordings",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("interview_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("storage_path", sa.String(512), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False, server_default="audio/webm"),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("idx_recordings_interview_id", "recordings", ["interview_id"])

    # 10. feedback
    op.create_table(
        "feedback",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("interview_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="valid_rating_range"),
    )
    op.create_index("idx_feedback_user_id", "feedback", ["user_id"])


def downgrade() -> None:
    op.drop_table("feedback")
    op.drop_table("recordings")
    op.drop_table("reports")
    op.drop_table("interview_events")
    op.drop_table("answer_attempts")
    op.drop_table("questions")
    op.drop_table("interview_plans")
    op.drop_table("interviews")
    op.drop_table("documents")
    op.drop_table("profiles")
