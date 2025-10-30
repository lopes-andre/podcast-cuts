"""Highlight-related Pydantic models."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class HighlightCreate(BaseModel):
    """Model for creating a highlight."""

    episode_id: str
    prompt_id: Optional[str] = None
    start_s: float
    end_s: float
    transcript: str
    status: str = "pending"


class HighlightUpdate(BaseModel):
    """Model for updating a highlight."""

    status: Optional[str] = None
    comments: Optional[str] = None
    raw_video_link: Optional[str] = None
    edited_video_link: Optional[str] = None
    profile_ids: Optional[list[str]] = None


class HighlightResponse(BaseModel):
    """Highlight response model."""

    id: str
    episode_id: str
    prompt_id: Optional[str] = None
    start_s: float
    end_s: float
    transcript: str
    status: str
    comments: Optional[str] = None
    raw_video_link: Optional[str] = None
    edited_video_link: Optional[str] = None
    speakers: list[str] = []  # List of speaker names in this highlight
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HighlightFilters(BaseModel):
    """Query filters for highlights."""

    episode_id: Optional[str] = None
    status: Optional[str] = None
    profile_id: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = 50
    offset: int = 0

