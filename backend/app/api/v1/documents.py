import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, AuthenticatedUser, verify_document_ownership
from backend.app.models.models import Document, Profile
from backend.app.schemas.document import DocumentResponse
from backend.app.services.document_service import (
    extract_document_text,
    parse_resume_with_ai,
    parse_job_description_with_ai,
)

router = APIRouter(prefix="/documents", tags=["Documents"])


def ensure_profile_exists(user_id: uuid.UUID, db: Session):
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        profile = Profile(id=user_id, display_name="Candidate")
        db.add(profile)
        db.commit()


@router.post("/resume", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload and parse a candidate resume (.pdf or .docx).
    Validates file size, checks magic bytes, extracts text, and extracts structured profile.
    """
    ensure_profile_exists(current_user.id, db)
    file_bytes = await file.read()
    extracted_text, doc_format = extract_document_text(file_bytes, file.filename or "resume.pdf")

    # Structured parsing
    parsed_data = await parse_resume_with_ai(extracted_text, filename=file.filename or "resume.pdf")

    doc = Document(
        user_id=current_user.id,
        document_type="resume",
        file_name=file.filename or "resume.pdf",
        storage_path=None,
        extracted_text=extracted_text,
        extracted_data=parsed_data,
        parsing_status="completed",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/job-description", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_job_description(
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit a job description by uploading a file (.pdf / .docx) or pasting text.
    """
    ensure_profile_exists(current_user.id, db)

    if file:
        file_bytes = await file.read()
        extracted_text, _ = extract_document_text(file_bytes, file.filename or "job_description.pdf")
        filename = file.filename or "job_description.pdf"
    elif text_content and len(text_content.strip()) >= 20:
        extracted_text = text_content.strip()
        filename = "pasted_job_description.txt"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid job description document or paste at least 20 characters of text.",
        )

    parsed_data = await parse_job_description_with_ai(extracted_text, filename=filename)


    doc = Document(
        user_id=current_user.id,
        document_type="job_description",
        file_name=filename,
        storage_path=None,
        extracted_text=extracted_text,
        extracted_data=parsed_data,
        parsing_status="completed",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves an authorized document and its extracted structured data."""
    return verify_document_ownership(document_id, current_user, db)
