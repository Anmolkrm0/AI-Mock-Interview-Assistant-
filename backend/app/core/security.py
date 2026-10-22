import uuid
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.models import Interview, Recording, Document

security_bearer = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    def __init__(self, user_id: uuid.UUID, email: Optional[str] = None, role: str = "authenticated"):
        self.id = user_id
        self.email = email
        self.role = role


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> AuthenticatedUser:
    """
    Validates Supabase JWT access token from the Authorization: Bearer <token> header.
    Extracts user UUID from the 'sub' claim.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # If Supabase JWT Secret is configured, verify signature; otherwise verify claims structure
    try:
        if settings.SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # Fallback for local development or when Supabase public key / secret is pending
            payload = jwt.decode(
                token,
                options={"verify_signature": False},
            )

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing user subject identifier",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = uuid.UUID(user_id_str)
        email = payload.get("email")
        role = payload.get("role", "authenticated")
        return AuthenticatedUser(user_id=user_id, email=email, role=role)

    except (jwt.PyJWTError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(err)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_interview_ownership(
    interview_id: uuid.UUID,
    user: AuthenticatedUser,
    db: Session,
) -> Interview:
    """Verifies that the requested interview exists and belongs to the authenticated user."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )
    if interview.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this interview",
        )
    return interview


def verify_document_ownership(
    document_id: uuid.UUID,
    user: AuthenticatedUser,
    db: Session,
) -> Document:
    """Verifies that the requested document exists and belongs to the authenticated user."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    if doc.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document",
        )
    return doc
