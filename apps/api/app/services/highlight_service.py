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
        
        if not highlights:
            return highlights
        
        # Optimize speaker fetching: batch queries instead of N+1
        try:
            # Get unique episode IDs and their highlight time ranges
            episode_ids = list(set(h["episode_id"] for h in highlights))
            
            # Calculate min/max time ranges per episode to fetch only relevant segments
            episode_time_ranges = {}
            for h in highlights:
                ep_id = h["episode_id"]
                if ep_id not in episode_time_ranges:
                    episode_time_ranges[ep_id] = {"min": h["start_s"], "max": h["end_s"]}
                else:
                    episode_time_ranges[ep_id]["min"] = min(episode_time_ranges[ep_id]["min"], h["start_s"])
                    episode_time_ranges[ep_id]["max"] = max(episode_time_ranges[ep_id]["max"], h["end_s"])
            
            # Fetch only segments that overlap with highlight time ranges (not all segments)
            all_segments = []
            for ep_id in episode_ids:
                time_range = episode_time_ranges[ep_id]
                segments_result = (
                    supabase.table("segments")
                    .select("id, episode_id, start_s, end_s")
                    .eq("episode_id", ep_id)
                    .gte("end_s", time_range["min"])  # Segment ends after earliest highlight
                    .lte("start_s", time_range["max"])  # Segment starts before latest highlight
                    .execute()
                )
                all_segments.extend(segments_result.data)
            
            # Get all segment IDs
            segment_ids = [s["id"] for s in all_segments]
            
            # Fetch all segment-speaker relationships in batches (Supabase has query limits)
            segment_speaker_map = {}
            batch_size = 100
            for i in range(0, len(segment_ids), batch_size):
                batch = segment_ids[i:i + batch_size]
                ss_result = (
                    supabase.table("segment_speakers")
                    .select("segment_id, speaker_id")
                    .in_("segment_id", batch)
                    .execute()
                )
                for ss in ss_result.data:
                    if ss["segment_id"] not in segment_speaker_map:
                        segment_speaker_map[ss["segment_id"]] = []
                    segment_speaker_map[ss["segment_id"]].append(ss["speaker_id"])
            
            # Fetch all speakers for these episodes in one query
            speakers_map = {}
            for ep_id in episode_ids:
                speakers_result = (
                    supabase.table("speakers")
                    .select("*")
                    .eq("episode_id", ep_id)
                    .execute()
                )
                for speaker in speakers_result.data:
                    speakers_map[speaker["id"]] = speaker
            
            # Build segment lookup by episode and time range
            segments_by_episode = {}
            for seg in all_segments:
                ep_id = seg["episode_id"]
                if ep_id not in segments_by_episode:
                    segments_by_episode[ep_id] = []
                segments_by_episode[ep_id].append(seg)
            
            # Now assign speakers to each highlight
            # Note: A highlight can span multiple segments with different speakers
            for highlight in highlights:
                try:
                    episode_id = highlight["episode_id"]
                    start_time = highlight["start_s"]
                    end_time = highlight["end_s"]
                    
                    # Find overlapping segments for this highlight
                    # A segment overlaps if it starts before the highlight ends AND ends after the highlight starts
                    # This excludes segments that just touch at the boundary
                    episode_segments = segments_by_episode.get(episode_id, [])
                    overlapping_segments = [
                        seg for seg in episode_segments
                        if seg["start_s"] < end_time and seg["end_s"] > start_time
                    ]
                    
                    # Get unique speakers from overlapping segments
                    speaker_ids_set = set()
                    for seg in overlapping_segments:
                        speaker_ids = segment_speaker_map.get(seg["id"], [])
                        speaker_ids_set.update(speaker_ids)
                    
                    # Get speaker names
                    speaker_names = []
                    for speaker_id in speaker_ids_set:
                        speaker = speakers_map.get(speaker_id)
                        if speaker:
                            name = speaker.get("mapped_name") or speaker.get("speaker_label")
                            speaker_names.append(name)
                    
                    highlight["speakers"] = speaker_names
                except Exception as e:
                    print(f"Error processing speakers for highlight {highlight['id']}: {e}")
                    highlight["speakers"] = []
            
            # Fetch comments for all highlights in batch
            highlight_ids = [h["id"] for h in highlights]
            comments_result = (
                supabase.table("highlight_comments")
                .select("*")
                .in_("highlight_id", highlight_ids)
                .order("created_at", desc=True)
                .execute()
            )
            
            # Group comments by highlight_id
            comments_by_highlight = {}
            for comment in comments_result.data:
                hid = comment["highlight_id"]
                if hid not in comments_by_highlight:
                    comments_by_highlight[hid] = []
                comments_by_highlight[hid].append({
                    "id": comment["id"],
                    "content": comment["content"],
                    "created_at": comment["created_at"],
                })
            
            # Fetch highlight-segment relationships in batch
            hs_result = (
                supabase.table("highlight_segments")
                .select("highlight_id, segment_id, sequence_order")
                .in_("highlight_id", highlight_ids)
                .order("sequence_order")
                .execute()
            )
            
            # Get all unique segment IDs and fetch their full data
            all_segment_ids = list(set(hs["segment_id"] for hs in hs_result.data))
            segments_data = {}
            if all_segment_ids:
                segments_result = (
                    supabase.table("segments")
                    .select("id, start_s, end_s, text")
                    .in_("id", all_segment_ids)
                    .execute()
                )
                segments_data = {s["id"]: s for s in segments_result.data}
                
                # Fetch segment speakers
                segment_speaker_data = {}
                ss_result = (
                    supabase.table("segment_speakers")
                    .select("segment_id, speaker_id")
                    .in_("segment_id", all_segment_ids)
                    .execute()
                )
                for ss in ss_result.data:
                    if ss["segment_id"] not in segment_speaker_data:
                        segment_speaker_data[ss["segment_id"]] = []
                    segment_speaker_data[ss["segment_id"]].append(ss["speaker_id"])
                
                # Add speaker names to segments
                for seg_id, segment in segments_data.items():
                    speaker_ids = segment_speaker_data.get(seg_id, [])
                    speaker_names = []
                    for speaker_id in speaker_ids:
                        speaker = speakers_map.get(speaker_id)
                        if speaker:
                            name = speaker.get("mapped_name") or speaker.get("speaker_label")
                            speaker_names.append(name)
                    segment["speakers"] = speaker_names
            
            # Group full segment details by highlight_id (preserving order)
            segments_by_highlight = {}
            for hs in hs_result.data:
                hid = hs["highlight_id"]
                if hid not in segments_by_highlight:
                    segments_by_highlight[hid] = []
                segment = segments_data.get(hs["segment_id"])
                if segment:
                    segment_with_order = {**segment, "sequence_order": hs["sequence_order"]}
                    segments_by_highlight[hid].append(segment_with_order)
            
            # Fetch prompt info for all highlights that have prompts
            prompt_ids = [h["prompt_id"] for h in highlights if h.get("prompt_id")]
            prompts_map = {}
            if prompt_ids:
                prompts_result = (
                    supabase.table("prompts")
                    .select("id, name, version")
                    .in_("id", list(set(prompt_ids)))
                    .execute()
                )
                prompts_map = {p["id"]: p for p in prompts_result.data}
            
            # Fetch social profiles for all highlights
            hp_result = (
                supabase.table("highlight_profiles")
                .select("highlight_id, profile_id")
                .in_("highlight_id", highlight_ids)
                .execute()
            )
            
            profile_ids_set = set(hp["profile_id"] for hp in hp_result.data)
            profiles_map = {}
            if profile_ids_set:
                profiles_result = (
                    supabase.table("social_profiles")
                    .select("id, name")
                    .in_("id", list(profile_ids_set))
                    .execute()
                )
                profiles_map = {p["id"]: p["name"] for p in profiles_result.data}
            
            # Group profile names by highlight_id
            profiles_by_highlight = {}
            for hp in hp_result.data:
                hid = hp["highlight_id"]
                if hid not in profiles_by_highlight:
                    profiles_by_highlight[hid] = []
                profile_name = profiles_map.get(hp["profile_id"], "Unknown")
                profiles_by_highlight[hid].append(profile_name)
            
            # Add all enhanced data to each highlight
            for highlight in highlights:
                hid = highlight["id"]
                
                # Add comments
                highlight["comments"] = comments_by_highlight.get(hid, [])
                
                # Add full segment details (ordered)
                highlight_segments = segments_by_highlight.get(hid, [])
                highlight["segments"] = highlight_segments  # Full segment objects with timestamps and speakers
                highlight["segment_ids"] = [s["id"] for s in highlight_segments]  # Just IDs for compatibility
                
                # Compute transcript from segments (override stored transcript)
                if highlight_segments:
                    computed_transcript = " ".join(
                        segment.get("text", "") for segment in highlight_segments
                    )
                    highlight["transcript"] = computed_transcript
                # If no segments, keep the original transcript from DB
                
                # Add prompt info
                prompt_id = highlight.get("prompt_id")
                if prompt_id and prompt_id in prompts_map:
                    highlight["prompt"] = prompts_map[prompt_id]
                else:
                    highlight["prompt"] = None
                
                # Add social profiles
                highlight["social_profiles"] = profiles_by_highlight.get(hid, [])
                    
        except Exception as e:
            print(f"Error in batch fetching enhanced highlight data: {e}")
            import traceback
            traceback.print_exc()
            # Fallback: set empty data for all
            for highlight in highlights:
                highlight["speakers"] = highlight.get("speakers", [])
                highlight["comments"] = []
                highlight["segments"] = []
                highlight["segment_ids"] = []
                highlight["prompt"] = None
                highlight["social_profiles"] = []
        
        return highlights

    async def get_highlight(self, highlight_id: str) -> Optional[dict[str, Any]]:
        """Get a single highlight by ID."""
        result = supabase.table("highlights").select("*").eq("id", highlight_id).execute()
        return result.data[0] if result.data else None

    async def update_highlight(
        self, highlight_id: str, data: dict[str, Any]
    ) -> Optional[dict[str, Any]]:
        """Update highlight metadata and return enhanced data."""
        # Handle profile_ids separately if provided
        profile_ids = data.pop("profile_ids", None)
        
        # Update highlight
        result = (
            supabase.table("highlights")
            .update(data)
            .eq("id", highlight_id)
            .execute()
        )
        
        if not result.data:
            return None
        
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
        
        # Fetch the full enhanced highlight data
        # Use list_highlights to get all the enhanced data (comments, segments, etc.)
        from app.models.highlights import HighlightFilters
        filters = HighlightFilters(limit=1, offset=0)
        
        # Get the updated highlight with all enhanced data
        enhanced_result = supabase.table("highlights").select("*").eq("id", highlight_id).execute()
        if not enhanced_result.data:
            return None
        
        highlight = enhanced_result.data[0]
        
        # Add default empty values for enhanced fields
        highlight["comments"] = []
        highlight["segments"] = []
        highlight["segment_ids"] = []
        highlight["prompt"] = None
        highlight["social_profiles"] = []
        highlight["speakers"] = []
        
        try:
            # Fetch comments
            comments_result = (
                supabase.table("highlight_comments")
                .select("*")
                .eq("highlight_id", highlight_id)
                .order("created_at", desc=True)
                .execute()
            )
            highlight["comments"] = [
                {"id": c["id"], "content": c["content"], "created_at": c["created_at"]}
                for c in comments_result.data
            ]
            
            # Fetch segments with full details
            hs_result = (
                supabase.table("highlight_segments")
                .select("segment_id, sequence_order")
                .eq("highlight_id", highlight_id)
                .order("sequence_order")
                .execute()
            )
            
            # Get full segment data
            segment_ids = [hs["segment_id"] for hs in hs_result.data]
            highlight["segment_ids"] = segment_ids
            
            if segment_ids:
                segments_result = (
                    supabase.table("segments")
                    .select("id, start_s, end_s, text")
                    .in_("id", segment_ids)
                    .execute()
                )
                segments_map = {s["id"]: s for s in segments_result.data}
                
                # Fetch segment speakers
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
                
                # Get speakers for this episode
                episode_id = highlight.get("episode_id")
                speakers_map = {}
                if episode_id:
                    speakers_result = (
                        supabase.table("speakers")
                        .select("*")
                        .eq("episode_id", episode_id)
                        .execute()
                    )
                    speakers_map = {s["id"]: s for s in speakers_result.data}
                
                # Build segments with speaker names in order
                highlight_segments = []
                for hs in hs_result.data:
                    segment = segments_map.get(hs["segment_id"])
                    if segment:
                        speaker_ids = segment_speaker_map.get(hs["segment_id"], [])
                        speaker_names = []
                        for speaker_id in speaker_ids:
                            speaker_obj = speakers_map.get(speaker_id)
                            if speaker_obj:
                                name = speaker_obj.get("mapped_name") or speaker_obj.get("speaker_label")
                                speaker_names.append(name)
                        segment_with_order = {
                            **segment,
                            "speakers": speaker_names,
                            "sequence_order": hs["sequence_order"]
                        }
                        highlight_segments.append(segment_with_order)
                
                highlight["segments"] = highlight_segments
                
                # Compute transcript from segments (override stored transcript)
                if highlight_segments:
                    computed_transcript = " ".join(
                        segment.get("text", "") for segment in highlight_segments
                    )
                    highlight["transcript"] = computed_transcript
            
            # Fetch prompt info if available
            if highlight.get("prompt_id"):
                prompt_result = (
                    supabase.table("prompts")
                    .select("id, name, version")
                    .eq("id", highlight["prompt_id"])
                    .execute()
                )
                if prompt_result.data:
                    highlight["prompt"] = prompt_result.data[0]
            
            # Fetch social profiles
            hp_result = (
                supabase.table("highlight_profiles")
                .select("profile_id")
                .eq("highlight_id", highlight_id)
                .execute()
            )
            if hp_result.data:
                profile_ids_list = [hp["profile_id"] for hp in hp_result.data]
                if profile_ids_list:
                    profiles_result = (
                        supabase.table("social_profiles")
                        .select("id, name")
                        .in_("id", profile_ids_list)
                        .execute()
                    )
                    highlight["social_profiles"] = [p["name"] for p in profiles_result.data]
            
            # Extract unique speakers from segments
            all_speakers = []
            for segment in highlight.get("segments", []):
                all_speakers.extend(segment.get("speakers", []))
            highlight["speakers"] = list(set(all_speakers))  # Deduplicate
        except Exception as e:
            print(f"Error fetching enhanced data for highlight {highlight_id}: {e}")
            # Already set defaults above, so we can continue
        
        return highlight

    async def delete_highlight(self, highlight_id: str) -> bool:
        """Delete a highlight."""
        result = supabase.table("highlights").delete().eq("id", highlight_id).execute()
        return len(result.data) > 0

