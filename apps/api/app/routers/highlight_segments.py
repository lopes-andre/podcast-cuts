"""API endpoints for highlight segments."""
from typing import List
from fastapi import APIRouter, HTTPException
from app.services.database import supabase
from app.models.highlight_segments import (
    HighlightSegmentCreate,
    HighlightSegmentResponse,
    HighlightSegmentBulkUpdate,
    SegmentDetail,
)

router = APIRouter()


@router.get("/{highlight_id}/segments", response_model=List[SegmentDetail])
async def list_highlight_segments(highlight_id: str) -> List[SegmentDetail]:
    """
    List all segments for a highlight in sequence order.
    Returns detailed segment information including speakers.
    """
    # Get highlight-segment relationships with ordering
    hs_result = (
        supabase.table("highlight_segments")
        .select("segment_id, sequence_order")
        .eq("highlight_id", highlight_id)
        .order("sequence_order")
        .execute()
    )
    
    if not hs_result.data:
        return []
    
    segment_ids = [hs["segment_id"] for hs in hs_result.data]
    order_map = {hs["segment_id"]: hs["sequence_order"] for hs in hs_result.data}
    
    # Fetch all segments
    segments_result = (
        supabase.table("segments")
        .select("*")
        .in_("id", segment_ids)
        .execute()
    )
    
    segments = segments_result.data
    
    # Get episode_id to fetch speakers
    if segments:
        episode_id = segments[0]["episode_id"]
        
        # Get all speakers for this episode
        speakers_result = (
            supabase.table("speakers")
            .select("*")
            .eq("episode_id", episode_id)
            .execute()
        )
        speakers_map = {s["id"]: s for s in speakers_result.data}
        
        # Get segment-speaker relationships
        ss_result = (
            supabase.table("segment_speakers")
            .select("segment_id, speaker_id")
            .in_("segment_id", segment_ids)
            .execute()
        )
        
        segment_speaker_map = {}
        for ss in ss_result.data:
            if ss["segment_id"] not in segment_speaker_map:
                segment_speaker_map[ss["segment_id"]] = []
            segment_speaker_map[ss["segment_id"]].append(ss["speaker_id"])
        
        # Add speaker info to each segment
        for segment in segments:
            speaker_ids = segment_speaker_map.get(segment["id"], [])
            speaker_names = []
            for speaker_id in speaker_ids:
                speaker = speakers_map.get(speaker_id)
                if speaker:
                    name = speaker.get("mapped_name") or speaker.get("speaker_label")
                    speaker_names.append(name)
            segment["speakers"] = speaker_names
            segment["sequence_order"] = order_map[segment["id"]]
    
    # Sort by sequence_order
    segments.sort(key=lambda s: s.get("sequence_order", 0))
    
    return [SegmentDetail(**seg) for seg in segments]


@router.post("/{highlight_id}/segments", response_model=HighlightSegmentResponse)
async def add_segment_to_highlight(
    highlight_id: str, data: HighlightSegmentCreate
) -> HighlightSegmentResponse:
    """Add a segment to a highlight at a specific sequence position."""
    # Verify highlight exists
    highlight_check = (
        supabase.table("highlights").select("id").eq("id", highlight_id).execute()
    )
    if not highlight_check.data:
        raise HTTPException(status_code=404, detail="Highlight not found")
    
    # Verify segment exists
    segment_check = (
        supabase.table("segments").select("id").eq("id", data.segment_id).execute()
    )
    if not segment_check.data:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    # Insert the relationship
    relationship_data = {
        "highlight_id": highlight_id,
        "segment_id": data.segment_id,
        "sequence_order": data.sequence_order,
    }
    result = supabase.table("highlight_segments").insert(relationship_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add segment to highlight")
    return HighlightSegmentResponse(**result.data[0])


@router.put("/{highlight_id}/segments", response_model=dict)
async def bulk_update_highlight_segments(
    highlight_id: str, data: HighlightSegmentBulkUpdate
) -> dict:
    """
    Replace all segments for a highlight with a new ordered list.
    This is used for reordering, adding, or removing multiple segments at once.
    """
    # Verify highlight exists
    highlight_check = (
        supabase.table("highlights").select("id, episode_id").eq("id", highlight_id).execute()
    )
    if not highlight_check.data:
        raise HTTPException(status_code=404, detail="Highlight not found")
    
    episode_id = highlight_check.data[0]["episode_id"]
    
    # Verify all segments exist and belong to the same episode
    if data.segment_ids:
        segments_check = (
            supabase.table("segments")
            .select("id")
            .in_("id", data.segment_ids)
            .eq("episode_id", episode_id)
            .execute()
        )
        if len(segments_check.data) != len(data.segment_ids):
            raise HTTPException(
                status_code=400,
                detail="Some segments not found or do not belong to the same episode",
            )
    
    # Delete all existing relationships for this highlight
    supabase.table("highlight_segments").delete().eq("highlight_id", highlight_id).execute()
    
    # Insert new relationships with ordering
    if data.segment_ids:
        new_relationships = [
            {
                "highlight_id": highlight_id,
                "segment_id": segment_id,
                "sequence_order": idx,
            }
            for idx, segment_id in enumerate(data.segment_ids)
        ]
        result = supabase.table("highlight_segments").insert(new_relationships).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update segments")
    
    # Update highlight's start_s and end_s based on new segments
    if data.segment_ids:
        segments_result = (
            supabase.table("segments")
            .select("start_s, end_s")
            .in_("id", data.segment_ids)
            .execute()
        )
        if segments_result.data:
            start_s = min(seg["start_s"] for seg in segments_result.data)
            end_s = max(seg["end_s"] for seg in segments_result.data)
            
            # Update highlight time range
            supabase.table("highlights").update({
                "start_s": start_s,
                "end_s": end_s,
            }).eq("id", highlight_id).execute()
    
    return {
        "message": "Segments updated successfully",
        "highlight_id": highlight_id,
        "segment_count": len(data.segment_ids),
    }


@router.delete("/{highlight_id}/segments/{segment_id}")
async def remove_segment_from_highlight(highlight_id: str, segment_id: str) -> dict:
    """Remove a specific segment from a highlight."""
    result = (
        supabase.table("highlight_segments")
        .delete()
        .eq("highlight_id", highlight_id)
        .eq("segment_id", segment_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=404, detail="Segment-highlight relationship not found"
        )
    return {"message": "Segment removed from highlight successfully"}

