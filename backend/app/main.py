import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Must run before anything below imports app.llm (app.api.chat does, at
# import time) - app.llm reads JUDGE_PROVIDER from the environment once, at
# import, and silently defaults to "google" if unset. That's the exact
# silent-fallback failure results.md S1.3 documents (Groq and Gemini
# genuinely disagree on identical input), and it must not happen invisibly
# in a live run. Refusing to start beats starting on the wrong provider.
if not os.environ.get("JUDGE_PROVIDER"):
    raise RuntimeError(
        "JUDGE_PROVIDER is not set. app.llm defaults to 'google' when this is "
        "unset, silently - refusing to start rather than risk a live run "
        "landing on the wrong judge provider (results.md S1.3). "
        "Set JUDGE_PROVIDER=groq (or google, explicitly) before starting."
    )

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.api.health import router as health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(health_router, prefix=settings.API_V1_STR)

from app.api.agents import router as agents_router
from app.api.attacks import router as attacks_router
from app.api.runs import router as runs_router
from app.api.traces import router as traces_router
from app.api.findings import router as findings_router
from app.api.versions import router as versions_router
from app.api.regression import router as regression_router
from app.api.chat import router as chat_router
from app.api.constraints import router as constraints_router

app.include_router(agents_router, prefix=settings.API_V1_STR)
app.include_router(attacks_router, prefix=settings.API_V1_STR)
app.include_router(runs_router, prefix=settings.API_V1_STR)
app.include_router(traces_router, prefix=settings.API_V1_STR)
app.include_router(findings_router, prefix=settings.API_V1_STR)
app.include_router(versions_router, prefix=settings.API_V1_STR)
app.include_router(regression_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=f"{settings.API_V1_STR}/chat")
app.include_router(constraints_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": "/health"
    }
