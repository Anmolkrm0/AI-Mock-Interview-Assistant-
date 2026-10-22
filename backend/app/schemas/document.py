import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ParsedCandidateProfile(BaseModel):
    name: Optional[str] = Field(None, description="Candidate name if explicitly found")
    summary: str = Field(..., description="Summary of candidate background")
    years_of_experience: Optional[str] = Field(None, description="Years of experience if explicitly stated")
    skills: List[str] = Field(default_factory=list, description="Extracted core skills and technologies")
    relevant_projects: List[Dict[str, Any]] = Field(default_factory=list, description="Projects and impact")
    responsibilities: List[str] = Field(default_factory=list, description="Key work responsibilities")
    education: Optional[str] = Field(None, description="Educational background if provided")


class ParsedJobDescription(BaseModel):
    job_title: str = Field(..., description="Detected primary job title")
    seniority: str = Field("Mid-Senior", description="Detected seniority level (Entry, Mid, Senior, Staff, Lead)")
    required_skills: List[str] = Field(default_factory=list, description="Mandatory technical & soft skills")
    preferred_skills: List[str] = Field(default_factory=list, description="Bonus/preferred qualifications")
    responsibilities: List[str] = Field(default_factory=list, description="Key duties and deliverables")
    competencies: List[str] = Field(default_factory=list, description="Key competencies to evaluate")


class DocumentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    document_type: str
    file_name: str
    parsing_status: str
    extracted_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
