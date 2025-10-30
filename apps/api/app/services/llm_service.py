"""LLM service for highlight detection using OpenAI and Anthropic."""
import json
from typing import List, Dict, Any, Optional

from openai import OpenAI
from anthropic import Anthropic

from app.core.config import settings


class LLMService:
    """Service for LLM-based highlight detection."""

    def __init__(self):
        """Initialize LLM service with API clients."""
        self.openai_client = None
        self.anthropic_client = None
        
        if settings.OPENAI_API_KEY:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        if settings.ANTHROPIC_API_KEY:
            self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def detect_highlights_openai(
        self,
        transcript: str,
        prompt_template: str,
        model: str = "gpt-4o-mini",
    ) -> List[Dict[str, Any]]:
        """
        Detect highlights using OpenAI.
        
        Args:
            transcript: Full transcript text
            prompt_template: Prompt template with {transcript} placeholder
            model: OpenAI model to use
            
        Returns:
            List of detected highlights
        """
        if not self.openai_client:
            raise RuntimeError("OpenAI API key not configured")
        
        # Fill in the template
        prompt = prompt_template.replace("{transcript}", transcript)
        
        # Add instructions for structured output
        system_prompt = """You are an expert at analyzing podcast content and identifying 
highlight moments. Return your response as a JSON array with the following structure:
[
  {
    "start_time": "00:15:30",
    "end_time": "00:16:45",
    "description": "Brief description of why this moment is a highlight",
    "transcript": "The actual text spoken during this highlight"
  }
]
"""
        
        response = self.openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        
        try:
            # Parse JSON response
            result = json.loads(content)
            highlights = result.get('highlights', [])
            return self._parse_highlights(highlights)
        except json.JSONDecodeError:
            # Fallback: try to extract highlights from text
            return []

    def detect_highlights_anthropic(
        self,
        transcript: str,
        prompt_template: str,
        model: str = "claude-3-5-sonnet-20241022",
    ) -> List[Dict[str, Any]]:
        """
        Detect highlights using Anthropic Claude.
        
        Args:
            transcript: Full transcript text
            prompt_template: Prompt template with {transcript} placeholder
            model: Claude model to use
            
        Returns:
            List of detected highlights
        """
        if not self.anthropic_client:
            raise RuntimeError("Anthropic API key not configured")
        
        # Fill in the template
        prompt = prompt_template.replace("{transcript}", transcript)
        
        # Add instructions for structured output
        prompt += """\n\nReturn your response as a JSON array with the following structure:
[
  {
    "start_time": "00:15:30",
    "end_time": "00:16:45",
    "description": "Brief description of why this moment is a highlight",
    "transcript": "The actual text spoken during this highlight"
  }
]
"""
        
        response = self.anthropic_client.messages.create(
            model=model,
            max_tokens=4096,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        
        content = response.content[0].text
        
        try:
            # Extract JSON from response
            start_idx = content.find('[')
            end_idx = content.rfind(']') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                highlights = json.loads(json_str)
                return self._parse_highlights(highlights)
        except (json.JSONDecodeError, ValueError):
            pass
        
        return []

    def detect_highlights(
        self,
        transcript: str,
        prompt_template: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Detect highlights using configured LLM provider.
        
        Args:
            transcript: Full transcript text
            prompt_template: Prompt template with {transcript} placeholder
            provider: LLM provider ('openai' or 'anthropic'), uses default if None
            model: Model to use, uses default if None
            
        Returns:
            List of detected highlights
        """
        provider = provider or settings.DEFAULT_LLM_PROVIDER
        
        if provider == "openai":
            model = model or settings.DEFAULT_LLM_MODEL
            return self.detect_highlights_openai(transcript, prompt_template, model)
        elif provider == "anthropic":
            model = model or "claude-3-5-sonnet-20241022"
            return self.detect_highlights_anthropic(transcript, prompt_template, model)
        else:
            raise ValueError(f"Unknown provider: {provider}")

    def _parse_highlights(self, highlights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Parse and validate highlight data.
        
        Args:
            highlights: Raw highlight data from LLM
            
        Returns:
            Validated and formatted highlights
        """
        parsed = []
        
        for h in highlights:
            try:
                # Convert time strings to seconds
                start_s = self._time_to_seconds(h.get('start_time', '00:00:00'))
                end_s = self._time_to_seconds(h.get('end_time', '00:00:00'))
                
                parsed.append({
                    'start_s': start_s,
                    'end_s': end_s,
                    'transcript': h.get('transcript', h.get('description', '')),
                    'description': h.get('description', ''),
                })
            except (ValueError, KeyError):
                continue
        
        return parsed

    def _time_to_seconds(self, time_str: str) -> float:
        """
        Convert time string (HH:MM:SS or MM:SS) to seconds.
        
        Args:
            time_str: Time string
            
        Returns:
            Time in seconds
        """
        parts = time_str.split(':')
        if len(parts) == 3:
            h, m, s = parts
            return int(h) * 3600 + int(m) * 60 + float(s)
        elif len(parts) == 2:
            m, s = parts
            return int(m) * 60 + float(s)
        else:
            return float(parts[0])

