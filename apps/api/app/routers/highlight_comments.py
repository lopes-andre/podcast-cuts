"""API endpoints for highlight comments."""
from typing import List
from fastapi import APIRouter, HTTPException
from app.services.database import supabase
from app.models.highlight_comments import (
    HighlightCommentCreate,
    HighlightCommentResponse,
    HighlightCommentUpdate,
)

router = APIRouter()


@router.get("/{highlight_id}/comments", response_model=List[HighlightCommentResponse])
async def list_highlight_comments(highlight_id: str) -> List[HighlightCommentResponse]:
    """List all comments for a highlight (most recent first)."""
    result = (
        supabase.table("highlight_comments")
        .select("*")
        .eq("highlight_id", highlight_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [HighlightCommentResponse(**comment) for comment in result.data]


@router.post("/{highlight_id}/comments", response_model=HighlightCommentResponse)
async def create_highlight_comment(
    highlight_id: str, data: HighlightCommentCreate
) -> HighlightCommentResponse:
    """Create a new comment for a highlight."""
    # Verify highlight exists
    highlight_check = (
        supabase.table("highlights").select("id").eq("id", highlight_id).execute()
    )
    if not highlight_check.data:
        raise HTTPException(status_code=404, detail="Highlight not found")
    
    comment_data = {"highlight_id": highlight_id, "content": data.content}
    result = supabase.table("highlight_comments").insert(comment_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create comment")
    return HighlightCommentResponse(**result.data[0])


@router.put("/comments/{comment_id}", response_model=HighlightCommentResponse)
async def update_highlight_comment(
    comment_id: str, data: HighlightCommentUpdate
) -> HighlightCommentResponse:
    """Update an existing highlight comment."""
    update_data = data.model_dump(exclude_unset=True)
    result = (
        supabase.table("highlight_comments")
        .update(update_data)
        .eq("id", comment_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Comment not found")
    return HighlightCommentResponse(**result.data[0])


@router.delete("/comments/{comment_id}")
async def delete_highlight_comment(comment_id: str) -> dict[str, str]:
    """Delete a highlight comment."""
    result = (
        supabase.table("highlight_comments").delete().eq("id", comment_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted successfully"}

