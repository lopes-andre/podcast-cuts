"""Tests for export service."""
import pytest

from app.services.export_service import ExportService


@pytest.fixture
def export_service():
    """Create export service instance."""
    return ExportService()


@pytest.fixture
def sample_highlights():
    """Sample highlights data."""
    return [
        {
            'id': '1',
            'episode_id': 'ep1',
            'start_s': 60.0,
            'end_s': 120.0,
            'transcript': 'This is the first highlight',
            'status': 'pending',
        },
        {
            'id': '2',
            'episode_id': 'ep1',
            'start_s': 300.0,
            'end_s': 360.5,
            'transcript': 'This is the second highlight',
            'status': 'used',
        },
    ]


def test_export_srt(export_service, sample_highlights):
    """Test SRT export."""
    result = export_service.export_srt(sample_highlights)
    
    assert '1' in result
    assert '00:01:00,000 --> 00:02:00,000' in result
    assert 'This is the first highlight' in result
    assert '2' in result
    assert '00:05:00,000 --> 00:06:00,500' in result
    assert 'This is the second highlight' in result


def test_export_csv(export_service, sample_highlights):
    """Test CSV export."""
    result = export_service.export_csv(sample_highlights)
    
    assert 'id,episode_id,start_s,end_s' in result
    assert '1,ep1,60.0,120.0' in result
    assert 'This is the first highlight' in result
    assert '2,ep1,300.0,360.5' in result


def test_export_json(export_service, sample_highlights):
    """Test JSON export."""
    result = export_service.export_json(sample_highlights)
    
    assert '"id": "1"' in result
    assert '"start_s": 60.0' in result
    assert '"end_s": 120.0' in result
    assert '"start_time"' in result
    assert '"end_time"' in result
    assert '"duration"' in result


def test_format_timestamp(export_service):
    """Test timestamp formatting."""
    assert export_service._format_timestamp(60.0) == "01:00"
    assert export_service._format_timestamp(3665.0) == "01:01:05"
    assert export_service._format_timestamp(45.0) == "00:45"

