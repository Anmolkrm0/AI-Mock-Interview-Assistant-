from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.documents import router as documents_router
from backend.app.api.v1.roles import router as roles_router
from backend.app.api.v1.interviews import router as interviews_router
from backend.app.api.v1.live_ws import router as live_ws_router
from backend.app.api.v1.recordings import router as recordings_router
from backend.app.api.v1.reports import router as reports_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Set CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include v1 routers
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(documents_router, prefix=settings.API_V1_STR, tags=["Documents"])
app.include_router(roles_router, prefix=settings.API_V1_STR, tags=["Roles"])
app.include_router(interviews_router, prefix=settings.API_V1_STR, tags=["Interviews"])
app.include_router(live_ws_router, prefix=settings.API_V1_STR, tags=["Live WebSocket"])
app.include_router(recordings_router, prefix=settings.API_V1_STR, tags=["Recordings"])
app.include_router(reports_router, prefix=settings.API_V1_STR, tags=["Reports & Feedback"])


@app.on_event("startup")
def on_startup():
    from backend.app.models.models import Base
    from backend.app.core.database import engine
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Startup table creation warning: {e}")


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": f"{settings.API_V1_STR}/docs",
    }
