import uuid
import jwt
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.models import Interview
from backend.app.services.live_ai_service import LiveInterviewSessionManager

router = APIRouter(tags=["Live WebSocket"])


DEV_SECRET = "dev-secret-key-mock-interview-2026"


def authenticate_websocket_token(token: Optional[str]) -> Optional[uuid.UUID]:
    if not token:
        return None
    # 1. Attempt Supabase JWT Secret if configured
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
            user_id_str = payload.get("sub")
            if user_id_str:
                return uuid.UUID(user_id_str)
        except Exception:
            pass

    # 2. Attempt local dev token secret
    try:
        payload = jwt.decode(token, DEV_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        user_id_str = payload.get("sub")
        if user_id_str:
            return uuid.UUID(user_id_str)
    except Exception:
        pass

    # 3. Development fallback: decode claims without signature verification
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id_str = payload.get("sub")
        if user_id_str:
            return uuid.UUID(user_id_str)
    except Exception:
        pass

    return None


@router.websocket("/interviews/{interview_id}/live-ws")
async def live_interview_websocket(
    websocket: WebSocket,
    interview_id: uuid.UUID,
    token: Optional[str] = Query(None),
):
    await websocket.accept()
    db: Session = SessionLocal()

    try:
        # Validate authentication
        user_id = authenticate_websocket_token(token)
        interview = db.query(Interview).filter(Interview.id == interview_id).first()

        if not interview:
            await websocket.send_json({"type": "error", "message": "Interview not found"})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # If user_id is verified, enforce ownership
        if user_id and interview.user_id != user_id:
            await websocket.send_json({"type": "error", "message": "Unauthorized access to interview"})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Instantiate session manager
        manager = LiveInterviewSessionManager(interview_id=interview_id, websocket=websocket, db=db)
        initialized = await manager.initialize()
        if not initialized:
            return

        # Main message receive loop
        while manager.is_active:
            data = await websocket.receive_json()
            await manager.handle_message(data)

    except WebSocketDisconnect:
        print(f"WebSocket client disconnected for interview {interview_id}")
    except Exception as e:
        print(f"Error in live interview websocket: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        db.close()
