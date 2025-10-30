"""
FastAPI main application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import episodes, highlights, prompts, speakers, seed

app = FastAPI(
    title="Podcast Highlighter API",
    description="AI-powered podcast highlight extraction API",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(episodes.router, prefix="/api/episodes", tags=["episodes"])
app.include_router(highlights.router, prefix="/api/highlights", tags=["highlights"])
app.include_router(prompts.router, prefix="/api/prompts", tags=["prompts"])
app.include_router(speakers.router, prefix="/api/speakers", tags=["speakers"])
app.include_router(seed.router, prefix="/api/seed", tags=["seed"])


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Podcast Highlighter API", "version": "1.0.0"}


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}

