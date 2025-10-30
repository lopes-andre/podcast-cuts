"""Prompt service for business logic."""
from typing import Any, Optional

from app.services.database import supabase


class PromptService:
    """Service for prompt template operations."""

    async def create_prompt(self, data: dict[str, Any]) -> dict[str, Any]:
        """Create a new prompt template."""
        result = supabase.table("prompts").insert(data).execute()
        return result.data[0]

    async def list_prompts(self, active_only: bool = False) -> list[dict[str, Any]]:
        """List all prompt templates."""
        query = supabase.table("prompts").select("*")
        
        if active_only:
            query = query.eq("is_active", True)
        
        result = query.order("name").order("version", desc=True).execute()
        return result.data

    async def get_prompt(self, prompt_id: str) -> Optional[dict[str, Any]]:
        """Get a single prompt template by ID."""
        result = supabase.table("prompts").select("*").eq("id", prompt_id).execute()
        return result.data[0] if result.data else None

    async def update_prompt(
        self, prompt_id: str, data: dict[str, Any]
    ) -> Optional[dict[str, Any]]:
        """Update a prompt template."""
        result = (
            supabase.table("prompts")
            .update(data)
            .eq("id", prompt_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def delete_prompt(self, prompt_id: str) -> bool:
        """Delete a prompt template."""
        result = supabase.table("prompts").delete().eq("id", prompt_id).execute()
        return len(result.data) > 0

