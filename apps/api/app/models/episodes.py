"""Episode-related Pydantic models."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, HttpUrl


class EpisodeCreate(BaseModel):
    """Model for creating a new episode."""

    youtube_url: str
    title: Optional[str] = None
    recorded_at: Optional[datetime] = None
    published_at: Optional[datetime] = None


class EpisodeIngest(BaseModel):
    """Model for ingesting and processing an episode."""

    youtube_url: str
    auto_detect_highlights: bool = False
    prompt_ids: Optional[list[str]] = None


class EpisodeUpdate(BaseModel):
    """Model for updating an episode."""

    title: Optional[str] = None
    description: Optional[str] = None
    raw_video_link: Optional[str] = None
    recorded_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    status: Optional[str] = None


class EpisodeResponse(BaseModel):
    """Episode response model."""

    id: str
    youtube_url: str
    title: str
    duration_seconds: int
    description: Optional[str] = None
    raw_video_link: Optional[str] = None
    recorded_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    full_transcript: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SegmentResponse(BaseModel):
    """Segment response model."""

    id: str
    episode_id: str
    start_s: float
    end_s: float
    text: str
    confidence: float
    speakers: list[str] = []

    class Config:
        from_attributes = True

