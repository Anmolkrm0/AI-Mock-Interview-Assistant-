import uuid
import jwt
import pytest
from fastapi import FastAPI, Depends, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from backend.app.core.database import Base, get_db
from backend.app.models.models import Profile, Interview
from backend.app.core.security import get_current_user, AuthenticatedUser, verify_interview_ownership

# Set up an in-memory SQLite database for fast isolated unit testing
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Create tables
Base.metadata.create_all(bind=test_engine)

# Create a test FastAPI app
test_app = FastAPI()


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


test_app.dependency_overrides[get_db] = override_get_db


@test_app.get("/test/protected")
def protected_route(current_user: AuthenticatedUser = Depends(get_current_user)):
    return {"user_id": str(current_user.id), "email": current_user.email}


@test_app.get("/test/interviews/{interview_id}")
def get_interview_route(
    interview_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = verify_interview_ownership(interview_id, current_user, db)
    return {"id": str(interview.id), "user_id": str(interview.user_id), "role": interview.job_role}


client = TestClient(test_app)


def generate_test_token(user_id: uuid.UUID, email: str = "test@example.com") -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
    }
    return jwt.encode(payload, "test-secret-key", algorithm="HS256")


def test_missing_token_returns_401():
    response = client.get("/test/protected")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Missing authentication" in response.json()["detail"]


def test_invalid_token_returns_401():
    response = client.get("/test/protected", headers={"Authorization": "Bearer not-a-valid-jwt"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_valid_token_accesses_protected_route():
    user_id = uuid.uuid4()
    token = generate_test_token(user_id, email="candidate@test.com")
    response = client.get("/test/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["user_id"] == str(user_id)
    assert response.json()["email"] == "candidate@test.com"


def test_user_can_access_own_interview():
    user_id = uuid.uuid4()
    db = TestingSessionLocal()

    # Create profile and interview for user
    profile = Profile(id=user_id, display_name="User A")
    db.add(profile)
    interview = Interview(
        id=uuid.uuid4(),
        user_id=user_id,
        job_role="Senior Backend Engineer",
        duration_minutes=30,
        evaluation_rigor="target_bar",
        status="created",
    )
    db.add(interview)
    db.commit()

    token = generate_test_token(user_id)
    response = client.get(f"/test/interviews/{interview.id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == str(interview.id)


def test_user_cannot_access_other_users_interview():
    user_a_id = uuid.uuid4()
    user_b_id = uuid.uuid4()
    db = TestingSessionLocal()

    # Create interview owned by User A
    profile_a = Profile(id=user_a_id, display_name="User A")
    profile_b = Profile(id=user_b_id, display_name="User B")
    db.add_all([profile_a, profile_b])

    interview = Interview(
        id=uuid.uuid4(),
        user_id=user_a_id,
        job_role="Staff Distributed Engineer",
        duration_minutes=45,
        evaluation_rigor="stress_test",
        status="in_progress",
    )
    db.add(interview)
    db.commit()

    # User B tries to access User A's interview
    token_b = generate_test_token(user_b_id)
    response = client.get(f"/test/interviews/{interview.id}", headers={"Authorization": f"Bearer {token_b}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "permission" in response.json()["detail"].lower()
