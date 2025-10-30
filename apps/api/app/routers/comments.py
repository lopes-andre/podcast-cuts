"""Episode comments endpoints."""
from typing import List
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.database import supabase

router = APIRouter()


class CommentCreate(BaseModel):
    """Comment creation model."""
    content: str


class CommentUpdate(BaseModel):
    """Comment update model."""
    content: str


class CommentResponse(BaseModel):
    """Comment response model."""
    id: str
    episode_id: str
    content: str
    created_at: datetime
    updated_at: datetime


@router.get("/{episode_id}/comments", response_model=List[CommentResponse])
async def list_comments(episode_id: str) -> List[CommentResponse]:
    """List all comments for an episode (most recent first)."""
    result = (
        supabase.table("episode_comments")
        .select("*")
        .eq("episode_id", episode_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [CommentResponse(**comment) for comment in result.data]


@router.post("/{episode_id}/comments", response_model=CommentResponse)
async def create_comment(episode_id: str, data: CommentCreate) -> CommentResponse:
    """Create a new comment for an episode."""
    # Verify episode exists
    episode = supabase.table("episodes").select("id").eq("id", episode_id).execute()
    if not episode.data:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    comment_data = {
        "episode_id": episode_id,
        "content": data.content,
    }
    result = supabase.table("episode_comments").insert(comment_data).execute()
    return CommentResponse(**result.data[0])


@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(comment_id: str, data: CommentUpdate) -> CommentResponse:
    """Update a comment."""
    result = (
        supabase.table("episode_comments")
        .update({"content": data.content})
        .eq("id", comment_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Comment not found")
    return CommentResponse(**result.data[0])


@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str) -> dict[str, str]:
    """Delete a comment."""
    result = supabase.table("episode_comments").delete().eq("id", comment_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted successfully"}

