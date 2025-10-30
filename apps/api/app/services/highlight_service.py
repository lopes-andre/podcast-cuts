"""Highlight service for business logic."""
from typing import Any, Optional

from app.models.highlights import HighlightFilters
from app.services.database import supabase


class HighlightService:
    """Service for highlight-related operations."""

    async def list_highlights(self, filters: HighlightFilters) -> list[dict[str, Any]]:
        """List highlights with filters."""
        query = supabase.table("highlights").select("*")

        if filters.episode_id:
            query = query.eq("episode_id", filters.episode_id)
        if filters.status:
            query = query.eq("status", filters.status)
        if filters.date_from:
            query = query.gte("created_at", filters.date_from.isoformat())
        if filters.date_to:
            query = query.lte("created_at", filters.date_to.isoformat())

        result = (
            query.order("created_at", desc=True)
            .range(filters.offset, filters.offset + filters.limit - 1)
            .execute()
        )
        return result.data

    async def get_highlight(self, highlight_id: str) -> Optional[dict[str, Any]]:
        """Get a single highlight by ID."""
        result = supabase.table("highlights").select("*").eq("id", highlight_id).execute()
        return result.data[0] if result.data else None

    async def update_highlight(
        self, highlight_id: str, data: dict[str, Any]
    ) -> Optional[dict[str, Any]]:
        """Update highlight metadata."""
        # Handle profile_ids separately if provided
        profile_ids = data.pop("profile_ids", None)
        
        # Update highlight
        result = (
            supabase.table("highlights")
            .update(data)
            .eq("id", highlight_id)
            .execute()
        )
        
        # Update profiles if provided
        if profile_ids is not None:
            # Delete existing associations
            supabase.table("highlight_profiles").delete().eq("highlight_id", highlight_id).execute()
            
            # Insert new associations
            if profile_ids:
                associations = [
                    {"highlight_id": highlight_id, "profile_id": pid}
                    for pid in profile_ids
                ]
                supabase.table("highlight_profiles").insert(associations).execute()
        
        return result.data[0] if result.data else None

    async def delete_highlight(self, highlight_id: str) -> bool:
        """Delete a highlight."""
        result = supabase.table("highlights").delete().eq("id", highlight_id).execute()
        return len(result.data) > 0

