from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.alerts import router as alerts_router
from app.api.analytics import router as analytics_router
from app.api.events import router as events_router
from app.api.feedback import router as feedback_router
from app.api.guidance import router as guidance_router
from app.api.health import router as health_router
from app.api.integrations import router as integrations_router
from app.api.copilot import router as copilot_router
from app.api.incidents import router as incidents_router
from app.api.measurements import router as measurements_router
from app.api.predictions import router as predictions_router
from app.api.risk import router as risk_router
from app.api.staffing import router as staffing_router
from app.api.websocket import router as ws_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Predictive crowd orchestration API foundation.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    register_exception_handlers(app)
    app.include_router(health_router)
    app.include_router(ws_router)
    app.include_router(events_router, prefix=settings.api_v1_prefix)
    app.include_router(measurements_router, prefix=settings.api_v1_prefix)
    app.include_router(predictions_router, prefix=settings.api_v1_prefix)
    app.include_router(risk_router, prefix=settings.api_v1_prefix)
    app.include_router(alerts_router, prefix=settings.api_v1_prefix)
    app.include_router(guidance_router, prefix=settings.api_v1_prefix)
    app.include_router(feedback_router, prefix=settings.api_v1_prefix)
    app.include_router(integrations_router, prefix=settings.api_v1_prefix)
    app.include_router(copilot_router, prefix=settings.api_v1_prefix)
    app.include_router(staffing_router, prefix=settings.api_v1_prefix)
    app.include_router(incidents_router, prefix=settings.api_v1_prefix)
    app.include_router(analytics_router, prefix=settings.api_v1_prefix)

    return app


app = create_app()
