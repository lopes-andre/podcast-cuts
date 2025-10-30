"""Highlight endpoints."""
from typing import List

from fastapi import APIRouter, HTTPException, Query

from app.models.highlights import HighlightFilters, HighlightResponse, HighlightUpdate
from app.services.highlight_service import HighlightService

router = APIRouter()
highlight_service = HighlightService()


@router.get("", response_model=List[HighlightResponse])
async def list_highlights(
    episode_id: str | None = None,
    status: str | None = None,
    profile_id: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> List[HighlightResponse]:
    """List highlights with filters."""
    filters = HighlightFilters(
        episode_id=episode_id,
        status=status,
        profile_id=profile_id,
        limit=limit,
        offset=offset,
    )
    highlights = await highlight_service.list_highlights(filters)
    return [HighlightResponse(**h) for h in highlights]


@router.get("/{highlight_id}", response_model=HighlightResponse)
async def get_highlight(highlight_id: str) -> HighlightResponse:
    """Get a single highlight by ID."""
    highlight = await highlight_service.get_highlight(highlight_id)
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    return HighlightResponse(**highlight)


@router.put("/{highlight_id}", response_model=HighlightResponse)
async def update_highlight(highlight_id: str, data: HighlightUpdate) -> HighlightResponse:
    """Update highlight metadata and status."""
    highlight = await highlight_service.update_highlight(
        highlight_id, data.model_dump(exclude_unset=True)
    )
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    return HighlightResponse(**highlight)


@router.delete("/{highlight_id}")
async def delete_highlight(highlight_id: str) -> dict[str, str]:
    """Delete a highlight."""
    success = await highlight_service.delete_highlight(highlight_id)
    if not success:
        raise HTTPException(status_code=404, detail="Highlight not found")
    return {"message": "Highlight deleted successfully"}


@router.get("/export/{format}")
async def export_highlights(
    format: str,
    episode_id: str | None = None,
    status: str | None = None,
) -> dict[str, str]:
    """Export highlights in specified format (srt, csv, json)."""
    if format not in ["srt", "csv", "json"]:
        raise HTTPException(status_code=400, detail="Invalid export format")
    
    # TODO: Implement export functionality
    return {"message": f"Export in {format} format", "episode_id": episode_id}

