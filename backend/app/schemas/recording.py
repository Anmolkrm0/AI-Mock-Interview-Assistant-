import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RecordingUploadUrlRequest(BaseModel):
    interview_id: uuid.UUID
    file_name: str
    mime_type: str = "audio/webm"
    file_size_bytes: int = Field(..., gt=0)


class RecordingUploadUrlResponse(BaseModel):
    upload_url: str
    storage_path: str
    max_size_bytes: int


class RecordingConfirmRequest(BaseModel):
    interview_id: uuid.UUID
    storage_path: str
    mime_type: str = "audio/webm"
    file_size_bytes: int
    duration_seconds: int


class RecordingResponse(BaseModel):
    user_id: uuid.UUID
    interview_id: uuid.UUID
    storage_path: str
    mime_type: str
    file_size_bytes: int
    duration_seconds: int
    created_at: datetime

    class Config:
        from_attributes = True


class PlaybackUrlResponse(BaseModel):
    playback_url: str
    expires_in_seconds: int
