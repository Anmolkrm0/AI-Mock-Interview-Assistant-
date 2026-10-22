import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, AuthenticatedUser, verify_interview_ownership
from backend.app.models.models import Report, Feedback, Interview
from backend.app.schemas.report import ReportResponse, FeedbackRequest, FeedbackResponse
from backend.app.services.evaluation_service import evaluate_interview_session

router = APIRouter(tags=["Reports & Feedback"])


@router.post("/interviews/{interview_id}/evaluate", response_model=ReportResponse, status_code=status.HTTP_200_OK)
async def trigger_interview_evaluation(
    interview_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Triggers structured evaluation of an interview session, scoring answers and generating the report.
    """
    verify_interview_ownership(interview_id, current_user, db)
    report = await evaluate_interview_session(interview_id, db)
    return report


@router.get("/interviews/{interview_id}/report", response_model=ReportResponse)
def get_interview_report(
    interview_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetches the generated evaluation report for an authorized interview.
    """
    verify_interview_ownership(interview_id, current_user, db)
    report = db.query(Report).filter(Report.interview_id == interview_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation report has not been generated for this interview yet.",
        )
    return report


@router.post("/interviews/{interview_id}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_interview_feedback(
    interview_id: uuid.UUID,
    payload: FeedbackRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits candidate rating and feedback for the practice session.
    """
    verify_interview_ownership(interview_id, current_user, db)

    feedback = Feedback(
        user_id=current_user.id,
        interview_id=interview_id,
        rating=payload.rating,
        comments=payload.comments,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
