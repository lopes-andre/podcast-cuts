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
        
        highlights = result.data
        
        # Add speaker information to each highlight by finding overlapping segments
        for highlight in highlights:
            try:
                episode_id = highlight["episode_id"]
                start_time = highlight["start_s"]
                end_time = highlight["end_s"]
                
                # Get all segments for this episode that overlap with the highlight time range
                segments_result = (
                    supabase.table("segments")
                    .select("id")
                    .eq("episode_id", episode_id)
                    .gte("end_s", start_time)  # Segment ends after highlight starts
                    .lte("start_s", end_time)  # Segment starts before highlight ends
                    .execute()
                )
                
                # Get unique speakers from all overlapping segments
                speaker_ids_set = set()
                for segment in segments_result.data:
                    segment_speakers_result = (
                        supabase.table("segment_speakers")
                        .select("speaker_id")
                        .eq("segment_id", segment["id"])
                        .execute()
                    )
                    for ss in segment_speakers_result.data:
                        speaker_ids_set.add(ss["speaker_id"])
                
                # Get speaker details
                speaker_names = []
                for speaker_id in speaker_ids_set:
                    speaker_result = (
                        supabase.table("speakers")
                        .select("*")
                        .eq("id", speaker_id)
                        .execute()
                    )
                    if speaker_result.data:
                        speaker = speaker_result.data[0]
                        name = speaker.get("mapped_name") or speaker.get("speaker_label")
                        speaker_names.append(name)
                
                highlight["speakers"] = speaker_names
            except Exception as e:
                # If speaker fetching fails, just set empty array and continue
                print(f"Error fetching speakers for highlight {highlight['id']}: {e}")
                highlight["speakers"] = []
        
        return highlights

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

