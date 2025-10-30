"""Tests for LLM service."""
import pytest
from unittest.mock import Mock, patch

from app.services.llm_service import LLMService


@pytest.fixture
def llm_service():
    """Create LLM service instance."""
    with patch('app.services.llm_service.settings') as mock_settings:
        mock_settings.OPENAI_API_KEY = "test-key"
        mock_settings.ANTHROPIC_API_KEY = "test-key"
        return LLMService()


def test_time_to_seconds(llm_service):
    """Test time string to seconds conversion."""
    assert llm_service._time_to_seconds("00:01:30") == 90.0
    assert llm_service._time_to_seconds("01:00") == 60.0
    assert llm_service._time_to_seconds("30") == 30.0
    assert llm_service._time_to_seconds("01:30:45") == 5445.0


def test_parse_highlights(llm_service):
    """Test parsing highlights from LLM response."""
    raw_highlights = [
        {
            "start_time": "00:01:00",
            "end_time": "00:02:00",
            "transcript": "This is a test highlight",
            "description": "Test description",
        },
        {
            "start_time": "00:05:30",
            "end_time": "00:06:00",
            "transcript": "Another highlight",
            "description": "Another description",
        },
    ]
    
    parsed = llm_service._parse_highlights(raw_highlights)
    
    assert len(parsed) == 2
    assert parsed[0]['start_s'] == 60.0
    assert parsed[0]['end_s'] == 120.0
    assert parsed[0]['transcript'] == "This is a test highlight"
    assert parsed[1]['start_s'] == 330.0
    assert parsed[1]['end_s'] == 360.0

