"""Export service for generating SRT, CSV, and JSON files."""
import csv
import json
from io import StringIO
from typing import List, Dict, Any


class ExportService:
    """Service for exporting highlights in various formats."""

    def export_srt(self, highlights: List[Dict[str, Any]]) -> str:
        """
        Export highlights as SRT subtitle format.
        
        Args:
            highlights: List of highlights with timestamps and text
            
        Returns:
            SRT formatted string
        """
        srt_lines = []
        
        for idx, highlight in enumerate(highlights, start=1):
            start_time = self._format_srt_time(highlight['start_s'])
            end_time = self._format_srt_time(highlight['end_s'])
            text = highlight['transcript']
            
            srt_lines.append(f"{idx}")
            srt_lines.append(f"{start_time} --> {end_time}")
            srt_lines.append(text)
            srt_lines.append("")  # Empty line between subtitles
        
        return "\n".join(srt_lines)

    def export_csv(self, highlights: List[Dict[str, Any]]) -> str:
        """
        Export highlights as CSV.
        
        Args:
            highlights: List of highlights
            
        Returns:
            CSV formatted string
        """
        output = StringIO()
        
        fieldnames = [
            'id', 'episode_id', 'start_s', 'end_s', 
            'start_time', 'end_time', 'transcript', 
            'status', 'comments', 'created_at'
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for highlight in highlights:
            writer.writerow({
                'id': highlight.get('id', ''),
                'episode_id': highlight.get('episode_id', ''),
                'start_s': highlight['start_s'],
                'end_s': highlight['end_s'],
                'start_time': self._format_timestamp(highlight['start_s']),
                'end_time': self._format_timestamp(highlight['end_s']),
                'transcript': highlight['transcript'],
                'status': highlight.get('status', ''),
                'comments': highlight.get('comments', ''),
                'created_at': highlight.get('created_at', ''),
            })
        
        return output.getvalue()

    def export_json(self, highlights: List[Dict[str, Any]]) -> str:
        """
        Export highlights as JSON.
        
        Args:
            highlights: List of highlights
            
        Returns:
            JSON formatted string
        """
        # Add formatted timestamps to each highlight
        enhanced_highlights = []
        for highlight in highlights:
            enhanced = highlight.copy()
            enhanced['start_time'] = self._format_timestamp(highlight['start_s'])
            enhanced['end_time'] = self._format_timestamp(highlight['end_s'])
            enhanced['duration'] = highlight['end_s'] - highlight['start_s']
            enhanced_highlights.append(enhanced)
        
        return json.dumps(enhanced_highlights, indent=2, default=str)

    def _format_srt_time(self, seconds: float) -> str:
        """
        Format seconds as SRT time (HH:MM:SS,mmm).
        
        Args:
            seconds: Time in seconds
            
        Returns:
            SRT formatted time string
        """
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    def _format_timestamp(self, seconds: float) -> str:
        """
        Format seconds as readable timestamp (HH:MM:SS).
        
        Args:
            seconds: Time in seconds
            
        Returns:
            Formatted time string
        """
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{secs:02d}"
        return f"{minutes:02d}:{secs:02d}"

