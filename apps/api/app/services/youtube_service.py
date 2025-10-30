"""YouTube video download service using yt-dlp."""
import os
import subprocess
from pathlib import Path
from typing import Dict, Any

import yt_dlp


class YouTubeService:
    """Service for downloading videos from YouTube."""

    def __init__(self, output_dir: str = "./downloads"):
        """Initialize YouTube service with output directory."""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def get_video_info(self, youtube_url: str) -> Dict[str, Any]:
        """
        Get video metadata without downloading.
        
        Args:
            youtube_url: YouTube video URL
            
        Returns:
            Dictionary with video metadata
        """
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            
            return {
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'uploader': info.get('uploader', 'Unknown'),
                'upload_date': info.get('upload_date'),
                'description': info.get('description', ''),
            }

    def download_audio(self, youtube_url: str, episode_id: str) -> str:
        """
        Download audio from YouTube video.
        
        Args:
            youtube_url: YouTube video URL
            episode_id: Episode ID for filename
            
        Returns:
            Path to downloaded audio file
        """
        output_path = self.output_dir / f"{episode_id}.wav"
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': str(self.output_dir / f"{episode_id}.%(ext)s"),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
            }],
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        
        return str(output_path)

    def download_video(self, youtube_url: str, episode_id: str) -> str:
        """
        Download full video from YouTube.
        
        Args:
            youtube_url: YouTube video URL
            episode_id: Episode ID for filename
            
        Returns:
            Path to downloaded video file
        """
        output_path = self.output_dir / f"{episode_id}.mp4"
        
        ydl_opts = {
            'format': 'best',
            'outtmpl': str(output_path),
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        
        return str(output_path)

    def cleanup(self, file_path: str) -> None:
        """Delete downloaded file."""
        try:
            os.remove(file_path)
        except OSError:
            pass

