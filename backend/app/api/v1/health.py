from fastapi import APIRouter, status
from backend.app.core.config import settings
from backend.app.core.database import check_db_connection

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check endpoint reporting overall system, DB, and configured provider status."""
    db_ok = check_db_connection()

    return {
        "status": "ok" if db_ok else "degraded",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": {
            "connected": db_ok,
            "dialect": "postgresql",
        },
        "providers": {
            "text_ai": {
                "provider": settings.TEXT_AI_PROVIDER,
                "configured": bool(
                    (settings.TEXT_AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY)
                    or (settings.TEXT_AI_PROVIDER == "groq" and settings.GROQ_API_KEY)
                ),
                "model": (
                    settings.GEMINI_TEXT_MODEL
                    if settings.TEXT_AI_PROVIDER == "gemini"
                    else settings.GROQ_TEXT_MODEL
                ),
            },
            "live_ai": {
                "provider": settings.LIVE_AI_PROVIDER,
                "configured": bool(settings.GEMINI_API_KEY),
                "model": settings.GEMINI_LIVE_MODEL,
            },
            "supabase": {
                "configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
            },
        },
    }
