"""Highlight-related Pydantic models."""
from datetime import datetime
from typing import Optional, Any

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
    raw_video_link: Optional[str] = None
    edited_video_link: Optional[str] = None
    profile_ids: Optional[list[str]] = None
    # Note: Individual comments are managed via separate comments endpoints
    # Segments are managed via separate segments endpoints


class PromptInfo(BaseModel):
    """Prompt information embedded in highlight response."""
    
    id: str
    name: str
    version: int
    
    class Config:
        from_attributes = True


class HighlightCommentInfo(BaseModel):
    """Comment information embedded in highlight response."""
    
    id: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class HighlightResponse(BaseModel):
    """Highlight response model with full related data."""

    id: str
    episode_id: str
    prompt_id: Optional[str] = None
    prompt: Optional[PromptInfo] = None  # Full prompt details
    start_s: float
    end_s: float
    transcript: str
    status: str
    raw_video_link: Optional[str] = None
    edited_video_link: Optional[str] = None
    speakers: list[str] = []  # List of speaker names in this highlight
    comments: list[HighlightCommentInfo] = []  # All comments for this highlight
    segment_ids: list[str] = []  # Ordered list of segment IDs that make up this highlight
    social_profiles: list[str] = []  # List of social profile names this highlight is tagged for
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

