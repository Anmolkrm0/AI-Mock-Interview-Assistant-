import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from backend.app.schemas.plan import InterviewPlanResponse


class InterviewCreateRequest(BaseModel):
    resume_document_id: Optional[uuid.UUID] = None
    job_description_document_id: Optional[uuid.UUID] = None
    job_role: str = Field(..., min_length=2)
    duration_minutes: int = Field(30, ge=10, le=60)
    evaluation_rigor: str = Field("target_bar", pattern="^(standard|target_bar|stress_test)$")


class InterviewResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    resume_document_id: Optional[uuid.UUID] = None
    job_description_document_id: Optional[uuid.UUID] = None
    job_role: str
    duration_minutes: int
    evaluation_rigor: str
    status: str
    started_at: Optional[datetime] = None
    deadline_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    plan: Optional[InterviewPlanResponse] = None

    class Config:
        from_attributes = True


class InterviewListResponse(BaseModel):
    interviews: List[InterviewResponse]
    total: int
