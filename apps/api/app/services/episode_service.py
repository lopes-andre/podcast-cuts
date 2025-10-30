"""Episode service for business logic."""
from typing import Any, Optional
import yt_dlp

from app.services.database import supabase


class EpisodeService:
    """Service for episode-related operations."""

    def fetch_youtube_metadata(self, youtube_url: str) -> dict[str, Any]:
        """Fetch metadata from YouTube using yt-dlp."""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(youtube_url, download=False)
                description = info.get('description', '')
                print(f"✅ Fetched metadata - Title: {info.get('title', 'Untitled')}")
                print(f"✅ Description length: {len(description)} characters")
                print(f"✅ Description preview: {description[:200]}..." if description else "⚠️ No description found")
                
                return {
                    'title': info.get('title', 'Untitled'),
                    'duration_seconds': int(info.get('duration', 0)),
                    'description': description,
                    'thumbnail_url': info.get('thumbnail'),
                    'upload_date': info.get('upload_date'),  # Format: YYYYMMDD
                }
        except Exception as e:
            print(f"❌ Error fetching YouTube metadata: {e}")
            import traceback
            traceback.print_exc()
            return {
                'title': 'Unknown Title',
                'duration_seconds': 0,
                'description': '',
            }

    async def create_episode(self, youtube_url: str) -> dict[str, Any]:
        """Create a new episode."""
        # Check if episode already exists
        existing = supabase.table("episodes").select("*").eq("youtube_url", youtube_url).execute()
        if existing.data:
            raise ValueError(f"Episode already exists for this YouTube URL. Episode ID: {existing.data[0]['id']}")
        
        # Fetch YouTube metadata
        print(f"Fetching YouTube metadata for: {youtube_url}")
        metadata = self.fetch_youtube_metadata(youtube_url)
        print(f"Metadata fetched - Title: {metadata['title']}, Duration: {metadata['duration_seconds']}s")
        
        data = {
            "youtube_url": youtube_url,
            "title": metadata['title'],
            "duration_seconds": metadata['duration_seconds'],
            "description": metadata['description'],
            "thumbnail_url": metadata.get('thumbnail_url'),
            "status": "pending",
        }
        result = supabase.table("episodes").insert(data).execute()
        print(f"Episode created successfully: {result.data[0]['id']}")
        return result.data[0]

    async def list_episodes(
        self,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """List episodes with optional filters."""
        query = supabase.table("episodes").select("*")
        
        if status:
            query = query.eq("status", status)
        
        result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        episodes = result.data
        
        # Add comments count for each episode
        for episode in episodes:
            comments_result = (
                supabase.table("episode_comments")
                .select("*", count="exact")
                .eq("episode_id", episode["id"])
                .execute()
            )
            comment_count = comments_result.count if comments_result.count is not None else 0
            episode["comments_count"] = comment_count
            print(f"📊 Episode {episode['title'][:30]}... has {comment_count} comments")
        
        return episodes

    async def get_episode(self, episode_id: str) -> Optional[dict[str, Any]]:
        """Get a single episode by ID."""
        result = supabase.table("episodes").select("*").eq("id", episode_id).execute()
        return result.data[0] if result.data else None

    async def get_segments(self, episode_id: str) -> list[dict[str, Any]]:
        """Get all segments for an episode with speaker information."""
        # Get segments
        segments_result = (
            supabase.table("segments")
            .select("*")
            .eq("episode_id", episode_id)
            .order("start_s")
            .execute()
        )
        
        segments = segments_result.data
        
        if not segments:
            return segments
        
        # Get all speakers for this episode (1 query)
        speakers_result = (
            supabase.table("speakers")
            .select("*")
            .eq("episode_id", episode_id)
            .execute()
        )
        speakers_map = {s["id"]: s for s in speakers_result.data}
        
        # Batch fetch all segment-speaker relationships at once (1-2 queries instead of N)
        segment_ids = [s["id"] for s in segments]
        segment_speaker_map = {}
        
        # Fetch in batches to avoid query size limits
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
        
        return segments

    async def update_episode(
        self, episode_id: str, data: dict[str, Any]
    ) -> Optional[dict[str, Any]]:
        """Update episode metadata."""
        from datetime import datetime
        
        # Convert datetime objects to ISO strings for JSON serialization
        cleaned_data = {}
        for key, value in data.items():
            if isinstance(value, datetime):
                cleaned_data[key] = value.isoformat()
            else:
                cleaned_data[key] = value
        
        result = (
            supabase.table("episodes")
            .update(cleaned_data)
            .eq("id", episode_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def delete_episode(self, episode_id: str) -> bool:
        """Delete an episode and all related data."""
        result = supabase.table("episodes").delete().eq("id", episode_id).execute()
        return len(result.data) > 0

    async def process_episode(
        self,
        episode_id: str,
        auto_detect_highlights: bool = False,
        prompt_ids: Optional[list[str]] = None,
    ) -> None:
        """
        Process an episode: download, transcribe, and diarize.
        This runs as a background task.
        
        For now, this is a placeholder. Use the /api/seed/seed-mock-data/{episode_id}
        endpoint to populate with mock data, or install WhisperX/Pyannote for real processing.
        """
        try:
            # Update status to show it's queued for processing
            await self.update_episode(episode_id, {"status": "pending"})
            print(f"Episode {episode_id} created and queued for processing.")
            print("To populate with mock data, use: POST /api/seed/seed-mock-data/{episode_id}")
            
        except Exception as e:
            print(f"Error in process_episode: {e}")
            await self.update_episode(episode_id, {"status": "failed"})

    async def detect_highlights(
        self, episode_id: str, prompt_ids: list[str]
    ) -> None:
        """Detect highlights using LLM prompts."""
        # TODO: Implement highlight detection
        # 1. Get episode transcript
        # 2. Get prompts
        # 3. Run LLM inference
        # 4. Store highlights
        pass

