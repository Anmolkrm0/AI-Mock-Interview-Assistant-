import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from supabase import create_client, Client

from backend.app.core.config import settings
from backend.app.models.models import Recording, Interview


def get_supabase_admin_client() -> Optional[Client]:
    """Returns an authenticated Supabase client using the service role key for storage administration."""
    if settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY):
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
        return create_client(settings.SUPABASE_URL, key)
    return None


def generate_recording_storage_path(user_id: uuid.UUID, interview_id: uuid.UUID, file_name: str) -> str:
    """Generates an isolated, private object storage path."""
    timestamp = int(datetime.now(timezone.utc).timestamp())
    ext = file_name.split(".")[-1] if "." in file_name else "webm"
    return f"{user_id}/{interview_id}_{timestamp}.{ext}"


def get_recording_upload_url(
    user_id: uuid.UUID,
    interview_id: uuid.UUID,
    file_name: str,
    file_size_bytes: int,
) -> Tuple[str, str]:
    """
    Validates file size against the 50MB quota and issues a secure upload destination.
    Returns (upload_url, storage_path).
    """
    max_bytes = settings.MAX_RECORDING_SIZE_MB * 1024 * 1024
    if file_size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Recording size ({file_size_bytes / (1024*1024):.1f}MB) exceeds the 50MB limit.",
        )

    storage_path = generate_recording_storage_path(user_id, interview_id, file_name)
    client = get_supabase_admin_client()

    if client:
        try:
            # Create a signed upload URL via Supabase Storage
            res = client.storage.from_(settings.RECORDING_BUCKET_NAME).create_signed_upload_url(storage_path)
            upload_url = res.get("signedUrl") or res.get("url") or ""
            return upload_url, storage_path
        except Exception as e:
            print(f"Failed to create signed upload URL on Supabase: {e}")

    # Fallback endpoint URL if direct bucket upload is in development mode
    fallback_url = f"{settings.API_V1_STR}/recordings/direct-upload?path={storage_path}"
    return fallback_url, storage_path


def confirm_and_replace_recording(
    user_id: uuid.UUID,
    interview_id: uuid.UUID,
    storage_path: str,
    mime_type: str,
    file_size_bytes: int,
    duration_seconds: int,
    db: Session,
) -> Recording:
    """
    Atomically replaces the user's single latest recording pointer.
    Deletes the prior recording's object from Supabase Storage without deleting previous reports or transcripts.
    """
    max_bytes = settings.MAX_RECORDING_SIZE_MB * 1024 * 1024
    if file_size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded recording exceeds the {settings.MAX_RECORDING_SIZE_MB}MB limit.",
        )

    # 1. Look up existing recording for this user
    prior_recording = db.query(Recording).filter(Recording.user_id == user_id).first()
    old_storage_path = prior_recording.storage_path if prior_recording else None

    # 2. Update or insert new recording in a transaction
    if prior_recording:
        prior_recording.interview_id = interview_id
        prior_recording.storage_path = storage_path
        prior_recording.mime_type = mime_type
        prior_recording.file_size_bytes = file_size_bytes
        prior_recording.duration_seconds = duration_seconds
        prior_recording.created_at = datetime.now(timezone.utc)
        target_recording = prior_recording
    else:
        target_recording = Recording(
            user_id=user_id,
            interview_id=interview_id,
            storage_path=storage_path,
            mime_type=mime_type,
            file_size_bytes=file_size_bytes,
            duration_seconds=duration_seconds,
        )
        db.add(target_recording)

    db.commit()
    db.refresh(target_recording)

    # 3. Clean up the old storage object after successful database commitment
    if old_storage_path and old_storage_path != storage_path:
        delete_storage_object(old_storage_path)

    return target_recording


def delete_storage_object(storage_path: str) -> bool:
    """Deletes an object from Supabase private storage."""
    client = get_supabase_admin_client()
    if client:
        try:
            client.storage.from_(settings.RECORDING_BUCKET_NAME).remove([storage_path])
            return True
        except Exception as e:
            print(f"Failed to delete old storage object {storage_path}: {e}")
            return False
    return True


def get_playback_url(user_id: uuid.UUID, interview_id: uuid.UUID, db: Session) -> str:
    """Generates a short-lived playback URL only if the user owns the recording."""
    rec = db.query(Recording).filter(Recording.user_id == user_id, Recording.interview_id == interview_id).first()
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No recording available for this interview.",
        )

    client = get_supabase_admin_client()
    if client:
        try:
            # 1 hour signed playback URL
            res = client.storage.from_(settings.RECORDING_BUCKET_NAME).create_signed_url(rec.storage_path, 3600)
            return res.get("signedURL") or res.get("signedUrl") or ""
        except Exception as e:
            print(f"Failed to generate signed playback URL: {e}")

    return f"/api/v1/recordings/mock-stream?path={rec.storage_path}"


def delete_user_latest_recording(user_id: uuid.UUID, db: Session) -> bool:
    """Manually deletes the user's latest recording and storage object."""
    rec = db.query(Recording).filter(Recording.user_id == user_id).first()
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No recording found to delete.",
        )

    storage_path = rec.storage_path
    db.delete(rec)
    db.commit()

    delete_storage_object(storage_path)
    return True
