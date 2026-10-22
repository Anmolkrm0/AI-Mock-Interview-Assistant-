import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, ConfigDict


class CompetencyScore(BaseModel):
    competency: str
    score: int = Field(..., ge=0, le=100)


class HighlightItem(BaseModel):
    title: str
    description: str


class QuestionEvaluation(BaseModel):
    question_id: int
    question_text: str
    competency: str
    score: float = Field(..., ge=1.0, le=5.0, description="1 to 5 score rubric")
    candidate_quote: str = Field(..., description="Exact or summarized quote from candidate answer")
    rationale: str = Field(..., description="Evaluation rationale distinguishing observed evidence from interpretation")
    model_upgrade: str = Field(..., description="Suggested STAR model improvement or stronger answer")


class ReportSchema(BaseModel):
    overall_score: int = Field(..., ge=0, le=100)
    verdict: str = Field("Meets Target Bar", description="Hiring verdict e.g. Strong Hire, Meets Target Bar")
    percentile: str = Field("Top 15% of candidates", description="Peer median comparison")
    competency_scores: List[CompetencyScore] = Field(default_factory=list)
    question_evaluations: List[QuestionEvaluation] = Field(default_factory=list)
    strengths: List[HighlightItem] = Field(default_factory=list)
    improvement_areas: List[HighlightItem] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    interview_id: uuid.UUID
    overall_score: int
    competency_scores: Any
    question_evaluations: Any
    strengths: Any
    improvement_areas: Any
    recommendations: List[str]
    report_status: str
    created_at: datetime


class FeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    interview_id: uuid.UUID
    rating: int
    comments: Optional[str] = None
    created_at: datetime
