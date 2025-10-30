"""Speaker service for business logic."""
from typing import Any, Optional

from app.services.database import supabase


class SpeakerService:
    """Service for speaker operations."""

    async def list_speakers(self, episode_id: str) -> list[dict[str, Any]]:
        """List all speakers for an episode."""
        result = (
            supabase.table("speakers")
            .select("*")
            .eq("episode_id", episode_id)
            .order("speaker_label")
            .execute()
        )
        return result.data

    async def update_speaker(
        self, speaker_id: str, mapped_name: str
    ) -> Optional[dict[str, Any]]:
        """Update speaker's mapped name."""
        result = (
            supabase.table("speakers")
            .update({"mapped_name": mapped_name})
            .eq("id", speaker_id)
            .execute()
        )
        return result.data[0] if result.data else None

