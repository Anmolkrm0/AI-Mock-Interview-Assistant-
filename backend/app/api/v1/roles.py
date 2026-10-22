from fastapi import APIRouter, Depends, status
from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.schemas.role import RoleDetectionRequest, RoleDetectionResponse
from backend.app.services.role_detection_service import detect_roles_from_job_description

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.post("/detect", response_model=RoleDetectionResponse, status_code=status.HTTP_200_OK)
async def detect_roles(
    payload: RoleDetectionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Detect plausible candidate roles from job description text."""
    result = await detect_roles_from_job_description(
        payload.job_description_text,
        filename=payload.filename or "",
    )
    return result

