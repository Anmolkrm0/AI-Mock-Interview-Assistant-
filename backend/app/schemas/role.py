from typing import List, Optional
from pydantic import BaseModel, Field


class DetectedRole(BaseModel):
    title: str = Field(..., description="Role title")
    seniority: str = Field(..., description="Seniority level (e.g. Senior, Staff, Lead)")
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0")
    reasoning: str = Field(..., description="Why this role matches the JD")


class RoleDetectionRequest(BaseModel):
    job_description_text: str = Field(..., min_length=1, description="Job description text")
    filename: Optional[str] = Field(None, description="Optional original filename to boost detection fidelity")


class RoleDetectionResponse(BaseModel):
    detected_roles: List[DetectedRole] = Field(..., min_length=1)
    primary_role: str = Field(..., description="Default selected role")
    primary_seniority: Optional[str] = Field("Senior", description="Detected primary seniority level")

