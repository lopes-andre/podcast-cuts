"""Speaker diarization service using Pyannote."""
from typing import Dict, List, Any

# Note: pyannote.audio needs to be installed and configured
# pip install pyannote.audio
# Requires HuggingFace token for model access
try:
    from pyannote.audio import Pipeline
    PYANNOTE_AVAILABLE = True
except ImportError:
    PYANNOTE_AVAILABLE = False
    print("Warning: Pyannote not installed. Diarization will not work.")

from app.core.config import settings


class DiarizationService:
    """Service for speaker diarization using Pyannote."""

    def __init__(self):
        """Initialize diarization service."""
        self.pipeline = None

    def load_pipeline(self) -> None:
        """Load Pyannote diarization pipeline."""
        if not PYANNOTE_AVAILABLE:
            raise RuntimeError("Pyannote is not installed")
        
        if not settings.HUGGINGFACE_TOKEN:
            raise RuntimeError("HUGGINGFACE_TOKEN is required for Pyannote")
        
        self.pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=settings.HUGGINGFACE_TOKEN
        )

    def diarize(self, audio_path: str) -> Dict[str, Any]:
        """
        Perform speaker diarization on audio file.
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Diarization result with speaker segments
        """
        if not PYANNOTE_AVAILABLE:
            # Return mock data for development
            return {
                'speakers': [
                    {'label': 'SPEAKER_00', 'segments': [(0.0, 5.0), (10.0, 15.0)]},
                    {'label': 'SPEAKER_01', 'segments': [(5.0, 10.0), (15.0, 20.0)]},
                ]
            }
        
        if self.pipeline is None:
            self.load_pipeline()
        
        # Run diarization
        diarization = self.pipeline(audio_path)
        
        # Format results
        speakers = {}
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            if speaker not in speakers:
                speakers[speaker] = []
            speakers[speaker].append((turn.start, turn.end))
        
        return {
            'speakers': [
                {'label': label, 'segments': segments}
                for label, segments in speakers.items()
            ]
        }

    def assign_speakers_to_segments(
        self,
        segments: List[Dict[str, Any]],
        diarization: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Assign speakers to transcription segments based on diarization.
        
        Args:
            segments: List of transcription segments
            diarization: Diarization result
            
        Returns:
            List of segments with assigned speakers
        """
        result = []
        
        for segment in segments:
            segment_start = segment['start_s']
            segment_end = segment['end_s']
            segment_speakers = set()
            
            # Find overlapping speakers
            for speaker_info in diarization['speakers']:
                speaker_label = speaker_info['label']
                for turn_start, turn_end in speaker_info['segments']:
                    # Check for overlap
                    if not (turn_end < segment_start or turn_start > segment_end):
                        segment_speakers.add(speaker_label)
            
            result.append({
                **segment,
                'speakers': list(segment_speakers)
            })
        
        return result

    def extract_unique_speakers(self, diarization: Dict[str, Any]) -> List[str]:
        """
        Extract unique speaker labels from diarization result.
        
        Args:
            diarization: Diarization result
            
        Returns:
            List of unique speaker labels
        """
        return [speaker['label'] for speaker in diarization['speakers']]

