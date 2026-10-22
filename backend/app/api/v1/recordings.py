import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, AuthenticatedUser, verify_interview_ownership
from backend.app.schemas.recording import (
    RecordingUploadUrlRequest,
    RecordingUploadUrlResponse,
    RecordingConfirmRequest,
    RecordingResponse,
    PlaybackUrlResponse,
)
from backend.app.services.recording_service import (
    get_recording_upload_url,
    confirm_and_replace_recording,
    get_playback_url,
    delete_user_latest_recording,
)

router = APIRouter(tags=["Recordings"])


@router.post("/recordings/upload-url", response_model=RecordingUploadUrlResponse)
def request_recording_upload_url(
    payload: RecordingUploadUrlRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Issues an authorized upload mechanism to Supabase Storage for the user's interview recording.
    """
    verify_interview_ownership(payload.interview_id, current_user, db)
    upload_url, storage_path = get_recording_upload_url(
        user_id=current_user.id,
        interview_id=payload.interview_id,
        file_name=payload.file_name,
        file_size_bytes=payload.file_size_bytes,
    )
    return {
        "upload_url": upload_url,
        "storage_path": storage_path,
        "max_size_bytes": settings.MAX_RECORDING_SIZE_MB * 1024 * 1024,
    }


@router.post("/recordings/confirm", response_model=RecordingResponse, status_code=status.HTTP_200_OK)
def confirm_recording(
    payload: RecordingConfirmRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Confirms an uploaded recording object, replaces the user's single current recording pointer,
    and cleans up any prior recording without deleting interview history or reports.
    """
    verify_interview_ownership(payload.interview_id, current_user, db)
    recording = confirm_and_replace_recording(
        user_id=current_user.id,
        interview_id=payload.interview_id,
        storage_path=payload.storage_path,
        mime_type=payload.mime_type,
        file_size_bytes=payload.file_size_bytes,
        duration_seconds=payload.duration_seconds,
        db=db,
    )
    return recording


@router.get("/interviews/{interview_id}/recording-url", response_model=PlaybackUrlResponse)
def get_interview_recording_playback_url(
    interview_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Issues a short-lived playback URL only if the authenticated user owns this recording.
    """
    verify_interview_ownership(interview_id, current_user, db)
    playback_url = get_playback_url(current_user.id, interview_id, db)
    return {
        "playback_url": playback_url,
        "expires_in_seconds": 3600,
    }


@router.delete("/recordings/latest", status_code=status.HTTP_200_OK)
def delete_latest_recording(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes the authenticated user's current recording from the database and storage.
    """
    delete_user_latest_recording(current_user.id, db)
    return {"message": "Latest recording deleted successfully."}
