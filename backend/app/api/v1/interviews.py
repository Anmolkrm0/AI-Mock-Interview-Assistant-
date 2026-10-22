import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, AuthenticatedUser, verify_interview_ownership
from backend.app.models.models import Interview, InterviewPlan, Question, Profile, Document
from backend.app.schemas.plan import InterviewPlanRequest, InterviewPlanResponse
from backend.app.schemas.interview import InterviewCreateRequest, InterviewResponse, InterviewListResponse
from backend.app.services.interview_planner import generate_interview_plan

router = APIRouter(prefix="/interviews", tags=["Interviews"])


def ensure_profile_exists(user_id: uuid.UUID, db: Session):
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        profile = Profile(id=user_id, display_name="Candidate")
        db.add(profile)
        db.commit()


@router.post("/plan", response_model=InterviewPlanResponse, status_code=status.HTTP_200_OK)
async def plan_interview(
    payload: InterviewPlanRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates a structured, duration-adapted interview plan without committing an interview session yet.
    """
    candidate_profile = None
    job_description = None

    if payload.resume_document_id:
        doc = db.query(Document).filter(
            Document.id == payload.resume_document_id,
            Document.user_id == current_user.id
        ).first()
        if doc:
            candidate_profile = doc.extracted_data

    if payload.job_description_document_id:
        jd_doc = db.query(Document).filter(
            Document.id == payload.job_description_document_id,
            Document.user_id == current_user.id
        ).first()
        if jd_doc:
            job_description = jd_doc.extracted_data

    plan = await generate_interview_plan(
        job_role=payload.job_role,
        duration_minutes=payload.duration_minutes,
        evaluation_rigor=payload.evaluation_rigor,
        candidate_profile=candidate_profile,
        job_description=job_description,
    )
    return plan


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    payload: InterviewCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates an interview session, generates the approved question plan,
    and initializes ordered questions in the database.
    """
    ensure_profile_exists(current_user.id, db)

    # 1. Fetch document contexts if provided
    candidate_profile = None
    job_description = None

    if payload.resume_document_id:
        doc = db.query(Document).filter(
            Document.id == payload.resume_document_id,
            Document.user_id == current_user.id
        ).first()
        if doc:
            candidate_profile = doc.extracted_data

    if payload.job_description_document_id:
        jd_doc = db.query(Document).filter(
            Document.id == payload.job_description_document_id,
            Document.user_id == current_user.id
        ).first()
        if jd_doc:
            job_description = jd_doc.extracted_data

    # 2. Generate Plan
    plan_data = await generate_interview_plan(
        job_role=payload.job_role,
        duration_minutes=payload.duration_minutes,
        evaluation_rigor=payload.evaluation_rigor,
        candidate_profile=candidate_profile,
        job_description=job_description,
    )

    # 3. Create Interview Record
    interview = Interview(
        user_id=current_user.id,
        resume_document_id=payload.resume_document_id,
        job_description_document_id=payload.job_description_document_id,
        job_role=payload.job_role,
        duration_minutes=payload.duration_minutes,
        evaluation_rigor=payload.evaluation_rigor,
        status="ready",
    )
    db.add(interview)
    db.flush()

    # 4. Save Interview Plan
    plan = InterviewPlan(
        interview_id=interview.id,
        plan_json=plan_data,
        version=1,
    )
    db.add(plan)

    # 5. Save Questions
    for q in plan_data["questions"]:
        question_obj = Question(
            interview_id=interview.id,
            sequence_number=q["id"],
            question_text=q["question_text"],
            competency=q["competency"],
            difficulty=q["difficulty"],
            question_type=q.get("question_type", "technical"),
            status="pending",
        )
        db.add(question_obj)

    db.commit()
    db.refresh(interview)

    return {
        "id": interview.id,
        "user_id": interview.user_id,
        "resume_document_id": interview.resume_document_id,
        "job_description_document_id": interview.job_description_document_id,
        "job_role": interview.job_role,
        "duration_minutes": interview.duration_minutes,
        "evaluation_rigor": interview.evaluation_rigor,
        "status": interview.status,
        "started_at": interview.started_at,
        "deadline_at": interview.deadline_at,
        "completed_at": interview.completed_at,
        "created_at": interview.created_at,
        "plan": plan_data,
        "overall_score": None,
        "has_recording": False,
    }


@router.get("", response_model=InterviewListResponse)
def list_interviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists the authenticated user's interview history with pagination."""
    query = db.query(Interview).filter(Interview.user_id == current_user.id).order_by(Interview.created_at.desc())
    total = query.count()
    interviews = query.offset(skip).limit(limit).all()

    result = []
    for it in interviews:
        result.append({
            "id": it.id,
            "user_id": it.user_id,
            "resume_document_id": it.resume_document_id,
            "job_description_document_id": it.job_description_document_id,
            "job_role": it.job_role,
            "duration_minutes": it.duration_minutes,
            "evaluation_rigor": it.evaluation_rigor,
            "status": it.status,
            "started_at": it.started_at,
            "deadline_at": it.deadline_at,
            "completed_at": it.completed_at,
            "created_at": it.created_at,
            "plan": it.plan.plan_json if it.plan else None,
            "overall_score": it.report.overall_score if it.report else None,
            "has_recording": len(it.recordings) > 0,
        })

    return {"interviews": result, "total": total}


@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves an authorized interview session."""
    it = verify_interview_ownership(interview_id, current_user, db)
    return {
        "id": it.id,
        "user_id": it.user_id,
        "resume_document_id": it.resume_document_id,
        "job_description_document_id": it.job_description_document_id,
        "job_role": it.job_role,
        "duration_minutes": it.duration_minutes,
        "evaluation_rigor": it.evaluation_rigor,
        "status": it.status,
        "started_at": it.started_at,
        "deadline_at": it.deadline_at,
        "completed_at": it.completed_at,
        "created_at": it.created_at,
        "plan": it.plan.plan_json if it.plan else None,
        "overall_score": it.report.overall_score if it.report else None,
        "has_recording": len(it.recordings) > 0,
    }


@router.get("/{interview_id}/status")
def get_interview_status(
    interview_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the current status of the session and evaluation."""
    it = verify_interview_ownership(interview_id, current_user, db)
    report_ready = bool(it.report and it.report.report_status == "completed")
    return {
        "interview_id": str(it.id),
        "status": it.status,
        "started_at": it.started_at,
        "deadline_at": it.deadline_at,
        "completed_at": it.completed_at,
        "report_ready": report_ready,
    }
