"""Tests for episode service."""
import pytest
from unittest.mock import Mock, patch

from app.services.episode_service import EpisodeService


@pytest.fixture
def episode_service():
    """Create episode service instance."""
    return EpisodeService()


@pytest.mark.asyncio
async def test_create_episode(episode_service):
    """Test episode creation."""
    youtube_url = "https://www.youtube.com/watch?v=test123"
    
    with patch('app.services.episode_service.supabase') as mock_supabase:
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {
                'id': 'test-id',
                'youtube_url': youtube_url,
                'title': 'Processing...',
                'status': 'pending'
            }
        ]
        
        result = await episode_service.create_episode(youtube_url)
        
        assert result['id'] == 'test-id'
        assert result['youtube_url'] == youtube_url
        assert result['status'] == 'pending'


@pytest.mark.asyncio
async def test_list_episodes(episode_service):
    """Test listing episodes."""
    with patch('app.services.episode_service.supabase') as mock_supabase:
        mock_supabase.table.return_value.select.return_value.order.return_value.range.return_value.execute.return_value.data = [
            {'id': '1', 'title': 'Episode 1'},
            {'id': '2', 'title': 'Episode 2'},
        ]
        
        result = await episode_service.list_episodes(limit=10, offset=0)
        
        assert len(result) == 2
        assert result[0]['id'] == '1'
        assert result[1]['id'] == '2'


@pytest.mark.asyncio
async def test_get_episode(episode_service):
    """Test getting a single episode."""
    episode_id = 'test-id'
    
    with patch('app.services.episode_service.supabase') as mock_supabase:
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {'id': episode_id, 'title': 'Test Episode'}
        ]
        
        result = await episode_service.get_episode(episode_id)
        
        assert result is not None
        assert result['id'] == episode_id
        assert result['title'] == 'Test Episode'

