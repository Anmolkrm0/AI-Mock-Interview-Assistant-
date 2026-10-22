import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.models import Profile

router = APIRouter(prefix="/auth", tags=["Authentication"])

DEV_SECRET = "dev-secret-key-mock-interview-2026"


class AuthRequest(BaseModel):
    email: str
    password: Optional[str] = "password123"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


def create_token(user_id: uuid.UUID, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=7)).timestamp()),
    }
    return jwt.encode(payload, DEV_SECRET, algorithm="HS256")


@router.post("/demo-token", response_model=TokenResponse)
def get_demo_token(db: Session = Depends(get_db)):
    """
    Generates a local development token for instant 1-click candidate login.
    """
    demo_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    demo_email = "candidate@mockinterview.local"

    profile = db.query(Profile).filter(Profile.id == demo_user_id).first()
    if not profile:
        profile = Profile(id=demo_user_id, display_name="Demo Candidate")
        db.add(profile)
        db.commit()

    token = create_token(demo_user_id, demo_email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(demo_user_id),
        "email": demo_email,
    }


@router.post("/login", response_model=TokenResponse)
def dev_login(payload: AuthRequest, db: Session = Depends(get_db)):
    """
    Local development sign in endpoint for environments where Supabase Cloud is pending.
    Generates deterministic user IDs and sets up candidate profile.
    """
    user_id = uuid.uuid5(uuid.NAMESPACE_DNS, payload.email.lower().strip())
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        profile = Profile(
            id=user_id,
            display_name=payload.email.split("@")[0].capitalize(),
        )
        db.add(profile)
        db.commit()

    token = create_token(user_id, payload.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user_id),
        "email": payload.email,
    }
