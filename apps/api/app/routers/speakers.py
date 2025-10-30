"""Speaker endpoints."""
from typing import List

from fastapi import APIRouter, HTTPException

from app.models.speakers import SpeakerResponse, SpeakerUpdate
from app.services.speaker_service import SpeakerService

router = APIRouter()
speaker_service = SpeakerService()


@router.get("/episode/{episode_id}", response_model=List[SpeakerResponse])
async def list_speakers(episode_id: str) -> List[SpeakerResponse]:
    """List all speakers for an episode."""
    speakers = await speaker_service.list_speakers(episode_id)
    return [SpeakerResponse(**s) for s in speakers]


@router.put("/{speaker_id}", response_model=SpeakerResponse)
async def update_speaker(speaker_id: str, data: SpeakerUpdate) -> SpeakerResponse:
    """Update speaker's mapped name."""
    speaker = await speaker_service.update_speaker(speaker_id, data.mapped_name)
    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")
    return SpeakerResponse(**speaker)

