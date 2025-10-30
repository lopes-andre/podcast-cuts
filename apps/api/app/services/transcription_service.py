"""Transcription service using WhisperX."""
from typing import Dict, List, Any

# Note: whisperx needs to be installed separately
# pip install git+https://github.com/m-bain/whisperX.git
try:
    import whisperx
    WHISPERX_AVAILABLE = True
except ImportError:
    WHISPERX_AVAILABLE = False
    print("Warning: WhisperX not installed. Transcription will not work.")


class TranscriptionService:
    """Service for transcribing audio using WhisperX."""

    def __init__(self, device: str = "cpu", compute_type: str = "float32"):
        """
        Initialize transcription service.
        
        Args:
            device: Device to run on ('cpu', 'cuda')
            compute_type: Compute type ('float16', 'float32', 'int8')
        """
        self.device = device
        self.compute_type = compute_type
        self.model = None

    def load_model(self, model_size: str = "base") -> None:
        """
        Load Whisper model.
        
        Args:
            model_size: Model size ('tiny', 'base', 'small', 'medium', 'large-v2')
        """
        if not WHISPERX_AVAILABLE:
            raise RuntimeError("WhisperX is not installed")
        
        self.model = whisperx.load_model(
            model_size,
            self.device,
            compute_type=self.compute_type,
            language="pt",  # Portuguese
        )

    def transcribe(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio file.
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Transcription result with segments
        """
        if not WHISPERX_AVAILABLE:
            # Return mock data for development
            return {
                'segments': [
                    {
                        'start': 0.0,
                        'end': 5.0,
                        'text': 'Mock transcription segment 1',
                        'confidence': 0.95,
                    },
                    {
                        'start': 5.0,
                        'end': 10.0,
                        'text': 'Mock transcription segment 2',
                        'confidence': 0.92,
                    },
                ],
                'language': 'pt',
            }
        
        if self.model is None:
            self.load_model()
        
        # Load audio
        audio = whisperx.load_audio(audio_path)
        
        # Transcribe
        result = self.model.transcribe(audio, batch_size=16)
        
        # Align whisper output
        model_a, metadata = whisperx.load_align_model(
            language_code=result["language"],
            device=self.device
        )
        result = whisperx.align(
            result["segments"],
            model_a,
            metadata,
            audio,
            self.device,
            return_char_alignments=False
        )
        
        return result

    def format_segments(self, transcription_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Format transcription segments for database storage.
        
        Args:
            transcription_result: Raw transcription result
            
        Returns:
            List of formatted segments
        """
        segments = []
        for segment in transcription_result.get('segments', []):
            segments.append({
                'start_s': segment['start'],
                'end_s': segment['end'],
                'text': segment['text'].strip(),
                'confidence': segment.get('confidence', segment.get('score', 0.0)),
            })
        return segments

    def get_full_transcript(self, segments: List[Dict[str, Any]]) -> str:
        """
        Combine all segments into full transcript.
        
        Args:
            segments: List of segment dictionaries
            
        Returns:
            Full transcript text
        """
        return " ".join(seg['text'] for seg in segments)

