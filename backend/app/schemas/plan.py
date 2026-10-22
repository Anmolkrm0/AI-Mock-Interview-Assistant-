import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class CompetencyWeight(BaseModel):
    competency: str = Field(..., description="Specific competency evaluated")
    weight: float = Field(..., description="Weight multiplier (e.g. 1.0, 1.5)")


class PlannedQuestion(BaseModel):
    id: int = Field(..., description="1-indexed sequence identifier")
    question_text: str = Field(..., description="The interview question text")
    competency: str = Field(..., description="Specific competency evaluated (e.g. Distributed Consensus)")
    difficulty: str = Field("Medium", description="Easy, Medium, Hard, or Staff")
    question_type: str = Field("technical", description="technical, architectural, behavioral, or trade_off")
    expected_evidence: str = Field(..., description="What signals demonstrate a strong hire")
    suggested_follow_ups: List[str] = Field(default_factory=list, description="Adaptive follow-up probes")
    time_allocation_minutes: int = Field(5, description="Estimated time for this question turn")


class InterviewPlanRequest(BaseModel):
    resume_document_id: Optional[uuid.UUID] = None
    job_description_document_id: Optional[uuid.UUID] = None
    job_role: str = Field(..., min_length=2)
    duration_minutes: int = Field(..., ge=10, le=60)
    evaluation_rigor: str = Field("target_bar", pattern="^(standard|target_bar|stress_test)$")


class InterviewPlanResponse(BaseModel):
    interview_objectives: List[str] = Field(default_factory=list)
    questions: List[PlannedQuestion] = Field(..., min_length=2)
    total_estimated_minutes: int
    competency_weights: List[CompetencyWeight] = Field(default_factory=list)

