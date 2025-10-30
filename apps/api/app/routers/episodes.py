"""Episode endpoints."""
from typing import List

from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.models.episodes import (
    EpisodeCreate,
    EpisodeIngest,
    EpisodeResponse,
    EpisodeUpdate,
    SegmentResponse,
)
from app.services.episode_service import EpisodeService

router = APIRouter()
episode_service = EpisodeService()


@router.post("/ingest", response_model=EpisodeResponse)
async def ingest_episode(
    data: EpisodeIngest,
    background_tasks: BackgroundTasks,
) -> EpisodeResponse:
    """
    Ingest a YouTube video: download, transcribe, and diarize.
    Processing happens in the background.
    """
    try:
        print(f"Creating episode for URL: {data.youtube_url}")
        episode = await episode_service.create_episode(data.youtube_url)
        print(f"Episode created with ID: {episode['id']}")
        
        # Add background task for processing
        background_tasks.add_task(
            episode_service.process_episode,
            episode["id"],
            data.auto_detect_highlights,
            data.prompt_ids,
        )
        
        print(f"Background task added for episode: {episode['id']}")
        return EpisodeResponse(**episode)
    except ValueError as e:
        # Handle duplicate URL error
        print(f"Duplicate episode error: {e}")
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        print(f"Error in ingest_episode: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[EpisodeResponse])
async def list_episodes(
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> List[EpisodeResponse]:
    """List episodes with optional filters."""
    episodes = await episode_service.list_episodes(status=status, limit=limit, offset=offset)
    return [EpisodeResponse(**ep) for ep in episodes]


@router.get("/{episode_id}", response_model=EpisodeResponse)
async def get_episode(episode_id: str) -> EpisodeResponse:
    """Get a single episode by ID."""
    episode = await episode_service.get_episode(episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    return EpisodeResponse(**episode)


@router.get("/{episode_id}/segments", response_model=List[SegmentResponse])
async def get_episode_segments(episode_id: str) -> List[SegmentResponse]:
    """Get all segments for an episode."""
    segments = await episode_service.get_segments(episode_id)
    return [SegmentResponse(**seg) for seg in segments]


@router.put("/{episode_id}", response_model=EpisodeResponse)
async def update_episode(episode_id: str, data: EpisodeUpdate) -> EpisodeResponse:
    """Update episode metadata."""
    episode = await episode_service.update_episode(episode_id, data.model_dump(exclude_unset=True))
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    return EpisodeResponse(**episode)


@router.post("/{episode_id}/detect-highlights")
async def detect_highlights(
    episode_id: str,
    prompt_ids: List[str],
    background_tasks: BackgroundTasks,
) -> dict[str, str]:
    """Detect highlights for an episode using specified prompts."""
    background_tasks.add_task(
        episode_service.detect_highlights,
        episode_id,
        prompt_ids,
    )
    return {"message": "Highlight detection started", "episode_id": episode_id}


@router.delete("/{episode_id}")
async def delete_episode(episode_id: str) -> dict[str, str]:
    """Delete an episode and all related data."""
    success = await episode_service.delete_episode(episode_id)
    if not success:
        raise HTTPException(status_code=404, detail="Episode not found")
    return {"message": "Episode deleted successfully"}

